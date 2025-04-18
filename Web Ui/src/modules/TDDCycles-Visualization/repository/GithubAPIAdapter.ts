import { graphql } from "@octokit/graphql";
import { CommitDataObject } from "../domain/githubCommitInterfaces";
import { GithubAPIRepository } from "../domain/GithubAPIRepositoryInterface";
import { formatDate } from "../application/GetTDDCycles";
import { CommitCycle } from "../domain/TddCycleInterface.ts";
import axios from "axios";
import { VITE_API } from "../../../../config.ts";

export class GithubAPIAdapter implements GithubAPIRepository {
  graphqlClient: any;
  backAPI: string;

  constructor() {
    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`, // usa tu token aquí
      },
    });
    this.backAPI = VITE_API + "/TDDCycles";
  }

  async obtainUserName(owner: string): Promise<string> {
    try {
      const result = await this.graphqlClient(`
        query {
          user(login: "${owner}") {
            name
          }
        }
      `);
      return result.user.name || owner;
    } catch (error) {
      console.error("Error obtaining user name:", error);
      throw error;
    }
  }

  async obtainCommitsOfRepo(owner: string, repoName: string): Promise<CommitDataObject[]> {
    try {
      const result = await this.graphqlClient(`
        query {
          repository(owner: "${owner}", name: "${repoName}") {
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 100) {
                    edges {
                      node {
                        committedDate
                        message
                        oid
                        url
                        additions
                        deletions
                        changedFiles
                        author {
                          name
                          email
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `);

      const commits = result.repository.defaultBranchRef.target.history.edges.map((edge: any) => {
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
            comment_count: 0, // GraphQL no devuelve esto directamente
          },
          coverage: null,
          test_count: 0,
        };
      });

      return commits;
    } catch (error) {
      console.error("Error fetching commits via GraphQL:", error);
      throw error;
    }
  }

  async obtainComplexityOfRepo(owner: string, repoName: string) {
    try {
      const repoUrl = `https://github.com/${owner}/${repoName}`;
      const response = await axios.post("https://api-ccn.vercel.app/analyzeAvgCcn", {
        repoUrl,
      });
      return response.data.results.map((complexity: any) => ({
        ciclomaticComplexity: Math.round(complexity.average_cyclomatic_complexity),
        commit: complexity.commit,
      }));
    } catch (error) {
      console.error("Error obtaining complexity:", error);
      throw error;
    }
  }

  async obtainRunsOfLog(owner: string, repoName: string) {
    // Puede omitirse en esta versión si no estás cruzando con Actions
    return [];
  }

  async obtainJobsOfRepo(owner: string, repoName: string) {
    // También omitido aquí; se puede usar REST si querés combinar
    return [];
  }

  async obtainCommitTddCycle(owner: string, repoName: string): Promise<CommitCycle[]> {
    try {
      const response = await axios.get(
        `${this.backAPI}/get-commits?owner=${owner}&repoName=${repoName}`
      );

      return response.data.map((commitData: any) => ({
        url: commitData.url,
        sha: commitData.sha,
        tddCylce: commitData.tdd_cycle ?? "null"
      }));
    } catch (error) {
      console.error("Error obtaining TDD cycles:", error);
      throw error;
    }
  }
}
