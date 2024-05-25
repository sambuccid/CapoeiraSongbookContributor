import { jest } from "@jest/globals";
import crypto from "crypto";
import { decryptText } from "../../lambdas/lib/encryptDecrypt.js";
import { actualHandler as lambda } from "../../lambdas/new-song.js";

function createEvent(body) {
  return {
    body: body ?? "",
  };
}

describe("new-song", () => {
  const octokitSpy = { request: jest.fn() };
  const spawnSyncSpy = jest.fn();
  const fsSpy = {
    writeFile: jest.fn(),
    readdir: jest.fn(),
  };
  const testDependencies = {
    octokit: octokitSpy,
    spawnSync: spawnSyncSpy,
    fs: fsSpy,
    decryptText, // Passing actual module
  };
  const testEnvVars = {};
  const execLambda = async (event, envVars, dependencies) => {
    if (!event) event = createEvent();
    envVars = { ...testEnvVars, ...envVars };
    dependencies = { ...testDependencies, ...dependencies };
    return await lambda(event, envVars, dependencies);
  };

  let privateDecryptSpy;
  beforeEach(() => {
    privateDecryptSpy = jest
      .spyOn(crypto, "privateDecrypt")
      .mockReturnValue("");
    spawnSyncSpy.mockReturnValue({ output: "" });
  });

  describe("usage of git", () => {
    const credentialFileName = "/tmp/.my-credentials";
    const spawnSyncInTmpDirectory = {
      cwd: "/tmp",
    };
    const spawnSyncInRepoDirectory = {
      cwd: "/tmp/CapoeiraSongbook",
    };
    it("clones the CapoeiraSongbook repository", async () => {
      await execLambda();

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["clone", "https://github.com/CortinaCapoeira/CapoeiraSongbook.git"],
        spawnSyncInTmpDirectory
      );
    });
    it("configures git credential file", async () => {
      await execLambda();

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["config", "credential.helper", `store --file ${credentialFileName}`],
        spawnSyncInRepoDirectory
      );
    });
    it("creates the credential file with the credentials", async () => {
      const envVars = {
        ...testEnvVars,
        GITHUB_USERNAME: "test-username",
        GITHUB_PASSWORD: "test-password",
      };

      await execLambda(undefined, envVars);

      expect(fsSpy.writeFile).toHaveBeenCalledWith(
        credentialFileName,
        "https://test-username:test-password@github.com/CortinaCapoeira/CapoeiraSongbook.git"
      );
    });
    it("configures git name and email", async () => {
      await execLambda();

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["config", "user.email", "songbook-contributor@a.com"],
        spawnSyncInRepoDirectory
      );

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["config", "user.name", "Songbook-contributor"],
        spawnSyncInRepoDirectory
      );
    });
    it("creates new git branch with random name", async () => {
      await execLambda();

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["checkout", "-b", expect.stringMatching(/^test-\d{1,4}$/)],
        spawnSyncInRepoDirectory
      );
    });
    it("creates new file", async () => {
      await execLambda();

      expect(fsSpy.writeFile).toHaveBeenCalledWith(
        "/tmp/CapoeiraSongbook/abcd-test-file.txt",
        "a test of writing a file"
      );
    });
    it("adds a new file to git stage", async () => {
      await execLambda();

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["add", "abcd-test-file.txt"],
        spawnSyncInRepoDirectory
      );
    });
    it("commits git changes", async () => {
      await execLambda();

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["commit", "-m", '"Add test file"'],
        spawnSyncInRepoDirectory
      );
    });
    it("pushes git changes to the branch with a random name", async () => {
      await execLambda();

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        [
          "push",
          "--set-upstream",
          "origin",
          expect.stringMatching(/^test-\d{1,4}$/),
        ],
        spawnSyncInRepoDirectory
      );
    });
  });

  describe("cryptography", () => {
    it("decrypts the data in input", async () => {
      const event = createEvent("Encrypted test");

      const envVars = {
        PRIVATE_KEY: "test-private-key",
      };

      await execLambda(event, envVars);

      expect(privateDecryptSpy).toHaveBeenCalledWith(
        {
          key: "test-private-key",
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        Buffer.from("Encrypted test", "base64")
      );
    });
  });

  describe("Response", () => {
    it("Returns correct data", async () => {
      privateDecryptSpy.mockReturnValue("Test decrypted text");

      const returnValues = await execLambda();

      expect(returnValues).toMatchObject({
        isBase64Encoded: false,
        statusCode: 200,
        headers: { "content-type": "text/plain" },
        body: "Test decrypted text",
      });
    });
  });

  describe("Usage of Github API", () => {
    it("gets the status of a commit in a private repo", async () => {
      await execLambda();

      expect(octokitSpy.request).toHaveBeenCalledWith(
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
    });
  });
});
