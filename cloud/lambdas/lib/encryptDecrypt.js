import crypto from "crypto";

const MAX_CHUNK_SIZE = 150;
const SEPARATOR = "|";
export function encryptText(publicKey, plainText) {
  const chunks = splitInChunks(plainText);
  const finalEncrypted = chunks
    .map((chunk) => simpleEncryption(publicKey, chunk))
    .join(SEPARATOR);
  return finalEncrypted;
}

function simpleEncryption(publicKey, plainText) {
  return crypto
    .publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(plainText)
    )
    .toString("base64");
}

export function decryptText(privateKey, encryptedText) {
  const chunks = encryptedText.split(SEPARATOR);
  const decrypted = chunks
    .map((chunk) => simpleDecryption(privateKey, chunk))
    .join("");
  return decrypted;
}

function simpleDecryption(privateKey, encryptedText) {
  const r = crypto
    .privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(encryptedText, "base64")
    )
    .toString();
  return r;
}

export function splitInChunks(text) {
  const numberOfChunks = Math.ceil(text.length / MAX_CHUNK_SIZE);
  const chunks = [];
  for (let i = 0; i < numberOfChunks; i++) {
    chunks.push(text.slice(i * MAX_CHUNK_SIZE, (i + 1) * MAX_CHUNK_SIZE));
  }
  return chunks;
}
