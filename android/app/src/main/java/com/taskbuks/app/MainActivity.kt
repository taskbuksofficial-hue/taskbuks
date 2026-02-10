package com.taskbuks.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.taskbuks.app.ui.theme.TaskBuksTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize Ads
        val adsManager = com.taskbuks.app.ads.UnityAdsManager()
        adsManager.initialize(this)
        adsManager.loadRewardedAd() // Preload one

        setContent {
            TaskBuksTheme {
                // A surface container using the 'background' color from the theme
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = androidx.navigation.compose.rememberNavController()
                    androidx.navigation.compose.NavHost(navController = navController, startDestination = "login") {
                        androidx.navigation.compose.composable("login") {
                            com.taskbuks.app.ui.screens.LoginScreen(
                                onLoginClick = {
                                    navController.navigate("home") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                }
                            )
                        }
                        androidx.navigation.compose.composable("home") {
                            com.taskbuks.app.ui.screens.HomeScreen(
                                // Pass repository instance here if available via Hilt
                                adsManager = adsManager,
                                onTaskClick = { task ->
                                    // Handle task click
                                },
                                onWalletClick = {
                                    navController.navigate("wallet")
                                },
                                onReferClick = {
                                    navController.navigate("refer")
                                }
                            )
                        }
                        androidx.navigation.compose.composable("wallet") {
                            com.taskbuks.app.ui.screens.WalletScreen(
                                onBackClick = {
                                    navController.popBackStack()
                                }
                            )
                        }
                        androidx.navigation.compose.composable("refer") {
                            com.taskbuks.app.ui.screens.ReferralScreen(
                                onBackClick = {
                                    navController.popBackStack()
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    TaskBuksTheme {
        Greeting("Android")
    }
}
