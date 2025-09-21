/**
 * Image compression utility for client-side image resizing and compression
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: string;
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  outputFormat: 'image/jpeg'
};

/**
 * Compresses an image file using Canvas API
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
  file: File, 
  options: ImageCompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const { width: newWidth, height: newHeight } = calculateDimensions(
        img.width, 
        img.height, 
        opts.maxWidth, 
        opts.maxHeight
      );
      
      // Set canvas size
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw and compress the image
      ctx.fillStyle = '#FFFFFF'; // White background for JPEG
      ctx.fillRect(0, 0, newWidth, newHeight);
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // Create a new File object with compressed data
          const compressedFile = new File(
            [blob], 
            file.name.replace(/\.[^/.]+$/, '.jpg'), // Change extension to jpg
            { 
              type: opts.outputFormat,
              lastModified: Date.now()
            }
          );
          
          console.log(`Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`);
          resolve(compressedFile);
        },
        opts.outputFormat,
        opts.quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number, 
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // Only resize if image is larger than max dimensions
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;
    
    if (width > height) {
      width = maxWidth;
      height = width / aspectRatio;
    } else {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    // Ensure we don't exceed max dimensions
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
  }
  
  return { 
    width: Math.round(width), 
    height: Math.round(height) 
  };
}

/**
 * Format file size for logging
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}