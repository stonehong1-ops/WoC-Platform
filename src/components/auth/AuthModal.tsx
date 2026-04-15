'use client';

import React, { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/clientApp';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AuthModal() {
  const { user, profile, showLogin, setShowLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'SOCIAL' | 'FORM'>('SOCIAL');
  const [authMethod, setAuthMethod] = useState<string>('');
  const router = useRouter();

  const [details, setDetails] = useState({
    nickname: '',
    nativeNickname: '',
    countryCode: '',
    gender: 'Other'
  });

  // Reset step whenever modal re-opens
  useEffect(() => {
    if (showLogin) {
      setStep('SOCIAL');
      setAuthMethod('');
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
        router.push('/home');
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

  const handleCompleteRegistration = async () => {
    if (!user) {
      alert('Please verify your identity first.');
      setStep('SOCIAL');
      return;
    }
    if (!details.nickname || !details.countryCode) {
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
      console.error(err);
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
            <button 
              onClick={() => setShowLogin(false)}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-blue-600">arrow_back</span>
            </button>
            <h1 className="font-manrope text-base font-semibold text-gray-900 font-headline">
              {step === 'FORM' ? 'Complete Registration' : 'Sign In / Register'}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-[80px] pb-24 px-6 max-w-2xl mx-auto w-full">
        <div className="mt-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
            {step === 'FORM' ? 'Tell us more' : 'Join WoC'}
          </h2>
          <p className="text-on-surface-variant text-sm mb-8 font-body text-gray-500">
            {step === 'FORM' 
              ? 'Identity verified! Just a few more details to set up your profile.' 
              : 'Create your global identity and start your journey.'}
          </p>
        </div>

        {step === 'SOCIAL' ? (
          /* Step 1: Social Buttons */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
            <button 
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="flex flex-col items-center justify-center gap-2 h-24 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <img alt="Google" className="w-6 h-6 grayscale opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrULfO5Si59s3yrGL1htM77UognPjlHkqCzmmqrbzqnNtGF7WHN8-E46CnXyZo-7bHd1wL78yQ6vat7pfYchsCTUmOFLpR7ttH1sp-iSZcq6i-zaOW4aoPFNiRS7AnA9xcYBQG4FyplVXBuKqvIDCOv9Lty8noBe58-BBq95wecE5M7v07XJgmZQrlcz362rkU-rE04bG_vmQXErI9lSqoPnrclYJgdfnabauLle6HNzmsdCFQKlXsCPTWgBF01qCZCc94BYLbUGcU" />
              <span className="text-xs font-bold text-gray-900 uppercase">Google</span>
            </button>
            <button 
              disabled={isLoading}
              onClick={() => { setAuthMethod('Apple'); setStep('FORM'); }}
              className="flex flex-col items-center justify-center gap-2 h-24 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <span className="text-[10px] font-black text-gray-400 font-manrope">APPLE</span>
              <span className="text-xs font-bold text-gray-900 uppercase">Apple</span>
            </button>
            <button 
              disabled={isLoading}
              onClick={handleFacebookLogin}
              className="flex flex-col items-center justify-center gap-2 h-24 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-gray-400">facebook</span>
              <span className="text-xs font-bold text-gray-900 uppercase">Facebook</span>
            </button>
            <button 
              disabled={isLoading}
              onClick={() => { setAuthMethod('Email'); setStep('FORM'); }}
              className="flex flex-col items-center justify-center gap-2 h-24 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-gray-400">mail</span>
              <span className="text-xs font-bold text-gray-900 uppercase">Email</span>
            </button>
            <button 
              disabled={isLoading}
              onClick={() => { setAuthMethod('Phone'); setStep('FORM'); }}
              className="flex flex-col items-center justify-center gap-2 h-24 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-gray-400">phone_iphone</span>
              <span className="text-xs font-bold text-gray-900 uppercase">Phone</span>
            </button>
          </div>
        ) : (
          /* Step 2: Registration Fields */
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Country <span className="text-red-500">*</span>
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
                    English Nickname <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={details.nickname}
                    onChange={(e) => setDetails({...details, nickname: e.target.value})}
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
                  Native Nickname (Optional)
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

      {/* Navigation Simulation */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-6 py-2 pb-safe bg-white border-t border-gray-100 shadow-lg">
        <div onClick={() => setShowLogin(false)} className="flex flex-col items-center p-2 text-gray-400">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-bold uppercase">Home</span>
        </div>
        <div className="flex flex-col items-center p-2 text-blue-600">
          <span className="material-symbols-outlined">person_add</span>
          <span className="text-[10px] font-bold uppercase">Join</span>
        </div>
      </nav>
    </div>
  );
}
