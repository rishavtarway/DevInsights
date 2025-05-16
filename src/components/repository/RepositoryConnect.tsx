import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getUserRepositories } from '@/lib/github/api';
import { Repository } from '@/types';

// Interface for GitHub API response
interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
  }

export function RepositoryConnect({ organizationId }: { organizationId?: string }) {
  const [loading, setLoading] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(organizationId || null);
  const [isGitHubAuthenticated, setIsGitHubAuthenticated] = useState(false);

  // Check GitHub authentication status
  useEffect(() => {
    async function checkGitHubAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const provider = session?.user?.app_metadata?.provider;
        setIsGitHubAuthenticated(provider === 'github' && !!session?.provider_token);
      } catch (error) {
        console.error('Error checking GitHub auth:', error);
      }
    }
    
    checkGitHubAuth();
  }, []);

  // Handle GitHub sign-in
  const handleGitHubSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'repo',
          redirectTo: window.location.origin + window.location.pathname
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      alert(`Failed to sign in with GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Fetch organization ID if not provided
  useEffect(() => {
    async function fetchOrgId() {
      if (!currentOrgId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { data: orgs } = await supabase
              .from('organizations')
              .select('id')
              .eq('created_by', user.id)
              .limit(1);
              
            if (orgs?.[0]?.id) {
              setCurrentOrgId(orgs[0].id);
            }
          }
        } catch (error) {
          console.error("Error fetching organization ID:", error);
        }
      }
    }
    fetchOrgId();
  }, [currentOrgId]);

  // Fetch repositories from GitHub and transform to Repository type
  const fetchGitHubRepositories = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      const token = session.provider_token;
      if (!token) throw new Error('Missing GitHub access token');
      
      // 👇 Explicitly type the response!
      const githubRepos: GitHubRepo[] = await getUserRepositories(token);
      
      const transformedRepos: Repository[] = githubRepos.map((repo) => ({
        id: repo.id.toString(),
        org_id: currentOrgId || '',
        name: repo.name,
        full_name: repo.full_name,
        platform: 'github',
        external_id: repo.id.toString(),
        url: repo.html_url,
        description: repo.description || '',
        created_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString()
      }));
  
      setRepositories(transformedRepos);
    } catch (error) {
      let errorMessage = 'Failed to fetch repositories';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle repository selection
  const toggleRepositorySelection = (repoId: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoId) 
        ? prev.filter(id => id !== repoId) 
        : [...prev, repoId]
    );
  };

  // Save selected repositories to Supabase
  const saveSelectedRepositories = async () => {
    if (selectedRepos.length === 0 || !currentOrgId) return;
    
    setLoading(true);
    try {
      const selectedRepoDetails = repositories
        .filter(repo => selectedRepos.includes(repo.id))
        .map(repo => ({
          org_id: currentOrgId,
          name: repo.name,
          platform: 'github',
          external_id: repo.external_id,
          url: repo.url,
          created_at: repo.created_at,
          last_synced_at: repo.last_synced_at
        }));
      
      const { error } = await supabase
        .from('repositories')
        .insert(selectedRepoDetails);
      
      if (error) throw error;
      
      alert('Repositories connected successfully!');
      setSelectedRepos([]);
    } catch (error) {
      alert(`Failed to connect repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Connect GitHub Repositories</h2>
      
      {/* Organization ID Display */}
      {!currentOrgId ? (
        <div className="text-red-600 mb-4">
          No organization selected. Please create an organization first.
        </div>
      ) : (
        <div className="text-gray-600 mb-4">
          Using organization ID: <span className="font-mono">{currentOrgId}</span>
        </div>
      )}
      
      {/* GitHub Authentication Prompt */}
      {!isGitHubAuthenticated && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 mb-2">GitHub authentication is required to fetch repositories.</p>
          <button 
            onClick={handleGitHubSignIn}
            className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
          >
            Sign in with GitHub
          </button>
        </div>
      )}
      
      {/* Repository Management Interface */}
      <button
        onClick={fetchGitHubRepositories}
        disabled={loading || !currentOrgId || !isGitHubAuthenticated}
        className="mb-6 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
      >
        {loading ? 'Loading...' : 'Fetch My Repositories'}
      </button>
      
      {repositories.length > 0 && (
        <>
          <div className="space-y-2 mb-6 max-h-64 overflow-y-auto border p-4 rounded-md">
            {repositories.map(repo => (
              <div key={repo.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`repo-${repo.id}`}
                  checked={selectedRepos.includes(repo.id)}
                  onChange={() => toggleRepositorySelection(repo.id)}
                  className="h-4 w-4"
                />
                <label htmlFor={`repo-${repo.id}`} className="flex-1 cursor-pointer">
                  <span className="font-medium text-gray-800">{repo.full_name}</span>
                  {repo.description && (
                    <p className="text-sm text-gray-500">{repo.description}</p>
                  )}
                </label>
              </div>
            ))}
          </div>
          
          <button
            onClick={saveSelectedRepositories}
            disabled={loading || selectedRepos.length === 0 || !currentOrgId}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-300"
          >
            {loading ? 'Saving...' : `Connect ${selectedRepos.length} Repositories`}
          </button>
        </>
      )}
    </div>
  );
}
