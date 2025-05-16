'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase/client';
import CommitActivityChart from '@/components/analytics/CommitActivityChart';
import PullRequestChart from '@/components/analytics/PullRequestChart';
import InsightCard from '@/components/insights/InsightCard';
import { useRepositories } from '@/hooks/useRepositories';
import { ensureOrganizationForUser } from '@/lib/organizations';
import { Repository, Insight } from '@/types';

interface DebugInfo {
  orgId?: string;
  directRepoCount?: number;
  directRepoData?: Repository[];
  manualFetchRepos?: Repository[];
  manualFetchError?: Error | null;
  orgIdUsed?: string;
  newlyCreatedRepos?: Repository[];
  metricsCreated?: boolean;
}

export default function DashboardPage() {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [repoLoading, setRepoLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [orgFixAttempted, setOrgFixAttempted] = useState(false);
  const [repoCreationAttempted, setRepoCreationAttempted] = useState(false);

  // 1. Ensure organization exists and fetch it
  useEffect(() => {
    async function getDefaultOrg() {
      try {
        const { data, error: sessionError } = await supabase.auth.getUser();
        if (sessionError) {
          console.error("Authentication error:", sessionError);
          return;
        }
        if (!data?.user) {
          console.log("No authenticated user found");
          return;
        }
        await ensureOrganizationForUser(data.user.id);

        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .eq('created_by', data.user.id);

        if (orgsError) {
          console.error("Error fetching organizations:", orgsError);
          return;
        }

        
        if (orgsData && orgsData.length > 0) {
          setOrgId(orgsData[0].id);
          const { data: directRepoData } = await supabase
            .from('repositories')
            .select('*')
            .eq('org_id', orgsData[0].id);

          setDebugInfo(prev => ({
            ...prev,
            orgId: orgsData[0].id,
            directRepoCount: directRepoData?.length || 0,
            directRepoData: directRepoData ?? undefined,
          }));
        }
      } catch (error) {
        console.error('Error getting default organization:', error);
      } finally {
        setLoading(false);
      }
    }
    getDefaultOrg();
  }, []);

  // 2. Manual fetch for repositories for debug
  useEffect(() => {
    async function fetchRepositoriesDirectly() {
      if (!orgId) return;
      try {
        const { data: directRepoData } = await supabase
          .from('repositories')
          .select('*')
          .eq('org_id', orgId);

        setDebugInfo(prev => ({
          ...prev,
          manualFetchRepos: directRepoData || [],
          orgIdUsed: orgId,
        }));
        setRepoLoading(false);
      } catch (error) {
        console.error("Manual repo fetch error:", error);
      }
    }
    fetchRepositoriesDirectly();
  }, [orgId]);

  // 3. Create test repositories if none exist
  useEffect(() => {
    if (
      orgId &&
      (!debugInfo.manualFetchRepos || debugInfo.manualFetchRepos.length === 0) &&
      !repoLoading &&
      !repoCreationAttempted
    ) {
      async function createTestRepositories() {
        try {
          setRepoCreationAttempted(true);
          const { data: repo1 } = await supabase
            .from('repositories')
            .insert({
              org_id: orgId,
              name: 'Test Repository 1',
              platform: 'github',
              external_id: '12345',
              url: 'https://github.com/test/repo1',
              created_at: new Date().toISOString(),
              last_synced_at: new Date().toISOString(),
            })
            .select();
          const { data: repo2 } = await supabase
            .from('repositories')
            .insert({
              org_id: orgId,
              name: 'Test Repository 2',
              platform: 'github',
              external_id: '67890',
              url: 'https://github.com/test/repo2',
              created_at: new Date().toISOString(),
              last_synced_at: new Date().toISOString(),
            })
            .select();
          if (repo1 || repo2) {
            setDebugInfo(prev => ({
              ...prev,
              newlyCreatedRepos: [
                ...(repo1 || []),
                ...(repo2 || []),
              ],
            }));
          }
        } catch (err) {
          console.error("Failed to create test repositories:", err);
        }
      }
      createTestRepositories();
    }
  }, [orgId, debugInfo.manualFetchRepos, repoLoading, repoCreationAttempted]);

  // 4. Create sample metrics and insights for demo
  useEffect(() => {
    if (orgId && !debugInfo.metricsCreated) {
      async function createSampleMetrics() {
        try {
          const { data: repos } = await supabase
            .from('repositories')
            .select('id')
            .eq('org_id', orgId);
          if (!repos || repos.length === 0) return;
          const { data } = await supabase.auth.getUser();
          if (!data?.user) return;
          const repoId = repos[0].id;
          for (let i = 0; i < 30; i++) {
            await supabase.from('metrics').insert({
              repo_id: repoId,
              user_id: data.user.id,
              metric_type: 'commit',
              value: Math.floor(Math.random() * 10) + 1,
              timestamp: new Date(Date.now() - i * 86400000).toISOString(),
            });
            await supabase.from('metrics').insert({
              repo_id: repoId,
              user_id: data.user.id,
              metric_type: 'pr',
              value: Math.floor(Math.random() * 5) + 1,
              timestamp: new Date(Date.now() - i * 86400000).toISOString(),
            });
          }
          await supabase.from('insights').insert([
            {
              org_id: orgId,
              title: 'Code Review Bottleneck',
              description: 'Pull requests are taking an average of 2.5 days to review.',
              recommendation: 'Consider implementing a PR rotation system.',
              priority: 4,
              created_at: new Date().toISOString(),
            },
            {
              org_id: orgId,
              title: 'Improving Test Coverage',
              description: 'Test coverage has increased by 12% this sprint.',
              recommendation: 'Continue the current test-driven development practices.',
              priority: 2,
              created_at: new Date().toISOString(),
            },
          ]);
          setDebugInfo(prev => ({ ...prev, metricsCreated: true }));
        } catch (err) {
          console.error('Failed to create sample metrics/insights:', err);
        }
      }
      createSampleMetrics();
    }
  }, [orgId, debugInfo.metricsCreated]);

  // 5. Fetch repositories for this org
  const { data: repositories, isLoading: repoQueryLoading } = useRepositories(orgId || '');

  // 6. Set first repo as selected if none selected
  useEffect(() => {
    if (repositories?.length && !selectedRepo) {
      setSelectedRepo(repositories[0].id);
    }
  }, [repositories, selectedRepo]);

  // 7. Fetch insights
  useEffect(() => {
    if (!orgId) return;
    async function fetchInsights() {
      try {
        const { data, error } = await supabase
          .from('insights')
          .select('*')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) throw error;
        setInsights(data || []);
      } catch (error) {
        console.error('Error fetching insights:', error);
      }
    }
    fetchInsights();
  }, [orgId]);

  if (loading) {
    return <div className="flex justify-center py-20 text-gray-700">Loading dashboard...</div>;
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 gap-6">
        {/* Debug Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm overflow-auto min-h-[150px]">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Debug Information</h3>
          <p className="text-gray-700 mb-2">Organization ID: {orgId || 'None'}</p>
          <p className="text-gray-700 mb-2">Repositories via hook: {repositories?.length || 0}</p>
          <p className="text-gray-700 mb-2">Selected repo: {selectedRepo || 'None'}</p>
          <p className="text-gray-700 mb-2">Emergency fix attempted: {orgFixAttempted ? 'Yes' : 'No'}</p>
          <p className="text-gray-700 mb-2">Repo creation attempted: {repoCreationAttempted ? 'Yes' : 'No'}</p>
          <p className="text-gray-700 mb-2">Metrics created: {debugInfo.metricsCreated ? 'Yes' : 'No'}</p>
          <pre className="text-xs bg-gray-50 p-2 rounded text-gray-800 max-h-60 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Repository Selector */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <label htmlFor="repo-select" className="block text-sm font-medium text-gray-700">
                Select Repository
              </label>
              <select
                id="repo-select"
                value={selectedRepo || ''}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-700"
                disabled={!repositories?.length || repoQueryLoading}
              >
                {repoQueryLoading && <option value="">Loading repositories...</option>}
                {!repoQueryLoading && !repositories?.length && (
                  <option value="">No repositories found</option>
                )}
                {repositories?.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name}
                  </option>
                ))}
              </select>
              {!repositories?.length && !repoQueryLoading && (
                <p className="mt-1 text-sm text-red-600">
                  No repositories found. Check RLS policies.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="time-range" className="block text-sm font-medium text-gray-700">
                Time Range
              </label>
              <select
                id="time-range"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'day' | 'week' | 'month')}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-700"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {selectedRepo ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CommitActivityChart repoId={selectedRepo} timeRange={timeRange} />
            <PullRequestChart repoId={selectedRepo} timeRange={timeRange} />
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-700">Select a repository to view charts</p>
          </div>
        )}

        {/* Insights Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Latest Insights</h3>
          {insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-700">No insights available yet</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
