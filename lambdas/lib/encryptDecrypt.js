const crypto = require("crypto");

function encryptText(publicKey, plainText) {
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

function decryptText(privateKey, encryptedText) {
  return crypto
    .privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(encryptedText, "base64")
    )
    .toString();
}

module.exports = {
  encryptText,
  decryptText,
};
