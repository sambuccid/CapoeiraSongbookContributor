package com.sambccd.capoeirasongbookcontributor

class SendSongAction(private val songDispatcher: SongDispatcher = SongDispatcher(SendSongAction.CONNECTION_TIMEOUT)) {
    companion object {
        const val CONNECTION_TIMEOUT = 45
    }

    suspend fun sendSong(song: Song){
        val serializedSong = SerializedSong(song)
        this.songDispatcher.send(serializedSong)
    }
}