import { CommitDataObject } from "../domain/githubCommitInterfaces";
import { GithubAPIRepository } from "../domain/GithubAPIRepositoryInterface";
import { CommitCycle } from "../domain/TddCycleInterface";
import { formatDate } from "../application/GetTDDCycles";
import { VITE_API } from "../../../../config.ts";

export class GithubAPIFetchAdapter implements GithubAPIRepository {
  private readonly backendAPI: string;

  constructor() {
    this.backendAPI = VITE_API + "/TDDCycles";
  }

  async obtainCommitsOfRepo(owner: string, repoName: string): Promise<CommitDataObject[]> {
    const endpoint = `https://raw.githubusercontent.com/${owner}/${repoName}/main/data/commits.json`;

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Error fetching commits: ${response.status}`);
    }

    const commits = await response.json();

    return commits.map((commit: any): CommitDataObject => ({
      html_url: commit.html_url,
      sha: commit.sha,
      stats: {
        total: commit.stats.total,
        additions: commit.stats.additions,
        deletions: commit.stats.deletions,
        date: formatDate(new Date(commit.commit.author.date)),
      },
      commit: {
        date: new Date(commit.commit.author.date),
        message: commit.commit.message,
        url: commit.html_url,
        comment_count: 0,
      },
      coverage: commit.coverage,
      test_count: commit.test_count,
    }));
  }

  async obtainCommitTddCycle(owner: string, repoName: string): Promise<CommitCycle[]> {
    const apiUrl = `${this.backendAPI}/get-commits?owner=${owner}&repoName=${repoName}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch TDD cycles: ${response.status}`);
    }

    const data = await response.json();

    return data.map((item: any): CommitCycle => ({
      url: item.url,
      sha: item.sha,
      tddCylce: item.tdd_cycle ?? "null"
    }));
  }
}
