'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase/client';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const { data, error } = await supabase.from("metrics").select("*");
        console.log("Metrics data:", data);
        
        if (error) {
          setError(error.message);
        } else {
          setMetrics(data || []);
        }
      } catch (err) {
        console.error("Error fetching metrics:", err);
        setError("Failed to fetch metrics data");
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return (
    <DashboardLayout title="Analytics">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Analytics Dashboard</h2>
        
        <div className="bg-gray-50 p-4 mb-6 rounded border">
          <h3 className="font-medium mb-2 text-gray-800">Debug Information:</h3>
          {loading ? (
            <p className="text-gray-700">Loading metrics data...</p>
          ) : error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : metrics.length === 0 ? (
            <p className="text-gray-700">No metrics data found. This may be due to Row Level Security policies.</p>
          ) : (
            <div>
              <p className="text-gray-700 mb-2">Found {metrics.length} metrics records. Showing first 5:</p>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-98 text-gray-800">
                {JSON.stringify(metrics.slice(0, 5), null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <p className="text-gray-700">Analytics visualization will appear here.</p>
      </div>
    </DashboardLayout>
  );
}
