/**
 * AdMob Bridge + Unity Ads for Task Buks
 * Handles native Android ads and Unity Ads web SDK for rewarded video & banners
 */

// --- Unity Ads Configuration ---
var UNITY_GAME_ID = '6044176';
var UNITY_REWARDED_PLACEMENT = 'Rewarded_Android';
var UNITY_BANNER_PLACEMENT = 'Banner_Android';
var unityAdsReady = false;
var unityBannerReady = false;
var unityAdsInitialized = false;

// Load Unity Ads SDK dynamically
(function loadUnityAdsSDK() {
    var script = document.createElement('script');
    script.src = 'https://game.api.unity.com/webview/latest/unity-ads.js';
    script.onload = function () {
        console.log('[UnityAds] SDK loaded, initializing...');
        initUnityAds();
        // Check env after a slight delay to allow native bridge injection
        setTimeout(() => {
            if (window.ads && window.ads.checkEnvironment) window.ads.checkEnvironment();
        }, 1000);
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
            testMode: window.location.search.includes('testAds=true'),
            onComplete: function () {
                console.log('[UnityAds] Initialized successfully');
                // if (window.showToast) window.showToast('✅ Unity Init Success');
                unityAdsInitialized = true;
                loadUnityRewardedAd();
                loadUnityBanner();
            },
            onFailed: function (error) {
                console.error('[UnityAds] Init failed:', error);
                // if (window.showToast) window.showToast('❌ Unity Init Failed: ' + error);
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
                console.log('[UnityAds] Rewarded loaded:', placementId);
                unityAdsReady = true;
            },
            onFailed: function (placementId, error) {
                console.warn('[UnityAds] Rewarded load failed:', placementId, error);
                // if (window.showToast) window.showToast('⚠️ Ad Load Failed: ' + error);
                unityAdsReady = false;
            }
        });
    } catch (e) {
        console.error('[UnityAds] Rewarded load error:', e);
    }
}

function loadUnityBanner() {
    if (!unityAdsInitialized) return;
    try {
        unity.services.load({
            placementId: UNITY_BANNER_PLACEMENT,
            onComplete: function (placementId) {
                console.log('[UnityAds] Banner loaded:', placementId);
                unityBannerReady = true;
            },
            onFailed: function (placementId, error) {
                console.warn('[UnityAds] Banner load failed:', placementId, error);
                unityBannerReady = false;
            }
        });
    } catch (e) {
        console.error('[UnityAds] Banner load error:', e);
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
                if (callback) callback(50);
                if (window.onAdRewardReceived) window.onAdRewardReceived(50);
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

function showUnityBanner(containerId) {
    if (!unityBannerReady) {
        loadUnityBanner();
        return false;
    }
    try {
        var container = document.getElementById(containerId || 'ad-banner-container');
        if (!container && !window.Android) {
            console.warn('[UnityAds] Banner container not found');
            return false;
        }
        unity.services.show({
            placementId: UNITY_BANNER_PLACEMENT,
            showOptions: {
                banner: {
                    position: 'bottom-center'
                }
            },
            onComplete: function (placementId) {
                console.log('[UnityAds] Banner shown');
            },
            onFailed: function (placementId, error) {
                console.error('[UnityAds] Banner show failed:', error);
            }
        });
        return true;
    } catch (e) {
        console.error('[UnityAds] Banner show error:', e);
        return false;
    }
}

function hideUnityBanner() {
    // Placeholder
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
     * Smart rewarded: Priority = Native (APK) -> Unity Web (Fallback)
     */
    showRewardedSmart: function (callback) {
        console.log("Requesting Smart Rewarded Ad...");

        // 1. Try Native Android Ad (Best for APK)
        if (window.Android && window.Android.showRewarded) {
            console.log("[SmartAd] Showing Native Android Ad");
            window.onAdRewardReceived = function (amount) {
                console.log("Reward received:", amount);
                if (callback) callback(amount);
            };
            window.Android.showRewarded();
            return;
        }

        // 2. Try Unity Ads (Web SDK)
        if (unityAdsReady) {
            console.log("[SmartAd] Showing Unity Ads rewarded");
            var shown = showUnityRewardedAd(callback);
            if (shown) return;
        }

        // 3. No Ad Available - Optimization
        console.warn("[SmartAd] No ad provider available. Triggering reload.");

        // Retry loading logic
        if (unityAdsInitialized && !unityAdsReady) {
            loadUnityRewardedAd(); // Force retry
            if (window.showToast) window.showToast('⏳ Ad Loading... Wait 5s.');
        } else {
            // Specific message for Web users
            if (!window.Android) {
                // if (window.showToast) window.showToast('⚠️ No Live Ads on Web/PC. Use APK.');
            } else {
                if (window.showToast) window.showToast('⚠️ No Ad Filled. Checking connection...');
            }

            // Force init if completely failed
            if (!unityAdsInitialized) initUnityAds();
        }

        if (callback) callback(0); // Proceed without reward
    },

    toggleTestMode: function () {
        const url = new URL(window.location.href);
        if (url.searchParams.get('testAds') === 'true') {
            url.searchParams.delete('testAds');
        } else {
            url.searchParams.set('testAds', 'true');
        }
        window.location.href = url.toString();
    },

    setBannerVisible: function (visible) {
        if (window.Android && window.Android.setBannerVisible) {
            window.Android.setBannerVisible(visible);
        } else {
            console.log("Web Mode: Banner Visibility set to " + visible);
        }
    },

    checkEnvironment: function () {
        if (window.Android && window.Android.showRewarded) {
            // if (window.showToast) window.showToast('📱 Native App Mode Detected');
        } else {
            console.log("Running in Web Mode");
            if (window.location.search.includes('testAds=true')) {
                if (window.showToast) window.showToast('🛠️ Test Ads Enabled');
            }
        }
    },

    setBannerVisible: function (visible, containerId) {
        console.log("Setting Smart Banner:", visible, "in", containerId);

        // 1. Handle HTML Containers (Unified across Web and APK)
        const containers = ['ad-banner-carousel', 'ludo-banner-ad', 'snl-banner-ad', 'generic-banner-ad'];
        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (visible && id === containerId) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            }
        });

        // 2. Native Bridge (Preferred for APK stability - docked at bottom)
        if (window.Android && window.Android.setBannerVisible) {
            // For carousel, we might want to skip native docked banner if it covers content
            // but the user wants it visible "at every bannerad in games all".
            window.Android.setBannerVisible(visible);
            return;
        }

        // 3. Unity Banner (Fallback for Web)
        if (visible) {
            showUnityBanner(containerId);
        } else {
            hideUnityBanner();
        }
    },

    toast: function (message) {
        if (window.Android && window.Android.showToast) {
            window.Android.showToast(message);
        } else {
            console.log("Native Toast:", message);
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