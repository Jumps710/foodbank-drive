// LIFF initialization for warehouse system

// API URLs
window.WAREHOUSE_API_URL = 'https://script.google.com/macros/s/AKfycby3cljD8FT5yBB2VM4Q2pw7Za8OfT6L5m67dtdVfUjnhedNBDK384E3GNBp1XzQFK1g/exec';
window.KODOMO_NW_API_URL = 'https://script.google.com/macros/s/AKfycbwyDc0GFNBChfjsbiAP9HLmWTWELhUPUOcsbV1iQZagEbUf-wHm1dLYJdx2XTkWLT8E8Q/exec';

// LIFF ID
const LIFF_ID = '2007977152-VaXgDOXk';

// Initialize LIFF
document.addEventListener('DOMContentLoaded', async function() {
    try {
        if (document.getElementById('loading')) {
            document.getElementById('loading').style.display = 'flex';
        }
        
        if (LIFF_ID) {
            await liff.init({ liffId: LIFF_ID });
            
            if (!liff.isLoggedIn()) {
                liff.login();
                return;
            }
            
            const profile = await liff.getProfile();
            const context = liff.getContext();
            
            if (typeof window.onLiffInit === 'function') {
                window.onLiffInit({
                    profile: profile,
                    context: context,
                    isInClient: liff.isInClient(),
                    language: liff.getLanguage(),
                    version: liff.getVersion()
                });
            }
        } else {
            console.warn('LIFF ID not set. Running in development mode.');
            if (typeof window.onLiffInit === 'function') {
                window.onLiffInit({
                    profile: {
                        userId: 'test-user-id',
                        displayName: 'テストユーザー',
                        pictureUrl: ''
                    },
                    context: {
                        type: 'utou',
                        userId: 'test-user-id',
                        viewType: 'full'
                    },
                    isInClient: false,
                    language: 'ja',
                    version: '2.0.0'
                });
            }
        }
    } catch (error) {
        console.error('LIFF initialization failed:', error);
        if (document.getElementById('loading')) {
            document.getElementById('loading').style.display = 'none';
        }
        alert('LIFFの初期化に失敗しました。ページを再読み込みしてください。');
    }
});