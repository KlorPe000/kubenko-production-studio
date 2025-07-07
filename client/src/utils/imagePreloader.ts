// Preload images to improve loading performance
export class ImagePreloader {
  private preloadedImages: Set<string> = new Set();

  preloadImage(src: string): Promise<void> {
    if (this.preloadedImages.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedImages.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  preloadImages(srcs: string[]): Promise<void[]> {
    return Promise.all(srcs.map(src => this.preloadImage(src)));
  }

  // Preload first few images immediately, rest with delay
  preloadPortfolioImages(images: string[], immediately = 3): void {
    if (images.length === 0) return;

    // Load first 3 images immediately
    const immediateImages = images.slice(0, immediately);
    this.preloadImages(immediateImages);

    // Load rest with delays to avoid blocking
    const remainingImages = images.slice(immediately);
    remainingImages.forEach((src, index) => {
      setTimeout(() => {
        this.preloadImage(src);
      }, (index + 1) * 200); // 200ms delay between each image
    });
  }
}

export const imagePreloader = new ImagePreloader();