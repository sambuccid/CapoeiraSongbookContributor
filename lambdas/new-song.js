import { spawnSync } from "child_process";
import fs from "fs/promises";
import { Octokit } from "octokit";
import { decryptText } from "./lib/encryptDecrypt.js";
import { GitClient, executeGitCommand } from "./lib/git-client.js";

const CREDENTAIL_FILE = "/tmp/.my-credentials";
const REPO_NAME = "CapoeiraSongbook";
const REPO_URL = "https://github.com/CortinaCapoeira/CapoeiraSongbook.git";
const getAuthRepoUrl = (username, password) =>
  `https://${username}:${password}@github.com/CortinaCapoeira/CapoeiraSongbook.git`;

const octokit = new Octokit({
  auth: process.env.GITHUB_PASSWORD,
});

const ENV_VARS = {
  GITHUB_USERNAME: process.env.GITHUB_USERNAME,
  GITHUB_PASSWORD: process.env.GITHUB_PASSWORD,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
};

const DEPENDENCIES = {
  octokit,
  spawnSync,
  fs,
  decryptText,
};

export const handler = (event) => actualHandler(event, ENV_VARS, DEPENDENCIES);

export const actualHandler = async (event, envVars, dependencies) => {
  const { GITHUB_USERNAME, GITHUB_PASSWORD, PRIVATE_KEY } = envVars;
  const { octokit, spawnSync, fs, decryptText } = dependencies;

  const decryptedRequest = decryptText(PRIVATE_KEY, event.body);
  const requestBody = JSON.parse(decryptedRequest);

  // TODO if(`/tmp/${REPO_NAME}` exists){ git checkout main && git pull}

  const aRepo = await octokit.request("GET /repos/{owner}/{repo}", {
    owner: "sambuccid",
    repo: "hulipaa",
    headers: {
      "x-github-api-version": "2022-11-28",
    },
  });
  console.log(aRepo);

  const aCommit = await octokit.request(
    "GET /repos/{owner}/{repo}/commits/{ref}/status",
    {
      owner: "sambuccid",
      repo: "CapoeiraSongbookContributor",
      ref: "501517fd54115faf256ca123ea77f47ca90758f4",
      headers: {
        "x-github-api-version": "2022-11-28",
      },
    }
  );
  console.log(aCommit);

  const clone = spawnSync("git", ["clone", REPO_URL], {
    cwd: "/tmp",
  });
  console.log("CLONE:" + clone.output.toString());

  const confStore = spawnSync(
    "git",
    ["config", "credential.helper", `store --file ${CREDENTAIL_FILE}`],
    {
      cwd: `/tmp/${REPO_NAME}`,
    }
  );
  console.log("confStore:" + confStore.output.toString());

  await fs.writeFile(
    CREDENTAIL_FILE,
    getAuthRepoUrl(GITHUB_USERNAME, GITHUB_PASSWORD)
  );

  const configEmail = spawnSync(
    "git",
    ["config", "user.email", "songbook-contributor@a.com"],
    {
      cwd: `/tmp/${REPO_NAME}`,
    }
  );
  console.log("CONFIG EMAIL:" + configEmail.output.toString());

  const configName = spawnSync(
    "git",
    ["config", "user.name", "Songbook-contributor"],
    {
      cwd: `/tmp/${REPO_NAME}`,
    }
  );
  console.log("CONFIG NAME:" + configName.output.toString());

  const randomN = Math.floor(Math.random() * 1000); // TODO more random, otherwise small chance that just fails
  const branchName = `test-${randomN}`;
  const checkoutBranch = spawnSync("git", ["checkout", "-b", branchName], {
    cwd: `/tmp/${REPO_NAME}`,
  });
  console.log("CHECKOUT:" + checkoutBranch.output.toString());

  await fs.writeFile(
    `/tmp/${REPO_NAME}/abcd-test-file.txt`,
    "a test of writing a file"
  );

  const add = spawnSync("git", ["add", "abcd-test-file.txt"], {
    cwd: `/tmp/${REPO_NAME}`,
  });
  console.log("ADD:" + add.output.toString());

  const commit = spawnSync("git", ["commit", "-m", '"Add test file"'], {
    cwd: `/tmp/${REPO_NAME}`,
  });
  console.log("COMMIT:" + commit.output.toString());

  if (!requestBody.dryRun) {
    const push = spawnSync(
      "git",
      ["push", "--set-upstream", "origin", branchName],
      {
        cwd: `/tmp/${REPO_NAME}`,
      }
    );
    console.log("PUSH:" + push.output.toString());
  }
  const files = await fs.readdir(`/tmp/${REPO_NAME}`);

  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: { "content-type": "text/plain" },
    body: JSON.stringify(requestBody),
  };
};
