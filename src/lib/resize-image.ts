const MAX_WIDTH = 1200;
const TARGET_ASPECT = 4 / 3; // 4:3 ratio to match card containers
const OUTPUT_QUALITY = 0.85;
const OUTPUT_TYPE = "image/webp";

/**
 * Resize and crop an image file client-side using canvas.
 * Crops to 4:3 aspect ratio (center-top crop) and scales to fit MAX_WIDTH.
 * Outputs as WebP for smaller file sizes.
 */
export function resizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { naturalWidth, naturalHeight } = img;

      // Calculate crop region for 4:3 (center-top)
      let cropX = 0;
      let cropY = 0;
      let cropW = naturalWidth;
      let cropH = naturalHeight;

      const srcAspect = naturalWidth / naturalHeight;

      if (srcAspect > TARGET_ASPECT) {
        // Source is wider than 4:3, crop sides
        cropW = Math.round(naturalHeight * TARGET_ASPECT);
        cropX = Math.round((naturalWidth - cropW) / 2);
      } else if (srcAspect < TARGET_ASPECT) {
        // Source is taller than 4:3, crop bottom (keep top for faces)
        cropH = Math.round(naturalWidth / TARGET_ASPECT);
        cropY = 0; // top-aligned so faces aren't cut
      }

      // Scale output to fit MAX_WIDTH
      let outW = cropW;
      let outH = cropH;
      if (outW > MAX_WIDTH) {
        const ratio = MAX_WIDTH / outW;
        outW = MAX_WIDTH;
        outH = Math.round(outH * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const baseName = file.name.replace(/\.[^.]+$/, "");
          const resized = new File([blob], `${baseName}.webp`, {
            type: OUTPUT_TYPE,
            lastModified: Date.now(),
          });

          resolve(resized);
        },
        OUTPUT_TYPE,
        OUTPUT_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for resizing"));
    };

    img.src = url;
  });
}
