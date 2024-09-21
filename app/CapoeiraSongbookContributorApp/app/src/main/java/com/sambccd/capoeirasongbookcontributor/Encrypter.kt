package com.sambccd.capoeirasongbookcontributor;

import android.util.Base64
import java.security.KeyFactory
import java.security.MessageDigest
import java.security.PrivateKey
import java.security.PublicKey
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher

class Encrypter(private val publicKey: String, private val strippedPrivateKey: String? = null) {
    fun encrypt(requestData: String): String {
        val usablePublicKey = stripPublicKey(this.publicKey)
        val encrypted = encryptData(requestData, usablePublicKey)
        return removeNewLines(encrypted)
    }

    private fun encryptData(txt: String, pk: String): String {
        val publicBytes: ByteArray = Base64.decode(pk, Base64.DEFAULT)
        val keySpec = X509EncodedKeySpec(publicBytes)
        val keyFactory: KeyFactory = KeyFactory.getInstance("RSA")
        val pubKey: PublicKey = keyFactory.generatePublic(keySpec)
        val cipher: Cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding")
        cipher.init(Cipher.ENCRYPT_MODE, pubKey)
        val encrypted = cipher.doFinal(txt.toByteArray())
        val encoded = Base64.encodeToString(encrypted, Base64.DEFAULT)
        return encoded
    }

    fun decrypt(data: String): String {
        if(this.strippedPrivateKey == null) throw Exception("Need to pass private key to decrypt")

        return decryptData(data, this.strippedPrivateKey)
    }

    private fun decryptData(txtBase64: String, pk: String): String {
        val privateBytes: ByteArray = Base64.decode(pk, Base64.DEFAULT)
        val keySpec = PKCS8EncodedKeySpec(privateBytes)
        val keyFactory: KeyFactory = KeyFactory.getInstance("RSA")
        val privKey: PrivateKey = keyFactory.generatePrivate(keySpec)

        val txtNormal = Base64.decode(txtBase64, Base64.DEFAULT)

        val cipher: Cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding")
        cipher.init(Cipher.DECRYPT_MODE, privKey)
        val decrypted = cipher.doFinal(txtNormal)
        val decryptedString = String(decrypted)
        return decryptedString
    }

    fun old_encrypt(requestData: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val input = requestData.toByteArray()
        val encryptedBytes = md.digest(input)
        val encoded = String(Base64.encode(encryptedBytes, Base64.DEFAULT))
        return encoded
    }

    private fun stripPublicKey(publicKey: String): String{
        return removeNewLines(publicKey)
            .replace("-----BEGIN PUBLIC KEY-----", "")
            .replace("-----END PUBLIC KEY-----", "")
    }

    private fun removeNewLines(s: String): String{
        return s.replace("\\r".toRegex(), "")
            .replace("\\n".toRegex(), "")
            .replace(System.lineSeparator().toRegex(), "")
    }
}
