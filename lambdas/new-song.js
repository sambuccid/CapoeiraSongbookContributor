const { spawnSync } = require("child_process");
const fs = require("fs/promises");
const { GitClient, executeGitCommand } = require("./git-client");

const REPO_NAME = "CapoeiraSongbook";
const REPO_URL = "https://github.com/CortinaCapoeira/CapoeiraSongbook.git";

// TODO convert to ES module, easier to organise things
exports.handler = async (event) => {
  // TODO if(`/tmp/${REPO_NAME}` exists){ git checkout main && git pull}
  const clone = spawnSync("git", ["clone", REPO_URL], {
    cwd: "/tmp",
  });
  console.log("CLONE:" + clone.output.toString());

  // executeGitCommand("/tmp", "clone", REPO_URL);
  // const git = new GitClient("/tmp", REPO_NAME);

  // TODO maybe try and change with a made up email and check if it's possible
  const configEmail = spawnSync(
    "git",
    ["config", "user.email", "sambuccid@gmail.com"],
    {
      cwd: `/tmp/${REPO_NAME}`,
    }
  );
  console.log("CONFIG EMAIL:" + configEmail.output.toString());

  // TODO maybe try and change with a made up name and check if it's possible
  const configName = spawnSync("git", ["config", "user.name", "sambuccid"], {
    cwd: `/tmp/${REPO_NAME}`,
  });
  console.log("CONFIG NAME:" + configName.output.toString());

  const randomN = Math.random() * 1000;
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
    body: JSON.stringify(files),
  };
};
