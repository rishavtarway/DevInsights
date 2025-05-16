'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import SignInButton from '@/components/auth/SignInButton';
import SignInForm from '@/components/auth/SignInForm';
import { User } from '@supabase/supabase-js';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  useEffect(() => {
    async function checkSession() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          setTimeout(() => router.push('/dashboard'), 1500);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkSession();
  }, [router]);

  if (loading) {
    return <div className="flex justify-center py-20 text-gray-700">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-indigo-600">DevInsights</h1>
            </div>
            <div>
              {user ? (
                <div className="text-sm text-gray-600">
                  Signed in as: <span className="font-semibold">{user.email}</span>
                </div>
              ) : (
                <button 
                  onClick={() => setShowPasswordForm(!showPasswordForm)} 
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {showPasswordForm ? "Use GitHub OAuth" : "Use Email & Password"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {user ? (
            <div className="mx-auto max-w-md bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Currently Signed In</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User ID:</strong> {user.id}</p>
                <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard...</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Developer Productivity</span>
                <span className="block text-indigo-600 xl:inline"> Analytics Platform</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Track your team's productivity, identify bottlenecks, and optimize workflows with data-driven insights.
              </p>
              <div className="mt-10 flex flex-col items-center">
                {showPasswordForm ? (
                  <div className="w-full max-w-md">
                    <SignInForm />
                  </div>
                ) : (
                  <SignInButton />
                )}
              </div>
            </div>
          )}

          {!user && (
            <div className="mt-20">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-3 text-gray-800">Repository Analytics</h2>
                  <p className="text-gray-600">Connect your GitHub or GitLab repositories and track key metrics like PR velocity, code review time, and more.</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-3 text-gray-800">AI-Powered Insights</h2>
                  <p className="text-gray-600">Get personalized recommendations and identify bottlenecks with our machine learning algorithms.</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-3 text-gray-800">Team Collaboration</h2>
                  <p className="text-gray-600">Share dashboards, set goals, and track progress as a team to continuously improve your development process.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
