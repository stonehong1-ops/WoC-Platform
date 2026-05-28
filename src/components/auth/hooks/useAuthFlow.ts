import { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/clientApp';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAuthErrorMessage } from '../helpers/authHelpers';

export function useAuthFlow() {
  const { user, profile, showLogin, setShowLogin } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeoutCount, setTimeoutCount] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [step, setStep] = useState<'SOCIAL' | 'PHONE_INPUT' | 'PHONE_VERIFY' | 'FORM' | 'EMAIL_INPUT'>('SOCIAL');
  const [authMethod, setAuthMethod] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+82');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const router = useRouter();
  const currentPathname = usePathname();

  const [details, setDetails] = useState({
    nickname: '',
    nativeNickname: '',
    countryCode: 'KR',
    gender: 'Other'
  });

  const handleClose = () => setShowLogin(false);

  // 1. Modal Lifecycle Management (Form Reset, Body Scroll Lock, and Registered User Warp Redirect)
  useEffect(() => {
    if (showLogin) {
      // a. Reset form states
      setStep('SOCIAL');
      setAuthMethod('');
      setPhoneCountryCode('+82');
      setPhoneNumber('');
      setVerificationCode('');
      setEmail('');
      setPassword('');
      setConfirmationResult(null);
      setTimeoutCount(0);
      setCooldown(false);
      resetRecaptcha();

      // b. Scroll Lock
      document.body.style.overflow = 'hidden';
      document.body.classList.add('auth-open');

      // c. Fast Warp for already registered users
      if (user && profile?.isRegistered) {
        handleClose();
        const lastContext = localStorage.getItem('woc_context');
        setTimeout(() => {
          if (lastContext) {
            localStorage.removeItem('woc_context');
            window.location.replace(lastContext);
          } else {
            window.location.replace('/live');
          }
        }, 50);
      }
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('auth-open');
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('auth-open');
    };
  }, [showLogin, user, profile, currentPathname]);

  // 2. Authentication Interaction Triggers (Countdown Timer, Auto-OTP verification, Profile Prefill)
  useEffect(() => {
    // a. SMS Countdown Timer (PHONE_VERIFY step)
    let timer: NodeJS.Timeout;
    if (step === 'PHONE_VERIFY') {
      if (countdown === null) {
        setCountdown(180); // 3 minutes
      }
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(null);
    }

    // b. Auto OTP Code Verification
    if (verificationCode.length === 6 && confirmationResult && !isLoading) {
      handleVerifyCode();
    }

    // c. Registration Prefill mapping based on user language characters
    if (user && !details.nickname && !details.nativeNickname) {
      const displayName = user.displayName || '';
      const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(displayName);
      
      if (hasKorean) {
        setDetails(prev => ({
          ...prev,
          nickname: '',
          nativeNickname: displayName
        }));
      } else {
        setDetails(prev => ({
          ...prev,
          nickname: displayName,
          nativeNickname: ''
        }));
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading, step, verificationCode, confirmationResult, user, details.nickname, details.nativeNickname]);

  const resetRecaptcha = () => {
    try {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
    } catch (e) {
      console.warn("Recaptcha clear error:", e);
    } finally {
      (window as any).recaptchaVerifier = null;
    }

    document.querySelectorAll('[id^="recaptcha-box-"]').forEach(el => el.remove());
    document.querySelectorAll('iframe[src*="recaptcha"]').forEach(el => el.remove());
  };

  const setupRecaptcha = async (useVisible: boolean = false) => {
    const existingVerifier = (window as any).recaptchaVerifier;
    let needNewVerifier = true;

    if (existingVerifier) {
      const containerId = existingVerifier.container?.id || existingVerifier.m;
      if (containerId && document.getElementById(containerId)) {
        needNewVerifier = false;
      }
    }

    if (needNewVerifier) {
      resetRecaptcha();

      const containerId = `recaptcha-box-${Date.now()}`;
      const container = document.createElement('div');
      container.id = containerId;
      
      if (!useVisible) {
        container.style.display = 'none';
        document.body.appendChild(container);
      } else {
        const parent = document.getElementById('recaptcha-placeholder');
        if (parent) {
          parent.appendChild(container);
        } else {
          document.body.appendChild(container);
        }
      }

      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': useVisible ? 'normal' : 'invisible',
        'callback': () => {},
        'expired-callback': () => {
          resetRecaptcha();
        }
      });

      await (window as any).recaptchaVerifier.render();
    }
  };

  const handleEmailLogin = async () => {
    if (isLoading) return;
    if (!email || !password) {
      alert(language === 'KR' ? '이메일과 비밀번호를 모두 입력해주세요.' : 'Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      alert(language === 'KR' ? '비밀번호는 최소 6자리 이상이어야 합니다.' : 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setAuthMethod('Email');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const loggedUser = result.user;
      const userDoc = await getDoc(doc(db, 'users', loggedUser.uid));
      if (userDoc.exists() && userDoc.data()?.isRegistered === true) {
        handleClose();
        const lastContext = localStorage.getItem('woc_context');
        setTimeout(() => {
          if (lastContext) {
            localStorage.removeItem('woc_context');
            window.location.replace(lastContext);
          } else {
            window.location.replace('/live');
          }
        }, 50);
      } else {
        setStep('FORM');
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        try {
          const regResult = await createUserWithEmailAndPassword(auth, email, password);
          const loggedUser = regResult.user;
          const userDoc = await getDoc(doc(db, 'users', loggedUser.uid));
          if (userDoc.exists() && userDoc.data()?.isRegistered === true) {
            handleClose();
            const lastContext = localStorage.getItem('woc_context');
            setTimeout(() => {
              if (lastContext) {
                localStorage.removeItem('woc_context');
                window.location.replace(lastContext);
              } else {
                window.location.replace('/live');
              }
            }, 50);
          } else {
            setStep('FORM');
          }
        } catch (regError: any) {
          if (regError.code === 'auth/email-already-in-use') {
            alert(language === 'KR' ? '올바르지 않은 비밀번호입니다.' : 'Invalid password.');
          } else {
            console.error(regError);
            alert(getAuthErrorMessage(regError.code, regError.message, language));
          }
        }
      } else {
        console.error(error);
        alert(getAuthErrorMessage(error.code, error.message, language));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setAuthMethod('Google');
    try {
      const provider = new GoogleAuthProvider();
      const isStandalone = typeof window !== 'undefined' && (
        (window.navigator as any).standalone || 
        window.matchMedia('(display-mode: standalone)').matches
      );
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isStandalone || isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        const loggedUser = result.user;
        
        const userDoc = await getDoc(doc(db, 'users', loggedUser.uid));
        if (userDoc.exists() && userDoc.data()?.isRegistered === true) {
          if (!userDoc.data()?.photoURL && loggedUser.photoURL) {
            await setDoc(doc(db, 'users', loggedUser.uid), {
              photoURL: loggedUser.photoURL,
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
        } else {
          setStep('FORM');
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(t('auth.alert_login_failed') + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setAuthMethod('Facebook');
    try {
      const provider = new FacebookAuthProvider();
      const isStandalone = typeof window !== 'undefined' && (
        (window.navigator as any).standalone || 
        window.matchMedia('(display-mode: standalone)').matches
      );
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isStandalone || isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        const loggedUser = result.user;

        const userDoc = await getDoc(doc(db, 'users', loggedUser.uid));
        if (userDoc.exists() && userDoc.data()?.isRegistered === true) {
          if (!userDoc.data()?.photoURL && loggedUser.photoURL) {
            await setDoc(doc(db, 'users', loggedUser.uid), {
              photoURL: loggedUser.photoURL,
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
        } else {
          setStep('FORM');
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(t('auth.alert_login_failed') + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (isLoading || cooldown) return;
    if (!phoneNumber) {
      alert(t('auth.alert_invalid_phone'));
      return;
    }
    
    const pureDigits = phoneNumber.replace(/[^\d]/g, '');
    if (pureDigits.length < 7) {
      alert(language === 'KR' ? '너무 짧은 번호입니다. 올바른 전화번호를 입력해 주세요.' : 'Phone number is too short. Please enter a valid number.');
      return;
    }

    setIsLoading(true);
    try {
      const sendSmsProcess = async () => {
        const useVisible = timeoutCount >= 2;
        await setupRecaptcha(useVisible);
        const appVerifier = (window as any).recaptchaVerifier;
        
        let cleanedNumber = phoneNumber.replace(/[^\d]/g, '');
        const currentCC = phoneCountryCode;
        const currentCCNumeric = currentCC.replace('+', '');
        
        if (cleanedNumber.startsWith(currentCCNumeric)) {
          cleanedNumber = cleanedNumber.slice(currentCCNumeric.length);
        }
        
        cleanedNumber = cleanedNumber.replace(/^0+/, '');
        setPhoneNumber(cleanedNumber);
        
        const finalPhoneE164 = `${currentCC}${cleanedNumber}`;
        return await signInWithPhoneNumber(auth, finalPhoneE164, appVerifier);
      };

      const useVisible = timeoutCount >= 2;
      const timeoutDuration = useVisible ? 60000 : 15000;
      
      const timeoutProcess = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), timeoutDuration);
      });

      const confirmation = await Promise.race([sendSmsProcess(), timeoutProcess]) as ConfirmationResult;
      
      setConfirmationResult(confirmation);
      setStep('PHONE_VERIFY');
      setTimeoutCount(0);
    } catch (error: any) {
      console.warn("SMS sending failed:", error);
      resetRecaptcha();
      
      if (error.message === 'timeout') {
        setTimeoutCount(prev => prev + 1);
        const isKo = language === 'KR';
        alert(isKo 
          ? '보안 인증 처리가 지연되고 있습니다. 잠시 후 다시 시도해 주세요.' 
          : 'Security verification is taking too long. Please try again in a moment.');
          
        setCooldown(true);
        setTimeout(() => setCooldown(false), 3000);
      } else {
        const msg = getAuthErrorMessage(error.code, error.message, language);
        alert(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (isLoading) return;
    if (!verificationCode || !confirmationResult) {
      alert(t('auth.alert_enter_code'));
      return;
    }
    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      const loggedUser = result.user;
      setAuthMethod('Phone');

      const userDoc = await getDoc(doc(db, 'users', loggedUser.uid));
      if (userDoc.exists() && userDoc.data()?.isRegistered === true) {
        handleClose();
        setTimeout(() => {
          window.location.replace('/live');
        }, 50);
      } else {
        setStep('FORM');
      }
    } catch (error: any) {
      console.warn("Verification failed:", error);
      setVerificationCode('');
      const msg = getAuthErrorMessage(error.code, error.message, language);
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (isLoading) return;
    if (!user) {
      alert(t('auth.alert_verify_first'));
      setStep('SOCIAL');
      return;
    }
    if (!details.nickname || !details.countryCode || !details.gender) {
      alert(t('auth.alert_fill_fields'));
      return;
    }

    setIsLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        authMethod: authMethod,
        nickname: details.nickname,
        nativeNickname: details.nativeNickname,
        countryCode: details.countryCode,
        gender: details.gender,
        role: details.gender.toLowerCase() === 'male' ? 'leader' : 'follower',
        photoURL: user.photoURL,
        isRegistered: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err: any) {
      console.warn(err);
      alert(t('auth.alert_reg_failed') + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    profile,
    showLogin,
    setShowLogin,
    language,
    setLanguage,
    t,
    isLoading,
    countdown,
    timeoutCount,
    cooldown,
    step,
    setStep,
    authMethod,
    email,
    setEmail,
    password,
    setPassword,
    phoneCountryCode,
    setPhoneCountryCode,
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    details,
    setDetails,
    handleClose,
    resetRecaptcha,
    handleEmailLogin,
    handleGoogleLogin,
    handleFacebookLogin,
    handleSendCode,
    handleVerifyCode,
    handleCompleteRegistration
  };
}
