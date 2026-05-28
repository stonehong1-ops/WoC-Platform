'use client';

import React from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { AuthModalContent } from './AuthModalContent';

export default function AuthModal() {
  const { showLogin } = useAuth();

  if (!showLogin) return null;

  return <AuthModalContent />;
}
