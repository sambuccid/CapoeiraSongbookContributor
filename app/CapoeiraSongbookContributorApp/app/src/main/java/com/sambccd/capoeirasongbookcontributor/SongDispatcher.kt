package com.sambccd.capoeirasongbookcontributor

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import android.util.Base64


class SongDispatcher(private val connectionTimeout: Int, private val encrypter: Encrypter = Encrypter(BuildConfig.API_PUBLIC_KEY)) {
    suspend fun send(song: SerializedSong){
        withContext(Dispatchers.IO){
            try {
                val requestData = song.getJson()
                val encryptedData = encrypter.encrypt(requestData)

                val (responseCode, response) = callServerEndpoint(encryptedData)

                if(!isSuccessfulResponseCode(responseCode)){
                    throw SongDispatcherException("Error in response: $response")
                }
            } catch (e: Exception) { // TODO maybe catch a subset of exceptions and not all of them (need to check best practices)
                throw SongDispatcherException(e)
            }
        }
    }

    private fun callServerEndpoint(requestData: String): Pair<Int, String>{
        val url = URL(getEndpointUrl())

        val openedConnection = url.openConnection() as HttpURLConnection

        openedConnection.setConnectTimeout(connectionTimeout * 1000);
        openedConnection.setReadTimeout(connectionTimeout * 1000);

        openedConnection.requestMethod = "POST"
        openedConnection.setRequestProperty("Content-Type", "application/json");


        openedConnection.setDoOutput(true)
        val requestOut: OutputStream = openedConnection.outputStream
        requestOut.write(requestData.toByteArray())
        requestOut.flush()
        requestOut.close()


        val responseCode = openedConnection.responseCode

        val responseStream = if(isSuccessfulResponseCode(responseCode)) openedConnection.inputStream else openedConnection.errorStream
        val responseReader = BufferedReader(InputStreamReader(responseStream))
        val response = responseReader.use(BufferedReader::readText)

        return Pair(responseCode, response);
    }

    private fun getEndpointUrl(): String {
        return BuildConfig.API_DOMAIN + "/song"
    }

    private fun isSuccessfulResponseCode(responseCode: Int): Boolean {return responseCode < 300}
}

class SongDispatcherException : Exception {
    constructor() : super()
    constructor(message: String) : super(message)
    constructor(message: String, cause: Throwable) : super(message, cause)
    constructor(cause: Throwable) : super(cause)
}
