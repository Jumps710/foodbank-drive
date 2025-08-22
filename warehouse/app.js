// Main App Entry Point for Warehouse System

window.appState = {
    currentView: null,
    userProfile: null,
    userRole: null,
    liffData: null
};

// Unified authentication initialization
window.onAuthInit = async function(authData) {
    console.log('Warehouse app initialized with platform:', authData.platform);
    
    window.appState.authData = authData;
    window.appState.userProfile = authData.profile;
    window.appState.platform = authData.platform;
    
    initRouter();
    handleRoute();
};

function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('popstate', handleRoute);
}

async function handleRoute() {
    document.getElementById('loading').style.display = 'flex';
    
    try {
        const hash = window.location.hash || '#/';
        const [route, queryString] = hash.split('?');
        const params = new URLSearchParams(queryString || '');
        
        console.log('Navigating to:', route);
        
        if (window.appState.currentView && typeof window.appState.currentView.cleanup === 'function') {
            window.appState.currentView.cleanup();
        }
        
        switch (route) {
            case '#/':
            case '#/form':
                showRequestForm();
                break;
            case '#/table':
                showRequestTable();
                break;
            case '#/details':
                const requestId = params.get('id');
                if (!requestId) {
                    alert('リクエストIDが指定されていません');
                    window.location.hash = '#/table';
                    return;
                }
                showRequestDetails(requestId);
                break;
            case '#/dashboard':
                const userRole = await checkUserRole();
                if (userRole !== 'admin') {
                    alert('ダッシュボードへのアクセス権限がありません');
                    window.location.hash = '#/';
                    return;
                }
                showDashboard();
                break;
            default:
                window.location.hash = '#/form';
                return;
        }
    } catch (error) {
        console.error('Error handling route:', error);
        alert('エラーが発生しました。ページを再読み込みしてください。');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

async function checkUserRole() {
    try {
        const response = await fetch(`${window.WAREHOUSE_API_URL}?action=getUserRole&lineUserId=${window.appState.userProfile.userId}`);
        const data = await response.json();
        return data.success ? data.role : 'requester';
    } catch (error) {
        console.error('Error checking user role:', error);
        return 'requester';
    }
}

function showRequestForm() {
    document.getElementById('app-container').innerHTML = `
        <div class="container mt-3">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">食品リクエストフォーム</h5>
                </div>
                <div class="card-body">
                    <p>食品リクエストフォームを実装中...</p>
                    <div class="row">
                        <div class="col-6">
                            <button class="btn btn-outline-primary w-100" onclick="navigateTo('/table')">
                                リクエスト一覧
                            </button>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-outline-secondary w-100" onclick="navigateTo('/dashboard')">
                                ダッシュボード
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showRequestTable() {
    document.getElementById('app-container').innerHTML = `
        <div class="container mt-3">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">リクエスト一覧</h5>
                </div>
                <div class="card-body">
                    <p>リクエスト一覧を実装中...</p>
                    <div class="row">
                        <div class="col-6">
                            <button class="btn btn-outline-primary w-100" onclick="navigateTo('/form')">
                                新規リクエスト
                            </button>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-outline-secondary w-100" onclick="navigateTo('/dashboard')">
                                ダッシュボード
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showRequestDetails(requestId) {
    document.getElementById('app-container').innerHTML = `
        <div class="container mt-3">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">リクエスト詳細: ${requestId}</h5>
                </div>
                <div class="card-body">
                    <p>リクエスト詳細を実装中...</p>
                    <button class="btn btn-outline-secondary" onclick="navigateTo('/table')">
                        一覧に戻る
                    </button>
                </div>
            </div>
        </div>
    `;
}

function showDashboard() {
    document.getElementById('app-container').innerHTML = `
        <div class="container mt-3">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">ダッシュボード</h5>
                </div>
                <div class="card-body">
                    <p>管理者ダッシュボードを実装中...</p>
                    <button class="btn btn-outline-secondary" onclick="navigateTo('/table')">
                        リクエスト一覧
                    </button>
                </div>
            </div>
        </div>
    `;
}

window.navigateTo = function(route, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    window.location.hash = queryString ? `#${route}?${queryString}` : `#${route}`;
};