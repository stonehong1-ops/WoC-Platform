import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useNavigationGuard(
  isActive: boolean,
  onExit: () => void,
  warningMessage: string = "한 번 더 누르면 방을 나갑니다"
) {
  const router = useRouter();
  const [backPressCount, setBackPressCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    // Push a dummy state to history so we can intercept the popstate
    // Preserve Next.js internal state to prevent white screen on subsequent router.push
    const currentState = window.history.state;
    window.history.pushState(currentState, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // Prevent default back behavior
      const currentState = window.history.state;
      window.history.pushState(currentState, '', window.location.href);

      setBackPressCount((prev) => {
        if (prev === 0) {
          toast(warningMessage, {
            duration: 2000,
          });
          
          // Reset count after 2 seconds
          setTimeout(() => {
            setBackPressCount(0);
          }, 2000);
          
          return 1;
        } else {
          // Double back pressed within 2 seconds
          onExit();
          return 0;
        }
      });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isActive, onExit, warningMessage]);

  return { backPressCount };
}
