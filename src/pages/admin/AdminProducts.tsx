import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Package, Loader2, AlertCircle, Upload, Image, X, Eye } from "lucide-react";

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
  const formFileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    original_price: "",
    discount_percent: "50",
    stock_quantity: "100",
    category: "woody",
    size: "100ml",
    image_url: "",
    is_active: true,
    notes_top: "",
    notes_middle: "",
    notes_base: "",
  });

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

      // Convert file to base64
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

  const createMutation = useMutation({
    mutationFn: async (product: typeof formData) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: {
          action: "create",
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price),
            original_price: parseFloat(product.original_price),
            discount_percent: parseInt(product.discount_percent),
            stock_quantity: parseInt(product.stock_quantity),
            category: product.category,
            size: product.size,
            image_url: product.image_url,
            is_active: product.is_active,
            notes: {
              top: product.notes_top.split(",").map(n => n.trim()).filter(Boolean),
              middle: product.notes_middle.split(",").map(n => n.trim()).filter(Boolean),
              base: product.notes_base.split(",").map(n => n.trim()).filter(Boolean),
            },
          },
        },
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Product created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (product: typeof formData & { id: string }) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: {
          action: "update",
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price),
            original_price: parseFloat(product.original_price),
            discount_percent: parseInt(product.discount_percent),
            stock_quantity: parseInt(product.stock_quantity),
            category: product.category,
            size: product.size,
            image_url: product.image_url,
            is_active: product.is_active,
            notes: {
              top: product.notes_top.split(",").map(n => n.trim()).filter(Boolean),
              middle: product.notes_middle.split(",").map(n => n.trim()).filter(Boolean),
              base: product.notes_base.split(",").map(n => n.trim()).filter(Boolean),
            },
          },
        },
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setEditingProduct(null);
      resetForm();
      toast({ title: "Product updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
      price: "",
      original_price: "",
      discount_percent: "50",
      stock_quantity: "100",
      category: "woody",
      size: "100ml",
      image_url: "",
      is_active: true,
      notes_top: "",
      notes_middle: "",
      notes_base: "",
    });
    setImagePreviewUrl("");
    setPendingImageFile(null);
  };

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
    setImagePreviewUrl("");
    setPendingImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If there's a pending image file, we need to upload it first after creating/updating the product
    if (pendingImageFile) {
      const productId = editingProduct ? editingProduct.id : formData.id;
      
      if (editingProduct) {
        // Update product first, then upload image
        updateMutation.mutate({ ...formData, id: editingProduct.id }, {
          onSuccess: () => {
            // Upload the image after product is updated
            uploadImageMutation.mutate({ productId, file: pendingImageFile });
          }
        });
      } else {
        // Create product first, then upload image
        createMutation.mutate(formData, {
          onSuccess: () => {
            // Upload the image after product is created
            uploadImageMutation.mutate({ productId, file: pendingImageFile });
          }
        });
      }
    } else {
      // No pending image, just create/update normally
      if (editingProduct) {
        updateMutation.mutate({ ...formData, id: editingProduct.id });
      } else {
        createMutation.mutate(formData);
      }
    }
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

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ProductForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({
                ...formData,
                name: e.target.value,
                id: editingProduct ? formData.id : generateSlug(e.target.value),
              });
            }}
            placeholder="Noir Intense"
            required
          />
        </div>
        <div>
          <Label htmlFor="id">Product ID (slug)</Label>
          <Input
            id="id"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="noir-intense"
            required
            disabled={!!editingProduct}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="A bold, mysterious fragrance..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="original_price">Original Price (₹)</Label>
          <Input
            id="original_price"
            type="number"
            value={formData.original_price}
            onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
            placeholder="888"
            required
          />
        </div>
        <div>
          <Label htmlFor="discount_percent">Discount %</Label>
          <Input
            id="discount_percent"
            type="number"
            value={formData.discount_percent}
            onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
            placeholder="50"
          />
        </div>
        <div>
          <Label htmlFor="price">Final Price (₹)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="444"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="stock_quantity">Stock Quantity</Label>
          <Input
            id="stock_quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
            placeholder="100"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="woody">Woody</SelectItem>
              <SelectItem value="floral">Floral</SelectItem>
              <SelectItem value="oriental">Oriental</SelectItem>
              <SelectItem value="fresh">Fresh</SelectItem>
              <SelectItem value="combo">Combo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="size">Size</Label>
          <Select
            value={formData.size}
            onValueChange={(value) => setFormData({ ...formData, size: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3ml">3ml</SelectItem>
              <SelectItem value="12ml">12ml</SelectItem>
              <SelectItem value="50ml">50ml</SelectItem>
              <SelectItem value="100ml">100ml</SelectItem>
              <SelectItem value="3ml PER BOTTLE">3ml PER BOTTLE</SelectItem>
              <SelectItem value="Set of 2">Set of 2</SelectItem>
              <SelectItem value="Set of 3">Set of 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fragrance Notes */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Fragrance Notes (comma-separated)</Label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="notes_top" className="text-sm text-muted-foreground">Top Notes</Label>
            <Input
              id="notes_top"
              value={formData.notes_top}
              onChange={(e) => setFormData({ ...formData, notes_top: e.target.value })}
              placeholder="Bergamot, Lemon"
            />
          </div>
          <div>
            <Label htmlFor="notes_middle" className="text-sm text-muted-foreground">Middle Notes</Label>
            <Input
              id="notes_middle"
              value={formData.notes_middle}
              onChange={(e) => setFormData({ ...formData, notes_middle: e.target.value })}
              placeholder="Jasmine, Rose"
            />
          </div>
          <div>
            <Label htmlFor="notes_base" className="text-sm text-muted-foreground">Base Notes</Label>
            <Input
              id="notes_base"
              value={formData.notes_base}
              onChange={(e) => setFormData({ ...formData, notes_base: e.target.value })}
              placeholder="Vanilla, Musk"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Product Image</Label>
        
        {/* Image Preview */}
        {(formData.image_url || imagePreviewUrl) && (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-muted group">
            <img
              src={imagePreviewUrl || formData.image_url}
              alt="Product preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsImagePreviewOpen(true)}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30"
              >
                <Eye className="h-4 w-4 text-white" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, image_url: "" });
                  setImagePreviewUrl("");
                  setPendingImageFile(null);
                }}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Upload or URL options */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => formFileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
          <input
            type="file"
            ref={formFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (!file.type.startsWith("image/")) {
                  toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
                  return;
                }
                if (file.size > 5 * 1024 * 1024) {
                  toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
                  return;
                }
                // Create preview URL
                const previewUrl = URL.createObjectURL(file);
                setImagePreviewUrl(previewUrl);
                setPendingImageFile(file);
              }
              e.target.value = "";
            }}
          />
        </div>

        {/* URL input as alternative */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>or enter URL:</span>
        </div>
        <Input
          id="image_url"
          value={formData.image_url}
          onChange={(e) => {
            setFormData({ ...formData, image_url: e.target.value });
            setImagePreviewUrl("");
            setPendingImageFile(null);
          }}
          placeholder="https://example.com/image.jpg"
        />
        
        {pendingImageFile && (
          <p className="text-sm text-muted-foreground">
            📎 {pendingImageFile.name} will be uploaded when you save the product
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label>Product Active</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsAddDialogOpen(false);
            setEditingProduct(null);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {(createMutation.isPending || updateMutation.isPending) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {editingProduct ? "Update Product" : "Add Product"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
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
          <p className="text-muted-foreground">Manage your product inventory and stock ({products?.length || 0} products)</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm />
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img
              src={imagePreviewUrl || formData.image_url}
              alt="Product preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
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
                    <Badge variant="secondary" className="mt-1">
                      {product.discount_percent}% OFF
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={product.stock_quantity}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        updateStockMutation.mutate({ id: product.id, stock_quantity: newValue });
                      }}
                      className="w-20 h-8"
                    />
                    {product.stock_quantity === 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Sold Out
                      </Badge>
                    )}
                    {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Low Stock
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {product.category}
                  </Badge>
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
