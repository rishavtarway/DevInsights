import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function SignInButton() {
  const [loading, setLoading] = useState(false);
  
  const signInWithGitHub = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('GitHub auth error:', error);
      alert('Error signing in with GitHub');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={signInWithGitHub}
      disabled={loading}
      className="bg-black text-white py-2 px-4 rounded-md flex items-center gap-2 hover:bg-gray-800 transition-colors"
    >
      {loading ? 'Loading...' : 'Sign in with GitHub'}
    </button>
  );
}
