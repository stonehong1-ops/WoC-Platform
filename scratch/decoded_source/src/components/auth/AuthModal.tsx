'use client';

import React, { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup,
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
import { useHistoryBack } from '@/hooks/useHistoryBack';
import { COUNTRY_CODES } from '@/lib/constants/countryCodes';

export default function AuthModal() {
  const { user, profile, showLogin, setShowLogin } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const getAuthErrorMessage = (code: string, fallback: string): string => {
    const isKo = language === 'KR';
    const messages: Record<string, string> = {
      'auth/too-many-requests': isKo 
        ? '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.' 
        : 'Too many attempts. Please wait a moment and try again.',
      'auth/invalid-verification-code': isKo
        ? '인증 코드가 올바르지 않습니다. 다시 확인해주세요.'
        : 'Invalid verification code. Please check and try again.',
      'auth/code-expired': isKo
        ? '인증 코드가 만료되었습니다. 새 코드를 요청해주세요.'
        : 'Verification code has expired. Please request a new one.',
      'auth/invalid-phone-number': isKo
        ? '유효하지 않은 전화번호입니다.'
        : 'Invalid phone number.',
      'auth/network-request-failed': isKo
        ? '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.'
        : 'Network error. Please check your connection.',
      'auth/quota-exceeded': isKo
        ? 'SMS 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
        : 'SMS quota exceeded. Please try again later.',
      'auth/captcha-check-failed': isKo
        ? '보안 인증에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.'
        : 'Security check failed. Please refresh and try again.',
    };
    return messages[code] || (isKo ? `오류: ${fallback}` : `Error: ${fallback}`);
  };

  const getRegionName = (isoCode: string) => {
    try {
      const locale = language === 'KR' ? 'ko-KR' : 'en-US';
      return new Intl.DisplayNames([locale], { type: 'region' }).of(isoCode) || isoCode;
    } catch (e) {
      return isoCode;
    }
  };
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

  const { handleClose } = useHistoryBack(showLogin, () => setShowLogin(false));

  const [details, setDetails] = useState({
    nickname: '',
    nativeNickname: '',
    countryCode: 'KR',
    gender: 'Other'
  });

  useEffect(() => {
    if (showLogin) {
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
      // Clear stale reCAPTCHA verifier on modal open
      resetRecaptcha();
    }
  }, [showLogin]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading && step === 'PHONE_INPUT') {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) return 1;
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(null);
    }
    return () => clearInterval(timer);
  }, [isLoading, step]);

  // Lock body scroll when open
  useEffect(() => {
    if (showLogin) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('auth-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('auth-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('auth-open');
    };
  }, [showLogin]);

  // Handle automatic nickname pre-fill when user is newly authenticated
  useEffect(() => {
    if (user && !details.nickname) {
      setDetails(prev => ({ ...prev, nickname: user.displayName || '' }));
    }
  }, [user, details.nickname]);

  // Automatic success observer (only if they are registered)
  useEffect(() => {
    if (user && profile?.isRegistered && showLogin) {
      handleClose();
      const lastContext = localStorage.getItem('woc_context');
      
      setTimeout(() => {
        if (lastContext) {
          localStorage.removeItem('woc_context');
          // Skip push if already on the target page to prevent flicker
          if (currentPathname !== lastContext) {
            router.push(lastContext);
          }
        } else {
          // Skip push if already on /social to prevent flicker
          if (currentPathname !== '/social') {
            router.push('/social');
          }
        }
      }, 50);
    }
  }, [user, profile, showLogin, handleClose, router, currentPathname]);

  if (!showLogin) return null;

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
            if (currentPathname !== lastContext) router.push(lastContext);
          } else {
            if (currentPathname !== '/social') router.push('/social');
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
                if (currentPathname !== lastContext) router.push(lastContext);
              } else {
                if (currentPathname !== '/social') router.push('/social');
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
            alert(getAuthErrorMessage(regError.code, regError.message));
          }
        }
      } else {
        console.error(error);
        alert(getAuthErrorMessage(error.code, error.message));
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
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;
      
      // Directly check Firestore instead of relying on profile state
      const userDoc = await getDoc(doc(db, 'users', loggedUser.uid));
      if (userDoc.exists() && userDoc.data()?.isRegistered === true) {
        // Already registered — update photo if missing
        if (!userDoc.data()?.photoURL && loggedUser.photoURL) {
          await setDoc(doc(db, 'users', loggedUser.uid), {
            photoURL: loggedUser.photoURL,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      } else {
        setStep('FORM');
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
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;

      // Directly check Firestore instead of relying on profile state
      const userDoc = await getDoc(doc(db, 'users', loggedUser.uid));
      if (userDoc.exists() && userDoc.data()?.isRegistered === true) {
        // Already registered — update photo if missing
        if (!userDoc.data()?.photoURL && loggedUser.photoURL) {
          await setDoc(doc(db, 'users', loggedUser.uid), {
            photoURL: loggedUser.photoURL,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      } else {
        setStep('FORM');
      }
    } catch (err: any) {
      console.error(err);
      alert(t('auth.alert_login_failed') + err.message);
    } finally {
      setIsLoading(false);
    }
  };

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

    // Remove ALL previous recaptcha containers to ensure clean slate
    document.querySelectorAll('[id^="recaptcha-box-"]').forEach(el => el.remove());
    
    // Remove orphaned iframes to prevent background zombie processes
    document.querySelectorAll('iframe[src*="recaptcha"]').forEach(el => el.remove());
  };

  const setupRecaptcha = async (useVisible: boolean = false) => {
    // Check for existing verifier and valid DOM container
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

      // Create a brand-new container with a unique ID each time
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
        'callback': () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          resetRecaptcha();
        }
      });

      await (window as any).recaptchaVerifier.render();
    }
  };

  const handleSendCode = async () => {
    if (isLoading || cooldown) return;
    if (!phoneNumber) {
      alert(t('auth.alert_invalid_phone'));
      return;
    }
    setIsLoading(true);
    try {
      const sendSmsProcess = async () => {
        const useVisible = timeoutCount >= 2;
        await setupRecaptcha(useVisible);
        const appVerifier = (window as any).recaptchaVerifier;
        
        console.log("RAW_INPUT:", phoneNumber);
        
        let cleanedNumber = phoneNumber;
        const currentCC = phoneCountryCode;
        const currentCCNumeric = currentCC.replace('+', '');
        
        // 1. 방어: 사용자가 +82나 82를 직접 입력한 경우 제거
        if (cleanedNumber.startsWith(currentCC)) {
          cleanedNumber = cleanedNumber.slice(currentCC.length);
        } else if (cleanedNumber.startsWith(currentCCNumeric)) {
          cleanedNumber = cleanedNumber.slice(currentCCNumeric.length);
        }
        
        // 2. 방어: 맨 앞의 0 제거 (010 -> 10)
        cleanedNumber = cleanedNumber.replace(/^0/, '');
        console.log("NORMALIZED_PHONE:", cleanedNumber);
        
        // 3. E.164 포맷 조합
        const finalPhoneE164 = `${currentCC}${cleanedNumber}`;
        console.log("FINAL_PHONE_E164:", finalPhoneE164);

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
      setTimeoutCount(0); // 성공 시 카운트 초기화
      console.log("SEND_SMS_SUCCESS");
    } catch (error: any) {
      console.warn("SMS sending failed:", error);
      console.log("SEND_SMS_FAIL");
      // Reset reCAPTCHA verifier so next attempt creates a fresh one
      resetRecaptcha();
      
      if (error.message === 'timeout') {
        setTimeoutCount(prev => prev + 1);
        const isKo = language === 'KR';
        alert(isKo 
          ? '인증 요청이 지연되고 있습니다.\nSafari 또는 Chrome에서 다시 시도해주세요.' 
          : 'Verification is taking too long.\nPlease retry in Safari or Chrome.');
          
        setCooldown(true);
        setTimeout(() => setCooldown(false), 3000);
      } else {
        const msg = getAuthErrorMessage(error.code, error.message);
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
        // Already registered user — close modal and navigate
        handleClose();
        setTimeout(() => {
          router.push('/social');
        }, 50);
      } else {
        setStep('FORM');
      }
    } catch (error: any) {
      console.warn("Verification failed:", error);
      const msg = getAuthErrorMessage(error.code, error.message);
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

  return (
    <div className="fixed inset-0 z-[100] bg-background text-on-surface flex flex-col overflow-y-auto min-h-screen animate-in fade-in duration-300">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex items-center px-4 h-16 bg-white border-b border-gray-100 transition-colors duration-200">
        <div className="flex items-center w-full max-w-2xl mx-auto justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-manrope text-base font-semibold text-gray-900 font-headline">
              {t('auth.title_signin')}
            </h1>
          </div>
          {/* Language Toggle */}
          <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 p-0.5">
            <button 
              type="button"
              onClick={() => setLanguage('KR')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${language === 'KR' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Ko
            </button>
            <button 
              type="button"
              onClick={() => setLanguage('EN')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${language === 'EN' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              En
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-20 pb-24 px-6 max-w-2xl mx-auto w-full relative">
        {/* Floating Wait Message */}
        {isLoading && step === 'PHONE_INPUT' && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl z-50 animate-bounce whitespace-nowrap">
            {t('auth.sending_code')}{countdown !== null ? ` ${countdown}` : ''}
          </div>
        )}

        <div className="mt-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
            {step === 'FORM' ? t('auth.headline_more') : step === 'PHONE_INPUT' || step === 'PHONE_VERIFY' ? t('auth.headline_verify') : t('auth.headline_join')}
          </h2>
          <p className={`text-on-surface-variant text-sm font-body text-gray-500 ${step === 'PHONE_VERIFY' ? 'mb-4' : 'mb-8'}`}>
            {step === 'FORM' 
              ? t('auth.desc_more') 
              : step === 'PHONE_INPUT' ? ''
              : step === 'PHONE_VERIFY' ? ''
              : t('auth.desc_join')}
          </p>
        </div>

        {step === 'SOCIAL' ? (
          /* Step 1: Select Auth Method */
          <div className="space-y-4 mb-10">
            <div className="grid grid-cols-2 gap-3">
              <button 
                disabled={isLoading}
                onClick={() => setStep('PHONE_INPUT')}
                className="flex flex-col items-center justify-center gap-1.5 h-20 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px] text-blue-600">phone_iphone</span>
                <span className="text-[11px] font-bold text-blue-900 uppercase">{t('auth.continue_phone', 'Phone')}</span>
              </button>
              
              <button 
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="flex flex-col items-center justify-center gap-1.5 h-20 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrULfO5Si59s3yrGL1htM77UognPjlHkqCzmmqrbzqnNtGF7WHN8-E46CnXyZo-7bHd1wL78yQ6vat7pfYchsCTUmOFLpR7ttH1sp-iSZcq6i-zaOW4aoPFNiRS7AnA9xcYBQG4FyplVXBuKqvIDCOv9Lty8noBe58-BBq95wecE5M7v07XJgmZQrlcz362rkU-rE04bG_vmQXErI9lSqoPnrclYJgdfnabauLle6HNzmsdCFQKlXsCPTWgBF01qCZCc94BYLbUGcU" />
                <span className="text-[11px] font-bold text-gray-700 uppercase">Google</span>
              </button>

              <button 
                disabled={isLoading}
                onClick={() => alert(t('auth.soon', 'Coming soon'))}
                className="flex flex-col items-center justify-center gap-1.5 h-20 bg-gray-50 border border-gray-100 rounded-xl relative overflow-hidden disabled:opacity-50 hover:bg-gray-100 transition-all"
              >
                <span className="material-symbols-outlined text-[20px] text-gray-400">facebook</span>
                <span className="text-[11px] font-bold text-gray-400 uppercase">Facebook</span>
                <span className="absolute top-1.5 right-2 text-[8px] font-black text-gray-300 uppercase tracking-wider">Soon</span>
              </button>

              <button 
                disabled={isLoading}
                onClick={() => alert(t('auth.soon', 'Coming soon'))}
                className="flex flex-col items-center justify-center gap-1.5 h-20 bg-gray-50 border border-gray-100 rounded-xl relative overflow-hidden disabled:opacity-50 hover:bg-gray-100 transition-all"
              >
                <span className="material-symbols-outlined text-[20px] text-gray-400">mail</span>
                <span className="text-[11px] font-bold text-gray-400 uppercase">Email</span>
                <span className="absolute top-1.5 right-2 text-[8px] font-black text-gray-300 uppercase tracking-wider">Soon</span>
              </button>

              <button 
                disabled={isLoading}
                onClick={() => alert(t('auth.soon', 'Coming soon'))}
                className="flex flex-col items-center justify-center gap-1.5 h-20 bg-gray-50 border border-gray-100 rounded-xl relative overflow-hidden col-span-2 disabled:opacity-50 hover:bg-gray-100 transition-all"
              >
                <span className="material-symbols-outlined text-[20px] text-gray-400">computer</span>
                <span className="text-[11px] font-bold text-gray-400 uppercase">Apple</span>
                <span className="absolute top-1.5 right-2 text-[8px] font-black text-gray-300 uppercase tracking-wider">Soon</span>
              </button>
            </div>
          </div>
        ) : step === 'EMAIL_INPUT' ? (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">{language === 'KR' ? '이메일' : 'Email'}</label>
              <input 
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[15px]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">{language === 'KR' ? '비밀번호' : 'Password'}</label>
              <input 
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[15px]"
              />
              <p className="mt-2 text-[11px] text-gray-500 font-medium">
                {language === 'KR' ? '계정이 없다면 자동으로 안전하게 가입됩니다.' : 'If you don\'t have an account, you will be registered automatically.'}
              </p>
            </div>

            <button 
              disabled={isLoading || !email || !password}
              onClick={handleEmailLogin}
              className="w-full h-14 bg-blue-600 text-white rounded-full font-bold text-lg shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {language === 'KR' ? '이메일로 계속하기' : 'Continue with Email'}
            </button>
            <button 
              disabled={isLoading}
              onClick={() => setStep('SOCIAL')}
              className="w-full h-14 text-gray-500 font-semibold"
            >
              {t('auth.back')}
            </button>
          </div>
        ) : step === 'PHONE_INPUT' ? (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">{t('auth.phone_label')}</label>
              <div className="flex gap-2">
                <div className="relative w-[125px] shrink-0">
                  <select 
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                    className="w-full h-14 pl-4 pr-8 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-gray-900 font-semibold text-[15px]"
                  >
                    {COUNTRY_CODES.map((c, i) => (
                      <option key={`phone-${c.iso}-${i}`} value={c.code}>
                        {c.code} ({c.iso})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 text-[20px]">expand_more</span>
                  </div>
                </div>
                <input 
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  autoFocus
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                  placeholder="1012345678"
                  className="flex-1 min-w-0 h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[15px]"
                />
              </div>
            </div>
            
            {/* reCAPTCHA Placeholder for visible fallback */}
            <div id="recaptcha-placeholder" className="flex justify-center empty:hidden"></div>

            <button 
              disabled={isLoading || cooldown}
              onClick={handleSendCode}
              className="w-full h-14 bg-blue-600 text-white rounded-full font-bold text-lg shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {t('auth.send_code')}
            </button>
            <button 
              disabled={isLoading}
              onClick={() => setStep('SOCIAL')}
              className="w-full h-14 text-gray-500 font-semibold"
            >
              {t('auth.back')}
            </button>
          </div>
        ) : step === 'PHONE_VERIFY' ? (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">{t('auth.code_label')}</label>
              <input 
                autoFocus
                ref={(input) => { if (input) input.focus(); }}
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="●●●●●●"
                className="w-full h-14 px-4 text-center tracking-[0.5em] text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-200/40 text-gray-800"
              />
              <p className="mt-3 text-xs text-blue-600 leading-relaxed font-bold break-keep">
                {t('auth.enter_6_digits')}
              </p>
            </div>
            <button 
              disabled={isLoading}
              onClick={handleVerifyCode}
              className="w-full h-14 bg-blue-600 text-white rounded-full font-bold text-lg shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {t('auth.verify_code')}
            </button>

            {/* reCAPTCHA Placeholder for visible fallback during resend */}
            <div id="recaptcha-placeholder" className="flex justify-center empty:hidden"></div>

            <button 
              disabled={isLoading || cooldown}
              onClick={() => {
                handleSendCode();
              }}
              className="w-full h-12 text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors"
            >
              {t('auth.resend_code') || 'Resend Code'}
            </button>
            <button 
              disabled={isLoading}
              onClick={() => {
                resetRecaptcha();
                setStep('PHONE_INPUT');
              }}
              className="w-full h-14 text-gray-500 font-semibold"
            >
              {t('auth.back')}
            </button>
          </div>
        ) : (
          /* Step 2: Registration Fields */
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  {t('auth.country')}
                </label>
                <div className="relative">
                  <select 
                    value={details.countryCode}
                    onChange={(e) => setDetails({...details, countryCode: e.target.value})}
                    className="w-full h-14 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-gray-700"
                  >
                    <option value="">{t('auth.select_country')}</option>
                    {COUNTRY_CODES.map((c, i) => (
                      <option key={`reg-${c.iso}-${i}`} value={c.iso}>
                        {getRegionName(c.iso)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    {t('auth.english_nickname')}
                  </label>
                  <input 
                    value={details.nickname}
                    onChange={(e) => setDetails({...details, nickname: e.target.value.replace(/[^a-zA-Z0-9_.\-\s]/g, '')})}
                    className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                    placeholder="ex. Scarlet"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    {t('auth.gender')}
                  </label>
                  <select 
                    value={details.gender}
                    onChange={(e) => setDetails({...details, gender: e.target.value})}
                    className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="Male">{t('auth.gender_male')}</option>
                    <option value="Female">{t('auth.gender_female')}</option>
                    <option value="Other">{t('auth.gender_other')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  {t('auth.native_nickname')}
                </label>
                <input 
                  value={details.nativeNickname}
                  onChange={(e) => setDetails({...details, nativeNickname: e.target.value})}
                  className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                  placeholder={t('auth.native_nickname_placeholder', '스칼렛')}
                  type="text"
                />
              </div>
            </form>

            <div className="mt-12 space-y-6">
              <button 
                onClick={handleCompleteRegistration}
                disabled={isLoading}
                className="w-full h-14 bg-blue-600 text-white rounded-full font-bold text-lg shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                {t('auth.complete_reg_btn')}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 mb-6">
          <p className="text-center text-xs leading-relaxed text-gray-500 px-4">
            {t('auth.terms_agree')} 
            <a className="text-blue-600 font-semibold underline ml-1" href="#">{t('auth.terms')}</a> 
            {t('auth.and')}
            <a className="text-blue-600 font-semibold underline ml-1" href="#">{t('auth.privacy')}</a>{t('auth.period')}
          </p>
        </div>
        <div className="mt-2 pb-6 border-t border-gray-100 pt-4">
          <p className="text-center text-[10px] leading-relaxed text-gray-400 px-4">
            This site is protected by reCAPTCHA and the Google <a className="text-blue-500 underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a className="text-blue-500 underline" href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.
          </p>
        </div>
      </main>
    </div>
  );
}
