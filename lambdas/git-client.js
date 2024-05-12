const executeGitCommand = (folder, commandName, ...params) => {
  const commandParams = [commandName, ...params];
  const command = spawnSync("git", commandParams, {
    cwd: folder,
  });
  console.log(`git ${commandName} ${params}` + command.output);
};

class GitClient {
  #parentFolder;
  #repoName;

  constructor(parentFolder, repoName) {
    this.#parentFolder = parentFolder;
    this.#repoName = repoName;
  }
  #repoFolder() {
    return `${this.#parentFolder}/${this.#repoName}`;
  }

  executeCommand(commandName, ...params) {
    executeGitCommand(this.#repoFolder(), commandName, params);
  }

  // TODO functions for clone, push, commit, add, ...
}

exports.handler = {
  GitClient,
  executeGitCommand,
};
