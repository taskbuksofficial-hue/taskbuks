package com.taskbuks;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends AppCompatActivity {

    private WebView myWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        myWebView = new WebView(this);
        setContentView(myWebView);

        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        WebView.setWebContentsDebuggingEnabled(true);

        myWebView.setWebViewClient(new WebViewClient());
        myWebView.setWebChromeClient(new android.webkit.WebChromeClient());
        
        // Load the local HTML file (needs to be in assets) or a remote URL
        // For now, let's assume we might serve it locally or verify connection
        // ideally: myWebView.loadUrl("file:///android_asset/index.html");
        // But since we haven't moved assets yet, let's just stick a placeholder or logic.
        // If the user wants to test the "shift" architecture, they might be expecting
        // it to hit the backend or a hosted frontend.
        // Let's load a simple placeholder for now or the backend health check if running.
        
        // Load the local HTML file from assets
        myWebView.loadUrl("file:///android_asset/index.html");
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
