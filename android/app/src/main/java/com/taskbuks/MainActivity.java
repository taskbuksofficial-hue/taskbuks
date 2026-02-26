package com.taskbuks;

import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
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
    private static final String UNITY_GAME_ID = "6044176";
    private static final boolean TEST_MODE = false; // PRODUCTION MODE

    private static final String INTERSTITIAL_ID = "Interstitial_Android";
    private static final String REWARDED_ID = "Rewarded_Android";
    private static final String BANNER_ID = "Banner_Android";

    private WebView myWebView;
    private RelativeLayout layout;
    private BannerView mBannerView;
    private boolean isBannerVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Edge-to-edge setup
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                        View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR // DEFAULT TO DARK ICONS
        );
        getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);

        // 1. Create Main Layout
        layout = new RelativeLayout(this);
        layout.setLayoutParams(new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        // 2. Create WebView
        myWebView = new WebView(this);
        myWebView.setLayoutParams(new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        layout.addView(myWebView);

        // 3. Pre-initialize Banner View
        setupBannerView();

        setContentView(layout);

        // 4. Initialize Unity Ads
        UnityAds.initialize(getApplicationContext(), UNITY_GAME_ID, TEST_MODE, new IUnityAdsInitializationListener() {
            @Override
            public void onInitializationComplete() {
                Log.d(TAG, "Unity Ads Initialization Complete");
                runOnUiThread(() -> {
                    // Load and pre-cache ads
                    loadBanner();
                    loadInterstitial();
                    loadRewarded();

                    // Auto-show banner at bottom after 3 seconds
                    new android.os.Handler().postDelayed(() -> {
                        isBannerVisible = true;
                        if (mBannerView != null) {
                            mBannerView.setVisibility(View.VISIBLE);
                            mBannerView.bringToFront();
                        }
                    }, 3000);
                });
            }

            @Override
            public void onInitializationFailed(UnityAds.UnityAdsInitializationError error, String message) {
                Log.e(TAG, "Unity Ads Init Failed: " + message);
            }
        });

        // Prevent black flash on launch
        myWebView.setBackgroundColor(android.graphics.Color.WHITE);

        // WebView Settings
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        WebView.setWebContentsDebuggingEnabled(true);

        // === AGGRESSIVE CACHING for fast loads ===
        webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        webSettings.setDatabaseEnabled(true);
        String cachePath = getApplicationContext().getCacheDir().getAbsolutePath();
        // webSettings.setAppCachePath(cachePath); // Deprecated in API 33+

        // WebViewAssetLoader setup
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .setDomain("app.assets.local")
                .build();

        myWebView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
        });

        myWebView.addJavascriptInterface(new WebAppInterface(), "Android");
        myWebView.setWebChromeClient(new android.webkit.WebChromeClient());

        myWebView.loadUrl("https://app.assets.local/index.html");
    }

    private void setupBannerView() {
        mBannerView = new BannerView(this, BANNER_ID, new UnityBannerSize(320, 50));
        mBannerView.setListener(new BannerView.IListener() {
            @Override
            public void onBannerLoaded(BannerView bannerView) {
                Log.d(TAG, "Banner loaded");
                if (isBannerVisible) {
                    mBannerView.setVisibility(View.VISIBLE);
                    mBannerView.bringToFront();
                }
            }

            @Override
            public void onBannerShown(BannerView bannerView) {
            }

            @Override
            public void onBannerClick(BannerView bannerView) {
            }

            @Override
            public void onBannerFailedToLoad(BannerView bannerView, BannerErrorInfo errorInfo) {
                Log.e(TAG, "Banner Load Failed: " + errorInfo.errorMessage);
                // Retry after 10 seconds
                new android.os.Handler().postDelayed(() -> loadBanner(), 10000);
            }

            @Override
            public void onBannerLeftApplication(BannerView bannerView) {
            }
        });

        // Add background for debug visibility (Safe Area Box)
        mBannerView.setBackgroundColor(android.graphics.Color.argb(50, 0, 0, 0)); // Subtle translucent black

        RelativeLayout.LayoutParams adParams = new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
        adParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        adParams.addRule(RelativeLayout.CENTER_HORIZONTAL);

        mBannerView.setLayoutParams(adParams);
        mBannerView.setVisibility(View.GONE);
        layout.addView(mBannerView);

        // SAFE AREA FIX: Adjust for bottom navigation bar
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT_WATCH) {
            layout.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                @Override
                public android.view.WindowInsets onApplyWindowInsets(View v, android.view.WindowInsets insets) {
                    int bottomInset = 0;
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                        bottomInset = insets.getInsets(android.view.WindowInsets.Type.systemBars()).bottom;
                    } else {
                        bottomInset = insets.getSystemWindowInsetBottom();
                    }

                    // Apply margin to banner to push it above the Bottom Navigation Bar (Safe Area)
                    RelativeLayout.LayoutParams params = (RelativeLayout.LayoutParams) mBannerView.getLayoutParams();
                    params.bottomMargin = bottomInset;
                    mBannerView.setLayoutParams(params);

                    return insets;
                }
            });
        }
    }

    private void loadBanner() {
        if (mBannerView != null)
            mBannerView.load();
    }

    private void loadInterstitial() {
        UnityAds.load(INTERSTITIAL_ID, new IUnityAdsLoadListener() {
            @Override
            public void onUnityAdsAdLoaded(String placementId) {
                Log.d(TAG, "Interstitial Loaded: " + placementId);
            }

            @Override
            public void onUnityAdsFailedToLoad(String placementId, UnityAds.UnityAdsLoadError error, String message) {
                Log.e(TAG, "Interstitial Load Failed: " + message);
            }
        });
    }

    private void loadRewarded() {
        UnityAds.load(REWARDED_ID, new IUnityAdsLoadListener() {
            @Override
            public void onUnityAdsAdLoaded(String placementId) {
                Log.d(TAG, "Rewarded Loaded: " + placementId);
            }

            @Override
            public void onUnityAdsFailedToLoad(String placementId, UnityAds.UnityAdsLoadError error, String message) {
                Log.e(TAG, "Rewarded Load Failed: " + message);
            }
        });
    }

    public class WebAppInterface {
        @JavascriptInterface
        public void showInterstitial() {
            runOnUiThread(() -> {
                UnityAds.show(MainActivity.this, INTERSTITIAL_ID, new UnityAdsShowOptions(),
                        new IUnityAdsShowListener() {
                            @Override
                            public void onUnityAdsShowFailure(String placementId, UnityAds.UnityAdsShowError error,
                                    String message) {
                                Log.e(TAG, "Interstitial Show Fail: " + message);
                                loadInterstitial();
                            }

                            @Override
                            public void onUnityAdsShowStart(String placementId) {
                            }

                            @Override
                            public void onUnityAdsShowClick(String placementId) {
                            }

                            @Override
                            public void onUnityAdsShowComplete(String placementId,
                                    UnityAds.UnityAdsShowCompletionState state) {
                                loadInterstitial();
                            }
                        });
            });
        }

        @JavascriptInterface
        public void showRewarded() {
            runOnUiThread(() -> {
                UnityAds.show(MainActivity.this, REWARDED_ID, new UnityAdsShowOptions(), new IUnityAdsShowListener() {
                    @Override
                    public void onUnityAdsShowFailure(String placementId, UnityAds.UnityAdsShowError error,
                            String message) {
                        Log.e(TAG, "Rewarded Show Fail: " + message);
                        loadRewarded();
                    }

                    @Override
                    public void onUnityAdsShowStart(String placementId) {
                    }

                    @Override
                    public void onUnityAdsShowClick(String placementId) {
                    }

                    @Override
                    public void onUnityAdsShowComplete(String placementId, UnityAds.UnityAdsShowCompletionState state) {
                        if (state == UnityAds.UnityAdsShowCompletionState.COMPLETED) {
                            myWebView.post(() -> myWebView.evaluateJavascript(
                                    "if(window.onAdRewardReceived) window.onAdRewardReceived(50);", null));
                        }
                        loadRewarded();
                    }
                });
            });
        }

        @JavascriptInterface
        public void setBannerVisible(boolean visible) {
            isBannerVisible = visible;
            runOnUiThread(() -> {
                if (mBannerView != null) {
                    if (visible) {
                        mBannerView.setVisibility(View.VISIBLE);
                        mBannerView.bringToFront();
                        loadBanner(); // Ensure it reloads/shows every time it's toggled ON
                    } else {
                        mBannerView.setVisibility(View.GONE);
                    }
                } else if (visible) {
                    loadBanner();
                }
            });
        }

        @JavascriptInterface
        public void setStatusBarMode(String mode) {
            runOnUiThread(() -> {
                int flags = getWindow().getDecorView().getSystemUiVisibility();
                if ("dark".equals(mode)) {
                    // Dark Icons (Light Mode)
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                } else {
                    // White Icons (Dark Mode)
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                }
                getWindow().getDecorView().setSystemUiVisibility(flags);
            });
        }

        @JavascriptInterface
        public String getDeviceId() {
            return android.provider.Settings.Secure.getString(
                    getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
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
