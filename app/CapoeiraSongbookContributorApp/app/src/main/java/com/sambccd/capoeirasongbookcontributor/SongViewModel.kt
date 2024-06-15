package com.sambccd.capoeirasongbookcontributor

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel

class SongViewModel: ViewModel() {
    val song = Song()
    fun setTitle() = song::title::set
    fun getBrLines() = song.brLines
    fun getEnLines() = song.enLines
    fun newLine() { song.newLine() }
    fun removeLine(lineIndex: Int) { song.removeLine(lineIndex) }

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
}

class SongLines {
    val lines = mutableStateListOf(SongLine())

    fun setTextLine(lineIndex: Int, newText: String){
        lines[lineIndex] = SongLine(newText)
    }

    fun removeLine(lineIndex: Int){
        lines.removeAt(lineIndex)
    }

    fun addEmptyLine(){
        lines.add(SongLine())
    }
}

data class SongLine(var str: String = ""){
    override fun equals(other: Any?) = (other is SongLine)
            && str == other.str

    override fun hashCode(): Int {
        return str.hashCode()
    }
}