import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import * as authService from '../../src/services/auth.service';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          router.push('/(authenticated)/home');
        } else {
          router.push('/auth/sign-in');
        }
      } else {
        router.push('/auth/sign-in');
      }
    };

    handleAuthCallback();
  }, [router]);

  return null;
}

