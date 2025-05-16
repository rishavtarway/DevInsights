// src/types.ts
export interface Repository {
    id: string;
    org_id: string;
    name: string;
    platform: string;
    external_id: string;
    url: string;
    created_at: string;
    last_synced_at: string;
  }
  
  export interface Insight {
    id: string;
    org_id: string;
    title: string;
    description: string;
    recommendation: string;
    priority: number;
    created_at: string;
  }
  
  export interface Metric {
    id: string;
    repo_id: string;
    user_id: string;
    metric_type: 'commit' | 'pr';
    value: number;
    timestamp: string;
  }

  export interface Repository {
    id: string;
    org_id: string;
    name: string;
    full_name: string;
    platform: string;
    external_id: string;
    url: string;
    description: string;
    created_at: string;
    last_synced_at: string;
  }
// src/types.ts
export interface Metric {
    id: string;
    repo_id: string;
    metric_type: 'commit' | 'pr';
    value: number;
    timestamp: string;
  }
  
  export interface Insight {
    title: string;
    description: string;
    recommendation: string;
    priority: number;
  }
  
  