"use client";

import React from 'react';
import { COUNTRY_CODES } from '@/constants/countryCodes';
import { useAuthFlow } from './hooks/useAuthFlow';
import { getRegionName } from './helpers/authHelpers';

export function AuthModalContent() {
  const {
    user,
    showLogin,
    language,
    setLanguage,
    t,
    isLoading,
    countdown,
    timeoutCount,
    cooldown,
    step,
    setStep,
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
  } = useAuthFlow();

  if (!showLogin) return null;

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
            {/* PWA Standalone Secure Sync Guide Card */}
            {typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches && (
              <div className="mb-6 p-6 bg-blue-50/70 border border-blue-200/80 rounded-3xl text-left animate-in slide-in-from-bottom-2 duration-500 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[24px] font-variation-fill" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-[15px] font-black text-blue-950 font-headline leading-tight">
                      {t('auth.pwa_sync_title')}
                    </h3>
                    <p className="text-[12px] text-blue-800 font-semibold leading-relaxed font-body">
                      {t('auth.pwa_sync_desc')}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

            {/* Premium iOS Installation Guide - Non-modal Native Scroll Flow */}
            {typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches && (
              <div className="mt-8 p-6 bg-blue-50/50 border border-blue-100 rounded-3xl text-left animate-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-[20px] font-variation-fill" style={{ fontVariationSettings: "'FILL' 1" }}>add_to_home_screen</span>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-black text-blue-950 font-headline">{t('auth.ios_pwa_title')}</h3>
                    <p className="text-[10px] text-blue-600/80 font-bold">{t('auth.ios_pwa_desc')}</p>
                  </div>
                </div>
                
                <div className="space-y-2.5 font-body text-xs font-semibold text-blue-900/90">
                  <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-blue-50 shadow-sm">
                    <span>{t('auth.ios_pwa_step1')}</span>
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">ios_share</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-blue-50 shadow-sm">
                    <span>{t('auth.ios_pwa_step2')}</span>
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">add_box</span>
                  </div>
                </div>
              </div>
            )}
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
                  autoComplete="off"
                  data-lpignore="true"
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
            <div 
              id="recaptcha-placeholder" 
              className={`flex justify-center transition-all ${
                timeoutCount >= 2 
                  ? 'w-full min-h-[78px] py-2' 
                  : 'w-0 h-0 overflow-hidden absolute pointer-events-none'
              }`}
              tabIndex={-1}
              aria-hidden="true"
            ></div>

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
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">{t('auth.code_label')}</label>
              
              {/* OTP 6-Digit Container Area */}
              <div className="relative w-full h-16 flex items-center justify-between gap-2.5 select-none">
                
                {/* 1. Behind-the-scenes Real Hidden Input */}
                <input 
                  type="text"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setVerificationCode(val);
                  }}
                  disabled={isLoading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-default z-20 outline-none"
                  autoFocus
                  ref={(input) => { if (input && !isLoading) input.focus(); }}
                />

                {/* 2. Visual Premium 6 Boxes */}
                {Array.from({ length: 6 }).map((_, idx) => {
                  const digit = verificationCode[idx] || '';
                  const isActive = verificationCode.length === idx;
                  return (
                    <div 
                      key={idx}
                      className={`flex-1 h-full rounded-2xl border-2 bg-gray-50/50 flex items-center justify-center text-2xl font-extrabold transition-all duration-200 ${
                        digit ? 'border-blue-600 bg-white text-blue-600 shadow-sm' : 'border-gray-200 text-gray-800'
                      } ${isActive && !isLoading ? 'border-blue-500 bg-white ring-2 ring-blue-500/20' : ''}`}
                    >
                      {/* Character display with subtle animation if populated */}
                      <span className={digit ? 'animate-in zoom-in-75 duration-100' : 'text-gray-300'}>
                        {digit || (isActive && !isLoading ? 'I' : '•')}
                      </span>
                    </div>
                  );
                })}

                {/* 3. Real-Time Processing Blur Lock & Loader Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-2xl z-30 flex items-center justify-center gap-2.5 border border-blue-100 transition-all duration-300">
                    <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    <span className="text-sm font-bold text-blue-600 tracking-tight animate-pulse">{t('auth.verifying_code')}</span>
                  </div>
                )}
              </div>
              
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

            <button 
              disabled={isLoading || cooldown}
              onClick={handleSendCode}
              className="w-full h-12 text-blue-600 font-bold text-sm hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                        {getRegionName(c.iso, language)}
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
