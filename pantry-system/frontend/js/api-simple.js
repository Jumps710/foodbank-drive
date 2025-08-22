/**
 * シンプルAPIクライアント（kodomonw成功パターン適用）
 */

/**
 * APIリクエスト共通関数
 */
async function apiRequest(path, method = 'GET', data = null) {
  try {
    console.log('🌐 API Request:', method, path, data);
    
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    };
    
    let url = CONFIG.API_BASE_URL;
    
    if (method === 'GET') {
      // pathにクエリパラメータが含まれている場合の処理
      if (path.includes('?')) {
        const [action, params] = path.split('?');
        url += `?action=${action}&${params}`;
      } else {
        url += `?action=${path}`;
      }
    } else {
      // POST の場合は URLSearchParams を使用
      const params = new URLSearchParams();
      params.append('action', path);
      if (data) {
        for (const [key, value] of Object.entries(data)) {
          params.append(key, value);
        }
      }
      options.body = params;
    }
    
    console.log('🌐 Final URL:', url);
    console.log('🌐 Options:', options);
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log('✅ API Response:', result);
    
    if (!result.success && result.error) {
      throw new Error(result.error.message || result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
}

/**
 * 公開API
 */
const publicApi = {
  // 統計データ取得
  async getStatistics() {
    return apiRequest('getStatistics');
  },
  
  // ダッシュボード統計データ取得
  async getDashboardStats(filter = 'all') {
    return apiRequest(`getDashboardStats?filter=${encodeURIComponent(filter)}`);
  },
  
  // 現在のパントリー取得
  async getCurrentPantry() {
    return apiRequest('getCurrentPantry');
  },
  
  // 予約作成
  async createReservation(data) {
    return apiRequest('createReservation', 'POST', data);
  }
};

/**
 * 管理API
 */
const adminApi = {
  // パントリー一覧取得
  async getPantries() {
    return apiRequest('adminGetPantries');
  },
  
  // 予約一覧取得  
  async getReservations() {
    return apiRequest('adminGetReservations');
  },
  
  // ユーザー一覧取得
  async getUsers() {
    return apiRequest('adminGetUsers');
  },
  
  // ログ一覧取得
  async getLogs(levelFilter = 'all') {
    return apiRequest(`adminGetLogs?levelFilter=${encodeURIComponent(levelFilter)}`);
  },
  
  // パントリー作成
  async createPantry(data) {
    return apiRequest('adminCreatePantry', 'POST', data);
  },
  
  // パントリー更新
  async updatePantry(data) {
    return apiRequest('adminUpdatePantry', 'POST', data);
  },
  
  // 予約キャンセル
  async cancelReservation(reservationId) {
    return apiRequest('adminCancelReservation', 'POST', { reservationId });
  },
  
  // パントリー削除
  async deletePantry(pantryId) {
    return apiRequest('adminDeletePantry', 'POST', { pantryId });
  },
  
  // 予約詳細取得
  async getReservationDetail(reservationId) {
    return apiRequest('adminGetReservationDetail', 'GET', { reservationId });
  },
  
  // ユーザー詳細取得
  async getUserDetail(nameKana) {
    return apiRequest('adminGetUserDetail', 'GET', { nameKana });
  },
  
  // ログエクスポート
  async exportLogs() {
    return apiRequest('adminExportLogs');
  },
  
  // パントリーごとの予約一覧取得
  async getReservationsByPantry(pantryId) {
    return apiRequest(`adminGetReservationsByPantry?pantryId=${encodeURIComponent(pantryId)}`);
  },
  
  // 利用者ベストテン取得
  async getTopUsers(filter = 'all') {
    return apiRequest(`adminGetTopUsers?filter=${encodeURIComponent(filter)}`);
  },
  
  // 利用履歴取得
  async getUsageHistory(filter = 'all', userFilter = '') {
    return apiRequest(`adminGetUsageHistory?filter=${encodeURIComponent(filter)}&userFilter=${encodeURIComponent(userFilter)}`);
  },
  
  // 利用履歴エクスポート
  async exportUsageHistory(filter = 'all', userFilter = '') {
    return apiRequest(`adminExportUsageHistory?filter=${encodeURIComponent(filter)}&userFilter=${encodeURIComponent(userFilter)}`);
  },
  
  // 管理者一覧取得
  async getAdmins() {
    return apiRequest('adminGetAdmins');
  },
  
  // 管理者追加
  async addAdmin(data) {
    return apiRequest('adminAddAdmin', 'POST', data);
  },
  
  // 管理者詳細取得
  async getAdminDetail(uid) {
    return apiRequest(`adminGetAdminDetail?uid=${encodeURIComponent(uid)}`);
  },
  
  // 管理者ステータス切り替え
  async toggleAdminStatus(uid, status) {
    return apiRequest('adminToggleAdminStatus', 'POST', { uid, status });
  },
  
  // ユーザーDBシート作成
  async createUsersSheet() {
    return apiRequest('createUsersSheet');
  },
  
  // 既存データをユーザーDBに移行
  async migrateToUsersDB() {
    return apiRequest('migrateToUsersDB');
  },
  
  // userシート初期化
  async initializeUserSheet() {
    return apiRequest('initializeUserSheet');
  },
  
  // reservationからuserシートへの全データ同期
  async syncAllUsersFromReservations() {
    return apiRequest('syncAllUsersFromReservations');
  },
  
  // ユーザー同期トリガー設定
  async setupUserSyncTrigger() {
    return apiRequest('setupUserSyncTrigger');
  },
  
  // ユーザー同期トリガー削除
  async deleteUserSyncTriggers() {
    return apiRequest('deleteUserSyncTriggers');
  },
  
  // ユーザー同期トリガー状態確認
  async getUserSyncTriggerStatus() {
    return apiRequest('getUserSyncTriggerStatus');
  },
  
  // 手動でスケジュール同期実行
  async runScheduledUserSync() {
    return apiRequest('scheduledUserSync');
  }
};

/**
 * テスト用API呼び出し
 */
async function testApi() {
  try {
    console.log('=== API テスト開始 ===');
    
    // 1. テストエンドポイント
    console.log('1. テストAPI呼び出し...');
    const testResult = await apiRequest('test');
    console.log('✅ テスト結果:', testResult);
    
    // 2. 統計データ取得
    console.log('2. 統計データ取得...');
    const statsResult = await publicApi.getStatistics();
    console.log('✅ 統計データ:', statsResult);
    
    // 3. パントリー一覧取得
    console.log('3. パントリー一覧取得...');
    const pantriesResult = await adminApi.getPantries();
    console.log('✅ パントリー一覧:', pantriesResult);
    
    console.log('=== API テスト完了 ===');
    return {
      success: true,
      message: 'すべてのAPIテストが成功しました',
      results: {
        test: testResult,
        statistics: statsResult,
        pantries: pantriesResult
      }
    };
    
  } catch (error) {
    console.error('❌ API テスト失敗:', error);
    return {
      success: false,
      error: error.message,
      message: 'APIテストが失敗しました'
    };
  }
}

// ブラウザのコンソールからテスト実行できるようにグローバルに公開
window.testApi = testApi;
window.publicApi = publicApi;
window.adminApi = adminApi;
window.apiRequest = apiRequest;

/**
 * エラーハンドリング用のヘルパー関数
 */
function handleApiError(error, defaultMessage = 'エラーが発生しました') {
  console.error('API エラー:', error);
  
  if (error.code === 'UNAUTHORIZED') {
    // 認証エラーの場合はログイン画面にリダイレクト
    if (window.location.pathname.includes('admin')) {
      window.location.href = 'login.html';
    }
    return '認証が必要です。ログインしてください。';
  }
  
  return error.message || defaultMessage;
}

/**
 * 日付フォーマット用のヘルパー関数
 */
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

// グローバルに公開
window.handleApiError = handleApiError;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;

console.log('📡 Simple API Client loaded');
console.log('💡 コンソールで testApi() を実行してテストできます');