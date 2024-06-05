export class GitClient {
  #spawnSyncLib;
  #parentFolder;
  #repoName;
  #repoUrl;

  constructor(spawnSyncLib, parentFolder, repoName, repoUrl) {
    this.#spawnSyncLib = spawnSyncLib;
    this.#parentFolder = parentFolder;
    this.#repoName = repoName;
    this.#repoUrl = repoUrl;
  }
  repoFolder() {
    return `${this.#parentFolder}/${this.#repoName}`;
  }

  clone() {
    this.#executeGeneralGitCommand(this.#parentFolder, "clone", this.#repoUrl);
  }

  hardReset(branchName) {
    this.#executeRepoCommand("reset", "--hard", branchName);
  }

  config(...params) {
    this.#executeRepoCommand("config", ...params);
  }

  checkoutNewBranch(branchName) {
    this.#executeRepoCommand("checkout", "-b", branchName);
  }

  checkoutExistingBranch(branchName) {
    this.#executeRepoCommand("checkout", branchName);
  }

  add(path) {
    this.#executeRepoCommand("add", path);
  }

  commit(commitMessage) {
    this.#executeRepoCommand("commit", "-m", `"${commitMessage}"`);
  }

  push(branchName) {
    this.#executeRepoCommand("push", "--set-upstream", "origin", branchName);
  }

  pullRebase() {
    this.#executeRepoCommand("pull", "-r");
  }

  #executeRepoCommand(commandName, ...params) {
    this.#executeGeneralGitCommand(this.repoFolder(), commandName, ...params);
  }

  #executeGeneralGitCommand(folder, commandName, ...params) {
    const commandParams = [commandName, ...params];
    const command = this.#spawnSyncLib("git", commandParams, {
      cwd: folder,
    });
    console.log(`git ${commandName} ${params} => ` + command.output);
  }
}
