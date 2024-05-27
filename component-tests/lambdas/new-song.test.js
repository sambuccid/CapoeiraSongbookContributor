import { jest } from "@jest/globals";
import crypto from "crypto";
import { decryptText } from "../../lambdas/lib/encryptDecrypt.js";
import { actualHandler as lambda } from "../../lambdas/new-song.js";

function simulateEncrypt(text) {
  return Buffer.from(text).toString("base64");
}
function createEvent(body) {
  let processedBody = body ?? {};
  processedBody = JSON.stringify(processedBody);
  processedBody = simulateEncrypt(processedBody);
  return {
    body: processedBody,
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
  const spawnSyncInTmpDirectory = {
    cwd: "/tmp",
  };
  const spawnSyncInRepoDirectory = {
    cwd: "/tmp/CapoeiraSongbook",
  };
  const defaultTestSong = {
    title: "a test song",
  };
  const execLambda = async (event, envVars, dependencies) => {
    if (!event) event = createEvent();
    envVars = { ...testEnvVars, ...envVars };
    dependencies = { ...testDependencies, ...dependencies };
    return await lambda(event, envVars, dependencies);
  };
  const execLambdaWithBody = async (body, envVars, dependencies) =>
    execLambda(createEvent(body), envVars, dependencies);

  const execLambdaWithDefaultSong = async (envVars, dependencies) =>
    execLambda(createEvent(defaultTestSong), envVars, dependencies);

  let privateDecryptSpy;
  beforeEach(() => {
    privateDecryptSpy = jest
      .spyOn(crypto, "privateDecrypt")
      .mockImplementation((key, buffer) => buffer);
    spawnSyncSpy.mockReturnValue({ output: "" });
  });

  describe("creation of new song file", () => {
    it("creates new file for the song in the songs folder", async () => {
      await execLambdaWithBody({ title: "Test Song 1" });

      expect(fsSpy.writeFile).toHaveBeenCalledWith(
        "/tmp/CapoeiraSongbook/_data/songs/test-song-1.json",
        expect.anything(),
        { flag: "wx" }
      );
    });
    it("adds a new file to git stage", async () => {
      await execLambdaWithBody({ title: "A new Test song" });

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["add", "_data/songs/a-new-test-song.json"],
        spawnSyncInRepoDirectory
      );
    });
    it("populates the file correctly", async () => {
      await execLambdaWithBody({ title: "A new Test song" });

      expect(fsSpy.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        JSON.stringify({ title: "A new Test song" }),
        expect.anything()
      );
    });
    it("appends suffix to title if file with same name exists", async () => {
      fsSpy.writeFile.mockImplementation((fileName) => {
        if (fileName.includes("song-with-test.json"))
          return Promise.reject(new Error("File already exists"));
      });

      await execLambdaWithBody({ title: "song with test" });

      expect(fsSpy.writeFile).toHaveBeenCalledWith(
        "/tmp/CapoeiraSongbook/_data/songs/song-with-test-1.json",
        expect.anything(),
        { flag: "wx" }
      );
      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["add", "_data/songs/song-with-test-1.json"],
        spawnSyncInRepoDirectory
      );
    });
  });

  describe("usage of git", () => {
    const credentialFileName = "/tmp/.my-credentials";
    it("clones the CapoeiraSongbook repository", async () => {
      await execLambdaWithDefaultSong();

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["clone", "https://github.com/CortinaCapoeira/CapoeiraSongbook.git"],
        spawnSyncInTmpDirectory
      );
    });
    it("configures git credential file", async () => {
      await execLambdaWithDefaultSong();

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

      await execLambdaWithDefaultSong(envVars);

      expect(fsSpy.writeFile).toHaveBeenCalledWith(
        credentialFileName,
        "https://test-username:test-password@github.com/CortinaCapoeira/CapoeiraSongbook.git"
      );
    });
    it("configures git name and email", async () => {
      await execLambdaWithDefaultSong();

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
      await execLambdaWithDefaultSong();

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        [
          "checkout",
          "-b",
          expect.stringMatching(/^songbook-new-song-contribution-\d{1,7}$/),
        ],
        spawnSyncInRepoDirectory
      );
    });
    it("commits git changes", async () => {
      await execLambdaWithBody({
        ...defaultTestSong,
        title: "Test title",
      });

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["commit", "-m", '"Add new song: Test title"'],
        spawnSyncInRepoDirectory
      );
    });
    it("pushes git changes to the branch with a random name", async () => {
      await execLambdaWithDefaultSong();

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        [
          "push",
          "--set-upstream",
          "origin",
          expect.stringMatching(/^songbook-new-song-contribution-\d{1,7}$/),
        ],
        spawnSyncInRepoDirectory
      );
    });
    it("doesn't push git branch when is executed as dryRun", async () => {
      await execLambdaWithBody({
        ...defaultTestSong,
        dryRun: true,
      });

      expect(spawnSyncSpy).not.toHaveBeenCalledWith(
        "git",
        ["push", expect.anything(), expect.anything(), expect.anything()],
        expect.anything()
      );
    });
  });

  describe("cryptography", () => {
    it("decrypts the data in input", async () => {
      const event = createEvent({
        ...defaultTestSong,
        prop: "Encrypted test",
      });

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
        Buffer.from(
          JSON.stringify({
            ...defaultTestSong,
            prop: "Encrypted test",
          })
        )
      );
    });
  });

  describe("Response", () => {
    it("Returns correct data", async () => {
      privateDecryptSpy.mockReturnValue(
        JSON.stringify({
          ...defaultTestSong,
          testText: "Test decrypted text",
        })
      );

      const returnValues = await execLambdaWithDefaultSong();

      expect(returnValues).toMatchObject({
        isBase64Encoded: false,
        statusCode: 200,
        headers: { "content-type": "text/plain" },
        body: JSON.stringify({
          ...defaultTestSong,
          testText: "Test decrypted text",
        }),
      });
    });
  });

  describe("Usage of Github API", () => {
    it("creates a pull request", async () => {
      await execLambdaWithBody({
        ...defaultTestSong,
        title: "The amazing test",
      });

      expect(octokitSpy.request).toHaveBeenCalledWith(
        "POST /repos/{owner}/{repo}/pulls",
        {
          owner: "CortinaCapoeira",
          repo: "CapoeiraSongbook",
          title: "Add The amazing test song",
          body: "New song contributed via the app: The amazing test",
          head: expect.stringMatching(
            /^songbook-new-song-contribution-\d{1,7}$/
          ),
          base: "main",
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );
    });
    it("doesn't create a pull request if executed with dryRun", async () => {
      await execLambdaWithBody({
        ...defaultTestSong,
        dryRun: true,
      });

      expect(octokitSpy.request).not.toHaveBeenCalledWith(
        "POST /repos/{owner}/{repo}/pulls",
        expect.anything()
      );
    });
  });
});
