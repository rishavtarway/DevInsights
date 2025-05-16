import { ReactNode } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type DashboardLayoutProps = {
  children: ReactNode;
  title: string;
};

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
    const router = useRouter();
  
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      // Redirect to login page or home page
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">DevInsights</h1>
              </div>
              <div className="ml-10 flex items-center space-x-4">
                <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">
                  Dashboard
                </Link>
                <Link href="/repositories" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">
                  Repositories
                </Link>
                <Link href="/analytics" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">
                  Analytics
                </Link>
                <Link href="/insights" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">
                  Insights
                </Link>
              </div>
            </div>
            <div className="flex items-center">
            <button 
                onClick={handleSignOut} 
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
