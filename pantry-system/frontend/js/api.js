/**
 * API通信クライアント
 */
class ApiClient {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
        this.adminToken = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
        this.firebaseToken = null;
    }

    /**
     * HTTP リクエスト送信
     */
    async request(endpoint, method = 'GET', data = null, useFormData = false) {
        try {
            console.log('🌐 API Request:', method, endpoint, data);
            
            // Firebase認証状態を自動取得
            await this.updateFirebaseToken();
            
            const url = this.baseUrl + endpoint;
            const options = {
                method: method,
                headers: {}
            };

            if (method === 'POST' && data) {
                if (useFormData) {
                    // GAS では FormData を直接受け取れないため、URLエンコードを使用
                    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    options.body = new URLSearchParams(data).toString();
                } else {
                    // JSON データの場合
                    options.headers['Content-Type'] = 'application/json';
                    
                    // GAS の doPost は postData.contents から JSON を取得
                    const requestData = {
                        action: data.action || endpoint.split('=')[1] || 'unknown',
                        data: data,
                        adminToken: this.adminToken,
                        firebaseToken: this.firebaseToken
                    };
                    
                    options.body = JSON.stringify(requestData);
                }
            } else if (method === 'GET') {
                // GETリクエストでもFirebaseトークンを含める
                const urlObj = new URL(url);
                if (this.firebaseToken) {
                    urlObj.searchParams.set('firebaseToken', this.firebaseToken);
                }
                if (this.adminToken) {
                    urlObj.searchParams.set('adminToken', this.adminToken);
                }
                options.url = urlObj.toString();
            }

            const fetchUrl = options.url || url;
            const response = await fetch(fetchUrl, options);
            
            // GAS Web App は常に 200 を返すため、レスポンス内容でエラーを判定
            const responseText = await response.text();
            
            try {
                const result = JSON.parse(responseText);
                return result;
            } catch (parseError) {
                console.error('JSON解析エラー:', parseError);
                console.error('レスポンス内容:', responseText);
                throw new Error('サーバーからの応答が無効です');
            }
            
        } catch (error) {
            console.error('API通信エラー:', error);
            throw error;
        }
    }

    /**
     * GET リクエスト
     */
    async get(endpoint) {
        return this.request(endpoint, 'GET');
    }

    /**
     * POST リクエスト
     */
    async post(endpoint, data) {
        return this.request(endpoint, 'POST', data);
    }

    // === 公開API ===

    /**
     * 現在アクティブなパントリー取得
     */
    async getCurrentActivePantry() {
        return this.get(CONFIG.ENDPOINTS.GET_CURRENT_PANTRY);
    }

    /**
     * 予約作成
     */
    async createReservation(reservationData) {
        return this.post(CONFIG.ENDPOINTS.CREATE_RESERVATION, {
            action: 'createReservation',
            ...reservationData
        });
    }

    /**
     * 統計データ取得
     */
    async getStatistics(filters = {}) {
        return this.get(CONFIG.ENDPOINTS.GET_STATISTICS);
    }

    // === 管理API ===

    /**
     * Firebase認証トークンを設定
     */
    setFirebaseToken(token) {
        this.firebaseToken = token;
    }

    /**
     * Firebase認証状態を自動更新
     */
    async updateFirebaseToken() {
        try {
            if (window.firebaseAuthManager && window.firebaseAuthManager.isAuthenticated()) {
                const token = await window.firebaseAuthManager.getIdToken();
                if (token) {
                    this.firebaseToken = token;
                }
            }
        } catch (error) {
            console.warn('Firebaseトークン更新エラー:', error);
        }
    }

    /**
     * 管理者ログイン（Firebase）
     */
    async adminLogin(credentials) {
        try {
            // Firebase認証を実行
            const authResult = await window.firebaseAuthManager.signInWithEmailAndPassword(
                credentials.email, 
                credentials.password
            );
            
            if (authResult.success) {
                console.log('Firebase ログイン成功:', authResult.user.email);
                
                // Firebaseトークンを設定
                this.setFirebaseToken(authResult.token);
                
                try {
                    // GASに認証情報を送信してセッション確立
                    const result = await this.post(CONFIG.ENDPOINTS.ADMIN_LOGIN, {
                        action: 'adminLogin',
                        firebaseToken: authResult.token,
                        uid: authResult.user.uid,
                        email: authResult.user.email
                    });
                    
                    if (result.success) {
                        this.adminToken = result.token;
                        localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN, result.token);
                        console.log('GAS セッション確立成功');
                    } else {
                        console.warn('GAS セッション確立失敗:', result.error);
                    }
                    
                    // Firebase認証が成功していれば、GAS通信エラーがあっても成功とみなす
                    return {
                        success: true,
                        user: authResult.user,
                        token: authResult.token,
                        gasSessionEstablished: result.success,
                        message: result.success ? 'ログインが完了しました' : 'ログインは成功しましたが、セッション確立でエラーが発生しました'
                    };
                    
                } catch (gasError) {
                    console.warn('GAS API通信エラー:', gasError);
                    
                    // Firebase認証は成功しているので、部分的成功として扱う
                    return {
                        success: true,
                        user: authResult.user,
                        token: authResult.token,
                        gasSessionEstablished: false,
                        message: 'Firebaseログインは成功しました。管理機能の一部が制限される可能性があります。',
                        warning: 'サーバー通信エラー: ' + gasError.message
                    };
                }
            } else {
                return authResult;
            }
        } catch (error) {
            console.error('ログインエラー:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    /**
     * 管理者アカウント作成（Firebase）
     */
    async adminRegister(credentials) {
        try {
            // Firebase アカウント作成を実行
            const authResult = await window.firebaseAuthManager.createUserWithEmailAndPassword(
                credentials.email, 
                credentials.password
            );
            
            if (authResult.success) {
                console.log('Firebase アカウント作成成功:', authResult.user.email);
                
                // Firebaseトークンを設定
                this.setFirebaseToken(authResult.token);
                
                try {
                    // GASに新規ユーザー情報を送信
                    const result = await this.post(CONFIG.ENDPOINTS.ADMIN_LOGIN, {
                        action: 'adminRegister',
                        firebaseToken: authResult.token,
                        uid: authResult.user.uid,
                        email: authResult.user.email
                    });
                    
                    if (result.success) {
                        this.adminToken = result.token;
                        localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN, result.token);
                        console.log('GAS セッション確立成功');
                    } else {
                        console.warn('GAS セッション確立失敗:', result.error);
                    }
                    
                    // Firebase認証が成功していれば、GAS通信エラーがあっても成功とみなす
                    return {
                        success: true,
                        user: authResult.user,
                        token: authResult.token,
                        gasSessionEstablished: result.success,
                        message: result.success ? 'アカウント作成とセッション確立が完了しました' : 'アカウント作成は成功しましたが、セッション確立でエラーが発生しました'
                    };
                    
                } catch (gasError) {
                    console.warn('GAS API通信エラー:', gasError);
                    
                    // Firebase認証は成功しているので、部分的成功として扱う
                    return {
                        success: true,
                        user: authResult.user,
                        token: authResult.token,
                        gasSessionEstablished: false,
                        message: 'Firebaseアカウント作成は成功しました。管理機能の一部が制限される可能性があります。',
                        warning: 'サーバー通信エラー: ' + gasError.message
                    };
                }
            } else {
                return authResult;
            }
        } catch (error) {
            console.error('アカウント作成エラー:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    /**
     * 管理者ログアウト
     */
    async adminLogout() {
        this.adminToken = null;
        this.firebaseToken = null;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
        
        // Firebase ログアウト
        if (window.firebaseAuthManager) {
            await window.firebaseAuthManager.signOut();
        }
    }

    /**
     * 認証チェック
     */
    isAuthenticated() {
        return !!this.adminToken && window.firebaseAuthManager?.isAuthenticated();
    }

    /**
     * パントリー一覧取得
     */
    async adminGetPantries(filters = {}) {
        return this.get(CONFIG.ENDPOINTS.ADMIN_GET_PANTRIES);
    }

    /**
     * パントリー作成
     */
    async adminCreatePantry(pantryData) {
        return this.post(CONFIG.ENDPOINTS.ADMIN_CREATE_PANTRY, {
            action: 'adminCreatePantry',
            data: pantryData
        });
    }

    /**
     * パントリー更新
     */
    async adminUpdatePantry(pantryData) {
        return this.post(CONFIG.ENDPOINTS.ADMIN_UPDATE_PANTRY, {
            action: 'adminUpdatePantry',
            data: pantryData
        });
    }

    /**
     * パントリー削除
     */
    async adminDeletePantry(pantryId) {
        return this.post(CONFIG.ENDPOINTS.ADMIN_DELETE_PANTRY, {
            action: 'adminDeletePantry',
            pantryId: pantryId
        });
    }

    /**
     * 予約一覧取得
     */
    async adminGetReservations(filters = {}) {
        return this.get(CONFIG.ENDPOINTS.ADMIN_GET_RESERVATIONS);
    }

    /**
     * 予約キャンセル
     */
    async adminCancelReservation(reservationId) {
        return this.post(CONFIG.ENDPOINTS.ADMIN_CANCEL_RESERVATION, {
            action: 'adminCancelReservation',
            reservationId: reservationId
        });
    }

    /**
     * ユーザー一覧取得
     */
    async adminGetUsers(filters = {}) {
        return this.get(CONFIG.ENDPOINTS.ADMIN_GET_USERS);
    }

    /**
     * ユーザー詳細取得
     */
    async adminGetUserDetail(userId) {
        return this.post(CONFIG.ENDPOINTS.ADMIN_GET_USER_DETAIL, {
            action: 'adminGetUserDetail',
            userId: userId
        });
    }

    /**
     * ログ一覧取得
     */
    async adminGetLogs(filters = {}) {
        return this.get(CONFIG.ENDPOINTS.ADMIN_GET_LOGS);
    }

    /**
     * ログエクスポート
     */
    async adminExportLogs(filters = {}) {
        return this.post(CONFIG.ENDPOINTS.ADMIN_EXPORT_LOGS, {
            action: 'adminExportLogs',
            filters: filters
        });
    }
}

// グローバルインスタンス
const apiClient = new ApiClient();

// エラーハンドリング用のヘルパー関数
function handleApiError(error, defaultMessage = 'エラーが発生しました') {
    console.error('API エラー:', error);
    
    if (error.code === 'UNAUTHORIZED') {
        // 認証エラーの場合はログイン画面にリダイレクト
        apiClient.adminLogout();
        if (window.location.pathname.includes('admin')) {
            window.location.href = 'login.html';
        }
        return '認証が必要です。ログインしてください。';
    }
    
    return error.message || defaultMessage;
}

// 日付フォーマット用のヘルパー関数
function formatDate(date, format = CONFIG.UI.DATE_FORMAT) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP');
}

function formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('ja-JP');
}