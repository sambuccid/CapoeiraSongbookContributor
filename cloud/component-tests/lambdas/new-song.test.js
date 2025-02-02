import { jest } from "@jest/globals";
import crypto from "crypto";
import { decryptText } from "../../lambdas/lib/encryptDecrypt.js";
import { actualHandler as lambda } from "../../lambdas/new-song.js";

function simulateEncrypt(text) {
  return Buffer.from(text).toString("base64");
}
function createEncryptedEvent(body) {
  let processedBody = body ?? {};
  processedBody = JSON.stringify(processedBody);
  processedBody = simulateEncrypt(processedBody);
  return {
    body: processedBody,
  };
}
function createUnencryptedEvent(body) {
  let processedBody = body ?? {};
  processedBody = JSON.stringify(processedBody);
  return {
    body: processedBody,
  };
}

describe("new-song", () => {
  const octokitSpy = { request: jest.fn() };
  const spawnSyncSpy = jest.fn();
  const fsSpy = {
    writeFile: jest.fn(),
    stat: jest.fn(),
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
    lines: [{ br: "A", en: "A" }],
  };
  const execLambda = async (event, envVars, dependencies) => {
    if (!event) event = createEncryptedEvent();
    envVars = { ...testEnvVars, ...envVars };
    dependencies = { ...testDependencies, ...dependencies };
    return await lambda(event, envVars, dependencies);
  };
  const execLambdaWithBody = async (body, envVars, dependencies) =>
    execLambda(createEncryptedEvent(body), envVars, dependencies);

  const execLambdaWithDefaultSong = async (envVars, dependencies) =>
    execLambda(createEncryptedEvent(defaultTestSong), envVars, dependencies);

  let privateDecryptSpy;
  beforeEach(() => {
    privateDecryptSpy = jest
      .spyOn(crypto, "privateDecrypt")
      .mockImplementation((key, buffer) => buffer);
    spawnSyncSpy.mockReturnValue({ output: "" });
    fsSpy.stat.mockRejectedValue("Error");
  });

  describe("validation", () => {
    it("errors if the song has an empty title", async () => {
      const execution = execLambdaWithBody({
        ...defaultTestSong,
        title: "",
      });

      await expect(execution).rejects.toThrow("Missing title");
    });

    it("errors if the song has no lines", async () => {
      const execution = execLambdaWithBody({
        ...defaultTestSong,
        lines: [],
      });

      await expect(execution).rejects.toThrow("Missing lines");
    });
  });

  describe("creation of new song file", () => {
    it("creates new file for the song in the songs folder", async () => {
      await execLambdaWithBody({
        ...defaultTestSong,
        title: "Test Song 1",
      });

      expect(fsSpy.writeFile).toHaveBeenCalledWith(
        "/tmp/CapoeiraSongbook/_data/songs/test-song-1.json",
        expect.anything(),
        { flag: "wx" }
      );
    });
    it("adds a new file to git stage", async () => {
      await execLambdaWithBody({
        ...defaultTestSong,
        title: "A new Test song",
      });

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["add", "_data/songs/a-new-test-song.json"],
        spawnSyncInRepoDirectory
      );
    });
    it("populates the file correctly with formatted json", async () => {
      await execLambdaWithBody({
        title: "A new Test song",
        lines: [
          { br: "Test line 1 in brazilian", en: "Test line 1 in english" },
          { br: "Test line 2 in brazilian", en: "Test line 2 in english" },
          { br: "", en: "" },
          { br: "Bold line br", en: "Bold line en", bold: true },
        ],
        author: "Test author"
      });

      expect(fsSpy.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        `{ "title": "A new Test song",
  "author": "Test author",
  "lines": [
    { "br": "Test line 1 in brazilian", "en": "Test line 1 in english" },
    { "br": "Test line 2 in brazilian", "en": "Test line 2 in english" },
    { "br": "", "en": "" },
    { "br": "Bold line br", "en": "Bold line en", "bold": true }
  ]
}`,
        expect.anything()
      );
    });
    it("populates the file correctly with author", async () => {
      await execLambdaWithBody({
        title: "A new Test song",
        lines: [
          { br: "Test line 1 in brazilian", en: "Test line 1 in english" },
          { br: "Test line 2 in brazilian", en: "Test line 2 in english" },
          { br: "", en: "" },
          { br: "Bold line br", en: "Bold line en", bold: true },
        ],
        author: "Test author"
      });

      expect(fsSpy.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/"author": *"Test author"/),
        expect.anything()
      );
    });
    it("appends suffix to title if file with same name exists", async () => {
      fsSpy.writeFile.mockImplementation((fileName) => {
        if (fileName.includes("song-with-test.json"))
          return Promise.reject(new Error("File already exists"));
      });

      await execLambdaWithBody({
        ...defaultTestSong,
        title: "song with test",
      });

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
    describe("when the repository is already checked out", () => {
      beforeEach(() => {
        fsSpy.stat.mockResolvedValue();
      });
      it("does not clone the repository again", async () => {
        await execLambdaWithDefaultSong();

        expect(spawnSyncSpy).not.toHaveBeenCalledWith(
          "git",
          ["clone", expect.anything()],
          spawnSyncInTmpDirectory
        );
      });
      it("does not create credential file again", async () => {
        await execLambdaWithDefaultSong();

        expect(fsSpy.writeFile).not.toHaveBeenCalledWith(
          credentialFileName,
          expect.anything()
        );
      });
      it("does not set any config again", async () => {
        await execLambdaWithDefaultSong();

        expect(spawnSyncSpy).not.toHaveBeenCalledWith(
          "git",
          ["config", expect.anything(), expect.anything()],
          spawnSyncInRepoDirectory
        );
      });
      it("makes git point to main branch", async () => {
        await execLambdaWithDefaultSong();

        expect(spawnSyncSpy).toHaveBeenCalledWith(
          "git",
          ["checkout", "main"],
          spawnSyncInRepoDirectory
        );
      });
      it("completely resets git branch to remove any local changes", async () => {
        await execLambdaWithDefaultSong();

        expect(spawnSyncSpy).toHaveBeenCalledWith(
          "git",
          ["reset", "--hard", "main"],
          spawnSyncInRepoDirectory
        );
      });
      it("pulls the latest changes from main", async () => {
        await execLambdaWithDefaultSong();

        expect(spawnSyncSpy).toHaveBeenCalledWith(
          "git",
          ["pull", "-r"],
          spawnSyncInRepoDirectory
        );
      });
    });
  });

  describe("cryptography", () => {
    it("decrypts the data in input", async () => {
      const event = createEncryptedEvent({
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
    it("supports multiple chunks of encrypted data", async () => {
      // Simulating what android application does for long data
      const json = `{"lines":[{}],"title":"12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"}`;
      const chunks = [json.slice(0, 150), json.slice(150)];
      const finalBody = chunks.map(simulateEncrypt).join("|");
      const event = {
        body: finalBody,
      };

      const envVars = {
        PRIVATE_KEY: "test-private-key",
      };

      await execLambda(event, envVars);

      expect(privateDecryptSpy).toHaveBeenCalledTimes(2);
      expect(privateDecryptSpy).toHaveBeenCalledWith(
        {
          key: "test-private-key",
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        Buffer.from(chunks[0])
      );
      expect(privateDecryptSpy).toHaveBeenCalledWith(
        {
          key: "test-private-key",
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        Buffer.from(chunks[1])
      );
    });
    it("does not decrypt data in input if it's disabled", async ()=>{
      const event = createUnencryptedEvent({
        ...defaultTestSong,
        prop: "Unencrypted test",
      });

      const envVars = {
        DISABLE_ENCRYPTION: "true"
      };

      await execLambda(event, envVars);

      expect(privateDecryptSpy).not.toHaveBeenCalled()
    })
  });

  describe("Response", () => {
    it("returns no data", async () => {
      const returnValues = await execLambdaWithDefaultSong();
      expect(returnValues).toMatchObject({
        isBase64Encoded: false,
        statusCode: 200,
        headers: { "content-type": "text/plain" },
        body: "",
      });
    });
    it("returns content of file when runs with dryRun option", async () => {
      const returnValues = await execLambdaWithBody({
        dryRun: true,
        ...defaultTestSong,
        title: "song with a test title",
        lines: [{ br: "line1br", en: "line1en" }],
      });

      expect(returnValues).toMatchObject({
        isBase64Encoded: false,
        statusCode: 200,
        headers: { "content-type": "text/plain" }
      });
      expect(JSON.parse(returnValues.body)).toMatchObject({
        ...defaultTestSong,
        title: "song with a test title",
        lines: [{ br: "line1br", en: "line1en" }],
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
