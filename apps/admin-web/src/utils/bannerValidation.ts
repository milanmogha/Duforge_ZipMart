// Fixed banner size contract shared by the admin upload UI.
// Uploads are rejected unless the image matches the exact dimensions.

export interface BannerSpec {
  width: number;
  height: number;
  label: string; // e.g. "1200 × 600"
  maxFileBytes: number; // 1 MB
}

export const BANNER_1: BannerSpec = {
  width: 1200,
  height: 600,
  label: "1200 × 600",
  maxFileBytes: 1 * 1024 * 1024,
};

export const BANNER_2: BannerSpec = {
  width: 1200,
  height: 500,
  label: "1200 × 500",
  maxFileBytes: 1 * 1024 * 1024,
};

export const BANNER_3: BannerSpec = {
  width: 800,
  height: 400,
  label: "800 × 400",
  maxFileBytes: 1 * 1024 * 1024,
};

// Reads the file's intrinsic dimensions.
export const readImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image file."));
    };
    img.src = url;
  });

// Returns an error message string, or null if the file is valid.
export const validateBannerFile = async (
  file: File,
  spec: BannerSpec
): Promise<string | null> => {
  if (file.size > spec.maxFileBytes) {
    return `Image size must be at most 1 MB (got ${(file.size / 1024).toFixed(0)} KB).`;
  }
  try {
    const { width, height } = await readImageDimensions(file);
    if (width !== spec.width || height !== spec.height) {
      return `Image must be exactly ${spec.label} pixels. This image is ${width} × ${height}.`;
    }
  } catch (err: any) {
    return err.message || "Could not read the image file.";
  }
  return null;
};
