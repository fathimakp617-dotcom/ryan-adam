import { useState } from "react";
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
import { Plus, Pencil, Trash2, Package, Loader2, AlertCircle } from "lucide-react";

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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

  const createMutation = useMutation({
    mutationFn: async (product: typeof formData) => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-products", {
        body: {
          action: "create",
          product: {
            ...product,
            price: parseFloat(product.price),
            original_price: parseFloat(product.original_price),
            discount_percent: parseInt(product.discount_percent),
            stock_quantity: parseInt(product.stock_quantity),
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
    onError: (error: any) => {
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
            ...product,
            price: parseFloat(product.price),
            original_price: parseFloat(product.original_price),
            discount_percent: parseInt(product.discount_percent),
            stock_quantity: parseInt(product.stock_quantity),
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
    onError: (error: any) => {
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
    onError: (error: any) => {
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
    onError: (error: any) => {
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
    });
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
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ ...formData, id: editingProduct.id });
    } else {
      createMutation.mutate(formData);
    }
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
              <SelectItem value="50ml">50ml</SelectItem>
              <SelectItem value="100ml">100ml</SelectItem>
              <SelectItem value="Set of 2">Set of 2</SelectItem>
              <SelectItem value="Set of 3">Set of 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="image_url">Image URL (optional)</Label>
        <Input
          id="image_url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://..."
        />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory and stock</p>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.id}</div>
                    </div>
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
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
