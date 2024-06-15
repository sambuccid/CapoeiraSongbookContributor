package com.sambccd.capoeirasongbookcontributor

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Clear
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sambccd.capoeirasongbookcontributor.ui.theme.CapoeiraSongbookContributorTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CapoeiraSongbookContributorTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    HighLevelLayout(
                            modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

data class SongLine(var str: String){
    override fun equals(other: Any?) = (other is SongLine)
            && str == other.str

    override fun hashCode(): Int {
        return str.hashCode()
    }
}


@Composable
fun HighLevelLayout(modifier: Modifier = Modifier){
    val brLines = remember { mutableStateListOf(SongLine("")) }
    Column(modifier= modifier
        .fillMaxSize()
        .padding(8.dp)
    ){
        Title("Song", Modifier.align(Alignment.CenterHorizontally))
        Spacer(Modifier.height(12.dp))
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier.weight(1f)
        ){
            // TODO need to add keys?
            itemsIndexed(brLines) { index, brLine ->
                val printedIndex = (index + 1).toString()
                SongLineElement(
                    printedIndex = printedIndex,
                    line = brLine,
                    onLineUpdate = { newText -> brLines[index] = SongLine(newText) },
                    onLineDelete = { brLines.removeAt(index) },
                    deletable = index > 0
                )

            }
        }
        NewLineButton(
            onClick = { brLines.add(SongLine("")) },
            modifier = Modifier.align(Alignment.End)
        )
    }
}

@Composable
fun SongLineElement(
    printedIndex: String,
    line: SongLine,
    onLineUpdate: (newText: String) -> Unit,
    onLineDelete: () -> Unit,
    deletable: Boolean,
    modifier: Modifier = Modifier
){
    Row(modifier) {
        Text(
            text =  "$printedIndex.",
            fontSize = 24.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.align(Alignment.Bottom)
        )
        Spacer(Modifier.width(8.dp))
        OutlinedTextField(
            value = line.str,
            onValueChange = onLineUpdate,
            modifier = Modifier.weight(1f)
        )
        IconButton(
            onClick = onLineDelete,
            modifier = Modifier.align(Alignment.CenterVertically),
            enabled = deletable
        ) {
            Icon(
                Icons.Rounded.Clear,
                contentDescription = "Delete line number $printedIndex)"
            )
        }
    }
}

@Composable
fun NewLineButton(onClick: () -> Unit, modifier: Modifier){
    FloatingActionButton(
        onClick = onClick,
        modifier = modifier
    ) {
        Icon(Icons.Rounded.Add, contentDescription = "Add a new line to the song")
    }
}

@Composable
fun Title(title: String, modifier: Modifier){
    Row(modifier){
        Text(
            text = title,
            fontSize = 36.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    CapoeiraSongbookContributorTheme {
        HighLevelLayout()
    }
}