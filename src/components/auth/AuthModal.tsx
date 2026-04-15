'use client';

import React, { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/clientApp';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AuthModal() {
  const { user, profile, showLogin, setShowLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [details, setDetails] = useState({
    nickname: '',
    nativeNickname: '',
    countryCode: ''
  });

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

  // Handle automatic nickname pre-fill
  useEffect(() => {
    if (user && !details.nickname) {
      setDetails(prev => ({ ...prev, nickname: user.displayName || '' }));
    }
  }, [user, details.nickname]);

  // Success redirect observer
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
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      alert('Login failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        nickname: details.nickname,
        nativeNickname: details.nativeNickname,
        countryCode: details.countryCode,
        photoURL: user.photoURL,
        isRegistered: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Explicitly close modal and redirect on success
      setShowLogin(false);
      router.push('/home');
      
    } catch (err: any) {
      console.error(err);
      alert('Registration failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background text-on-surface flex flex-col overflow-y-auto min-h-screen">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex items-center px-4 h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-200">
        <div className="flex items-center w-full max-w-2xl mx-auto justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowLogin(false)}
              className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">arrow_back</span>
            </button>
            <h1 className="font-manrope text-base font-semibold text-gray-900 dark:text-white">
              {!user ? 'Register' : 'Complete Profile'}
            </h1>
          </div>
          {!user && (
            <button className="text-blue-600 dark:text-blue-400 font-manrope text-sm font-bold px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors">Sign In</button>
          )}
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-[80px] pb-24 px-6 max-w-2xl mx-auto w-full">
        <div className="mt-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">
            {!user ? 'Identity Verification' : 'Verification Successful'}
          </h2>
          <p className="text-on-surface-variant text-sm mb-8">
            {!user 
              ? 'Please verify your identity to begin registration.' 
              : 'ID verified. Now, please create your unique WoC identity.'}
          </p>
        </div>

        {!user ? (
          <>
            {/* Step 1: Verification Options */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              <button 
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 h-14 bg-white border border-outline-variant rounded-xl hover:bg-surface-container-low transition-all"
              >
                <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrULfO5Si59s3yrGL1htM77UognPjlHkqCzmmqrbzqnNtGF7WHN8-E46CnXyZo-7bHd1wL78yQ6vat7pfYchsCTUmOFLpR7ttH1sp-iSZcq6i-zaOW4aoPFNiRS7AnA9xcYBQG4FyplVXBuKqvIDCOv9Lty8noBe58-BBq95wecE5M7v07XJgmZQrlcz362rkU-rE04bG_vmQXErI9lSqoPnrclYJgdfnabauLle6HNzmsdCFQKlXsCPTWgBF01qCZCc94BYLbUGcU" />
                <span className="font-label text-sm font-semibold">Verify</span>
              </button>
              
              <button className="flex items-center justify-center gap-3 h-14 bg-inverse-surface text-on-tertiary rounded-xl hover:opacity-90 transition-all">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>ios</span>
                <span className="font-label text-sm font-semibold">Apple</span>
              </button>
              
              <button className="flex items-center justify-center gap-3 h-14 bg-white border border-outline-variant rounded-xl hover:bg-surface-container-low transition-all">
                <span className="material-symbols-outlined text-secondary">mail</span>
                <span className="font-label text-sm font-semibold">Email</span>
              </button>
              
              <button className="flex items-center justify-center gap-3 h-14 bg-white border border-outline-variant rounded-xl hover:bg-surface-container-low transition-all">
                <span className="material-symbols-outlined text-secondary">phone_iphone</span>
                <span className="font-label text-sm font-semibold">Phone</span>
              </button>
            </div>
          </>
        ) : (
          /* Step 2 Profile Info (Just email-id display) */
          <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl mb-10 border border-outline-variant/30">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">verified_user</span>
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Verified ID (Email)</p>
              <p className="font-bold text-lg">{user.email}</p>
            </div>
          </div>
        )}

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              Country <span className="text-error">*</span>
            </label>
            <div className="relative">
              <select 
                value={details.countryCode}
                onChange={(e) => setDetails({ ...details, countryCode: e.target.value })}
                className="w-full h-14 pl-4 pr-12 bg-surface-container-lowest border border-outline-variant rounded-xl appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                <option value="">Select your country</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="FR">France</option>
                <option value="JP">Japan</option>
                <option value="KR">South Korea</option>
                <option value="CN">China</option>
                <option value="DE">Germany</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="SG">Singapore</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="material-symbols-outlined text-outline">expand_more</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              English Nickname <span className="text-error">*</span>
            </label>
            <input 
              type="text" 
              value={details.nickname}
              onChange={(e) => setDetails({ ...details, nickname: e.target.value })}
              className="w-full h-14 px-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
              placeholder="e.g. Alex Traveler"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              Native Nickname (Optional)
            </label>
            <input 
              type="text" 
              value={details.nativeNickname}
              onChange={(e) => setDetails({ ...details, nativeNickname: e.target.value })}
              className="w-full h-14 px-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
              placeholder="e.g. 김알렉스 / アレックス" 
            />
          </div>
        </form>

        <div className="mt-12 space-y-6">
          <button 
            onClick={handleCompleteRegistration}
            disabled={isLoading || !user || !details.nickname || !details.countryCode}
            className="w-full h-14 bg-primary text-on-primary rounded-full font-headline font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? 'Processing...' : (user ? 'Complete Registration' : 'Continue with Social Login')}
          </button>
        </div>
      </main>

      {/* BottomNavBar */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-6 py-2 pb-safe bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg">
        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-2 scale-95 active:scale-90 transition-transform">
          <span className="material-symbols-outlined">home</span>
          <span className="font-manrope text-[11px] font-medium">Home</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl p-2 scale-95 active:scale-90 transition-transform">
          <span className="material-symbols-outlined">person_add</span>
          <span className="font-manrope text-[11px] font-medium">Register</span>
        </div>
        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-2 scale-95 active:scale-90 transition-transform">
          <span className="material-symbols-outlined">account_circle</span>
          <span className="font-manrope text-[11px] font-medium">Profile</span>
        </div>
      </nav>
    </div>
  );
}
