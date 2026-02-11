package com.taskbuks.app.ads

import android.app.Activity
import android.content.Context
import android.util.Log
import com.unity3d.ads.IUnityAdsInitializationListener
import com.unity3d.ads.IUnityAdsLoadListener
import com.unity3d.ads.IUnityAdsShowListener
import com.unity3d.ads.UnityAds
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UnityAdsManager @Inject constructor() {

    private val gameId = "6044176"
    private val testMode = true // Set to false for production
    private val rewardedAdUnitId = "Rewarded_Android"
    private val interstitialAdUnitId = "Interstitial_Android"

    fun initialize(context: Context) {
        UnityAds.initialize(context, gameId, testMode, object : IUnityAdsInitializationListener {
            override fun onInitializationComplete() {
                Log.d("UnityAds", "Initialization Complete")
            }

            override fun onInitializationFailed(error: UnityAds.UnityAdsInitializationError?, message: String?) {
                Log.e("UnityAds", "Initialization Failed: $error - $message")
            }
        })
    }

    fun loadRewardedAd() {
        UnityAds.load(rewardedAdUnitId, object : IUnityAdsLoadListener {
            override fun onUnityAdsAdLoaded(placementId: String) {
                Log.d("UnityAds", "Ad Loaded: $placementId")
            }

            override fun onUnityAdsFailedToLoad(placementId: String, error: UnityAds.UnityAdsLoadError, message: String) {
                Log.e("UnityAds", "Failed to Load Ad: $error - $message")
            }
        })
    }

    fun showRewardedAd(activity: Activity, onReward: () -> Unit) {
        UnityAds.show(activity, rewardedAdUnitId, object : IUnityAdsShowListener {
            override fun onUnityAdsShowStart(placementId: String) {}
            override fun onUnityAdsShowClick(placementId: String) {}
            override fun onUnityAdsShowFailure(placementId: String, error: UnityAds.UnityAdsShowError, message: String) {
                Log.e("UnityAds", "Show Failure: $error - $message")
            }

            override fun onUnityAdsShowComplete(placementId: String, state: UnityAds.UnityAdsShowCompletionState) {
                if (state == UnityAds.UnityAdsShowCompletionState.COMPLETED) {
                    onReward()
                }
            }
        })
    }
}
