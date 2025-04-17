import fetch from "node-fetch";
import { CommitDataObject } from "../domain/githubCommitInterfaces";
import { GithubAPIRepository } from "../domain/GithubAPIRepositoryInterface";
import { CommitCycle } from "../domain/TddCycleInterface";
import { formatDate } from "../application/GetTDDCycles";
import { VITE_API } from "../../../../config.ts";

const GRAPHQL_URL = "https://api.github.com/graphql";

export class GithubAPIAltAdapter implements GithubAPIRepository {
  private backAPI: string;
  private token: string;

  constructor() {
    this.backAPI = VITE_API + "/TDDCycles";
    this.token = process.env.GITHUB_TOKEN || "";
  }

  private async queryGitHubGraphQL(query: string, variables: any = {}) {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Authorization": `bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GitHub GraphQL API error: ${response.status}`);
    }

    return await response.json();
  }

  async obtainCommitsOfRepo(owner: string, repo: string): Promise<CommitDataObject[]> {
    const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 30) {
                  edges {
                    node {
                      message
                      committedDate
                      oid
                      url
                      additions
                      deletions
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.queryGitHubGraphQL(query, { owner, repo });
    const commitsRaw = data.data.repository.defaultBranchRef.target.history.edges;

    return commitsRaw.map((edge: any) => {
      const node = edge.node;
      return {
        html_url: node.url,
        sha: node.oid,
        stats: {
          total: node.additions + node.deletions,
          additions: node.additions,
          deletions: node.deletions,
          date: formatDate(new Date(node.committedDate)),
        },
        commit: {
          date: new Date(node.committedDate),
          message: node.message,
          url: node.url,
          comment_count: 0,
        },
        coverage: Math.random() * 100, // Simulación
        test_count: Math.floor(Math.random() * 10), // Simulación
      };
    });
  }

  async obtainCommitTddCycle(owner: string, repoName: string): Promise<CommitCycle[]> {
    const url = `${this.backAPI}/get-commits?owner=${owner}&repoName=${repoName}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error from backend: ${res.status}`);
    const data = await res.json();

    return data.map((commitData: any) => ({
      url: commitData.url,
      sha: commitData.sha,
      tddCylce: commitData.tdd_cycle ?? "null"
    }));
  }
}
