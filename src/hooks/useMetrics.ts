import { useQuery } from 'react-query';
import { supabase } from '@/lib/supabase/client';

export function useCommitMetrics(repoId: string, timeRange: 'day' | 'week' | 'month' = 'week') {
  return useQuery(['metrics', 'commit', repoId, timeRange], async () => {
    // Calculate time range
    const now = new Date();
    const startDate = new Date();
    
    if (timeRange === 'day') {
      startDate.setDate(now.getDate() - 1);
    } else if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }
    
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .eq('repo_id', repoId)
      .eq('metric_type', 'commit')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp');
      
    if (error) throw error;
    return data || [];
  });
}

export function usePullRequestMetrics(repoId: string, timeRange: 'day' | 'week' | 'month' = 'week') {
  return useQuery(['metrics', 'pr', repoId, timeRange], async () => {
    // Calculate time range
    const now = new Date();
    let startDate = new Date();
    
    if (timeRange === 'day') {
      startDate.setDate(now.getDate() - 1);
    } else if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }
    
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .eq('repo_id', repoId)
      .eq('metric_type', 'pr')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp');
      
    if (error) throw error;
    return data || [];
  });
}
