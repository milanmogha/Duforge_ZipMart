// Shared helpers for product image URIs and pricing math (ported from the
// duplicated renderImage / discount logic scattered across the old screens).

export const imageUri = (image?: any): string => {
  if (!image) return "";
  if (typeof image === "string") {
    return image.startsWith("data:") || image.startsWith("http") ? image : "";
  }
  if (image.data) {
    if (image.data.startsWith("data:") || image.data.startsWith("http")) {
      return image.data;
    }
    if (image.contentType) {
      return `data:${image.contentType};base64,${image.data.trim()}`;
    }
  }
  return "";
};

// Pull the primary image from a product's `images` map (image1, or first key).
export const primaryImage = (product?: any): string => {
  const imgs = product?.images;
  if (!imgs) return "";
  const first = imgs.image1 ?? imgs[Object.keys(imgs)[0]];
  return imageUri(first);
};

export const discountedPrice = (price: number, discount = 0): number =>
  discount > 0 ? price - (price * discount) / 100 : price;

export const inr = (n: number, decimals = 0): string =>
  `₹${(n || 0).toFixed(decimals)}`;
