import { useSignedImageUrls } from "@/hooks/useSignedImageUrls";
import { Image as ImageIcon, Loader2 } from "lucide-react";

interface ReturnImagesGridProps {
  images: string[] | null;
}

const ReturnImagesGrid = ({ images }: ReturnImagesGridProps) => {
  const { signedUrls, isLoading } = useSignedImageUrls(images);

  if (!images || images.length === 0) return null;

  return (
    <div>
      <span className="text-muted-foreground text-sm flex items-center gap-1 mb-2">
        <ImageIcon className="w-4 h-4" />
        Attached Images ({images.length})
      </span>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading images...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {signedUrls.map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
            >
              <img src={url} alt={`Return image ${idx + 1}`} className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReturnImagesGrid;
