'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase/client';
import CommitActivityChart from '@/components/analytics/CommitActivityChart';
import PullRequestChart from '@/components/analytics/PullRequestChart';
import InsightCard from '@/components/insights/InsightCard';
import { useRepositories } from '@/hooks/useRepositories';
import { ensureOrganizationForUser } from '@/lib/organizations';


// Define a proper interface for debugInfo
interface DebugInfo {
  orgId?: string;
  directRepoCount?: number;
  directRepoData?: any[];
  manualFetchRepos?: any[];
  manualFetchError?: any;
  orgIdUsed?: string;
  newlyCreatedRepos?: any[];
  metricsCreated?: boolean;
  [key: string]: any; // Allow for additional properties
}

export default function DashboardPage() {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [insights, setInsights] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [repoLoading, setRepoLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [orgFixAttempted, setOrgFixAttempted] = useState(false); // Added for emergency fix
  const [repoCreationAttempted, setRepoCreationAttempted] = useState(false); // Added to prevent multiple creation attempts
  
  // Get user's default organization
  useEffect(() => {
    async function getDefaultOrg() {
      try {
        // Get user session with detailed error handling
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
        
        const user = data.user;
        console.log("Authenticated user ID:", user.id);
        
        // Log the current user to help with debugging
        console.log("User data:", {
          id: user.id,
          email: user.email,
          isAuthenticated: !!user
        });
        
        // Modified profile creation logic - first check if profile exists
        const { data: existingProfile, error: profileQueryError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
          
        // If profile doesn't exist or there was an error querying, create a new profile
        if (!existingProfile || profileQueryError) {
          console.log("Creating new user profile...");
          
          // Ensure profile creation succeeds first
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,  // Make sure this matches auth.users.id
              email: user.email || '',
              name: user.user_metadata?.full_name || '',
              avatar_url: user.user_metadata?.avatar_url || '',
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString()
            })
            .select()
            .single();
          
          if (profileError) {
            console.error("Failed to create user profile:", profileError);
            return; // Stop execution - don't try to create organization
          }
          
          console.log("Profile created successfully:", profile);
        } else {
          console.log("Using existing user profile:", existingProfile.id);
        }
        
        // Get organization with detailed error handling
        const { data: orgs, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .eq('created_by', user.id)
          .limit(1);
          
        if (orgsError) {
          console.error("Error fetching organizations:", orgsError);
          return; // Stop execution if we can't fetch orgs
        }
        
        // Debug what we found
        console.log(`Found ${orgs?.length || 0} organizations for user`);
        
        if (orgs && orgs.length > 0) {
          setOrgId(orgs[0].id);
          console.log("Using existing organization:", orgs[0].id);
          
          // Fetch direct data for debugging
          const { data: directRepoData } = await supabase
            .from('repositories')
            .select('*')
            .eq('org_id', orgs[0].id);
            
          setDebugInfo((prev: DebugInfo) => ({
            ...prev, 
            orgId: orgs[0].id,
            directRepoCount: directRepoData?.length || 0,
            directRepoData: directRepoData
          }));
        } else {
          console.log("No organizations found, creating one...");
          
          // Create default org with detailed error handling
          const { data: newOrg, error: createError } = await supabase
            .from('organizations')
            .insert({
              name: 'My Organization',
              description: 'Default organization',
              created_by: user.id,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
        
          if (createError) {
            console.error("Organization creation error:", JSON.stringify(createError));
            
            // Test if you're properly authenticated
            const { data: testData } = await supabase.rpc('test_authorization_header');
            console.log("Auth status:", testData);
            
            return;
          }
          
          console.log("Created new organization:", newOrg.id);
          setOrgId(newOrg.id);
        }
      } catch (error: unknown) {
        console.error('Error getting default organization:', error);
        
        // Type narrowing using type guard
        if (error && typeof error === 'object') {
          // Now TypeScript knows error is at least an object
          const err = error as Record<string, unknown>;
          
          if ('code' in err) console.error('Error code:', err.code);
          if ('message' in err) console.error('Error message:', err.message);
          if ('details' in err) console.error('Error details:', err.details);
        } else if (error instanceof Error) {
          // Standard Error object
          console.error('Error message:', error.message);
        } else {
          // Fallback for primitive values
          console.error('Unknown error type:', String(error));
        }
      } finally {
        setLoading(false);
      }
    }
    
    getDefaultOrg();
  }, []);
  
  // ADDED: Emergency organization creation effect
  useEffect(() => {
    if (orgId === null && !loading && !orgFixAttempted) {
      async function createEmergencyOrg() {
        setOrgFixAttempted(true);
        try {
          // Get current user
          const { data } = await supabase.auth.getUser();
          if (!data?.user) {
            console.log("Cannot create emergency org - no user found");
            return;
          }
          
          console.log("Creating emergency organization for user:", data.user.id);
          
          // Create default org directly
          const { data: newOrg, error } = await supabase
            .from('organizations')
            .insert({
              name: 'Emergency Organization',
              description: 'Created during troubleshooting',
              created_by: data.user.id,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (error) {
            console.error("Emergency org creation failed:", error);
          } else {
            console.log("Created emergency organization:", newOrg.id);
            setOrgId(newOrg.id);
          }
        } catch (e) {
          console.error("Emergency org creation exception:", e);
        }
      }
      
      createEmergencyOrg();
    }
  }, [orgId, loading, orgFixAttempted]);
  
  // Manual repository fetch for debugging
  useEffect(() => {
    async function fetchRepositoriesDirectly() {
      if (!orgId) return;
      
      try {
        const { data, error } = await supabase
          .from('repositories')
          .select('*')
          .eq('org_id', orgId);
          
        setDebugInfo((prev: DebugInfo) => ({ 
          ...prev, 
          manualFetchRepos: data,
          manualFetchError: error,
          orgIdUsed: orgId
        }));
        
        setRepoLoading(false);
      } catch (error) {
        console.error("Manual repo fetch error:", error);
      }
    }
    
    fetchRepositoriesDirectly();
  }, [orgId]);
  
  // FIXED: Modify the test repository creation effect to prevent infinite loops
  useEffect(() => {
    if (orgId && (!debugInfo?.manualFetchRepos || debugInfo.manualFetchRepos.length === 0) && !repoLoading && !repoCreationAttempted) {
      async function createTestRepositories() {
        try {
          // Mark that we've attempted creation to prevent loops
          setRepoCreationAttempted(true);
          
          console.log("Creating test repositories for organization:", orgId);
          
          // Create test repository 1
          const { data: repo1, error: error1 } = await supabase
            .from('repositories')
            .insert({
              org_id: orgId,
              name: 'Test Repository 1',
              platform: 'github',
              external_id: '12345',
              url: 'https://github.com/test/repo1',
              created_at: new Date().toISOString(),
              last_synced_at: new Date().toISOString()
            })
            .select();
            
          if (error1) {
            console.error("Error creating Test Repository 1:", error1);
          } else {
            console.log("Created Test Repository 1:", repo1);
          }
          
          // Create test repository 2
          const { data: repo2, error: error2 } = await supabase
            .from('repositories')
            .insert({
              org_id: orgId,
              name: 'Test Repository 2',
              platform: 'github',
              external_id: '67890',
              url: 'https://github.com/test/repo2',
              created_at: new Date().toISOString(),
              last_synced_at: new Date().toISOString()
            })
            .select();
            
          if (error2) {
            console.error("Error creating Test Repository 2:", error2);
          } else {
            console.log("Created Test Repository 2:", repo2);
          }
          
          // REMOVED: window.location.reload() - this was causing the infinite loop
          // Instead, update state to trigger a re-render
          if (repo1 || repo2) {
            setDebugInfo((prev: DebugInfo) => ({
              ...prev,
              newlyCreatedRepos: [...(repo1 || []), ...(repo2 || [])]
            }));
          }
        } catch (err) {
          console.error("Failed to create test repositories:", err);
        }
      }
      
      createTestRepositories();
    }
  }, [orgId, debugInfo?.manualFetchRepos, repoLoading, repoCreationAttempted]);
  
  // ADDED: Create sample metrics and insights for the repositories
  useEffect(() => {
    if (orgId && !debugInfo.metricsCreated) {
      async function createSampleMetrics() {
        try {
          // Get repositories first
          const { data: repos } = await supabase
            .from('repositories')
            .select('id')
            .eq('org_id', orgId);
            
          if (!repos || repos.length === 0) {
            console.log("No repositories found for creating metrics");
            return;
          }
          
          console.log(`Found ${repos.length} repositories for metrics creation`);
          
          // Get user ID
          const { data } = await supabase.auth.getUser();
          if (!data?.user) {
            console.log("No user found for creating metrics");
            return;
          }
          
          // Create metrics for the first repository
          const repoId = repos[0].id;
          console.log(`Creating metrics for repository: ${repoId}`);
          
          for (let i = 0; i < 30; i++) {
            // Add commit metrics
            const { error: commitError } = await supabase.from('metrics').insert({
              repo_id: repoId,
              user_id: data.user.id,
              metric_type: 'commit',
              value: Math.floor(Math.random() * 10) + 1,
              timestamp: new Date(Date.now() - i * 86400000).toISOString()
            });
            
            if (commitError) {
              console.error(`Error creating commit metric for day -${i}:`, commitError);
            }
            
            // Add PR metrics
            const { error: prError } = await supabase.from('metrics').insert({
              repo_id: repoId,
              user_id: data.user.id,
              metric_type: 'pr',
              value: Math.floor(Math.random() * 5) + 1,
              timestamp: new Date(Date.now() - i * 86400000).toISOString()
            });
            
            if (prError) {
              console.error(`Error creating PR metric for day -${i}:`, prError);
            }
          }
          
          console.log("Created sample metrics successfully");
          
          // Create sample insights
          const { data: insightData, error: insightError } = await supabase.from('insights').insert([
            {
              org_id: orgId,
              title: 'Code Review Bottleneck',
              description: 'Pull requests are taking 2.5 days on average to be reviewed.',
              recommendation: 'Consider implementing a PR rotation system.',
              priority: 4,
              created_at: new Date().toISOString()
            },
            {
              org_id: orgId,
              title: 'Improving Test Coverage',
              description: 'Test coverage has increased by 12% this sprint.',
              recommendation: 'Continue the current test-driven development practices.',
              priority: 2,
              created_at: new Date().toISOString()
            }
          ]).select();
          
          if (insightError) {
            console.error("Error creating insights:", insightError);
          } else {
            console.log("Created sample insights:", insightData);
          }
          
          setDebugInfo((prev: DebugInfo) => ({...prev, metricsCreated: true}));
        } catch (err) {
          console.error('Failed to create sample metrics/insights:', err);
        }
      }
      
      createSampleMetrics();
    }
  }, [orgId, debugInfo.metricsCreated]);
  
  // Fetch repositories for this org
  const { data: repositories, isLoading: repoQueryLoading } = useRepositories(orgId || '');
  
  // Set first repo as selected if none selected
  useEffect(() => {
    if (repositories?.length && !selectedRepo) {
      setSelectedRepo(repositories[0].id);
    }
  }, [repositories, selectedRepo]);
  
  // Fetch insights
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
        {/* Debug info */}
        <div className="bg-white p-4 rounded-lg shadow-sm overflow-auto">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Debug Information</h3>
          <p className="text-gray-700 mb-2">Organization ID: {orgId || 'None'}</p>
          <p className="text-gray-700 mb-2">Repositories via hook: {repositories?.length || 0}</p>
          <p className="text-gray-700 mb-2">Selected repo: {selectedRepo || 'None'}</p>
          <p className="text-gray-700 mb-2">Emergency fix attempted: {orgFixAttempted ? 'Yes' : 'No'}</p>
          <p className="text-gray-700 mb-2">Repo creation attempted: {repoCreationAttempted ? 'Yes' : 'No'}</p>
          <p className="text-gray-700 mb-2">Metrics created: {debugInfo.metricsCreated ? 'Yes' : 'No'}</p>
          <pre className="text-xs bg-gray-50 p-2 rounded text-gray-800 max-h-40 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        {/* Repository selector */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
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
