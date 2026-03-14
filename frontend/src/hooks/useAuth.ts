'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';

interface UseAuthOptions {
  requiredRole?: 'instructor' | 'student';
}

export function useAuth(options: UseAuthOptions = {}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (!storedToken || !userStr) {
      router.replace('/');
      return;
    }

    try {
      const parsed = JSON.parse(userStr) as User;
      if (options.requiredRole && parsed.role !== options.requiredRole) {
        router.replace('/dashboard');
        return;
      }
      setUser(parsed);
      setToken(storedToken);
      setIsReady(true);
    } catch {
      router.replace('/');
    }
  }, [router, options.requiredRole]);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return { user, token, isReady, logout };
}
