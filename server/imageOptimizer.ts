import sharp from 'sharp';

export interface OptimizedImage {
  original: Buffer;
  thumbnail: Buffer;
  medium: Buffer;
  originalUrl?: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
}

export async function optimizeImage(buffer: Buffer, filename: string): Promise<OptimizedImage> {
  try {
    // Get original image info
    const metadata = await sharp(buffer).metadata();
    console.log(`Optimizing image: ${filename}, original size: ${metadata.width}x${metadata.height}`);

    // Aggressive compression for Render free tier
    const fileSizeMB = buffer.length / (1024 * 1024);
    const isLargeFile = fileSizeMB > 5; // Files larger than 5MB get extra compression

    // Adaptive quality based on file size
    const thumbnailQuality = isLargeFile ? 60 : 75;
    const mediumQuality = isLargeFile ? 70 : 80;
    const originalQuality = isLargeFile ? 80 : 90;

    // Process images sequentially to minimize memory usage
    console.log(`Creating thumbnail (quality: ${thumbnailQuality}%)`);
    const thumbnail = await sharp(buffer)
      .resize(250, 250, { // Smaller thumbnail for faster loading
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: thumbnailQuality, 
        progressive: true,
        mozjpeg: true // Better compression
      })
      .toBuffer();

    // Force cleanup between operations
    if (global.gc) global.gc();

    console.log(`Creating medium size (quality: ${mediumQuality}%)`);
    const medium = await sharp(buffer)
      .resize(600, 600, { // Smaller medium size for free tier
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: mediumQuality, 
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();

    // Force cleanup between operations
    if (global.gc) global.gc();

    console.log(`Creating optimized original (quality: ${originalQuality}%)`);
    const original = await sharp(buffer)
      .jpeg({ 
        quality: originalQuality, 
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();

    // Final cleanup
    if (global.gc) global.gc();

    const compressionRatio = ((buffer.length - original.length) / buffer.length * 100).toFixed(1);
    console.log(`Image optimized: thumbnail ${(thumbnail.length/1024).toFixed(1)}KB, medium ${(medium.length/1024).toFixed(1)}KB, original ${(original.length/1024).toFixed(1)}KB (${compressionRatio}% compression)`);

    return {
      original,
      thumbnail,
      medium
    };
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Fallback to original if optimization fails
    return {
      original: buffer,
      thumbnail: buffer,
      medium: buffer
    };
  }
}