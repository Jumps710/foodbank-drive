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
        console.error('Platform initialization failed:', error);
        if (document.getElementById('loading')) {
            document.getElementById('loading').style.display = 'none';
        }
        alert('認証の初期化に失敗しました。ページを再読み込みしてください。');
    }
});

// WOFF initialization
async function initializeWOFF() {
    console.log('Initializing WOFF...');
    
    if (typeof woff === 'undefined') {
        console.error('WOFF SDK not available');
        throw new Error('WOFF SDK not available');
    }
    
    console.log('WOFF SDK available, initializing with ID:', WOFF_ID);
    await woff.init({ woffId: WOFF_ID });
    
    console.log('WOFF initialized, checking login status...');
    if (!woff.isLoggedIn()) {
        console.log('Not logged in, redirecting to WOFF login...');
        woff.login();
        return;
    }
    
    console.log('WOFF logged in, getting profile...');
    const profile = await woff.getProfile();
    const context = woff.getContext();
    
    console.log('WOFF profile retrieved:', profile);
    
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