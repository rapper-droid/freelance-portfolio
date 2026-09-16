// Change on a new capture set; versioned paths invalidate persistent image caches.
export const previewRevision = "premium-3";
export const previewPath = (slug: string, device: string | number) =>
  `/previews/${slug}-${device}-${previewRevision}.webp`;
