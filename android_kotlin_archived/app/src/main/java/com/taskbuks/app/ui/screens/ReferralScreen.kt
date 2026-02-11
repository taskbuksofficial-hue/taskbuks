package com.taskbuks.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.taskbuks.app.ui.theme.TaskBuksTheme

@Composable
fun ReferralScreen(
    referralCode: String = "SUMIT123",
    onBackClick: () -> Unit = {},
    onShareClick: () -> Unit = {}
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF111827))
            .padding(16.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Start,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBackClick) {
                    Text("←", color = Color.White, fontSize = 24.sp)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Refer & Earn",
                    style = MaterialTheme.typography.titleLarge.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Info Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1F2937)),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Invite a friend and get",
                        style = MaterialTheme.typography.bodyLarge.copy(color = Color.Gray)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "₹ 10.00",
                        style = MaterialTheme.typography.displayMedium.copy(
                            color = Color(0xFF22C55E),
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "when they complete their first task",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = Color.Gray,
                            textAlign = TextAlign.Center
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Code Display
            Text(
                text = "Your Referral Code",
                style = MaterialTheme.typography.titleMedium.copy(color = Color.White)
            )
            Spacer(modifier = Modifier.height(16.dp))
            
            Surface(
                color = Color(0xFF374151),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.padding(24.dp)
                ) {
                    Text(
                        text = referralCode,
                        style = MaterialTheme.typography.headlineMedium.copy(
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.sp
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Share Button
            Button(
                onClick = onShareClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("Share Now", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Preview
@Composable
fun ReferralScreenPreview() {
    TaskBuksTheme {
        ReferralScreen()
    }
}
