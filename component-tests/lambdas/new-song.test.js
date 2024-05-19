import { jest } from "@jest/globals";
import crypto from "crypto";
import { decryptText } from "../../lambdas/lib/encryptDecrypt.js";
import { actualHandler as lambda } from "../../lambdas/new-song.js";

function createEvent() {
  return {
    body: "",
  };
}

describe("new-song", () => {
  const octokitSpy = { request: jest.fn() };
  const spawnSyncSpy = jest.fn();
  const fsSpy = {
    writeFile: jest.fn(),
    readdir: jest.fn(),
  };
  const dependencies = {
    octokit: octokitSpy,
    spawnSync: spawnSyncSpy,
    fs: fsSpy,
    decryptText, // Passing actual module
  };
  const envVars = {};

  beforeEach(() => {
    const privateDescriptSpy = jest
      .spyOn(crypto, "privateDecrypt")
      .mockReturnValue("");
    spawnSyncSpy.mockReturnValue({ output: "" });
  });

  describe("usage of git", () => {
    it("clones the CapoeiraSongbook repository", async () => {
      const event = createEvent();

      await lambda(event, envVars, dependencies);

      expect(spawnSyncSpy).toHaveBeenCalledWith(
        "git",
        ["clone", "https://github.com/CortinaCapoeira/CapoeiraSongbook.git"],
        {
          cwd: "/tmp",
        }
      );
    });
  });
});
