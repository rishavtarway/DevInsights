'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { RepositoryConnect } from '@/components/repository/RepositoryConnect';
import { supabase } from '@/lib/supabase/client';
import { Repository } from '@/types';

export default function RepositoriesPage() {
    const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function debugFetchRepositories() {
      try {
        const { data, error } = await supabase.from("repositories").select("*");
        console.log("Query error:", error);
        console.log("Data returned:", data);
        
        if (error) {
          setError(error.message);
        } else {
          setRepositories(data || []);
        }
      } catch (err) {
        console.error("Exception:", err);
        setError("Failed to fetch repositories");
      } finally {
        setLoading(false);
      }
    }
    
    debugFetchRepositories();
  }, []);

  return (
    <DashboardLayout title="Repositories">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Repositories Management</h2>
        
        {/* Debug information - ENLARGED */}
        <div className="bg-gray-50 p-6 mb-6 rounded border min-h-[200px] overflow-auto">
          <h3 className="font-medium mb-2 text-gray-800">Debug Information:</h3>
          {loading ? (
            <p className="text-gray-700">Loading repository data...</p>
          ) : error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : repositories.length === 0 ? (
            <p className="text-gray-700">No repositories found. This may be due to Row Level Security policies.</p>
          ) : (
            <div>
              <p className="text-gray-700 mb-2">Found {repositories.length} repositories:</p>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-80 text-gray-800">
                {JSON.stringify(repositories.slice(0, 5), null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        {/* Repository Connection Interface - ADDED */}
        <div className="mt-6">
          <h3 className="font-medium mb-4 text-gray-800">Connect Repository:</h3>
          <RepositoryConnect />
        </div>
      </div>
    </DashboardLayout>
  );
}
