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
    const isWoffEnvironment = currentURL.includes('woff.worksmobile.com') || 
        referrer.includes('woff.worksmobile.com') ||
        referrer.includes('works.do') ||
        referrer.includes('worksmobile') ||
        userAgent.includes('WORKS') || 
        userAgent.includes('LineWorks') ||
        userAgent.includes('WorksMobile') ||
        // Additional WOFF indicators
        userAgent.includes('Mobile/') && referrer.includes('worksmobile') ||
        currentURL.includes('staff.html'); // Staff page defaults to WOFF
        
    if (isWoffEnvironment) {
        console.log('WOFF platform detected by URL/referrer/UA');
        return 'woff';
    }
    
    // Check if accessed via LIFF URL or LINE browser
    if (currentURL.includes('miniapp.line.me') || 
        referrer.includes('miniapp.line.me') ||
        referrer.includes('line.me') ||
        userAgent.includes('Line/') || 
        userAgent.includes('LIFF/')) {
        console.log('LIFF platform detected by URL/referrer/UA');
        return 'liff';
    }
    
    // Check URL parameters for explicit platform specification first
    const urlParams = new URLSearchParams(window.location.search);
    const platformParam = urlParams.get('platform');
    if (platformParam === 'woff') {
        console.log('WOFF platform detected by URL parameter');
        return 'woff';
    }
    if (platformParam === 'liff') {
        console.log('LIFF platform detected by URL parameter');
        return 'liff';
    }
    if (platformParam === 'dev') {
        console.log('Development mode forced by URL parameter');
        return 'dev';
    }
    
    // Check for development environment indicators
    if (currentURL.includes('localhost') ||
        currentURL.includes('127.0.0.1') ||
        currentURL.includes('file://') ||
        window.location.hostname === '') {
        console.log('Development platform detected');
        return 'dev';
    }
    
    // Default fallback - prefer development mode for testing
    console.log('No specific platform detected, defaulting to development mode');
    return 'dev';
}

