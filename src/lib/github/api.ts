import axios from 'axios';
import { GitHubRepo, GitHubCommit, GitHubPullRequest } from '@/types/api';

const BASE_URL = 'https://api.github.com';

export const getGitHubHeaders = (token: string) => ({
  'Authorization': `token ${token}`,
  'Accept': 'application/vnd.github.v3+json'
});

export async function getUserRepositories(token: string): Promise<GitHubRepo[]> {
  try {
    const response = await axios.get(`${BASE_URL}/user/repos?sort=updated`, {
      headers: getGitHubHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    throw error;
  }
}

export async function getRepoCommits(token: string, owner: string, repo: string): Promise<GitHubCommit[]> {
  try {
    const response = await axios.get(
      `${BASE_URL}/repos/${owner}/${repo}/commits`,
      { headers: getGitHubHeaders(token) }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching commits for ${owner}/${repo}:`, error);
    throw error;
  }
}

export async function getRepoPullRequests(
  token: string, 
  owner: string, 
  repo: string, 
  state: 'open' | 'closed' | 'all' = 'all'
): Promise<GitHubPullRequest[]> {
  try {
    const response = await axios.get(
      `${BASE_URL}/repos/${owner}/${repo}/pulls?state=${state}`,
      { headers: getGitHubHeaders(token) }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching pull requests for ${owner}/${repo}:`, error);
    throw error;
  }
}
