import fs from "fs/promises";
import { encryptText } from "../lambdas/lib/encryptDecrypt.js";

const API_URL = "https://huhwadu4w4.execute-api.eu-west-2.amazonaws.com";
const ENDPOINT = "song";

describe("POST /song", () => {
  const endpoint_url = `${API_URL}/${ENDPOINT}`;

  it("returns the correct data", async () => {
    const publicKey = await fs.readFile("./.credentials/public_key.txt");
    const requestBody = JSON.stringify({
      dryRun: true,
      testText: "Some test data",
    });
    const encryptedBody = encryptText(publicKey, requestBody);

    const response = await fetch(endpoint_url, {
      method: "POST",
      body: encryptedBody,
    });

    const respData = await response.text();
    const respStatus = response.status;

    expect(respStatus).toBe(200);
    expect(JSON.parse(respData)).toMatchObject({ testText: "Some test data" });
  }, 40000);
});
