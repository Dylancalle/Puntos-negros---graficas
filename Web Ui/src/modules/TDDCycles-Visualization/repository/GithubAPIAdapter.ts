import { Octokit } from "octokit";
import { CommitDataObject } from "../domain/githubCommitInterfaces";
import { JobDataObject } from "../domain/jobInterfaces";
import { GithubAPIRepository } from "../domain/GithubAPIRepositoryInterface";
import { formatDate } from '../application/GetTDDCycles';
import { CommitCycle } from "../domain/TddCycleInterface.ts";
import axios from "axios";
import { VITE_API } from "../../../../config.ts";

//import fetch from "node-fetch"

export class GithubAPIAdapter implements GithubAPIRepository {
  octokit: Octokit;
  backAPI: string;
  
  constructor() {
    this.octokit = new Octokit();
    //auth: 'coloca tu token github para mas requests'
    this.backAPI = VITE_API + "/TDDCycles"; // https://localhost:3000/api/ -> https://tdd-lab-api-gold.vercel.app/api/
  }

  async obtainUserName(owner: string): Promise<string> {
    try {
      const response = await this.octokit.request(`GET /users/${owner}`);
      
      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const userName = response.data.name;
      return userName || owner; // Retorna el nombre o un mensaje si no está disponible
    } catch (error) {
      console.error("Error obtaining user name:", error);
      throw error;
    }
  }

  /*
  async obtainCommitsOfRepo(
    owner: string,
    repoName: string,
  ): Promise<CommitDataObject[]> {
    try {
      const response = await axios.get(
        this.backAPI + `/commits?owner=${owner}&repoName=${repoName}`,
      );
      console.log(
        this.backAPI + `/commits?owner=${owner}&repoName=${repoName}`,
      );

      if (response.status != 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const responseData: [] = response.data;
      const commits: CommitDataObject[] = responseData.map(
        (commitData: any) => ({
          html_url: commitData.html_url,
          sha: commitData.sha,
          stats: {
            total: commitData.total,
            additions: commitData.additions,
            deletions: commitData.deletions,
            date: formatDate(new Date(commitData.commit_date))
          },
          commit: {
            date: new Date(commitData.commit_date), // Convert date string to Date object
            message: commitData.message,
            url: commitData.url,
            comment_count: commitData.comment_count,
          },
          coverage: commitData.coverage,
          test_count: commitData.test_count,
        }),
      );
      console.log(commits)
      return commits;
    } catch (error) {
      // Handle any errors here
      console.error("Error obtaining commits:", error);
      throw error;
    }
  }
  */

  async obtainCommitsOfRepo(
    owner: string,
    repoName: string,
  ): Promise<CommitDataObject[]> {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repoName}/refs/heads/pruebas-JPMJ/commit-history.json`
      );
      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const commitsData = (await response.json()) as any[];
      console.log(commitsData);
  
      const commitDataObject: CommitDataObject[] = commitsData.map(
        (commitData: any) => ({
          html_url: commitData.html_url,
          sha: commitData.sha,
          stats: {
            total: commitData.stats.total,
            additions: commitData.stats.additions,
            deletions: commitData.stats.deletions,
          },
          commit: {
            date: new Date(commitData.commit.date),
            message: commitData.commit.message,
            url: commitData.commit.url,
            comment_count: commitData.commit.comment_count,
          },
          coverage: commitData.coverage,
          test_count: commitData.test_count,
        })
      ).sort((a, b) => b.commit.date.getTime() - a.commit.date.getTime());
      return commitDataObject;
    } catch (error) {
      console.error("Error reading commits from JSON", error);
      throw error;
    }
  }

  async obtainComplexityOfRepo(owner: string, repoName: string) {
    try {
      const repoUrl = `https://github.com/${owner}/${repoName}`;
      
      const response = await axios.post("https://api-ccn.vercel.app/analyzeAvgCcn", {
        repoUrl,
      });

     
      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = response.data.results;
      console.log(response.data)
      return  responseData.map((complexity: any) => ({
        ciclomaticComplexity: Math.round(complexity.average_cyclomatic_complexity),
        commit: complexity.commit,
      }));

      
    } catch (error) {
      console.error("Error obtaining jobs:", error);
      throw error;
    }
  }

  async obtainRunsOfLog(owner: string, repoName: string) {
    try {
      const response = await this.octokit.request(
        `GET /repos/${owner}/${repoName}/actions/runs`,
      );

      return response;
    } catch (error) {
      // Handle any errors here
      console.error("Error obtaining runs:", error);
      throw error;
    }
  }

  async obtainJobsOfRepo(
    owner: string,
    repoName: string,
  ): Promise<JobDataObject[]> {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repoName}/refs/heads/pruebas-JPMJ/commit-history.json`
      );
      
      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const commitsData = await response.json();
      
      return commitsData.map((commit: any) => ({
        sha: commit.sha,
        conclusion: commit.job_conclusion
      }));
    } catch (error) {
      console.error("Error obtaining jobs:", error);
      throw error;
    }
  }

  async obtainCommitTddCycle(
    owner: string,
    repoName: string,
  ): Promise<CommitCycle[]> {
    try {
      const response = await axios.get(
        this.backAPI + `/get-commits?owner=${owner}&repoName=${repoName}`,
      );
      console.log(
        this.backAPI + `/get-commits?owner=${owner}&repoName=${repoName}`,
      );

      if (response.status != 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const responseData: [] = response.data;
      const commits: CommitCycle[] = responseData.map(
        (commitData: any) => ({
          url: commitData.url,
          sha: commitData.sha,
          tddCylce: commitData.tdd_cycle ?? "null"
        }),
      );
      console.log(commits)
      return commits;
    } catch (error) {
      // Handle any errors here
      console.error("Error obtaining commits:", error);
      throw error;
    }
  }
}
