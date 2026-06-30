'use client';

import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    window.location.replace('/live');
  }, []);

  return null;
}
