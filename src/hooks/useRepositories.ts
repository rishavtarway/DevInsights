import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '@/lib/supabase/client';

export function useRepositories(organizationId: string) {
  return useQuery({
    queryKey: ['repositories', organizationId],
    queryFn: async () => {
      console.log(`Fetching repositories for organization: ${organizationId}`);
      
      if (!organizationId) return [];
      
      // Force Supabase to select all repositories for this organization
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('org_id', organizationId)
        .order('name');
      
      if (error) {
        console.error('Repository fetch error:', error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} repositories:`, data);
      return data || [];
    },
    enabled: Boolean(organizationId)
  });
}

export function useDeleteRepository() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async (repoId: string) => {
      const { error } = await supabase
        .from('repositories')
        .delete()
        .eq('id', repoId);
        
      if (error) throw error;
      return repoId;
    },
    {
      onSuccess: (_, variables, context) => {
        // Invalidate and refetch repositories query
        queryClient.invalidateQueries('repositories');
      }
    }
  );
}
