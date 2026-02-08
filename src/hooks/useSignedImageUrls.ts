import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to generate signed URLs for private storage bucket images.
 * Handles both legacy public URLs and new file paths.
 * Signed URLs expire after 1 hour.
 */
export function useSignedImageUrls(paths: string[] | null | undefined) {
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!paths || paths.length === 0) {
      setSignedUrls([]);
      return;
    }

    const generateSignedUrls = async () => {
      setIsLoading(true);
      const urls: string[] = [];

      for (const path of paths) {
        // If it's already a full URL (legacy data), use it as-is
        if (path.startsWith("http://") || path.startsWith("https://")) {
          urls.push(path);
          continue;
        }

        // Generate signed URL for file paths
        try {
          const { data, error } = await supabase.storage
            .from("return-images")
            .createSignedUrl(path, 3600); // 1 hour expiry

          if (data?.signedUrl && !error) {
            urls.push(data.signedUrl);
          }
        } catch {
          // Skip failed URLs silently
        }
      }

      setSignedUrls(urls);
      setIsLoading(false);
    };

    generateSignedUrls();
  }, [paths?.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return { signedUrls, isLoading };
}
