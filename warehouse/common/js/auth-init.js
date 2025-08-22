// Unified LIFF/WOFF initialization for warehouse system
// Detects the platform and initializes accordingly

// API URLs
window.WAREHOUSE_API_URL = 'https://script.google.com/macros/s/AKfycby3cljD8FT5yBB2VM4Q2pw7Za8OfT6L5m67dtdVfUjnhedNBDK384E3GNBp1XzQFK1g/exec';

// Platform IDs
const LIFF_ID = '2007977152-VaXgDOXk';
const WOFF_ID = 'z-vHKyt_a0GkVpsS9j46NQ';

// Detect platform based on URL or user agent
function detectPlatform() {
    const userAgent = navigator.userAgent;
    const currentURL = window.location.href;
    const referrer = document.referrer;
    
    console.log('Detection Info:', {
        userAgent,
        currentURL,
        referrer,
        woffAvailable: typeof woff !== 'undefined',
        liffAvailable: typeof liff !== 'undefined'
    });
    
    // Check if accessed via WOFF URL or referrer
    if (currentURL.includes('woff.worksmobile.com') || 
        referrer.includes('woff.worksmobile.com') ||
        referrer.includes('works.do') ||
        referrer.includes('worksmobile') ||
        userAgent.includes('WORKS') || 
        userAgent.includes('LineWorks') ||
        userAgent.includes('WorksMobile')) {
        console.log('WOFF platform detected by URL/referrer/UA');
        return 'woff';
    }
    
    // Check if accessed via LIFF URL or LINE browser
    if (currentURL.includes('miniapp.line.me') || 
        referrer.includes('miniapp.line.me') ||
        referrer.includes('line.me') ||
        userAgent.includes('Line/') || 
        userAgent.includes('LIFF/')) {
        return 'liff';
    }
    
    // Check URL parameters for platform hint
    const urlParams = new URLSearchParams(window.location.search);
    const platformParam = urlParams.get('platform');
    if (platformParam === 'woff') return 'woff';
    if (platformParam === 'liff') return 'liff';
    
    // Default to LIFF for direct access (most common case)
    return 'liff';
}

// Initialize based on detected platform
document.addEventListener('DOMContentLoaded', async function() {
    try {
        if (document.getElementById('loading')) {
            document.getElementById('loading').style.display = 'flex';
        }
        
        const platform = detectPlatform();
        console.log('Detected platform:', platform);
        
        // Check SDK availability
        console.log('SDK Status:', {
            liffSDK: typeof liff !== 'undefined',
            woffSDK: typeof woff !== 'undefined',
            liffMethods: typeof liff !== 'undefined' ? Object.keys(liff) : 'N/A',
            woffMethods: typeof woff !== 'undefined' ? Object.keys(woff) : 'N/A'
        });
        
        switch (platform) {
            case 'woff':
                await initializeWOFF();
                break;
            case 'liff':
                await initializeLIFF();
                break;
            default:
                await initializeDevelopment();
                break;
        }
        
    } catch (error) {
        console.error('=== Platform Initialization Failed ===');
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            platform: platform || 'unknown',
            userAgent: navigator.userAgent,
            currentURL: window.location.href,
            referrer: document.referrer
        });
        
        if (document.getElementById('loading')) {
            document.getElementById('loading').style.display = 'none';
        }
        
        // Show detailed error information
        const errorInfo = `
認証の初期化に失敗しました

プラットフォーム: ${platform || 'unknown'}
エラー: ${error.message}
URL: ${window.location.href}
リファラー: ${document.referrer}
UserAgent: ${navigator.userAgent}

デバッグ情報はvConsoleで確認できます。
画面右下の緑色のボタンをタップしてください。
        `;
        
        // Create error display
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 20px; left: 20px; right: 20px; 
            background: #ff4444; color: white; padding: 20px; 
            border-radius: 10px; z-index: 10000; 
            font-family: monospace; font-size: 12px;
            white-space: pre-wrap; word-break: break-all;
            max-height: 300px; overflow-y: auto;
        `;
        errorDiv.textContent = errorInfo;
        document.body.appendChild(errorDiv);
        
        // Also show simple alert for compatibility
        alert('認証の初期化に失敗しました。詳細はエラー表示とvConsoleを確認してください。');
    }
});

// WOFF initialization
async function initializeWOFF() {
    try {
        console.log('=== WOFF Initialization Start ===');
        console.log('WOFF_ID:', WOFF_ID);
        console.log('typeof woff:', typeof woff);
        console.log('window.woff:', window.woff);
        
        if (typeof woff === 'undefined') {
            console.error('WOFF SDK not loaded');
            console.log('Available globals:', Object.keys(window).filter(key => key.toLowerCase().includes('woff')));
            throw new Error('WOFF SDK not available - check if SDK script loaded');
        }
        
        console.log('WOFF SDK available, methods:', Object.keys(woff));
        console.log('Calling woff.init with WOFF_ID:', WOFF_ID);
        
        const initResult = await woff.init({ woffId: WOFF_ID });
        console.log('WOFF init result:', initResult);
        
        console.log('Checking login status...');
        const isLoggedIn = woff.isLoggedIn();
        console.log('WOFF isLoggedIn:', isLoggedIn);
        
        if (!isLoggedIn) {
            console.log('Not logged in, calling woff.login()...');
            const loginResult = woff.login();
            console.log('WOFF login result:', loginResult);
            return;
        }
        
        console.log('Getting WOFF profile...');
        const profile = await woff.getProfile();
        console.log('WOFF profile:', profile);
        
        const context = woff.getContext();
        console.log('WOFF context:', context);
        
        if (typeof window.onAuthInit === 'function') {
            window.onAuthInit({
                profile: profile,
                context: context,
                isInClient: woff.isInClient(),
                language: woff.getLanguage(),
                version: woff.getVersion(),
                platform: 'woff'
            });
        }
        
        console.log('=== WOFF Initialization Complete ===');
        
    } catch (error) {
        console.error('=== WOFF Initialization Error ===');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', error);
        throw error;
    }
}

// LIFF initialization
async function initializeLIFF() {
    if (typeof liff === 'undefined') {
        throw new Error('LIFF SDK not available');
    }
    
    await liff.init({ liffId: LIFF_ID });
    
    if (!liff.isLoggedIn()) {
        liff.login();
        return;
    }
    
    const profile = await liff.getProfile();
    const context = liff.getContext();
    
    if (typeof window.onAuthInit === 'function') {
        window.onAuthInit({
            profile: profile,
            context: context,
            isInClient: liff.isInClient(),
            language: liff.getLanguage(),
            version: liff.getVersion(),
            platform: 'liff'
        });
    }
}

// Development mode initialization
async function initializeDevelopment() {
    console.warn('Running in development mode - no authentication');
    
    if (typeof window.onAuthInit === 'function') {
        window.onAuthInit({
            profile: {
                userId: 'dev-user-id',
                displayName: 'Development User',
                pictureUrl: ''
            },
            context: {
                type: 'utou',
                userId: 'dev-user-id',
                viewType: 'full'
            },
            isInClient: false,
            language: 'ja',
            version: '2.0.0',
            platform: 'dev'
        });
    }
}