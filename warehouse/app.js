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
                    <form id="request-form">
                        <div class="mb-3">
                            <label for="organization-name" class="form-label">団体名 <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="organization-name" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="contact-person" class="form-label">担当者名 <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="contact-person" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="contact-phone" class="form-label">連絡先電話番号 <span class="text-danger">*</span></label>
                            <input type="tel" class="form-control" id="contact-phone" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="contact-email" class="form-label">連絡先メールアドレス</label>
                            <input type="email" class="form-control" id="contact-email">
                        </div>
                        
                        <div class="mb-3">
                            <label for="beneficiary-count" class="form-label">受益者数 <span class="text-danger">*</span></label>
                            <input type="number" class="form-control" id="beneficiary-count" min="1" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="food-type" class="form-label">希望食品カテゴリ <span class="text-danger">*</span></label>
                            <select class="form-select" id="food-type" required>
                                <option value="">選択してください</option>
                                <option value="米・穀物">米・穀物</option>
                                <option value="缶詰・レトルト">缶詰・レトルト食品</option>
                                <option value="調味料・油">調味料・油類</option>
                                <option value="冷凍食品">冷凍食品</option>
                                <option value="野菜・果物">野菜・果物</option>
                                <option value="パン・菓子">パン・菓子類</option>
                                <option value="その他">その他</option>
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <label for="quantity-needed" class="form-label">希望数量・重量</label>
                            <input type="text" class="form-control" id="quantity-needed" placeholder="例: 10kg、50人分など">
                        </div>
                        
                        <div class="mb-3">
                            <label for="pickup-date" class="form-label">希望受取日 <span class="text-danger">*</span></label>
                            <input type="date" class="form-control" id="pickup-date" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="pickup-time" class="form-label">希望受取時間帯</label>
                            <select class="form-select" id="pickup-time">
                                <option value="">時間帯を選択</option>
                                <option value="09:00-12:00">午前 (9:00-12:00)</option>
                                <option value="13:00-17:00">午後 (13:00-17:00)</option>
                                <option value="17:00-19:00">夕方 (17:00-19:00)</option>
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <label for="usage-purpose" class="form-label">使用目的・配布予定 <span class="text-danger">*</span></label>
                            <textarea class="form-control" id="usage-purpose" rows="3" required placeholder="食品の使用目的や配布予定について詳しく記載してください"></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label for="special-notes" class="form-label">特記事項・その他要望</label>
                            <textarea class="form-control" id="special-notes" rows="2" placeholder="アレルギー対応、冷蔵・冷凍の希望など"></textarea>
                        </div>
                        
                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-primary btn-lg">
                                <i class="fas fa-paper-plane me-2"></i>リクエストを送信
                            </button>
                        </div>
                    </form>
                    
                    <hr class="my-4">
                    
                    <div class="row">
                        <div class="col-6">
                            <button class="btn btn-outline-primary w-100" onclick="navigateTo('/table')">
                                <i class="fas fa-list me-2"></i>リクエスト一覧
                            </button>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-outline-secondary w-100" onclick="navigateTo('/dashboard')">
                                <i class="fas fa-chart-dashboard me-2"></i>ダッシュボード
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add form submission handler
    document.getElementById('request-form').addEventListener('submit', handleFormSubmission);
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pickup-date').setAttribute('min', today);
}

async function showRequestTable() {
    document.getElementById('app-container').innerHTML = `
        <div class="container mt-3">
            <div class="card">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">リクエスト一覧</h5>
                    <button class="btn btn-light btn-sm" onclick="loadRequestTable()">
                        <i class="fas fa-refresh"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div id="table-loading" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">読み込み中...</span>
                        </div>
                        <p class="mt-2">リクエストを読み込み中...</p>
                    </div>
                    
                    <div id="table-content" style="display: none;">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th>リクエストID</th>
                                        <th>団体名</th>
                                        <th>食品カテゴリ</th>
                                        <th>受取予定日</th>
                                        <th>ステータス</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody id="request-table-body">
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div id="no-data" style="display: none;" class="text-center py-4">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <p class="text-muted">リクエストがありません</p>
                    </div>
                    
                    <hr class="my-4">
                    
                    <div class="row">
                        <div class="col-6">
                            <button class="btn btn-primary w-100" onclick="navigateTo('/form')">
                                <i class="fas fa-plus me-2"></i>新規リクエスト
                            </button>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-outline-secondary w-100" onclick="navigateTo('/dashboard')">
                                <i class="fas fa-chart-dashboard me-2"></i>ダッシュボード
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load data
    loadRequestTable();
}

async function showRequestDetails(requestId) {
    document.getElementById('app-container').innerHTML = `
        <div class="container mt-3">
            <div class="card">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">リクエスト詳細</h5>
                    <button class="btn btn-light btn-sm" onclick="navigateTo('/table')">
                        <i class="fas fa-arrow-left"></i> 一覧に戻る
                    </button>
                </div>
                <div class="card-body">
                    <div id="details-loading" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">読み込み中...</span>
                        </div>
                        <p class="mt-2">リクエスト詳細を読み込み中...</p>
                    </div>
                    
                    <div id="details-content" style="display: none;">
                        <!-- Content will be populated here -->
                    </div>
                    
                    <div id="details-error" style="display: none;" class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <span id="error-message"></span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load request details
    loadRequestDetails(requestId);
}

