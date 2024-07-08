package com.sambccd.capoeirasongbookcontributor

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class SongDispatcher {
    suspend fun send(song: SerializedSong){
        withContext(Dispatchers.IO){
            // -----possible http connection code 1------
//            val url = URL(getEndpointUrl())
//            val openedConnection = url.openConnection() as HttpURLConnection
//            openedConnection.requestMethod = "POST"
//
//            val responseCode = openedConnection.responseCode
//
//            println(responseCode)
//            val reader = BufferedReader(InputStreamReader(openedConnection.inputStream))
//            val response = reader.readText()
//            println(response)
//            reader.close() // TODO probably need to make auto-closable
            // ---------possible http connection code 2-----------------
//            val client = HttpClient.newBuilder().build();
//            val request = HttpRequest.newBuilder()
//            .uri(URI.create("https://something.com"))
//            .build();
//            val response = client.send(request, BodyHandlers.ofString());
//            println(response.body())
//



            try {
                // TODO final code to go here

                //        println(BuildConfig.API_PUBLIC_KEY)
                //        println(BuildConfig.API_URL)
                // TODO call api gateway to send song
                // TODO throw error if non-200 response

                // Testing code:
                delay(5000L)
                throw IOException("Hi There!")
            } catch (e: Exception) { // TODO maybe catch a subset of exceptions and not all of them (need to check best practices)
                throw SongDispatcherException(e)
            }

        }


    }

    private fun getEndpointUrl(): String {
        return BuildConfig.API_DOMAIN + "/song"
    }
}

class SongDispatcherException(cause: Exception) : Exception(cause)