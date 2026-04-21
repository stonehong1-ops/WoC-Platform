import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './clientApp';

export const storageService = {
  /**
   * Uploads a file to Firebase Storage and returns the download URL.
   * @param file The file to upload
   * @param path The storage path (e.g., 'posts/image.jpg')
   * @param onProgress Optional callback for upload progress
   */
  uploadFile: async (
    file: File, 
    path: string, 
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
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
