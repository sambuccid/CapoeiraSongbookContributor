import { spawnSync as spawnSyncDependency } from "child_process";
import fsDependency from "fs/promises";
import { Octokit } from "octokit";
import { decryptText as decryptTextDependency } from "./lib/encryptDecrypt.js";
import { GitClient } from "./lib/git-client.js";
import { GithubApi } from "./lib/github-api.js";

const CREDENTAIL_FILE = "/tmp/.my-credentials";
const REPO_OWNER = "CortinaCapoeira";
const REPO_NAME = "CapoeiraSongbook";
const REPO_URL = "https://github.com/CortinaCapoeira/CapoeiraSongbook.git";
const getAuthRepoUrl = (username, password) =>
  `https://${username}:${password}@github.com/CortinaCapoeira/CapoeiraSongbook.git`;

const RELATIVE_SONGS_FOLDER_PATH = "_data/songs";

const octokitClient = new Octokit({
  auth: process.env.GITHUB_PASSWORD,
});

const ENV_VARS = {
  GITHUB_USERNAME: process.env.GITHUB_USERNAME,
  GITHUB_PASSWORD: process.env.GITHUB_PASSWORD,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
};

const DEPENDENCIES = {
  octokit: octokitClient,
  spawnSync: spawnSyncDependency,
  fs: fsDependency,
  decryptText: decryptTextDependency,
};

export const handler = (event) => actualHandler(event, ENV_VARS, DEPENDENCIES);

export const actualHandler = async (event, envVars, dependencies) => {
  const { GITHUB_USERNAME, GITHUB_PASSWORD, PRIVATE_KEY } = envVars;
  const { octokit, spawnSync, fs, decryptText } = dependencies;
  const git = new GitClient(spawnSync, "/tmp", REPO_NAME, REPO_URL);
  const github = new GithubApi(octokit, REPO_OWNER, REPO_NAME);

  const decryptedRequest = decryptText(PRIVATE_KEY, event.body);
  const requestBody = JSON.parse(decryptedRequest);

  // TODO if(`/tmp/${REPO_NAME}` exists){ git checkout main && git pull}

  git.clone();

  git.config("credential.helper", `store --file ${CREDENTAIL_FILE}`);

  await fs.writeFile(
    CREDENTAIL_FILE,
    getAuthRepoUrl(GITHUB_USERNAME, GITHUB_PASSWORD)
  );

  git.config("user.email", "songbook-contributor@a.com");
  git.config("user.name", "Songbook-contributor");

  const randomN = Math.floor(Math.random() * 10000000);
  const branchName = `songbook-new-song-contribution-${randomN}`;
  git.checkoutBranch(branchName);

  const { newFileRelativePath } = await createSongFile(
    fs,
    git.repoFolder(),
    requestBody.title,
    createFileContent(requestBody)
  );

  git.add(newFileRelativePath);
  git.commit(`Add new song: ${requestBody.title}`);

  if (!requestBody.dryRun) {
    git.push(branchName);
    await github.createPullRequest(
      branchName,
      `Add ${requestBody.title} song`,
      `New song contributed via the app: ${requestBody.title}`
    );
  }

  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: { "content-type": "text/plain" },
    body: JSON.stringify(requestBody),
  };
};

function createFileContent(requestBody) {
  const content = { title: requestBody.title };
  return JSON.stringify(content);
}

async function createSongFile(fs, gitRepoFolder, title, data) {
  let dashedTitle = title.toLowerCase().replaceAll(" ", "-");

  try {
    await fs.writeFile(getAbsoluteFilePath(dashedTitle), data, {
      flag: "wx",
    });
  } catch (err) {
    dashedTitle = `${dashedTitle}-1`;
    await fs.writeFile(getAbsoluteFilePath(dashedTitle), data, {
      flag: "wx",
    });
  }
  return {
    fileName: dashedTitle,
    newFileRelativePath: getRelativeFilePath(dashedTitle),
  };

  function getAbsoluteFilePath(fileName) {
    return `${gitRepoFolder}/${getRelativeFilePath(fileName)}`;
  }
  function getRelativeFilePath(fileName) {
    return `${RELATIVE_SONGS_FOLDER_PATH}/${fileName}.json`;
  }
}
