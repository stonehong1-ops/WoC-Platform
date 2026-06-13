import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './clientApp';
import imageCompression from 'browser-image-compression';

export const storageService = {
  /**
   * Compresses an image file while preserving original format.
   * - PNG → PNG (preserves transparency)
   * - JPEG/JPG → JPEG (standard compression)
   * - HEIC/HEIF → JPEG conversion (fallback to original on failure)
   * - Other → original as-is
   */
  compressImage: async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) {
      return file; // Return non-images as-is
    }

    try {
      const isMobileWebView = typeof window !== 'undefined' &&
        /KAKAOTALK|Lines|Instagram|FBAN|FBAV/i.test(navigator.userAgent);

      const lowerName = file.name.toLowerCase();
      const isHEIC = lowerName.endsWith('.heic') || lowerName.endsWith('.heif') ||
        file.type === 'image/heic' || file.type === 'image/heif';
      const isPNG = file.type === 'image/png' || lowerName.endsWith('.png');

      // Determine output format: preserve PNG, convert HEIC to JPEG, keep JPEG for rest
      const outputType = isPNG ? 'image/png' : 'image/jpeg';
      const outputExt = isPNG ? '.png' : '.jpg';

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: !isMobileWebView,
        fileType: outputType as string,
      };

      // 5-second safety timeout for compression
      const compressionPromise = imageCompression(file, options);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));

      const compressedFile = await Promise.race([compressionPromise, timeoutPromise]);

      if (!compressedFile) {
        console.warn("Image compression timed out. Falling back to original file.");
        return file;
      }

      // Build safe filename with correct extension
      let newFileName = file.name;
      if (isHEIC) {
        newFileName = newFileName.replace(/\.(heic|heif)$/i, outputExt);
      } else if (!isPNG && !lowerName.endsWith('.jpg') && !lowerName.endsWith('.jpeg')) {
        newFileName = newFileName.replace(/\.[^/.]+$/, outputExt);
      }

      return new File([compressedFile], newFileName, {
        type: outputType,
      });
    } catch (error) {
      console.error("Error compressing image:", error);
      return file; // fallback to original on failure — MIME stays original
    }
  },

  /**
   * Sanitizes a filename: removes non-ASCII characters, spaces, and special chars.
   * Preserves the extension.
   */
  sanitizeFileName: (name: string): string => {
    const dotIdx = name.lastIndexOf('.');
    const ext = dotIdx !== -1 ? name.slice(dotIdx) : '';
    const base = dotIdx !== -1 ? name.slice(0, dotIdx) : name;
    // Keep only alphanumeric, dash, underscore
    const safe = base.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 60);
    return (safe || 'file') + ext.toLowerCase();
  },

  /**
   * Uploads a file to Firebase Storage and returns the download URL.
   * Automatically compresses images before upload.
   * @param file The file to upload
   * @param path The storage path (e.g., 'posts/image.jpg')
   * @param onProgress Optional callback for upload progress
   */
  uploadFile: async (
    file: File,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {

    // Compress file if it's an image
    const processedFile = await storageService.compressImage(file);

    // Sanitize the filename portion of the path to avoid encoding issues
    const lastSlash = path.lastIndexOf('/');
    const dir = lastSlash !== -1 ? path.slice(0, lastSlash + 1) : '';
    const rawName = lastSlash !== -1 ? path.slice(lastSlash + 1) : path;
    const safeName = storageService.sanitizeFileName(rawName);

    // Adjust extension to match actual processed file type
    let finalName = safeName;
    const processedExt = processedFile.type === 'image/png' ? '.png' : processedFile.type === 'image/jpeg' ? '.jpg' : '';
    if (processedExt && !finalName.toLowerCase().endsWith(processedExt)) {
      finalName = finalName.replace(/\.[^/.]+$/, '') + processedExt;
    }
    const finalPath = dir + finalName;

    const storageRef = ref(storage, finalPath);
    const metadata = {
      contentType: processedFile.type || file.type || 'application/octet-stream'
    };
    const uploadTask = uploadBytesResumable(storageRef, processedFile, metadata);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error("Storage upload error:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }
};