async function loadRequestDetails(requestId) {
    try {
        document.getElementById('details-loading').style.display = 'block';
        document.getElementById('details-content').style.display = 'none';
        document.getElementById('details-error').style.display = 'none';
        
        const response = await fetch(`${window.WAREHOUSE_API_URL}?action=getRequestDetails&requestId=${requestId}&userId=${window.appState.userProfile.userId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Request details loaded:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'データの取得に失敗しました');
        }
        
        const request = result.request;
        if (!request) {
            throw new Error('リクエストが見つかりません');
        }
        
        const userRole = await checkUserRole();
        const isAdmin = userRole === 'admin';
        
        document.getElementById('details-content').innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <h6 class="text-muted mb-3">基本情報</h6>
                    <table class="table table-borderless">
                        <tbody>
                            <tr>
                                <td width="150"><strong>リクエストID:</strong></td>
                                <td><code>${escapeHtml(request.requestId)}</code></td>
                            </tr>
                            <tr>
                                <td><strong>団体名:</strong></td>
                                <td>${escapeHtml(request.organizationName)}</td>
                            </tr>
                            <tr>
                                <td><strong>担当者名:</strong></td>
                                <td>${escapeHtml(request.contactPerson)}</td>
                            </tr>
                            <tr>
                                <td><strong>連絡先電話:</strong></td>
                                <td><a href="tel:${request.contactPhone}">${escapeHtml(request.contactPhone)}</a></td>
                            </tr>
                            ${request.contactEmail ? `
                            <tr>
                                <td><strong>メールアドレス:</strong></td>
                                <td><a href="mailto:${request.contactEmail}">${escapeHtml(request.contactEmail)}</a></td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td><strong>受益者数:</strong></td>
                                <td>${request.beneficiaryCount}名</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <h6 class="text-muted mb-3 mt-4">食品情報</h6>
                    <table class="table table-borderless">
                        <tbody>
                            <tr>
                                <td width="150"><strong>食品カテゴリ:</strong></td>
                                <td><span class="badge bg-secondary">${escapeHtml(request.foodType)}</span></td>
                            </tr>
                            ${request.quantityNeeded ? `
                            <tr>
                                <td><strong>希望数量:</strong></td>
                                <td>${escapeHtml(request.quantityNeeded)}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td><strong>受取予定日:</strong></td>
                                <td>${formatDate(request.pickupDate)}</td>
                            </tr>
                            ${request.pickupTime ? `
                            <tr>
                                <td><strong>受取時間帯:</strong></td>
                                <td>${escapeHtml(request.pickupTime)}</td>
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>
                    
                    <h6 class="text-muted mb-3 mt-4">詳細情報</h6>
                    <div class="mb-3">
                        <strong>使用目的・配布予定:</strong>
                        <div class="border rounded p-3 mt-2 bg-light">
                            ${escapeHtml(request.usagePurpose).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    
                    ${request.specialNotes ? `
                    <div class="mb-3">
                        <strong>特記事項・その他要望:</strong>
                        <div class="border rounded p-3 mt-2 bg-light">
                            ${escapeHtml(request.specialNotes).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">ステータス</h6>
                        </div>
                        <div class="card-body text-center">
                            ${getStatusBadge(request.status)}
                            <hr>
                            <small class="text-muted">
                                申請日: ${formatDateTime(request.submittedAt)}
                            </small>
                            ${request.updatedAt && request.updatedAt !== request.submittedAt ? `
                            <br>
                            <small class="text-muted">
                                更新日: ${formatDateTime(request.updatedAt)}
                            </small>
                            ` : ''}
                            
                            ${isAdmin ? `
                            <hr>
                            <div class="btn-group-vertical w-100" role="group">
                                ${request.status === 'pending' ? `
                                <button class="btn btn-success btn-sm" onclick="updateRequestStatus('${request.requestId}', 'approved')">
                                    <i class="fas fa-check"></i> 承認
                                </button>
                                ` : ''}
                                ${request.status === 'approved' ? `
                                <button class="btn btn-info btn-sm" onclick="updateRequestStatus('${request.requestId}', 'ready')">
                                    <i class="fas fa-box"></i> 受取準備完了
                                </button>
                                ` : ''}
                                ${request.status === 'ready' ? `
                                <button class="btn btn-primary btn-sm" onclick="updateRequestStatus('${request.requestId}', 'completed')">
                                    <i class="fas fa-check-double"></i> 受取完了
                                </button>
                                ` : ''}
                                ${['pending', 'approved'].includes(request.status) ? `
                                <button class="btn btn-danger btn-sm" onclick="updateRequestStatus('${request.requestId}', 'cancelled')">
                                    <i class="fas fa-times"></i> キャンセル
                                </button>
                                ` : ''}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${isAdmin ? `
                    <div class="card mt-3">
                        <div class="card-header">
                            <h6 class="mb-0">管理情報</h6>
                        </div>
                        <div class="card-body">
                            <small class="text-muted">
                                <strong>申請者:</strong><br>
                                ${escapeHtml(request.requesterName)}<br>
                                <code>${escapeHtml(request.requesterUserId)}</code><br><br>
                                <strong>プラットフォーム:</strong><br>
                                ${escapeHtml(request.platform)}
                            </small>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('details-loading').style.display = 'none';
        document.getElementById('details-content').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading request details:', error);
        document.getElementById('details-loading').style.display = 'none';
        document.getElementById('details-error').style.display = 'block';
        document.getElementById('error-message').textContent = error.message;
    }
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

async function updateRequestStatus(requestId, newStatus) {
    if (!confirm(`ステータスを「${getStatusText(newStatus)}」に変更しますか？`)) {
        return;
    }
    
    try {
        const response = await fetch(window.WAREHOUSE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'updateRequestStatus',
                requestId: requestId,
                status: newStatus,
                updatedBy: window.appState.userProfile.userId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert('ステータスが正常に更新されました');
            loadRequestDetails(requestId); // Reload details
        } else {
            throw new Error(result.error || 'ステータスの更新に失敗しました');
        }
        
    } catch (error) {
        console.error('Status update error:', error);
        alert('ステータスの更新中にエラーが発生しました: ' + error.message);
    }
}

function getStatusText(status) {
    const statusMap = {
        'pending': '申請中',
        'approved': '承認済み',
        'ready': '受取可能',
        'completed': '完了',
        'cancelled': 'キャンセル'
    };
    return statusMap[status] || status;
}

async function showDashboard() {
    document.getElementById('app-container').innerHTML = `
        <div class="container mt-3">
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">管理者ダッシュボード</h5>
                            <button class="btn btn-light btn-sm" onclick="loadDashboardData()">
                                <i class="fas fa-refresh"></i>
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="dashboard-loading" class="text-center py-4">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">読み込み中...</span>
                                </div>
                                <p class="mt-2">ダッシュボードデータを読み込み中...</p>
                            </div>
                            
                            <div id="dashboard-content" style="display: none;">
                                <!-- Summary cards -->
                                <div class="row mb-4">
                                    <div class="col-md-3 col-sm-6 mb-3">
                                        <div class="card bg-primary text-white">
                                            <div class="card-body text-center">
                                                <i class="fas fa-clipboard-list fa-2x mb-2"></i>
                                                <h4 id="total-requests">-</h4>
                                                <p class="mb-0">総リクエスト数</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3 col-sm-6 mb-3">
                                        <div class="card bg-warning text-dark">
                                            <div class="card-body text-center">
                                                <i class="fas fa-clock fa-2x mb-2"></i>
                                                <h4 id="pending-requests">-</h4>
                                                <p class="mb-0">申請中</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3 col-sm-6 mb-3">
                                        <div class="card bg-success text-white">
                                            <div class="card-body text-center">
                                                <i class="fas fa-check-circle fa-2x mb-2"></i>
                                                <h4 id="completed-requests">-</h4>
                                                <p class="mb-0">完了済み</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3 col-sm-6 mb-3">
                                        <div class="card bg-info text-white">
                                            <div class="card-body text-center">
                                                <i class="fas fa-users fa-2x mb-2"></i>
                                                <h4 id="total-beneficiaries">-</h4>
                                                <p class="mb-0">総受益者数</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Charts row -->
                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="mb-0">ステータス別リクエスト</h6>
                                            </div>
                                            <div class="card-body">
                                                <canvas id="status-chart" width="400" height="200"></canvas>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="mb-0">食品カテゴリ別リクエスト</h6>
                                            </div>
                                            <div class="card-body">
                                                <canvas id="category-chart" width="400" height="200"></canvas>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Recent requests -->
                                <div class="card">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0">最近のリクエスト</h6>
                                        <button class="btn btn-sm btn-outline-primary" onclick="navigateTo('/table')">
                                            すべて表示
                                        </button>
                                    </div>
                                    <div class="card-body">
                                        <div id="recent-requests">
                                            <!-- Will be populated dynamically -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="dashboard-error" style="display: none;" class="alert alert-danger">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <span id="dashboard-error-message"></span>
                            </div>
                            
                            <hr class="my-4">
                            
                            <div class="row">
                                <div class="col-6">
                                    <button class="btn btn-primary w-100" onclick="navigateTo('/table')">
                                        <i class="fas fa-list me-2"></i>リクエスト一覧
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-outline-primary w-100" onclick="navigateTo('/form')">
                                        <i class="fas fa-plus me-2"></i>新規リクエスト
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load dashboard data
    loadDashboardData();
}

async function loadDashboardData() {
    try {
        document.getElementById('dashboard-loading').style.display = 'block';
        document.getElementById('dashboard-content').style.display = 'none';
        document.getElementById('dashboard-error').style.display = 'none';
        
        const response = await fetch(`${window.WAREHOUSE_API_URL}?action=getDashboardData&userId=${window.appState.userProfile.userId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Dashboard data loaded:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'ダッシュボードデータの取得に失敗しました');
        }
        
        const data = result.data;
        
        // Update summary cards
        document.getElementById('total-requests').textContent = data.totalRequests || 0;
        document.getElementById('pending-requests').textContent = data.pendingRequests || 0;
        document.getElementById('completed-requests').textContent = data.completedRequests || 0;
        document.getElementById('total-beneficiaries').textContent = data.totalBeneficiaries || 0;
        
        // Create charts
        createStatusChart(data.statusCounts || {});
        createCategoryChart(data.categoryCounts || {});
        
        // Update recent requests
        updateRecentRequests(data.recentRequests || []);
        
        document.getElementById('dashboard-loading').style.display = 'none';
        document.getElementById('dashboard-content').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        document.getElementById('dashboard-loading').style.display = 'none';
        document.getElementById('dashboard-error').style.display = 'block';
        document.getElementById('dashboard-error-message').textContent = error.message;
    }
}

function createStatusChart(statusCounts) {
    const ctx = document.getElementById('status-chart').getContext('2d');
    
    // Clear existing chart
    if (window.statusChart) {
        window.statusChart.destroy();
    }
    
    const statusLabels = {
        'pending': '申請中',
        'approved': '承認済み',
        'ready': '受取可能',
        'completed': '完了',
        'cancelled': 'キャンセル'
    };
    
    const labels = Object.keys(statusCounts).map(status => statusLabels[status] || status);
    const data = Object.values(statusCounts);
    
    window.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#ffc107',  // pending - warning
                    '#28a745',  // approved - success
                    '#17a2b8',  // ready - info
                    '#007bff',  // completed - primary
                    '#dc3545'   // cancelled - danger
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createCategoryChart(categoryCounts) {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Clear existing chart
    if (window.categoryChart) {
        window.categoryChart.destroy();
    }
    
    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    
    window.categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'リクエスト数',
                data: data,
                backgroundColor: '#007bff',
                borderColor: '#0056b3',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateRecentRequests(recentRequests) {
    const container = document.getElementById('recent-requests');
    
    if (recentRequests.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">最近のリクエストがありません</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-sm table-hover">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>団体名</th>
                        <th>食品カテゴリ</th>
                        <th>ステータス</th>
                        <th>申請日</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentRequests.map(request => `
                        <tr>
                            <td><code>${escapeHtml(request.requestId)}</code></td>
                            <td>${escapeHtml(request.organizationName)}</td>
                            <td><span class="badge bg-secondary">${escapeHtml(request.foodType)}</span></td>
                            <td>${getStatusBadge(request.status)}</td>
                            <td>${formatDate(request.submittedAt)}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="navigateTo('/details', {id: '${request.requestId}'})">
                                    詳細
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function handleFormSubmission(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>送信中...';
        
        // Collect form data
        const formData = {
            organizationName: document.getElementById('organization-name').value,
            contactPerson: document.getElementById('contact-person').value,
            contactPhone: document.getElementById('contact-phone').value,
            contactEmail: document.getElementById('contact-email').value,
            beneficiaryCount: parseInt(document.getElementById('beneficiary-count').value),
            foodType: document.getElementById('food-type').value,
            quantityNeeded: document.getElementById('quantity-needed').value,
            pickupDate: document.getElementById('pickup-date').value,
            pickupTime: document.getElementById('pickup-time').value,
            usagePurpose: document.getElementById('usage-purpose').value,
            specialNotes: document.getElementById('special-notes').value,
            requesterUserId: window.appState.userProfile.userId,
            requesterName: window.appState.userProfile.displayName,
            platform: window.appState.platform,
            submittedAt: new Date().toISOString()
        };
        
        console.log('Submitting form data:', formData);
        
        // Submit to API
        const response = await fetch(window.WAREHOUSE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'submitRequest',
                data: JSON.stringify(formData)
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Submission result:', result);
        
        if (result.success) {
            alert('リクエストが正常に送信されました。\nリクエストID: ' + result.requestId);
            event.target.reset();
            navigateTo('/table');
        } else {
            throw new Error(result.error || '送信に失敗しました');
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        alert('送信中にエラーが発生しました: ' + error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

async function loadRequestTable() {
    try {
        document.getElementById('table-loading').style.display = 'block';
        document.getElementById('table-content').style.display = 'none';
        document.getElementById('no-data').style.display = 'none';
        
        const userRole = await checkUserRole();
        const isAdmin = userRole === 'admin';
        
        const response = await fetch(`${window.WAREHOUSE_API_URL}?action=getRequests&userId=${window.appState.userProfile.userId}&isAdmin=${isAdmin}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Requests loaded:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'データの取得に失敗しました');
        }
        
        const requests = result.requests || [];
        const tableBody = document.getElementById('request-table-body');
        
        if (requests.length === 0) {
            document.getElementById('table-loading').style.display = 'none';
            document.getElementById('no-data').style.display = 'block';
            return;
        }
        
        tableBody.innerHTML = requests.map(request => {
            const statusBadge = getStatusBadge(request.status);
            const formattedDate = formatDate(request.pickupDate);
            
            return `
                <tr>
                    <td>
                        <code>${request.requestId}</code>
                    </td>
                    <td>
                        <strong>${escapeHtml(request.organizationName)}</strong>
                        <br>
                        <small class="text-muted">${escapeHtml(request.contactPerson)}</small>
                    </td>
                    <td>
                        <span class="badge bg-secondary">${escapeHtml(request.foodType)}</span>
                    </td>
                    <td>
                        ${formattedDate}
                        ${request.pickupTime ? `<br><small class="text-muted">${request.pickupTime}</small>` : ''}
                    </td>
                    <td>
                        ${statusBadge}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="navigateTo('/details', {id: '${request.requestId}'})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        document.getElementById('table-loading').style.display = 'none';
        document.getElementById('table-content').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading request table:', error);
        document.getElementById('table-loading').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                データの読み込みに失敗しました: ${error.message}
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="loadRequestTable()">
                    再試行
                </button>
            </div>
        `;
    }
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': { class: 'bg-warning text-dark', text: '申請中' },
        'approved': { class: 'bg-success', text: '承認済み' },
        'ready': { class: 'bg-info', text: '受取可能' },
        'completed': { class: 'bg-primary', text: '完了' },
        'cancelled': { class: 'bg-danger', text: 'キャンセル' }
    };
    
    const statusInfo = statusMap[status] || { class: 'bg-secondary', text: status };
    return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });
    } catch (error) {
        return dateString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.navigateTo = function(route, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    window.location.hash = queryString ? `#${route}?${queryString}` : `#${route}`;
};