package com.taskbuks.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.taskbuks.app.ui.theme.TaskBuksTheme

@Composable
fun LoginScreen(
    onLoginClick: () -> Unit = {}
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF111827)) // Dark Background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo / Branding
            Text(
                text = "TaskBuks",
                style = MaterialTheme.typography.displayLarge.copy(
                    fontSize = 48.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF22C55E) // Primary Green
                )
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Earn Money Daily",
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = Color.White.copy(alpha = 0.8f)
                )
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Action Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF1F2937)
                ),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Get Started",
                        style = MaterialTheme.typography.headlineSmall.copy(
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = onLoginClick,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF22C55E)
                        ),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text(
                            text = "Continue with Google",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Text(
                        text = "By continuing, you agree to our Terms & Conditions",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = Color.Gray,
                            textAlign = TextAlign.Center
                        )
                    )
                }
            }
        }
    }
}

@Preview
@Composable
fun LoginScreenPreview() {
    TaskBuksTheme {
        LoginScreen()
    }
}
