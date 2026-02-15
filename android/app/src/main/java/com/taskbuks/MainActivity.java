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
    private static final boolean TEST_MODE = true; // ENABLE TEST MODE FOR DEBUGGING

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
        
        // ... (Edge-to-edge setup) ...
        getWindow().getDecorView().setSystemUiVisibility(
            android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
        getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);

        // 1. Create Main Layout
        layout = new RelativeLayout(this);
        layout.setLayoutParams(new RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // 2. Create WebView
        myWebView = new WebView(this);
        RelativeLayout.LayoutParams webViewParams = new RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        );
        // Add bottom margin so banner doesn't overlap content when visible? 
        // No, we want overlay for translucent effect or just standard docked banner.
        // Let's keep it full screen for now.
        myWebView.setLayoutParams(webViewParams);
        layout.addView(myWebView);

        // 3. Pre-initialize Banner View (Add to layout GONE)
        setupBannerView();

        setContentView(layout);

        // 4. Initialize Unity Ads
        UnityAds.initialize(getApplicationContext(), UNITY_GAME_ID, TEST_MODE, new IUnityAdsInitializationListener() {
            @Override
            public void onInitializationComplete() {
                Log.d(TAG, "Unity Ads Initialization Complete");
                runOnUiThread(() -> {
                    // Load banner content now that SDK is ready
                    if (mBannerView != null) mBannerView.load();
                });
            }

            @Override
            public void onInitializationFailed(UnityAds.UnityAdsInitializationError error, String message) {
                Log.e(TAG, "Unity Ads Init Failed: " + message);
            }
        });

        // ... (WebView Settings) ...
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        WebView.setWebContentsDebuggingEnabled(true);

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
        
        // Load from virtual domain instead of file://
        myWebView.loadUrl("https://app.assets.local/index.html");
    }

    private void setupBannerView() {
        mBannerView = new BannerView(this, BANNER_ID, new UnityBannerSize(320, 50));
        
        // Listener
        mBannerView.setListener(new BannerView.IListener() {
            @Override
            public void onBannerLoaded(BannerView bannerView) {
                Log.d(TAG, "Banner loaded successfully");
                // If visibility was requested, show it now
                if (isBannerVisible) {
                    mBannerView.setVisibility(View.VISIBLE);
                    mBannerView.bringToFront();
                }
            }
            @Override
            public void onBannerShown(BannerView bannerView) { }
            @Override
            public void onBannerClick(BannerView bannerView) { }
            @Override
            public void onBannerFailedToLoad(BannerView bannerView, BannerErrorInfo errorInfo) {
                Log.e(TAG, "Banner Load Failed: " + errorInfo.errorMessage);
                // runOnUiThread(() -> Toast.makeText(MainActivity.this, "Banner Error: " + errorInfo.errorMessage, Toast.LENGTH_LONG).show());
            }
            @Override
            public void onBannerLeftApplication(BannerView bannerView) { }
        });

        // Layout Params - Align Parent Bottom
        RelativeLayout.LayoutParams adParams = new RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        adParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        mBannerView.setLayoutParams(adParams);
        
        // Add to layout but Hidden
        mBannerView.setVisibility(View.GONE);
        layout.addView(mBannerView);
    }

    // Removed old loadBanner since checking is moved to setup+init
    private void loadBanner() { 
        if (mBannerView != null) mBannerView.load(); 
    }

    // ... (WebAppInterface class) ...

    public class WebAppInterface {
        // ... (other methods) ...

        @JavascriptInterface
        public void setBannerVisible(boolean visible) {
            isBannerVisible = visible; // Update state tracking
            runOnUiThread(() -> {
                if (mBannerView != null) {
                    if (visible) {
                        mBannerView.setVisibility(View.VISIBLE);
                        mBannerView.bringToFront();
                    } else {
                        mBannerView.setVisibility(View.GONE);
                    }
                } else {
                     Log.w(TAG, "setBannerVisible called but mBannerView is null. Request queued.");
                     if (visible && UnityAds.isInitialized()) {
                         // Attempt to load if initialized but null (recovery)
                         loadBanner();
                     }
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
