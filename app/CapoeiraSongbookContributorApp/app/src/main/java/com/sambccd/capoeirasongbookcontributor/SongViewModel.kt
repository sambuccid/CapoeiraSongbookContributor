package com.sambccd.capoeirasongbookcontributor

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel

class SongViewModel: ViewModel() {
    private val song = Song()
    fun setTitle(newTitle: String) { song.title = newTitle }
    fun getTitle() = song.title
    fun getBrLines() = song.brLines
    fun getEnLines() = song.enLines
    fun newLine() { song.newLine() }
    fun removeLine(lineIndex: Int) { song.removeLine(lineIndex) }
    fun updateBold(lineIndex: Int, newBold: Boolean) { song.updateBold(lineIndex, newBold) }
    fun canSend(): Boolean { return song.canSend() }
    fun send() { song.send() }

    private var showEnglishScreen by mutableStateOf(false)
    fun swapScreens() { showEnglishScreen = !showEnglishScreen }
    fun isBrazilianScreen() = !showEnglishScreen
    fun isEnglishScreen() = showEnglishScreen
}

class Song {
    var title by mutableStateOf("")
    val brLines = SongLines()
    val enLines = SongLines()

    fun newLine(){
        brLines.addEmptyLine()
        enLines.addEmptyLine()
    }
    fun removeLine(lineIndex: Int){
        brLines.removeLine(lineIndex)
        enLines.removeLine(lineIndex)
    }
    fun updateBold(lineIndex: Int, newBold: Boolean){
        brLines.updateBold(lineIndex, newBold)
        enLines.updateBold(lineIndex, newBold)
    }
    fun canSend() = brLines.isNotEmpty()
    fun send() {
        SendSongAction().sendSong(this)
    }
}

class SongLines {
    val lines = mutableStateListOf(SongLine())

    fun setTextLine(lineIndex: Int, newText: String){
        lines[lineIndex] = lines[lineIndex].copy(str = newText)
    }

    fun updateBold(lineIndex: Int, newBold: Boolean){
        val updated = lines[lineIndex].copy(bold = newBold)
        lines[lineIndex] = updated
    }

    fun removeLine(lineIndex: Int){
        lines.removeAt(lineIndex)
    }

    fun addEmptyLine(){
        lines.add(SongLine())
    }

    fun isNotEmpty() = !lines.isEmpty()
}

data class SongLine(var str: String = "", var bold: Boolean = false){
    override fun equals(other: Any?) = (other is SongLine)
            && str == other.str
            && bold == other.bold

    override fun hashCode(): Int {
        var result = str.hashCode()
        result = 31 * result + bold.hashCode()
        return result
    }
}