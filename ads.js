/**
 * AdMob Bridge + Unity Ads for Task Buks
 * Handles native Android ads and Unity Ads web SDK for rewarded video
 */

// --- Unity Ads Configuration ---
var UNITY_GAME_ID = '6044176';
var UNITY_REWARDED_PLACEMENT = 'Rewarded_Android';
var unityAdsReady = false;
var unityAdsInitialized = false;

// Load Unity Ads SDK dynamically
(function loadUnityAdsSDK() {
    var script = document.createElement('script');
    script.src = 'https://game.api.unity.com/webview/latest/unity-ads.js';
    script.onload = function () {
        console.log('[UnityAds] SDK loaded, initializing...');
        initUnityAds();
    };
    script.onerror = function () {
        console.warn('[UnityAds] Failed to load SDK');
    };
    document.head.appendChild(script);
})();

function initUnityAds() {
    if (typeof unity === 'undefined' || !unity.services) {
        console.warn('[UnityAds] unity.services not available');
        return;
    }
    try {
        unity.services.init({
            gameId: UNITY_GAME_ID,
            testMode: false,
            onComplete: function () {
                console.log('[UnityAds] Initialized successfully');
                unityAdsInitialized = true;
                loadUnityRewardedAd();
            },
            onFailed: function (error) {
                console.error('[UnityAds] Init failed:', error);
            }
        });
    } catch (e) {
        console.error('[UnityAds] Init error:', e);
    }
}

function loadUnityRewardedAd() {
    if (!unityAdsInitialized) return;
    try {
        unity.services.load({
            placementId: UNITY_REWARDED_PLACEMENT,
            onComplete: function (placementId) {
                console.log('[UnityAds] Ad loaded:', placementId);
                unityAdsReady = true;
            },
            onFailed: function (placementId, error) {
                console.warn('[UnityAds] Load failed:', placementId, error);
                unityAdsReady = false;
            }
        });
    } catch (e) {
        console.error('[UnityAds] Load error:', e);
    }
}

function showUnityRewardedAd(callback) {
    if (!unityAdsReady) return false;
    try {
        unityAdsReady = false;
        unity.services.show({
            placementId: UNITY_REWARDED_PLACEMENT,
            onComplete: function (placementId) {
                console.log('[UnityAds] Ad completed, rewarding user');
                if (callback) callback(10);
                if (window.onAdRewardReceived) window.onAdRewardReceived(10);
                loadUnityRewardedAd();
            },
            onSkipped: function (placementId) {
                console.log('[UnityAds] Ad skipped');
                loadUnityRewardedAd();
            },
            onFailed: function (placementId, error) {
                console.error('[UnityAds] Show failed:', error);
                loadUnityRewardedAd();
            }
        });
        return true;
    } catch (e) {
        console.error('[UnityAds] Show error:', e);
        return false;
    }
}

// --- Main Ads Object ---
window.ads = {
    showInterstitial: function () {
        console.log("Requesting Interstitial Ad...");
        if (window.Android && window.Android.showInterstitial) {
            window.Android.showInterstitial();
        } else {
            console.warn("Android Ad Interface not found. Skipping Interstitial.");
        }
    },

    showRewarded: function (callback) {
        console.log("Requesting Rewarded Ad (AdMob)...");
        if (window.Android && window.Android.showRewarded) {
            window.onAdRewardReceived = function (amount) {
                console.log("Reward received:", amount);
                if (callback) callback(amount);
            };
            window.Android.showRewarded();
        } else {
            console.warn("Android Ad Interface not found. Skipping Rewarded.");
        }
    },

    /**
     * Smart rewarded: Unity Ads first, AdMob native fallback
     */
    showRewardedSmart: function (callback) {
        console.log("Requesting Smart Rewarded Ad...");
        // Try Unity Ads first (works in web + Android)
        if (unityAdsReady) {
            console.log("[SmartAd] Showing Unity Ads rewarded");
            var shown = showUnityRewardedAd(callback);
            if (shown) return;
        }
        // Fallback to native AdMob
        if (window.Android && window.Android.showRewarded) {
            console.log("[SmartAd] Falling back to AdMob");
            window.ads.showRewarded(callback);
        } else {
            console.warn("[SmartAd] No ad provider available");
        }
    },

    toast: function (message) {
        if (window.Android && window.Android.showToast) {
            window.Android.showToast(message);
        } else {
            console.log("Native Toast:", message);
        }
    },

    setBannerVisible: function (visible) {
        console.log("Setting Banner Visible:", visible);
        if (window.Android && window.Android.setBannerVisible) {
            window.Android.setBannerVisible(visible);
        } else {
            console.warn("Android Ad Interface not found. Skipping Banner toggle.");
        }
    }
};

/**
 * Handle Reward callback globally
 */
window.onAdRewardReceived = function (amount) {
    console.log("Global Reward handler:", amount);
    if (window.controller && window.controller.claimVideoReward) {
        window.controller.claimVideoReward(amount);
    }
};