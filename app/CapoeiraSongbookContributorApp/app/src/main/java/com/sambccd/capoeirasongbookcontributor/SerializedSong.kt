package com.sambccd.capoeirasongbookcontributor

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class SerializedSong(var songToSerialize: Song) {
    fun getJson(): String{
        val lines = Array(songToSerialize.brLines.lines.size) { SongLineData("","") }
        songToSerialize.brLines.lines.forEachIndexed { index, brSongLine ->
            lines[index] = SongLineData(
                br=brSongLine.str,
                en=songToSerialize.enLines.lines[index].str,
                bold = if(brSongLine.bold) true else null
            )
        }
        val song = SongData(title=songToSerialize.title, lines=lines)

        val serialized = Json.encodeToString(song)
        return serialized
    }
}

@Serializable
data class SongData(val title: String, val lines: Array<SongLineData>) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as SongData

        if (title != other.title) return false
        if (!lines.contentEquals(other.lines)) return false

        return true
    }

    override fun hashCode(): Int {
        var result = title.hashCode()
        result = 31 * result + lines.contentHashCode()
        return result
    }
}

@Serializable
data class SongLineData(val br: String, val en: String, val bold: Boolean?=null)
