import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/services/supabase";

/**
 * Resolves a Supabase storage path into a displayable URL.
 * Uses a signed URL (works for private buckets) and falls back to
 * the public URL if signing fails (public bucket).
 *
 * @param path  - Storage path stored in DB/metadata (e.g. "uuid/avatar.jpg")
 * @param bucket - The storage bucket name
 */
export const useResolvedAvatarUrl = (
  path: string | null | undefined,
  bucket: string,
): string | null => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (!path || !isSupabaseConfigured() || !supabase) {
        setUrl(null);
        return;
      }

      // Try signed URL first (works for private buckets)
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);

      if (cancelled) return;

      if (!error && data?.signedUrl) {
        setUrl(data.signedUrl);
      } else {
        // Bucket is public — fall back to public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);
        setUrl(publicUrl);
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [path, bucket]);

  return url;
};
