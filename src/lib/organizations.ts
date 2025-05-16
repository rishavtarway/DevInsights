// src/lib/organizations.ts
import { supabase } from '@/lib/supabase/client';

export async function ensureOrganizationForUser(userId: string) {
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .eq('created_by', userId)
    .limit(1);

  if (!orgs || orgs.length === 0) {
    const { error } = await supabase
      .from('organizations')
      .insert({
        name: 'My Organization',
        description: 'Default organization',
        created_by: userId,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("Failed to create organization:", error);
    }
  }
}
