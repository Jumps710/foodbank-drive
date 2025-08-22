// WOFF (LINE WORKS Front-end Framework) initialization for warehouse system

// API URLs
window.WAREHOUSE_API_URL = 'https://script.google.com/macros/s/AKfycby3cljD8FT5yBB2VM4Q2pw7Za8OfT6L5m67dtdVfUjnhedNBDK384E3GNBp1XzQFK1g/exec';

// WOFF ID
const WOFF_ID = 'z-vHKyt_a0GkVpsS9j46NQ';

// Initialize WOFF
document.addEventListener('DOMContentLoaded', async function() {
    try {
        if (document.getElementById('loading')) {
            document.getElementById('loading').style.display = 'flex';
        }
        
        // Check if WOFF SDK is available
        if (typeof woff !== 'undefined' && WOFF_ID) {
            await woff.init({ woffId: WOFF_ID });
            
            if (!woff.isLoggedIn()) {
                woff.login();
                return;
            }
            
            const profile = await woff.getProfile();
            const context = woff.getContext();
            
            if (typeof window.onWoffInit === 'function') {
                window.onWoffInit({
                    profile: profile,
                    context: context,
                    isInClient: woff.isInClient(),
                    language: woff.getLanguage(),
                    version: woff.getVersion(),
                    platform: 'woff'
                });
            }
        } else if (typeof liff !== 'undefined') {
            // Fallback to LIFF if WOFF is not available
            const LIFF_ID = '2007977152-VaXgDOXk';
            await liff.init({ liffId: LIFF_ID });
            
            if (!liff.isLoggedIn()) {
                liff.login();
                return;
            }
            
            const profile = await liff.getProfile();
            const context = liff.getContext();
            
            if (typeof window.onWoffInit === 'function') {
                window.onWoffInit({
                    profile: profile,
                    context: context,
                    isInClient: liff.isInClient(),
                    language: liff.getLanguage(),
                    version: liff.getVersion(),
                    platform: 'liff'
                });
            }
        } else {
            console.warn('Neither WOFF nor LIFF SDK available. Running in development mode.');
            if (typeof window.onWoffInit === 'function') {
                window.onWoffInit({
                    profile: {
                        userId: 'test-staff-id',
                        displayName: 'テストスタッフ',
                        pictureUrl: ''
                    },
                    context: {
                        type: 'utou',
                        userId: 'test-staff-id',
                        viewType: 'full'
                    },
                    isInClient: false,
                    language: 'ja',
                    version: '2.0.0',
                    platform: 'dev'
                });
            }
        }
    } catch (error) {
        console.error('WOFF/LIFF initialization failed:', error);
        if (document.getElementById('loading')) {
            document.getElementById('loading').style.display = 'none';
        }
        alert('認証の初期化に失敗しました。ページを再読み込みしてください。');
    }
});