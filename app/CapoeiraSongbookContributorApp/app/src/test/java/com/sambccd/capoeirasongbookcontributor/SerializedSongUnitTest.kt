package com.sambccd.capoeirasongbookcontributor

import org.junit.Test

import org.junit.Assert.*

class SerializedSongUnitTest {
    @Test
    fun creates_json() {
        val song = Song()
        song.title="test-title"
        song.newLine()
        song.newLine()
        song.brLines.setTextLine(0, "br-line-0")
        song.enLines.setTextLine(0, "en-line-0")
        song.brLines.setTextLine(1, "br-line-1")
        song.enLines.setTextLine(1, "en-line-1")
        song.brLines.setTextLine(2, "br-line-2")
        song.enLines.setTextLine(2, "en-line-2")
        song.updateBold(1, true)

        val res = SerializedSong(song).getJson()
        assertEquals("""{"title":"test-title","lines":[{"br":"br-line-0","en":"en-line-0"},{"br":"br-line-1","en":"en-line-1","bold":true},{"br":"br-line-2","en":"en-line-2"}]}""", res)
    }
}