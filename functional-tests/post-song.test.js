import fs from "fs/promises";
import { Octokit } from "octokit";
import { encryptText } from "../lambdas/lib/encryptDecrypt.js";

const API_URL = "https://huhwadu4w4.execute-api.eu-west-2.amazonaws.com";
const ENDPOINT = "song";

const publicKey = await fs.readFile("./.credentials/public_key.txt");
const githubPassword = (
  await fs.readFile("./.credentials/github_personal_access_token.txt")
).toString();

const octokit = new Octokit({
  auth: githubPassword,
});

describe("POST /song", () => {
  const endpoint_url = `${API_URL}/${ENDPOINT}`;

  // TODO something for clean up? maybe based on branch and pr name? (that could contain name of song sent in tests)

  async function callLambdaWith(data) {
    const requestBody = JSON.stringify(data);
    const encryptedBody = encryptText(publicKey, requestBody);

    const response = await fetch(endpoint_url, {
      method: "POST",
      body: encryptedBody,
    });

    return response;
  }

  it("returns the correct data", async () => {
    const response = await callLambdaWith({
      dryRun: true,
      title: "Test title",
      lines: [{ br: "test", en: "test", bold: true }],
      testText: "Some test data",
    });

    const respData = await response.text();
    const respStatus = response.status;

    expect(respStatus).toBe(200);
    expect(JSON.parse(respData)).toMatchObject({ testText: "Some test data" });
  }, 40000);

  it.skip("creates a new branch", async () => {
    const { data: branchesBefore } = await octokit.request(
      "GET /repos/{owner}/{repo}/branches",
      {
        owner: "CortinaCapoeira",
        repo: "CapoeiraSongbook",
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    const response = await callLambdaWith({
      title: "A test title",
      lines: [{ br: "Brazilian line", en: "English line" }],
    });

    expect(response.status).toBe(200);

    const { data: branchesAfter } = await octokit.request(
      "GET /repos/{owner}/{repo}/branches",
      {
        owner: "CortinaCapoeira",
        repo: "CapoeiraSongbook",
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    expect(branchesBefore.length + 1).toBe(branchesAfter.length);
  }, 45000);

  it.skip("creates a new PR", async () => {
    const { data: PRBefore } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls",
      {
        owner: "CortinaCapoeira",
        repo: "CapoeiraSongbook",
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    const response = await callLambdaWith({
      title: "Another test title",
      lines: [
        {
          br: "Another brazilian line",
          en: "Another english line",
        },
      ],
    });

    expect(response.status).toBe(200);

    const { data: PRAfter } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls",
      {
        owner: "CortinaCapoeira",
        repo: "CapoeiraSongbook",
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    expect(PRBefore.length + 1).toBe(PRAfter.length);
  }, 45000);
});
