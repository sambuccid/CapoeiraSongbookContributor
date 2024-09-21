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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Done
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Clear
import androidx.compose.material.icons.rounded.Done
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.LastBaseline
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
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
                            closeApp = { this.finish() },
                            modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

// TODO need to refactor to extract components better, and reorganise how we pass variables down
@Composable
fun HighLevelLayout(
    viewModel: SongViewModel,
    closeApp: () -> Unit,
    modifier: Modifier = Modifier
){
    if(viewModel.isBrazilianScreen()){
        GenericScreen(
            songTitle = viewModel.getTitle(),
            languageLabel = "PT",
            songLines = viewModel.getBrLines(),
            onNewLine = viewModel::newLine,
            onRemoveLine = viewModel::removeLine,
            onBoldUpdate = viewModel::updateBold,
            otherLanguage = "English",
            onSwapLanguage = viewModel::swapScreens,
            canSend = viewModel.canSend(),
            onSend = viewModel::send,
            canUpdateTitle = true,
            onTitleUpdate = viewModel::setTitle,
            sendSongState = viewModel.sendSongState,
            resetSendSongState = viewModel::resetSendSongState,
            closeApp = closeApp,
            modifier = modifier
            // TODO refactor to remove double parameters of value and setValue and instead use a MutableState<> type
        )
    } else {
        GenericScreen(
            songTitle = viewModel.getTitle(),
            languageLabel = "EN",
            songLines = viewModel.getEnLines(),
            onNewLine = viewModel::newLine,
            onRemoveLine = viewModel::removeLine,
            onBoldUpdate = viewModel::updateBold,
            otherLanguage = "Portuguese",
            onSwapLanguage = viewModel::swapScreens,
            canSend = viewModel.canSend(),
            onSend = viewModel::send,
            canUpdateTitle = false,
            onTitleUpdate = viewModel::setTitle,
            sendSongState = viewModel.sendSongState,
            resetSendSongState = viewModel::resetSendSongState,
            closeApp = closeApp,
            modifier = modifier
        )
    }
}

@Composable
fun GenericScreen(
    songTitle: String,
    languageLabel: String,
    songLines: SongLines,
    onNewLine: () -> Unit,
    onRemoveLine: (idx: Int) -> Unit,
    onBoldUpdate: (Int, Boolean) -> Unit,
    otherLanguage: String,
    onSwapLanguage: () -> Unit,
    canSend: Boolean,
    onSend: () -> Unit,
    canUpdateTitle: Boolean,
    onTitleUpdate: (String) -> Unit,
    sendSongState: SendSongState,
    resetSendSongState: () -> Unit,
    closeApp: () -> Unit,
    modifier: Modifier = Modifier
){
    if(sendSongState != SendSongState.Init){
        SendDialog(
            sendSongState = sendSongState,
            onCloseDialog = {
                when(sendSongState){
                    SendSongState.Loading -> {}
                    SendSongState.Sent -> { closeApp() }
                    SendSongState.Error -> { resetSendSongState() }
                    else -> { resetSendSongState() }
                }
            }
        )
    }
    Column(
        modifier
            .fillMaxSize()
            .padding(8.dp)
    ){
        Title(songTitle, canUpdateTitle, onTitleUpdate, languageLabel, Modifier.align(Alignment.CenterHorizontally))
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
                    line = line.str,
                    onLineUpdate = { newText -> songLines.setTextLine(index, newText) },
                    onLineDelete = { onRemoveLine(index) },
                    bold = line.bold,
                    onBoldUpdate = { newBold -> onBoldUpdate(index, newBold) },
                    deletable = true
                )

            }
        }
        NewLineButton(
            onClick = onNewLine,
            modifier = Modifier.align(Alignment.End)
        )
        ActionsBottomLine(
            otherLanguage,
            onSwapLanguage,
            canSend,
            onSend
        )
    }
}

@Composable
fun SongLineElement(
    printedIndex: String,
    line: String,
    onLineUpdate: (String) -> Unit,
    onLineDelete: () -> Unit,
    bold: Boolean,
    onBoldUpdate: (Boolean) -> Unit,
    deletable: Boolean,
    modifier: Modifier = Modifier
){
    val boldTextStyle = TextStyle(fontWeight = FontWeight.SemiBold)
    val defaultTextStyle = TextStyle()
    Row(modifier) {
        Text(
            text = "$printedIndex.",
            fontSize = 24.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.align(Alignment.CenterVertically)
        )
        Spacer(Modifier.width(8.dp))
        OutlinedTextField(
            value = line,
            onValueChange = onLineUpdate,
            maxLines = 1,
            textStyle = if(bold) boldTextStyle else defaultTextStyle,
            modifier = Modifier
                .weight(1f)
                .align(Alignment.CenterVertically)
        )
        Column(
            modifier = Modifier.align(Alignment.CenterVertically),
        ) {
            Checkbox(
                checked = bold,
                onCheckedChange = onBoldUpdate,
            )
            IconButton(
                onClick = onLineDelete,
                enabled = deletable
            ) {
                Icon(
                    Icons.Rounded.Clear,
                    contentDescription = "Delete line number $printedIndex)"
                )
            }
        }
    }
}

