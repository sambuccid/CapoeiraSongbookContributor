package com.sambccd.capoeirasongbookcontributor

class SendSongAction(private var songDispatcher: SongDispatcher = SongDispatcher()) {
    // TODO dispatcher might need to be created outside, or it might need an http client as input
    suspend fun sendSong(song: Song){
        val serializedSong = SerializedSong(song)
        this.songDispatcher.send(serializedSong)
    }
}