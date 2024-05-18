import { spawnSync } from "child_process";
import fs from "fs/promises";
// const { Octokit } = require("octokit");
import { decryptText } from "./lib/encryptDecrypt.js";
import { GitClient, executeGitCommand } from "./lib/git-client.js";

const CREDENTAIL_FILE = "/tmp/.my-credentials";
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_PASSWORD = process.env.GITHUB_PASSWORD;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const REPO_NAME = "CapoeiraSongbook";
const REPO_URL = "https://github.com/CortinaCapoeira/CapoeiraSongbook.git";
const AUTH_REPO_URL = `https://${GITHUB_USERNAME}:${GITHUB_PASSWORD}@github.com/CortinaCapoeira/CapoeiraSongbook.git`;

export const handler = async (event) => {
  // TODO if(`/tmp/${REPO_NAME}` exists){ git checkout main && git pull}

  const requestBody = decryptText(PRIVATE_KEY, event.body);

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

  await fs.writeFile(CREDENTAIL_FILE, AUTH_REPO_URL);

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

  const push = spawnSync(
    "git",
    ["push", "--set-upstream", "origin", branchName],
    {
      cwd: `/tmp/${REPO_NAME}`,
    }
  );
  console.log("PUSH:" + push.output.toString());

  const files = await fs.readdir(`/tmp/${REPO_NAME}`);

  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: { "content-type": "text/plain" },
    body: requestBody,
  };
};
