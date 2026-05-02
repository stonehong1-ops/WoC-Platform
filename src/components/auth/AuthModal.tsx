'use client';

import React, { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/clientApp';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AuthModal() {
  const { user, profile, showLogin, setShowLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'SOCIAL' | 'PHONE_INPUT' | 'PHONE_VERIFY' | 'FORM'>('SOCIAL');
  const [authMethod, setAuthMethod] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const router = useRouter();

  const [details, setDetails] = useState({
    nickname: '',
    nativeNickname: '',
    countryCode: 'KR',
    gender: 'Other'
  });

  // Reset step whenever modal re-opens
  useEffect(() => {
    if (showLogin) {
      setStep('SOCIAL');
      setAuthMethod('');
      setPhoneNumber('');
      setVerificationCode('');
      setConfirmationResult(null);
    }
  }, [showLogin]);

  // Lock body scroll when open
  useEffect(() => {
    if (showLogin) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
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
      setShowLogin(false);
      const lastContext = localStorage.getItem('woc_context');
      if (lastContext) {
        localStorage.removeItem('woc_context');
        router.push(lastContext);
      } else {
        router.push('/social');
      }
    }
  }, [user, profile, showLogin, setShowLogin, router]);

  if (!showLogin) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setAuthMethod('Google');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;
      
      if (!profile?.isRegistered) {
        setStep('FORM');
      } else if (!profile.photoURL && loggedUser.photoURL) {
        // Update photo if missing in profile but available from Google
        await setDoc(doc(db, 'users', loggedUser.uid), {
          photoURL: loggedUser.photoURL,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (err: any) {
      console.error(err);
      alert('Login failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setAuthMethod('Facebook');
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;

      if (!profile?.isRegistered) {
        setStep('FORM');
      } else if (!profile.photoURL && loggedUser.photoURL) {
        // Update photo if missing in profile but available from Facebook
        await setDoc(doc(db, 'users', loggedUser.uid), {
          photoURL: loggedUser.photoURL,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (err: any) {
      console.error(err);
      alert('Login failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      alert("Please enter a valid phone number.");
      return;
    }
    setIsLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      let formattedPhone = phoneNumber;
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('82')) {
          formattedPhone = '+' + formattedPhone;
        } else {
          formattedPhone = `+82${formattedPhone.replace(/^0/, '')}`;
        }
      }
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('PHONE_VERIFY');
    } catch (error: any) {
      console.warn("SMS sending failed:", error);
      alert("Failed to send SMS: " + error.message);
      // Reset recaptcha on error
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || !confirmationResult) {
      alert("Please enter the verification code.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      const loggedUser = result.user;
      setAuthMethod('Phone');
      if (!profile?.isRegistered) {
        setStep('FORM');
      } else {
        // Already registered user
        setShowLogin(false);
        router.push('/social');
      }
    } catch (error: any) {
      console.warn("Verification failed:", error);
      alert("Invalid code: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!user) {
      alert('Please verify your identity first.');
      setStep('SOCIAL');
      return;
    }
    if (!details.nickname || !details.countryCode || !details.nativeNickname || !details.gender) {
      alert('Please fill in all required fields.');
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
        photoURL: user.photoURL,
        isRegistered: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.warn(err);
      alert('Registration failed: ' + err.message);
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
              {step === 'FORM' ? 'Complete Registration' : 'Sign In / Register'}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-[80px] pb-24 px-6 max-w-2xl mx-auto w-full">
        <div id="recaptcha-container"></div>
        <div className="mt-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
            {step === 'FORM' ? 'Tell us more' : step === 'PHONE_INPUT' || step === 'PHONE_VERIFY' ? 'Verify Identity' : 'Join WoC'}
          </h2>
          <p className="text-on-surface-variant text-sm mb-8 font-body text-gray-500">
            {step === 'FORM' 
              ? 'Identity verified! Just a few more details to set up your profile.' 
              : step === 'PHONE_INPUT' ? 'Enter your phone number to receive a verification code.'
              : step === 'PHONE_VERIFY' ? 'Enter the 6-digit code sent to your phone.'
              : 'Create your global identity and start your journey.'}
          </p>
        </div>

        {step === 'SOCIAL' ? (
          /* Step 1: Social Buttons — Phone Only Active */
          <div className="space-y-4 mb-10">
            {/* Phone — Active */}
            <button 
              disabled={isLoading}
              onClick={() => setStep('PHONE_INPUT')}
              className="w-full flex items-center justify-center gap-3 h-16 bg-blue-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[22px]">phone_iphone</span>
              Continue with Phone
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Other Methods</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Disabled grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: 'google', label: 'Google', isImg: true, imgSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrULfO5Si59s3yrGL1htM77UognPjlHkqCzmmqrbzqnNtGF7WHN8-E46CnXyZo-7bHd1wL78yQ6vat7pfYchsCTUmOFLpR7ttH1sp-iSZcq6i-zaOW4aoPFNiRS7AnA9xcYBQG4FyplVXBuKqvIDCOv9Lty8noBe58-BBq95wecE5M7v07XJgmZQrlcz362rkU-rE04bG_vmQXErI9lSqoPnrclYJgdfnabauLle6HNzmsdCFQKlXsCPTWgBF01qCZCc94BYLbUGcU' },
                { icon: 'facebook', label: 'Facebook', isImg: false },
                { icon: 'mail', label: 'Email', isImg: false },
                { icon: 'computer', label: 'Apple', isImg: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center justify-center gap-1.5 h-20 bg-gray-50 border border-gray-100 rounded-xl cursor-not-allowed relative overflow-hidden"
                >
                  {item.isImg ? (
                    <img alt={item.label} className="w-5 h-5 grayscale opacity-25" src={item.imgSrc} />
                  ) : (
                    <span className="material-symbols-outlined text-[20px] text-gray-200">{item.icon}</span>
                  )}
                  <span className="text-[11px] font-bold text-gray-300 uppercase">{item.label}</span>
                  <span className="absolute top-1.5 right-2 text-[8px] font-black text-gray-300 uppercase tracking-wider">Soon</span>
                </div>
              ))}
            </div>
          </div>
        ) : step === 'PHONE_INPUT' ? (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Phone Number</label>
              <input 
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="01012345678"
                className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <button 
              disabled={isLoading}
              onClick={handleSendCode}
              className="w-full h-14 bg-blue-600 text-white rounded-full font-bold text-lg shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              Send Verification Code
            </button>
            <button 
              disabled={isLoading}
              onClick={() => setStep('SOCIAL')}
              className="w-full h-14 text-gray-500 font-semibold"
            >
              Back
            </button>
          </div>
        ) : step === 'PHONE_VERIFY' ? (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Verification Code</label>
              <input 
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="w-full h-14 px-4 text-center tracking-[0.5em] text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              <p className="mt-3 text-xs text-gray-500 leading-relaxed font-medium break-keep">
                대부분의 경우 위 숫자를 터치하면 문자로 온 6자리가 보이고 선택하시면 됩니다. 구글에서 보내지는 문자이기 때문에 해외문자를 차단하신 경우 직접 찾아서 확인하셔야 합니다.
              </p>
            </div>
            <button 
              disabled={isLoading}
              onClick={handleVerifyCode}
              className="w-full h-14 bg-blue-600 text-white rounded-full font-bold text-lg shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              Verify Code
            </button>
            <button 
              disabled={isLoading}
              onClick={() => setStep('PHONE_INPUT')}
              className="w-full h-14 text-gray-500 font-semibold"
            >
              Back
            </button>
          </div>
        ) : (
          /* Step 2: Registration Fields */
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Country
                </label>
                <div className="relative">
                  <select 
                    value={details.countryCode}
                    onChange={(e) => setDetails({...details, countryCode: e.target.value})}
                    className="w-full h-14 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-gray-700"
                  >
                    <option value="">Select your country</option>
                    <option value="KR">South Korea</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="FR">France</option>
                    <option value="JP">Japan</option>
                    <option value="CN">China</option>
                    <option value="DE">Germany</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="SG">Singapore</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    English Nickname
                  </label>
                  <input 
                    value={details.nickname}
                    onChange={(e) => setDetails({...details, nickname: e.target.value.replace(/[^a-zA-Z0-9_.\-\s]/g, '')})}
                    className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                    placeholder="e.g. Alex" 
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Gender
                  </label>
                  <select 
                    value={details.gender}
                    onChange={(e) => setDetails({...details, gender: e.target.value})}
                    className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Native Nickname
                </label>
                <input 
                  value={details.nativeNickname}
                  onChange={(e) => setDetails({...details, nativeNickname: e.target.value})}
                  className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                  placeholder="e.g. 김알렉스" 
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
                Complete Registration
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <p className="text-center text-xs leading-relaxed text-gray-500 px-4">
            By continuing, you agree to our 
            <a className="text-blue-600 font-semibold underline ml-1" href="#">Terms</a> 
            and 
            <a className="text-blue-600 font-semibold underline ml-1" href="#">Privacy</a>. 
          </p>
        </div>
      </main>

    </div>
  );
}
