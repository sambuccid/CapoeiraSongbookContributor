package com.sambccd.capoeirasongbookcontributor

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Clear
import androidx.compose.material3.Button
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sambccd.capoeirasongbookcontributor.ui.theme.CapoeiraSongbookContributorTheme

class MainActivity : ComponentActivity() {

    private val viewModel by viewModels<SongViewModel>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CapoeiraSongbookContributorTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    HighLevelLayout(
                            viewModel = viewModel,
                            modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}


@Composable
fun HighLevelLayout(viewModel: SongViewModel, modifier: Modifier = Modifier){
    if(viewModel.isBrazilianScreen()){
        GenericScreen(
            screenTitle = "Song",
            songLines = viewModel.getBrLines(),
            onNewLine = viewModel::newLine,
            onRemoveLine = viewModel::removeLine,
            otherLanguage = "English",
            onSwapLanguage = viewModel::swapScreens,
            modifier = modifier
        )
    } else {
        GenericScreen(
            screenTitle = "English",
            songLines = viewModel.getEnLines(),
            onNewLine = viewModel::newLine,
            onRemoveLine = viewModel::removeLine,
            otherLanguage = "Portuguese",
            onSwapLanguage = viewModel::swapScreens,
            modifier = modifier
        )
    }
}

@Composable
fun GenericScreen(
    screenTitle: String,
    songLines: SongLines,
    onNewLine: () -> Unit,
    onRemoveLine: (idx: Int) -> Unit,
    otherLanguage: String,
    onSwapLanguage: () -> Unit,
    modifier: Modifier = Modifier
){
    Column(modifier
        .fillMaxSize()
        .padding(8.dp)
    ){
        Title(screenTitle, Modifier.align(Alignment.CenterHorizontally))
        Spacer(Modifier.height(12.dp))
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier.weight(1f)
        ){
            // TODO need to add keys?
            itemsIndexed(songLines.lines) { index, line ->
                val printedIndex = (index + 1).toString()
                SongLineElement(
                    printedIndex = printedIndex,
                    line = line,
                    onLineUpdate = { newText -> songLines.setTextLine(index, newText) },
                    onLineDelete = { onRemoveLine(index) },
                    deletable = true
                )

            }
        }
        NewLineButton(
            onClick = onNewLine,
            modifier = Modifier.align(Alignment.End)
        )
        ActionsBottomLine(otherLanguage, onSwapLanguage)
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
            maxLines = 1,
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
fun ActionsBottomLine (otherLanguage: String, onSwapLanguage: () -> Unit,modifier: Modifier = Modifier) {
    Row(
        horizontalArrangement = Arrangement.SpaceEvenly,
        modifier = modifier.fillMaxWidth()
    ){
        Button(
            onClick = onSwapLanguage
        ){
            Icon(
                painterResource(id = R.drawable.baseline_swap_horiz_24),
                contentDescription = "Swap to")
            Text(otherLanguage, Modifier.padding(start = 4.dp))
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
        HighLevelLayout(previewViewModel())
    }
}

fun previewViewModel(): SongViewModel {
    val viewModel = SongViewModel()
    viewModel.getBrLines().addEmptyLine()
    viewModel.getBrLines().setTextLine(0,"Test Text")
    return viewModel
}