// WOFF Manager - Simple and Reliable (Based on working cruto apps)

const WOFFManager = {
    profile: null,
    
    async init(woffId) {
        try {
            if (typeof woff === 'undefined') {
                throw new Error('WOFF SDKがロードされていません');
            }
            
            console.log('🔄 WOFF initialization starting...');
            await woff.init({ woffId });
            this.profile = await woff.getProfile();
            console.log('✅ WOFF initialization successful:', this.profile);
            
            return this.profile;
        } catch (err) {
            console.error('❌ WOFF initialization failed:', err);
            throw err;
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