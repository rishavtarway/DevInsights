'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase/client';
import { Insight } from '@/types'; 

export default function InsightsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const { data, error } = await supabase.from('insights').select('*');
        console.log('Insights data:', data);
        
        if (error) {
          setError(error.message);
        } else {
          setInsights(data || []);
        }
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError('Failed to fetch insights data');
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  return (
    <DashboardLayout title="Insights">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Development Insights</h2>

        <div className="bg-gray-50 p-4 mb-6 rounded border">
          <h3 className="font-medium mb-2 text-gray-800">Debug Information:</h3>
          {loading ? (
            <p className="text-gray-700">Loading insights data...</p>
          ) : error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : insights.length === 0 ? (
            <p className="text-gray-700">No insights data found. This may be due to Row Level Security policies.</p>
          ) : (
            <div>
              <p className="text-gray-700 mb-2">Found {insights.length} insights records. Showing first 5:</p>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-75 text-gray-800">
                {JSON.stringify(insights.slice(0, 5), null, 2)}
              </pre>
            </div>
          )}
        </div>

        <p className="text-gray-700">AI-powered insights will appear here.</p>
        
        {/* Display insights cards if available */}
        {!loading && insights.length > 0 && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {insights.map(insight => (
              <div key={insight.id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <div className={`p-1 ${insight.priority > 3 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <div className="p-4">
                  <h3 className="font-medium text-lg text-gray-800 mb-2">{insight.title}</h3>
                  <p className="text-gray-600 mb-3">{insight.description}</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700 font-medium">Recommendation</p>
                    <p className="text-gray-600">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