@Composable
fun ActionsBottomLine (
    otherLanguage: String,
    onSwapLanguage: () -> Unit,
    sendEnabled: Boolean,
    onSend: () -> Unit,
    modifier: Modifier = Modifier) {
    Row(
        horizontalArrangement = Arrangement.SpaceEvenly,
        modifier = modifier.fillMaxWidth()
    ){
        Button(
            enabled = sendEnabled,
            onClick = onSend
        ) {
            Icon(
                Icons.Filled.Done,
                contentDescription = "Add line")
            Text("Send", Modifier.padding(start = 8.dp))
        }
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
fun NewLineButton(onClick: () -> Unit, modifier: Modifier = Modifier){
    FloatingActionButton(
        onClick = onClick,
        modifier = modifier
    ) {
        Icon(Icons.Rounded.Add, contentDescription = "Add a new line to the song")
    }
}

@Composable
fun Title(
    title: String,
    canUpdateTitle: Boolean,
    onTitleUpdate: (String) -> Unit,
    languageLabel: String,
    modifier: Modifier
){
    Row(modifier.fillMaxWidth()){
        val titleTextStyle = LocalTextStyle.current.copy(
            textAlign = TextAlign.Center,
            fontWeight = FontWeight.Bold,
            fontSize = 27.sp)
        OutlinedTextField(
            value = title,
            onValueChange = onTitleUpdate,
            label = { Text("Song title") },
            singleLine = true,
            textStyle = titleTextStyle,
            enabled = canUpdateTitle,
            modifier = Modifier
                .alignBy(LastBaseline)
                .weight(1f)
        )
        Spacer(Modifier.width(16.dp))
        Text(
            text = languageLabel,
            fontSize = 36.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.alignBy(LastBaseline)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SendDialog(
    sendSongState: SendSongState,
    onCloseDialog: () -> Unit,
    modifier: Modifier = Modifier
){
    if(sendSongState == SendSongState.Loading){
        AlertDialog(onDismissRequest = onCloseDialog, modifier = modifier){
            LoadingSpinnerDialogContent()
        }
        return
    }

    AlertDialog(
        icon = {
            when(sendSongState) {
                SendSongState.Sent -> Icon(
                    Icons.Rounded.Done,
                    contentDescription = "Song sent"
                )
                SendSongState.Error -> Icon(
                    Icons.Rounded.Clear,
                    contentDescription = "Error"
                )
                else -> { }
            }
        },
        title = {
            val text = when(sendSongState) {
                SendSongState.Sent -> "Song suggestion sent"
                SendSongState.Error -> "Error sending song"
                else -> ""
            }
            Text(text)
        },
        text = {
            when(sendSongState) {
                SendSongState.Sent -> {
                    Text("The suggestion for the new song has been sent correctly")
                }
                SendSongState.Error -> {
                    Text("An error occurred while sending the suggestion for the new song")
                }
                else -> {}
            }
        },
        onDismissRequest = onCloseDialog,
        confirmButton = {
            TextButton(
                onClick = onCloseDialog,
            ){
                Text("Ok")
            }
        },
        modifier = modifier
    )
}

@Composable
fun LoadingSpinnerDialogContent(modifier: Modifier = Modifier){
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
            .padding(16.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            verticalArrangement = Arrangement.Center,
            modifier = modifier
                .fillMaxSize()
                .padding(8.dp)
        ){
            Text("Sending song...", Modifier.align(Alignment.CenterHorizontally))
            Spacer(Modifier.height(16.dp))
            // TODO add specific time in seconds for loading (constant CONNECTION_TIMEOUT)
            CircularProgressIndicator(
                color = MaterialTheme.colorScheme.secondary,
                trackColor = MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )
        }
    }
}



@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    CapoeiraSongbookContributorTheme {
        HighLevelLayout(
            previewViewModel(),
            {}
        )
    }
}

fun previewViewModel(): SongViewModel {
    val viewModel = SongViewModel()
    viewModel.getBrLines().addEmptyLine()
    viewModel.getBrLines().setTextLine(0,"Test Text")
    viewModel.setTitle("Song title")
    return viewModel
}