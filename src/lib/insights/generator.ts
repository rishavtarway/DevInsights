import { supabase } from '@/lib/supabase/client';
import { generateInsight } from '@/lib/ai/openai';
import { useCommitMetrics, usePullRequestMetrics } from '@/hooks/useMetrics';

export async function generateAndStoreInsights(repoId: string, orgId: string) {
  try {
    // First, get the repository details
    const { data: repoData, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repoId)
      .single();
      
    if (repoError) throw repoError;
    if (!repoData) throw new Error('Repository not found');
    
    // Get commit metrics for the last week
    const { data: commitData, error: commitError } = await supabase
      .from('metrics')
      .select('*')
      .eq('repo_id', repoId)
      .eq('metric_type', 'commit')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp');
      
    if (commitError) throw commitError;
    
    // Get PR metrics for the last week
    const { data: prData, error: prError } = await supabase
      .from('metrics')
      .select('*')
      .eq('repo_id', repoId)
      .eq('metric_type', 'pr')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp');
      
    if (prError) throw prError;
    
    // Generate insights using OpenAI
    const insight = await generateInsight(
      repoData.name,
      commitData || [],
      prData || []
    );
    
    // Store the insight in the database
    const { error: insertError } = await supabase
      .from('insights')
      .insert({
        org_id: orgId,
        title: insight.title,
        description: insight.description,
        recommendation: insight.recommendation,
        priority: insight.priority
      });
      
    if (insertError) throw insertError;
    
    return insight;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
}
