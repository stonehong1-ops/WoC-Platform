'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/clientApp';
import { useAuth } from '@/components/providers/AuthProvider';

const COUNTRIES = [
  { code: 'KR', name: 'Korea, South' },
  { code: 'AR', name: 'Argentina' },
  { code: 'US', name: 'United States' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NO', name: 'Norway' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russian Federation' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'VN', name: 'Vietnam' },
];

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'details'>('login');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();
  const router = useRouter();

  const [details, setDetails] = useState({
    nickname: '',
    nativeNickname: '',
    countryCode: 'KR'
  });

  // 사용자가 로그인되어 있고 프로필도 있으면 홈으로 리다이렉트
  useEffect(() => {
    if (user && profile?.isRegistered) {
      router.push('/home');
    } else if (user && !profile?.isRegistered) {
      setView('details');
    }
  }, [user, profile, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push('/home');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl overflow-hidden p-8">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white font-bold text-2xl">W</div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {view === 'login' ? 'Welcome to WoC' : 'Create Profile'}
          </h1>
          <p className="text-gray-500 mt-2">
            {view === 'login' ? 'Join our community culture' : 'Tell us a bit about yourself'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {view === 'login' ? (
          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-semibold text-gray-700 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09l-.11-.33-.11-.33c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09l.11-.33.11-.33V5.75H2.18C1.43 7.55 1 9.73 1 12s.43 4.45 1.18 6.25l3.66-2.84c-.22-.66-.35-1.36-.35-2.09z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 py-4 bg-black text-white rounded-2xl hover:bg-black/90 transition-all font-semibold active:scale-[0.98]">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.96.95-2.12 1.43-3.08 1.43-.97 0-1.87-.27-2.77-.85-.92-.58-1.95-.87-3.07-.87-1.14 0-2.19.29-3.15.87-.93.58-1.78.85-2.55.85-.9 0-1.77-.32-2.6-.96-1.58-1.32-2.83-4.83-2.83-8.08 0-1.77.49-3.26 1.47-4.48.98-1.22 2.25-1.83 3.8-1.83 1.05 0 2.05.28 3.01.83.6.35 1.05.52 1.34.52.26 0 .66-.14 1.22-.42 1.15-.59 2.18-.88 3.12-.88 1.42 0 2.59.45 3.5 1.35 1.01.99 1.6 2.37 1.77 4.14-1.6.66-2.69 1.61-3.26 2.86-.59 1.33-.29 2.89.88 4.67.24.32.41.56.51.72-.45.87-1.1 1.57-1.94 2.1zm-3.03-12.87c.1-.01.21-.02.32-.02 2.45-.19 2.04-3.15 1.96-3.15-.02 0-.25.01-.69.11-1.35.34-2.18 1.32-2.51 2.94-.02.1-.03.2-.03.31 0 1.93 1.73 2.02 2.14 1.93l.11-.02z"/>
              </svg>
              Continue with Apple
            </button>
            <button className="w-full flex items-center justify-center gap-3 py-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-semibold text-gray-700 active:scale-[0.98]">
              <span className="material-symbols-outlined text-[1.25rem]">mail</span>
              Continue with Email
            </button>
            <button className="w-full flex items-center justify-center gap-3 py-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-semibold text-gray-700 active:scale-[0.98]">
              <span className="material-symbols-outlined text-[1.25rem]">phone_iphone</span>
              Continue with Phone
            </button>
          </div>
        ) : (
          <form onSubmit={handleDetailsSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Nickname</label>
                <input 
                  type="text" 
                  required
                  placeholder="How should we call you?"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  value={details.nickname}
                  onChange={(e) => setDetails({...details, nickname: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Native Name (Optional)</label>
                <input 
                  type="text"
                  placeholder="Name in your language"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  value={details.nativeNickname}
                  onChange={(e) => setDetails({...details, nativeNickname: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Region Code</label>
                <select 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                  value={details.countryCode}
                  onChange={(e) => setDetails({...details, countryCode: e.target.value})}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
            >
              Complete Profile
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
