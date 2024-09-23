import {
  decryptText,
  encryptText,
  splitInChunks,
} from "../../../lambdas/lib/encryptDecrypt.js";
import fs from "fs/promises";

describe("encryptDecrypt", () => {
  it("the encrypt and decript functions can work together", async () => {
    const privateKey = await fs.readFile("./.credentials/private_key.txt");
    const publicKey = await fs.readFile("./.credentials/public_key.txt");

    const text = `{"title":"abc"}`;

    const encrypted = encryptText(publicKey, text);
    const decrypted = decryptText(privateKey, encrypted);
    expect(decrypted).toBe(text);
  });
  it("supports long text", async () => {
    const privateKey = await fs.readFile("./.credentials/private_key.txt");
    const publicKey = await fs.readFile("./.credentials/public_key.txt");

    const text = `{"title":"abc 1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"}`;

    const encrypted = encryptText(publicKey, text);
    const decrypted = decryptText(privateKey, encrypted);
    expect(decrypted).toBe(text);
  });
  describe("splitInChunks", () => {
    it("doesnt split a text that is less than 150 characters", () => {
      const text = "abc";
      const res = splitInChunks(text);
      expect(res).toEqual(["abc"]);
    });
    it("splits a text that is more than 150 characters", () => {
      const tenChars = "1234567890";
      let text = "";
      for (var i = 0; i < 40; i++) {
        text += tenChars;
      }
      const res = splitInChunks(text);
      expect(res.length).toBe(3);
      // All groups starts with 1
      expect(res[0][0]).toBe("1");
      expect(res[1][0]).toBe("1");
      expect(res[2][0]).toBe("1");
      // All groups end with 0
      expect(res[0].slice(-1)).toBe("0");
      expect(res[1].slice(-1)).toBe("0");
      expect(res[2].slice(-1)).toBe("0");
      // The groups have the right length
      expect(res[0].length).toBe(150);
      expect(res[1].length).toBe(150);
      expect(res[2].length).toBe(100);
    });
  });
});
