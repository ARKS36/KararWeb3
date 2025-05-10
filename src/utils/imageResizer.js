/**
 * Utility for resizing images before upload
 */

/**
 * Resizes an image to specified width and height while maintaining aspect ratio
 * @param {File} imageFile - The original image file
 * @param {Object} options - Resizing options
 * @param {number} options.maxWidth - Maximum width for the resized image
 * @param {number} options.maxHeight - Maximum height for the resized image
 * @param {string} options.format - Output format ('jpeg', 'png', etc.)
 * @param {number} options.quality - Image quality (0-1)
 * @returns {Promise<Blob>} - A promise resolving to the resized image as a Blob
 */
export const resizeImage = async (imageFile, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    format = 'jpeg',
    quality = 0.8
  } = options;

  return new Promise((resolve, reject) => {
    // Create image element to load the file
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Create canvas and resize image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        `image/${format}`,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load image from file
    img.src = URL.createObjectURL(imageFile);
  });
};

/**
 * Get image dimensions from a file
 * @param {File} imageFile - The image file
 * @returns {Promise<{width: number, height: number}>} - Image dimensions
 */
export const getImageDimensions = (imageFile) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(imageFile);
  });
};

/**
 * Creates a thumbnail version of an image suitable for cards
 * @param {File} imageFile - The original image file
 * @param {Object} options - Thumbnail options
 * @param {number} options.width - Thumbnail width
 * @param {number} options.height - Thumbnail height
 * @param {string} options.format - Output format ('jpeg', 'png', etc.)
 * @param {number} options.quality - Image quality (0-1) 
 * @returns {Promise<Blob>} - A promise resolving to the thumbnail as a Blob
 */
export const createThumbnail = async (imageFile, options = {}) => {
  const {
    width = 300,
    height = 200,
    format = 'jpeg',
    quality = 0.7
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate dimensions for center crop
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;
      
      // If the image aspect ratio doesn't match the target aspect ratio, 
      // crop from the center to maintain target aspect ratio
      const targetRatio = width / height;
      const imageRatio = img.width / img.height;
      
      if (imageRatio > targetRatio) {
        // Image is wider than target - crop sides
        sourceWidth = img.height * targetRatio;
        sourceX = (img.width - sourceWidth) / 2;
      } else if (imageRatio < targetRatio) {
        // Image is taller than target - crop top/bottom
        sourceHeight = img.width / targetRatio;
        sourceY = (img.height - sourceHeight) / 2;
      }
      
      // Create canvas for thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, width, height
      );
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        `image/${format}`,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail creation'));
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
}; 