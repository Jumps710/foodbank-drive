// WOFF Manager - Simple and Reliable (Based on working cruto apps)

const WOFFManager = {
    profile: null,
    
    async init(woffId) {
        try {
            console.log('🔄 WOFF Manager init starting...');
            console.log('🔧 WOFF ID:', woffId);
            console.log('🔧 WOFF SDK available:', typeof woff !== 'undefined');
            
            if (typeof woff === 'undefined') {
                console.error('❌ WOFF SDK not found');
                console.log('Available globals:', Object.keys(window).slice(0, 20));
                throw new Error('WOFF SDKがロードされていません。LINE WORKS環境で開いてください。');
            }
            
            console.log('🔄 Calling woff.init...');
            await woff.init({ woffId });
            console.log('✅ woff.init completed');
            
            console.log('🔄 Getting profile...');
            this.profile = await woff.getProfile();
            console.log('✅ Profile obtained:', {
                userId: this.profile.userId,
                displayName: this.profile.displayName,
                department: this.profile.department
            });
            
            return this.profile;
        } catch (err) {
            console.error('❌ WOFF initialization failed:', {
                error: err.message,
                stack: err.stack,
                woffAvailable: typeof woff !== 'undefined'
            });
            throw new Error(`WOFF初期化エラー: ${err.message}`);
        }
    },
    
    getDisplayName() {
        return this.profile?.displayName || "";
    },
    
    getUserId() {
        return this.profile?.userId || "";
    },
    
    getDepartment() {
        return this.profile?.department || "";
    },
    
    getProfile() {
        return this.profile;
    }
};