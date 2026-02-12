/**
 * AdMob Bridge for Task Buks
 * Handles communication with native Android/iOS ad interfaces
 */

window.ads = {
    showInterstitial() {
        console.log("Requesting Interstitial Ad...");
        if (window.Android && window.Android.showInterstitial) {
            window.Android.showInterstitial();
        } else {
            console.warn("Android Ad Interface not found. Skipping Interstitial.");
        }
    },

    showRewarded(callback) {
        console.log("Requesting Rewarded Ad...");
        if (window.Android && window.Android.showRewarded) {
            // Setup global reward listener
            window.onAdRewardReceived = (amount) => {
                console.log("Reward received:", amount);
                if (callback) callback(amount);
            };
            window.Android.showRewarded();
        } else {
            console.warn("Android Ad Interface not found. Skipping Rewarded.");
            // Fallback: Give reward anyway in dev mode? 
            // Better to just log.
        }
    },

    toast(message) {
        if (window.Android && window.Android.showToast) {
            window.Android.showToast(message);
        } else {
            console.log("Native Toast:", message);
        }
    },

    setBannerVisible(visible) {
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
window.onAdRewardReceived = (amount) => {
    console.log("Global Reward handler:", amount);
    if (window.controller && window.controller.claimVideoReward) {
        window.controller.claimVideoReward(amount);
    }
};