// Wait for SDK load with retry mechanism
async function waitForSDK(sdkName, timeout = 15000) { // Increased timeout to 15 seconds
    const startTime = Date.now();
    const checkInterval = 200; // Increased interval for better performance
    
    console.log(`Starting ${sdkName.toUpperCase()} SDK wait...`);
    
    while (Date.now() - startTime < timeout) {
        // Check multiple ways to access the SDK
        if (sdkName === 'woff') {
            if (typeof woff !== 'undefined' || typeof window.woff !== 'undefined') {
                const detectedTime = Date.now() - startTime;
                console.log(`WOFF SDK detected after ${detectedTime}ms`);
                
                // Ensure woff is globally accessible
                if (typeof woff === 'undefined' && typeof window.woff !== 'undefined') {
                    window.woff = window.woff;
                    console.log('Set window.woff to global woff');
                }
                
                return true;
            }
        }
        
        if (sdkName === 'liff') {
            if (typeof liff !== 'undefined' || typeof window.liff !== 'undefined') {
                const detectedTime = Date.now() - startTime;
                console.log(`LIFF SDK detected after ${detectedTime}ms`);
                
                // Ensure liff is globally accessible
                if (typeof liff === 'undefined' && typeof window.liff !== 'undefined') {
                    window.liff = window.liff;
                    console.log('Set window.liff to global liff');
                }
                
                return true;
            }
        }
        
        // Log progress every 2 seconds
        if ((Date.now() - startTime) % 2000 < checkInterval) {
            console.log(`Still waiting for ${sdkName.toUpperCase()} SDK... (${Math.round((Date.now() - startTime) / 1000)}s)`);
        }
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.error(`${sdkName.toUpperCase()} SDK not loaded after ${timeout}ms`);
    console.error('Final SDK status check:', {
        [sdkName]: typeof window[sdkName] !== 'undefined',
        windowKeys: Object.keys(window).filter(key => key.toLowerCase().includes(sdkName))
    });
    return false;
}

// Initialize based on detected platform
document.addEventListener('DOMContentLoaded', async function() {
    let platform = null;
    
    try {
        if (document.getElementById('loading')) {
            document.getElementById('loading').style.display = 'flex';
        }
        
        platform = detectPlatform();
        console.log('Detected platform:', platform);
        
        // Add debug info about script loading
        console.log('Script elements in page:', Array.from(document.getElementsByTagName('script')).map(s => ({
            src: s.src,
            loaded: !s.src || s.complete || s.readyState === 'complete'
        })));
        
        // Check SDK availability immediately
        console.log('Initial SDK Status:', {
            liffSDK: typeof liff !== 'undefined',
            woffSDK: typeof woff !== 'undefined',
            liffMethods: typeof liff !== 'undefined' ? Object.keys(liff) : 'N/A',
            woffMethods: typeof woff !== 'undefined' ? Object.keys(woff) : 'N/A'
        });
        
        // Wait for SDK if needed
        if (platform === 'woff') {
            // Check if WOFF SDK is available or mock is created
            if (typeof woff === 'undefined') {
                console.log('WOFF platform detected but SDK not available, waiting...');
                const loaded = await waitForSDK('woff');
                if (!loaded) {
                    console.warn('WOFF SDK failed to load completely');
                    // Check if we have a mock WOFF or load failed
                    if (window.woffLoadStatus === 'failed' && typeof woff !== 'undefined') {
                        console.log('Using mock WOFF object for authentication');
                        platform = 'woff'; // Continue with WOFF platform using mock
                    } else if (currentURL.includes('staff.html')) {
                        console.warn('Staff page: forcing development mode due to WOFF unavailability');
                        platform = 'dev';
                    } else {
                        console.warn('WOFF SDK load timeout, falling back to development mode');
                        platform = 'dev';
                    }
                }
            } else {
                console.log('WOFF SDK available (real or mock)');
            }
        } else if (platform === 'liff') {
            if (typeof liff === 'undefined') {
                console.log('LIFF platform detected but SDK not available, waiting...');
                const loaded = await waitForSDK('liff');
                if (!loaded) {
                    console.warn('LIFF SDK load timeout, falling back to development mode');
                    platform = 'dev';
                }
            } else {
                console.log('LIFF SDK already available');
            }
        }
        
        // Re-check SDK availability after wait
        console.log('Post-wait SDK Status:', {
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
        
        // Try fallback to development mode
        console.warn('Attempting fallback to development mode...');
        try {
            await initializeDevelopment();
            errorDiv.style.background = '#ff8800';
            errorDiv.textContent += '\n\n開発モードで動作しています。';
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            alert('認証の初期化に失敗しました。詳細はエラー表示とvConsoleを確認してください。');
        }
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
            console.log('WOFF load status:', window.woffLoadStatus);
            
            // Try alternative SDK access methods
            if (window.woff) {
                console.log('Found window.woff, using that instead');
                window.woff = window.woff;
            } else {
                throw new Error('WOFF SDK not available - check if SDK script loaded');
            }
        }
        
        // Check if this is a mock WOFF object
        const isMockWOFF = woff && woff.getVersion && woff.getVersion().includes('mock');
        if (isMockWOFF) {
            console.log('Detected mock WOFF object - using for testing');
        }
        
        console.log('WOFF SDK available, methods:', Object.keys(woff));
        
        // Validate essential methods exist
        const requiredMethods = ['init', 'isLoggedIn', 'login', 'getProfile', 'getContext'];
        const missingMethods = requiredMethods.filter(method => typeof woff[method] !== 'function');
        
        if (missingMethods.length > 0) {
            throw new Error(`WOFF SDK missing required methods: ${missingMethods.join(', ')}`);
        }
        
        console.log('Calling woff.init with WOFF_ID:', WOFF_ID);
        
        // Add timeout for init call
        const initPromise = woff.init({ woffId: WOFF_ID });
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('WOFF init timeout')), 10000)
        );
        
        const initResult = await Promise.race([initPromise, timeoutPromise]);
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
        const profilePromise = woff.getProfile();
        const profileTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('WOFF getProfile timeout')), 5000)
        );
        
        const profile = await Promise.race([profilePromise, profileTimeoutPromise]);
        console.log('WOFF profile:', profile);
        
        const context = woff.getContext();
        console.log('WOFF context:', context);
        
        if (typeof window.onAuthInit === 'function') {
            window.onAuthInit({
                profile: profile,
                context: context,
                isInClient: woff.isInClient ? woff.isInClient() : false,
                language: woff.getLanguage ? woff.getLanguage() : 'ja',
                version: woff.getVersion ? woff.getVersion() : '2.0.0',
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
        
        // Add debug info for common issues
        if (error.message.includes('timeout')) {
            console.error('This may be a network connectivity issue or WOFF service problem');
        } else if (error.message.includes('not available')) {
            console.error('SDK loading issue - check network and script tags');
        }
        
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