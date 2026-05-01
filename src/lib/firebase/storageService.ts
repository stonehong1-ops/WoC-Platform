import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './clientApp';
import imageCompression from 'browser-image-compression';

export const storageService = {
  /**
   * Compresses an image file (and converts HEIC to JPEG)
   */
  compressImage: async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) {
      return file; // Return non-images as is
    }
    
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg' as string,
      };
      
      const compressedFile = await imageCompression(file, options);
      // Ensure the file name has the correct extension if converted
      const newFileName = file.name.replace(/\.(heic|HEIC|heif|HEIF|png|PNG)$/, '.jpg');
      
      return new File([compressedFile], newFileName, {
        type: 'image/jpeg',
      });
    } catch (error) {
      console.error("Error compressing image:", error);
      return file; // fallback to original file if compression fails
    }
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
    
    // Adjust path extension if the file was converted to jpeg
    let finalPath = path;
    if (processedFile.name.endsWith('.jpg') && !path.endsWith('.jpg')) {
        finalPath = path.replace(/\.[^/.]+$/, "") + ".jpg";
    }

    const storageRef = ref(storage, finalPath);
    const uploadTask = uploadBytesResumable(storageRef, processedFile);

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
