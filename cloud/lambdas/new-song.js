import { spawnSync as spawnSyncDependency } from "child_process";
import fsDependency from "fs/promises";
import { Octokit } from "octokit";
import { decryptText as decryptTextDependency } from "./lib/encryptDecrypt.js";
import { GitClient } from "./lib/git-client.js";
import { GithubApi } from "./lib/github-api.js";

const CREDENTIAL_FILE = "/tmp/.my-credentials";
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
  DISABLE_ENCRYPTION: process.env.DISABLE_ENCRYPTION,
};

const DEPENDENCIES = {
  octokit: octokitClient,
  spawnSync: spawnSyncDependency,
  fs: fsDependency,
  decryptText: decryptTextDependency,
};

export const handler = (event) => actualHandler(event, ENV_VARS, DEPENDENCIES);

export const actualHandler = async (event, envVars, dependencies) => {
  const { GITHUB_USERNAME, GITHUB_PASSWORD, PRIVATE_KEY, DISABLE_ENCRYPTION } = envVars;
  const { octokit, spawnSync, fs, decryptText } = dependencies;
  const git = new GitClient(spawnSync, "/tmp", REPO_NAME, REPO_URL);
  const github = new GithubApi(octokit, REPO_OWNER, REPO_NAME);

  console.info("Lambda invoked with body:" + event.body);

  let plainRequest = event.body
  if(DISABLE_ENCRYPTION !== 'true'){
    plainRequest = decryptText(PRIVATE_KEY, event.body);
    console.info("Body decrypted:" + plainRequest);
  }
  const requestBody = JSON.parse(plainRequest);
  console.info("Body parsed:", requestBody);

  validate(requestBody);

  await initialiseRepo(fs, git, { GITHUB_USERNAME, GITHUB_PASSWORD });

  const randomN = Math.floor(Math.random() * 10000000);
  const branchName = `songbook-new-song-contribution-${randomN}`;
  git.checkoutNewBranch(branchName);

  const newFileContent = createFileContent(requestBody);
  const { newFileRelativePath } = await createSongFile(
    fs,
    git.repoFolder(),
    requestBody.title,
    newFileContent
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
    body: requestBody.dryRun ? newFileContent : "",
  };
};

async function initialiseRepo(fs, git, credentials) {
  const alreadyCheckedOut = await fileOrDirExist(fs, git.repoFolder());
  if (!alreadyCheckedOut) {
    git.clone();

    git.config("credential.helper", `store --file ${CREDENTIAL_FILE}`);
    await fs.writeFile(
      CREDENTIAL_FILE,
      getAuthRepoUrl(credentials.GITHUB_USERNAME, credentials.GITHUB_PASSWORD)
    );

    git.config("user.email", "songbook-contributor@a.com");
    git.config("user.name", "Songbook-contributor");
  } else {
    git.checkoutExistingBranch("main");
    git.hardReset("main");
    git.pullRebase();
  }
}

function validate(requestBody) {
  if (requestBody.title == null || requestBody.title == "") {
    throw new Error("Missing title");
  }
  if (requestBody.lines == null || requestBody.lines.length <= 0) {
    throw new Error("Missing lines");
  }
}

function createFileContent(requestBody) {
  const content = {
    title: requestBody.title,
    author: requestBody.author,
    lines: requestBody.lines.map((line) => ({
      br: line.br,
      en: line.en,
      bold: line.bold? true : undefined,
    })),
  };
  return formatFileContent(content);
}

function formatFileContent(objectContent){
  let formatted = JSON.stringify(objectContent, null, 2)
  formatted = formatted.replace(/{(\s*)"title"/, `{ "title"`)
  formatted = formatted.replaceAll(/{\s*"br"/g, `{ "br"`)
  formatted = formatted.replaceAll(/,\s*"en"/g, `, "en"`)
  formatted = formatted.replaceAll(/"en": *"(.*)"\s*}/g, `"en": "$1" }`)
  formatted = formatted.replaceAll(/,\s*"bold"/g, `, "bold"`)
  formatted = formatted.replaceAll(/"bold": *(.*)\s*}/g, `"bold": $1 }`)
  return formatted;
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

async function fileOrDirExist(fs, path) {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
}
