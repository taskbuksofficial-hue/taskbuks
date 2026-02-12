package com.taskbuks;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RelativeLayout;
import android.widget.Toast;

import com.unity3d.ads.IUnityAdsInitializationListener;
import com.unity3d.ads.IUnityAdsLoadListener;
import com.unity3d.ads.IUnityAdsShowListener;
import com.unity3d.ads.UnityAds;
import com.unity3d.ads.UnityAdsShowOptions;
import com.unity3d.services.banners.BannerErrorInfo;
import com.unity3d.services.banners.BannerView;
import com.unity3d.services.banners.UnityBannerSize;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "TaskBuksUnityAds";
    private static final String UNITY_GAME_ID = "5524357"; // REPLACE WITH YOUR ACTUAL UNITY GAME ID
    private static final boolean TEST_MODE = true;

    private static final String INTERSTITIAL_ID = "Interstitial_Android";
    private static final String REWARDED_ID = "Rewarded_Android";
    private static final String BANNER_ID = "Banner_Android";

    private WebView myWebView;
    private RelativeLayout layout;
    private BannerView mBannerView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable edge-to-edge
        getWindow().getDecorView().setSystemUiVisibility(
            android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
        getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);

        // Create Layout
        layout = new RelativeLayout(this);
        layout.setLayoutParams(new RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // Create WebView
        myWebView = new WebView(this);
        RelativeLayout.LayoutParams webViewParams = new RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        );
        myWebView.setLayoutParams(webViewParams);
        layout.addView(myWebView);

        setContentView(layout);

        // Initialize Unity Ads
        UnityAds.initialize(getApplicationContext(), UNITY_GAME_ID, TEST_MODE, new IUnityAdsInitializationListener() {
            @Override
            public void onInitializationComplete() {
                Log.d(TAG, "Unity Ads Initialization Complete");
                loadBanner();
            }

            @Override
            public void onInitializationFailed(UnityAds.UnityAdsInitializationError error, String message) {
                Log.e(TAG, "Unity Ads Initialization Failed: [" + error + "] " + message);
            }
        });

        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        WebView.setWebContentsDebuggingEnabled(true);

        // Add Javascript Bridge
        myWebView.addJavascriptInterface(new WebAppInterface(), "Android");

        myWebView.setWebViewClient(new WebViewClient());
        myWebView.setWebChromeClient(new android.webkit.WebChromeClient());
        
        myWebView.loadUrl("file:///android_asset/index.html");
    }

    private void loadBanner() {
        if (mBannerView != null) {
            layout.removeView(mBannerView);
            mBannerView.destroy();
        }

        mBannerView = new BannerView(this, BANNER_ID, new UnityBannerSize(320, 50));
        mBannerView.setListener(new BannerView.IListener() {
            @Override
            public void onBannerLoaded(BannerView bannerView) {
                Log.d(TAG, "Banner loaded");
            }

            @Override
            public void onBannerShown(BannerView bannerView) {
                Log.d(TAG, "Banner shown");
            }

            @Override
            public void onBannerClick(BannerView bannerView) {
                Log.d(TAG, "Banner clicked");
            }

            @Override
            public void onBannerFailedToLoad(BannerView bannerView, BannerErrorInfo errorInfo) {
                Log.e(TAG, "Banner failed to load: " + errorInfo.errorMessage);
            }

            @Override
            public void onBannerLeftApplication(BannerView bannerView) {
                Log.d(TAG, "Banner left application");
            }
        });

        RelativeLayout.LayoutParams adParams = new RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        adParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        mBannerView.setLayoutParams(adParams);
        
        layout.addView(mBannerView);
        mBannerView.load();
    }

    public class WebAppInterface {
        @JavascriptInterface
        public void showInterstitial() {
            runOnUiThread(() -> {
                UnityAds.load(INTERSTITIAL_ID, new IUnityAdsLoadListener() {
                    @Override
                    public void onUnityAdsAdLoaded(String placementId) {
                        UnityAds.show(MainActivity.this, placementId, new UnityAdsShowOptions(), new IUnityAdsShowListener() {
                            @Override
                            public void onUnityAdsShowFailure(String placementId, UnityAds.UnityAdsShowError error, String message) {
                                Log.e(TAG, "Interstitial show failed: " + message);
                            }

                            @Override
                            public void onUnityAdsShowStart(String placementId) {
                                Log.d(TAG, "Interstitial show started");
                            }

                            @Override
                            public void onUnityAdsShowClick(String placementId) {
                                Log.d(TAG, "Interstitial clicked");
                            }

                            @Override
                            public void onUnityAdsShowComplete(String placementId, UnityAds.UnityAdsShowCompletionState state) {
                                Log.d(TAG, "Interstitial show complete");
                            }
                        });
                    }

                    @Override
                    public void onUnityAdsFailedToLoad(String placementId, UnityAds.UnityAdsLoadError error, String message) {
                        Log.e(TAG, "Interstitial load failed: " + message);
                    }
                });
            });
        }

        @JavascriptInterface
        public void showRewarded() {
            runOnUiThread(() -> {
                UnityAds.load(REWARDED_ID, new IUnityAdsLoadListener() {
                    @Override
                    public void onUnityAdsAdLoaded(String placementId) {
                        UnityAds.show(MainActivity.this, placementId, new UnityAdsShowOptions(), new IUnityAdsShowListener() {
                            @Override
                            public void onUnityAdsShowFailure(String placementId, UnityAds.UnityAdsShowError error, String message) {
                                Log.e(TAG, "Rewarded show failed: " + message);
                            }

                            @Override
                            public void onUnityAdsShowStart(String placementId) {
                                Log.d(TAG, "Rewarded show started");
                            }

                            @Override
                            public void onUnityAdsShowClick(String placementId) {
                                Log.d(TAG, "Rewarded clicked");
                            }

                            @Override
                            public void onUnityAdsShowComplete(String placementId, UnityAds.UnityAdsShowCompletionState state) {
                                if (state == UnityAds.UnityAdsShowCompletionState.COMPLETED) {
                                    // Reward the user
                                    myWebView.post(() -> myWebView.loadUrl("javascript:window.onAdRewardReceived(10)"));
                                }
                                Log.d(TAG, "Rewarded show complete: " + state);
                            }
                        });
                    }

                    @Override
                    public void onUnityAdsFailedToLoad(String placementId, UnityAds.UnityAdsLoadError error, String message) {
                        Log.e(TAG, "Rewarded load failed: " + message);
                    }
                });
            });
        }

        @JavascriptInterface
        public void setBannerVisible(boolean visible) {
            runOnUiThread(() -> {
                if (mBannerView != null) {
                    mBannerView.setVisibility(visible ? View.VISIBLE : View.GONE);
                }
            });
        }
        
        @JavascriptInterface
        public void showToast(String toast) {
            Toast.makeText(MainActivity.this, toast, Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onBackPressed() {
        if (myWebView.canGoBack()) {
            myWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
