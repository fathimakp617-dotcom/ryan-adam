import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, Eye, X } from "lucide-react";

export interface ProductFormData {
  id: string;
  name: string;
  description: string;
  price: string;
  original_price: string;
  discount_percent: string;
  stock_quantity: string;
  category: string;
  size: string;
  image_url: string;
  is_active: boolean;
  notes_top: string;
  notes_middle: string;
  notes_base: string;
}

export const emptyFormData: ProductFormData = {
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
};

interface ProductFormProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  isEditing: boolean;
  isSubmitting: boolean;
  onSubmit: (formData: ProductFormData, pendingImageFile: File | null) => void;
  onCancel: () => void;
}

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
};

const ProductForm = ({
  formData,
  setFormData,
  isEditing,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProductFormProps) => {
  const { toast } = useToast();
  const formFileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.id.trim()) {
      toast({ title: "Error", description: "Product ID is required", variant: "destructive" });
      return;
    }
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Product name is required", variant: "destructive" });
      return;
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      toast({ title: "Error", description: "Please enter a valid price", variant: "destructive" });
      return;
    }
    if (!formData.original_price || isNaN(parseFloat(formData.original_price)) || parseFloat(formData.original_price) <= 0) {
      toast({ title: "Error", description: "Please enter a valid original price", variant: "destructive" });
      return;
    }

    onSubmit(formData, pendingImageFile);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                  id: isEditing ? prev.id : generateSlug(e.target.value),
                }));
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
              onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value }))}
              placeholder="noir-intense"
              required
              disabled={isEditing}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
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
              min="0"
              step="0.01"
              value={formData.original_price}
              onChange={(e) => setFormData((prev) => ({ ...prev, original_price: e.target.value }))}
              placeholder="888"
              required
            />
          </div>
          <div>
            <Label htmlFor="discount_percent">Discount %</Label>
            <Input
              id="discount_percent"
              type="number"
              min="0"
              max="100"
              value={formData.discount_percent}
              onChange={(e) => setFormData((prev) => ({ ...prev, discount_percent: e.target.value }))}
              placeholder="50"
            />
          </div>
          <div>
            <Label htmlFor="price">Final Price (₹)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
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
              min="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData((prev) => ({ ...prev, stock_quantity: e.target.value }))}
              placeholder="100"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
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
              onValueChange={(value) => setFormData((prev) => ({ ...prev, size: value }))}
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
                onChange={(e) => setFormData((prev) => ({ ...prev, notes_top: e.target.value }))}
                placeholder="Bergamot, Lemon"
              />
            </div>
            <div>
              <Label htmlFor="notes_middle" className="text-sm text-muted-foreground">Middle Notes</Label>
              <Input
                id="notes_middle"
                value={formData.notes_middle}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes_middle: e.target.value }))}
                placeholder="Jasmine, Rose"
              />
            </div>
            <div>
              <Label htmlFor="notes_base" className="text-sm text-muted-foreground">Base Notes</Label>
              <Input
                id="notes_base"
                value={formData.notes_base}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes_base: e.target.value }))}
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
                  (e.target as HTMLImageElement).style.display = "none";
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
                    setFormData((prev) => ({ ...prev, image_url: "" }));
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
              setFormData((prev) => ({ ...prev, image_url: e.target.value }));
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
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
          />
          <Label>Product Active</Label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </form>

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
    </>
  );
};

export default ProductForm;
