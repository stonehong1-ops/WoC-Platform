import { useState, useEffect } from 'react';

export function useBase64Image(url: string | undefined | null) {
  const [base64, setBase64] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!url) {
      setBase64(undefined);
      return;
    }
    
    if (url.startsWith('data:')) {
      setBase64(url);
      return;
    }

    let isMounted = true;

    const fetchImage = async () => {
      try {
        // Use proxy for external images
        const fetchUrl = url.startsWith('http') 
          ? `/api/proxy/image?url=${encodeURIComponent(url)}` 
          : url;
          
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: status ${response.status}`);
        }
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted) {
            setBase64(reader.result as string);
          }
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error("Failed to convert image to base64", e);
        if (isMounted) {
          setBase64(undefined);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return base64;
}
