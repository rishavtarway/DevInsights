export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
    private: boolean;
    owner: {
      login: string;
      id: number;
      avatar_url: string;
    };
  }
  
  export interface GitHubCommit {
    sha: string;
    commit: {
      author: {
        name: string;
        email: string;
        date: string;
      };
      message: string;
    };
    author: {
      login: string;
      id: number;
    } | null;
  }
  
  export interface GitHubPullRequest {
    id: number;
    number: number;
    title: string;
    user: {
      login: string;
      id: number;
    };
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    merged_at: string | null;
  }
  
  // Add similar types for GitLab
  