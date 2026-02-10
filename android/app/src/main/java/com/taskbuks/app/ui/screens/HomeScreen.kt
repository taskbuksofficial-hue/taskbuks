package com.taskbuks.app.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.rememberAsyncImagePainter
import com.taskbuks.app.data.model.Task
import com.taskbuks.app.data.repository.TaskRepository
import com.taskbuks.app.ui.theme.TaskBuksTheme
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    taskRepository: TaskRepository? = null,
    adsManager: com.taskbuks.app.ads.UnityAdsManager? = null,
    onTaskClick: (Task) -> Unit = {},
    onWalletClick: () -> Unit = {},
    onReferClick: () -> Unit = {}
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val activity = context as? android.app.Activity
    val scope = rememberCoroutineScope()
    var tasks by remember { mutableStateOf<List<Task>>(emptyList()) }
    var walletBalance by remember { mutableStateOf(50.0) } // Local state for immediate update
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                // Fetch from Supabase if repository is provided, else use dummy data
                tasks = taskRepository?.getTasks() ?: getDummyTasks()
            } catch (e: Exception) {
                // Handle error
                tasks = getDummyTasks() // Fallback
            } finally {
                isLoading = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF111827))
            .padding(16.dp)
    ) {
        // App Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "TaskBuks",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            )
            // Wallet Badge
            Surface(
                color = Color(0xFF1F2937),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF22C55E)),
                modifier = Modifier.clickable { onWalletClick() }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "₹ $walletBalance",
                        color = Color(0xFF22C55E),
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Available Tasks",
            style = MaterialTheme.typography.titleMedium.copy(color = Color.White)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Refer Banner
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onReferClick() },
            colors = CardDefaults.cardColors(containerColor = Color(0xFF374151)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "📢  Refer Friends & Earn ₹10",
                    style = MaterialTheme.typography.titleSmall.copy(
                        color = Color(0xFF60A5FA), // Blue
                        fontWeight = FontWeight.Bold
                    )
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) {
            CircularProgressIndicator(color = Color(0xFF22C55E))
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(tasks) { task ->
                    TaskCard(
                        task = task, 
                        onClick = { 
                            // Show Ad if available
                            if (activity != null && adsManager != null) {
                                adsManager.showRewardedAd(activity) {
                                    // On Ad Complete (Reward)
                                    walletBalance += task.payoutAmount
                                    // TODO: Call API to save this on server
                                }
                            } else {
                                // Fallback (No Ads/Preview)
                                walletBalance += task.payoutAmount
                            }
                            onTaskClick(task) 
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun TaskCard(task: Task, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1F2937)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Surface(
                modifier = Modifier.size(48.dp),
                shape = RoundedCornerShape(12.dp),
                color = Color.Black
            ) {
                if (task.iconUrl != null) {
                   Image(
                       painter = rememberAsyncImagePainter(task.iconUrl),
                       contentDescription = null,
                       modifier = Modifier.fillMaxSize()
                   )
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.titleMedium.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                )
                Text(
                    text = task.description ?: "Complete to earn",
                    style = MaterialTheme.typography.bodySmall.copy(color = Color.Gray),
                    maxLines = 1
                )
            }

            // Payout
            Text(
                text = "+₹${task.payoutAmount}",
                style = MaterialTheme.typography.titleMedium.copy(
                    color = Color(0xFF22C55E),
                    fontWeight = FontWeight.Bold
                )
            )
        }
    }
}

// Dummy Data for Preview
fun getDummyTasks(): List<Task> {
    return listOf(
        Task("1", "Install Dream11", "Register and deposit", 50.0, null, "", "INSTALL", true),
        Task("2", "Play Ludo", "Win 1 game", 10.0, null, "", "GAME", true),
        Task("3", "Watch Video", "Watch full ad", 0.5, null, "", "VIDEO", true)
    )
}

@Preview
@Composable
fun HomeScreenPreview() {
    TaskBuksTheme {
        HomeScreen()
    }
}
