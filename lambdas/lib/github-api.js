export class GithubApi {
  #octokitClient;
  #repoOwner;
  #repoName;

  constructor(octokitClient, repoOwner, repoName) {
    this.#octokitClient = octokitClient;
    this.#repoOwner = repoOwner;
    this.#repoName = repoName;
  }

  async createPullRequest(branchName, title, description) {
    await this.#octokitClient.request("POST /repos/{owner}/{repo}/pulls", {
      owner: this.#repoOwner,
      repo: this.#repoName,
      title,
      body: description,
      head: branchName,
      base: "main",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  }
}
