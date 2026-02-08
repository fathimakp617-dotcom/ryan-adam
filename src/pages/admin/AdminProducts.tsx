import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Upload, Image } from "lucide-react";
import ProductForm, { emptyFormData, type ProductFormData } from "@/components/admin/ProductForm";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number;
  discount_percent: number;
  stock_quantity: number;
  category: string;
  size: string;
  image_url: string;
  is_active: boolean;
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  created_at: string;
}

const getAdminSession = () => {
  const stored = sessionStorage.getItem("rayn_admin_session");
  if (!stored) return null;
  try {
    const session = JSON.parse(stored);
    if (session.expiry > Date.now()) return session;
  } catch {
    return null;
  }
  return null;
};

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { action: "list" },
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (error) throw error;
      return data.products as Product[];
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: {
          action: "upload_image",
          imageData: {
            base64,
            fileName: file.name,
            contentType: file.type,
            productId,
          },
        },
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Image uploaded successfully" });
      setUploadingFor(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setUploadingFor(null);
    },
  });

  const buildProductPayload = (fd: ProductFormData) => ({
    id: fd.id.trim(),
    name: fd.name.trim(),
    description: fd.description.trim(),
    price: parseFloat(fd.price) || 0,
    original_price: parseFloat(fd.original_price) || 0,
    discount_percent: parseInt(fd.discount_percent) || 0,
    stock_quantity: parseInt(fd.stock_quantity) || 0,
    category: fd.category,
    size: fd.size,
    image_url: fd.image_url.trim(),
    is_active: fd.is_active,
    notes: {
      top: fd.notes_top.split(",").map((n) => n.trim()).filter(Boolean),
      middle: fd.notes_middle.split(",").map((n) => n.trim()).filter(Boolean),
      base: fd.notes_base.split(",").map((n) => n.trim()).filter(Boolean),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (fd: ProductFormData) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { action: "create", product: buildProductPayload(fd) },
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setIsAddDialogOpen(false);
      setFormData(emptyFormData);
      toast({ title: "Product created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating product", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (fd: ProductFormData) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { action: "update", product: buildProductPayload(fd) },
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setEditingProduct(null);
      setFormData(emptyFormData);
      toast({ title: "Product updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating product", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { action: "delete", product: { id: productId } },
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock_quantity }: { id: string; stock_quantity: number }) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: { action: "update_stock", product: { id, stock_quantity } },
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Stock updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      original_price: product.original_price?.toString() || "",
      discount_percent: product.discount_percent?.toString() || "0",
      stock_quantity: product.stock_quantity.toString(),
      category: product.category || "woody",
      size: product.size || "100ml",
      image_url: product.image_url || "",
      is_active: product.is_active,
      notes_top: product.notes?.top?.join(", ") || "",
      notes_middle: product.notes?.middle?.join(", ") || "",
      notes_base: product.notes?.base?.join(", ") || "",
    });
  };

  const handleFormSubmit = (fd: ProductFormData, pendingImageFile: File | null) => {
    const productId = editingProduct ? editingProduct.id : fd.id;

    const afterSuccess = () => {
      if (pendingImageFile && productId) {
        uploadImageMutation.mutate({ productId, file: pendingImageFile });
      }
    };

    if (editingProduct) {
      updateMutation.mutate(fd, { onSuccess: afterSuccess });
    } else {
      createMutation.mutate(fd, { onSuccess: afterSuccess });
    }
  };

  const handleCancel = () => {
    setIsAddDialogOpen(false);
    setEditingProduct(null);
    setFormData(emptyFormData);
  };

  const handleImageUpload = (productId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }
    setUploadingFor(productId);
    uploadImageMutation.mutate({ productId, file });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input for table image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingFor) {
            handleImageUpload(uploadingFor, file);
          }
          e.target.value = "";
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and stock ({products?.length || 0} products)
          </p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setFormData(emptyFormData);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setFormData(emptyFormData)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm
              formData={formData}
              setFormData={setFormData}
              isEditing={false}
              isSubmitting={createMutation.isPending || uploadImageMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProduct(null);
            setFormData(emptyFormData);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            formData={formData}
            setFormData={setFormData}
            isEditing={true}
            isSubmitting={updateMutation.isPending || uploadImageMutation.isPending}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="relative group">
                    {product.image_url ? (
                      <div className="relative h-16 w-16 rounded overflow-hidden">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                        <button
                          onClick={() => {
                            setUploadingFor(product.id);
                            fileInputRef.current?.click();
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          {uploadingFor === product.id && uploadImageMutation.isPending ? (
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                          ) : (
                            <Upload className="h-5 w-5 text-white" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setUploadingFor(product.id);
                          fileInputRef.current?.click();
                        }}
                        className="h-16 w-16 rounded bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                      >
                        {uploadingFor === product.id && uploadImageMutation.isPending ? (
                          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                        ) : (
                          <div className="text-center">
                            <Image className="h-5 w-5 text-muted-foreground mx-auto" />
                            <span className="text-[10px] text-muted-foreground">Upload</span>
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.id}</div>
                    {product.notes?.top?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.notes.top.slice(0, 2).map((note) => (
                          <span key={note} className="text-xs px-1.5 py-0.5 bg-muted rounded">
                            {note}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">₹{product.price}</span>
                    {product.original_price && (
                      <span className="ml-2 text-sm text-muted-foreground line-through">
                        ₹{product.original_price}
                      </span>
                    )}
                  </div>
                  {product.discount_percent > 0 && (
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold mt-1 bg-secondary text-secondary-foreground">
                      {product.discount_percent}% OFF
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      defaultValue={product.stock_quantity}
                      onBlur={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        if (newValue !== product.stock_quantity) {
                          updateStockMutation.mutate({ id: product.id, stock_quantity: newValue });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-20 h-8"
                    />
                    {product.stock_quantity === 0 && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-destructive text-destructive-foreground gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Sold Out
                      </span>
                    )}
                    {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-orange-600 border-orange-600">
                        Low Stock
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      product.is_active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize">
                    {product.category}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this product?")) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!products || products.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found. Add your first product!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminProducts;
