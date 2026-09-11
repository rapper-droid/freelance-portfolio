// Change on a new capture set; versioned paths invalidate persistent image caches.
export const previewRevision = "figma-sales-1";
export const previewPath = (slug: string, device: string | number) =>
  `/previews/${slug}-${device}-${previewRevision}.webp`;
