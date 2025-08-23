// Staff App Entry Point for Warehouse System

window.appState = {
    currentView: null,
    userProfile: null,
    userRole: 'admin', // Staff always have admin role
    liffData: null
};

// Unified authentication initialization for staff
window.onAuthInit = async function(authData) {
    console.log('Staff warehouse app initialized with platform:', authData.platform);
    
    window.appState.authData = authData;
    window.appState.userProfile = authData.profile;
    window.appState.platform = authData.platform;
    window.appState.userRole = 'admin'; // Force admin role for staff
    
    // Override profile for dev mode on staff page
    if (authData.platform === 'dev') {
        window.appState.userProfile = {
            userId: 'staff-dev-user-id',
            displayName: 'Development Staff User',
            pictureUrl: ''
        };
        console.log('Using development staff profile');
    }
    
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
        
        console.log('Staff navigating to:', route);
        
        if (window.appState.currentView && typeof window.appState.currentView.cleanup === 'function') {
            window.appState.currentView.cleanup();
        }
        
        switch (route) {
            case '#/':
            case '#/list':
                showRequestList();
                break;
            case '#/details':
                const requestId = params.get('id');
                if (!requestId) {
                    alert('リクエストIDが指定されていません');
                    window.location.hash = '#/list';
                    return;
                }
                showRequestDetails(requestId);
                break;
            case '#/dashboard':
                showDashboard();
                break;
            default:
                window.location.hash = '#/list';
                return;
        }
    } catch (error) {
        console.error('Error handling route:', error);
        alert('エラーが発生しました。ページを再読み込みしてください。');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Staff always have admin privileges
async function checkUserRole() {
    return 'admin';
}

async function showRequestList() {
    document.getElementById('app-container').innerHTML = `
        <div class="container mt-3">
            <!-- Header -->
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col">
                            <h4 class="mb-0">
                                <i class="fas fa-clipboard-list me-2"></i>
                                食品リクエスト管理
                            </h4>
                            <small class="text-muted">スタッフ用管理画面</small>
                        </div>
                        <div class="col-auto">
                            <button class="btn btn-primary btn-sm me-2" onclick="navigateTo('/dashboard')">
                                <i class="fas fa-chart-dashboard"></i> ダッシュボード
                            </button>
                            <button class="btn btn-outline-primary btn-sm" onclick="loadRequestList()">
                                <i class="fas fa-refresh"></i> 更新
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">リクエスト一覧</h5>
                </div>
                <div class="card-body">
                    <div id="list-loading" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">読み込み中...</span>
                        </div>
                        <p class="mt-2">リクエストを読み込み中...</p>
                    </div>
                    
                    <div id="list-content" style="display: none;">
                        <!-- Filter options -->
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <select id="status-filter" class="form-select" onchange="applyFilters()">
                                    <option value="">すべてのステータス</option>
                                    <option value="pending">申請中</option>
                                    <option value="approved">承認済み</option>
                                    <option value="ready">受取可能</option>
                                    <option value="completed">完了</option>
                                    <option value="cancelled">キャンセル</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <select id="category-filter" class="form-select" onchange="applyFilters()">
                                    <option value="">すべてのカテゴリ</option>
                                    <option value="米・穀物">米・穀物</option>
                                    <option value="缶詰・レトルト">缶詰・レトルト食品</option>
                                    <option value="調味料・油">調味料・油類</option>
                                    <option value="冷凍食品">冷凍食品</option>
                                    <option value="野菜・果物">野菜・果物</option>
                                    <option value="パン・菓子">パン・菓子類</option>
                                    <option value="その他">その他</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <input type="text" id="search-filter" class="form-control" placeholder="団体名で検索..." onkeyup="applyFilters()">
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th>リクエストID</th>
                                        <th>団体名</th>
                                        <th>食品カテゴリ</th>
                                        <th>受取予定日</th>
                                        <th>受益者数</th>
                                        <th>ステータス</th>
                                        <th>申請日</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody id="request-list-body">
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div id="no-data" style="display: none;" class="text-center py-4">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <p class="text-muted">リクエストがありません</p>
                    </div>
                    
                    <div id="list-error" style="display: none;" class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <span id="list-error-message"></span>
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="loadRequestList()">
                            再試行
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load data
    loadRequestList();
}

let allRequests = [];

async function loadRequestList() {
    try {
        document.getElementById('list-loading').style.display = 'block';
        document.getElementById('list-content').style.display = 'none';
        document.getElementById('no-data').style.display = 'none';
        document.getElementById('list-error').style.display = 'none';
        
        const response = await fetch(`${window.WAREHOUSE_API_URL}?action=getRequests&userId=${window.appState.userProfile.userId}&isAdmin=true`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Staff requests loaded:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'データの取得に失敗しました');
        }
        
        allRequests = result.requests || [];
        
        if (allRequests.length === 0) {
            document.getElementById('list-loading').style.display = 'none';
            document.getElementById('no-data').style.display = 'block';
            return;
        }
        
        displayRequests(allRequests);
        document.getElementById('list-loading').style.display = 'none';
        document.getElementById('list-content').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading request list:', error);
        document.getElementById('list-loading').style.display = 'none';
        document.getElementById('list-error').style.display = 'block';
        document.getElementById('list-error-message').textContent = error.message;
    }
}

function displayRequests(requests) {
    const tableBody = document.getElementById('request-list-body');
    
    tableBody.innerHTML = requests.map(request => {
        const statusBadge = getStatusBadge(request.status);
        const formattedDate = formatDate(request.pickupDate);
        const formattedSubmitted = formatDate(request.submittedAt);
        
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
                    <span class="badge bg-info">${request.beneficiaryCount}名</span>
                </td>
                <td>
                    ${statusBadge}
                </td>
                <td>
                    <small>${formattedSubmitted}</small>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="navigateTo('/details', {id: '${request.requestId}'})">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${getQuickActionButton(request)}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getQuickActionButton(request) {
    switch (request.status) {
        case 'pending':
            return `<button class="btn btn-sm btn-success" onclick="quickUpdateStatus('${request.requestId}', 'approved')" title="承認">
                <i class="fas fa-check"></i>
            </button>`;
        case 'approved':
            return `<button class="btn btn-sm btn-info" onclick="quickUpdateStatus('${request.requestId}', 'ready')" title="受取準備完了">
                <i class="fas fa-box"></i>
            </button>`;
        case 'ready':
            return `<button class="btn btn-sm btn-primary" onclick="quickUpdateStatus('${request.requestId}', 'completed')" title="受取完了">
                <i class="fas fa-check-double"></i>
            </button>`;
        default:
            return '';
    }
}

async function quickUpdateStatus(requestId, newStatus) {
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
            // Update local data
            const request = allRequests.find(r => r.requestId === requestId);
            if (request) {
                request.status = newStatus;
                applyFilters(); // Re-apply current filters
            }
            
            // Show success message
            const toast = document.createElement('div');
            toast.className = 'alert alert-success position-fixed';
            toast.style.cssText = 'top: 20px; right: 20px; z-index: 10000;';
            toast.innerHTML = `
                <i class="fas fa-check me-2"></i>
                ステータスを更新しました
                <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
            
        } else {
            throw new Error(result.error || 'ステータスの更新に失敗しました');
        }
        
    } catch (error) {
        console.error('Quick status update error:', error);
        alert('ステータスの更新中にエラーが発生しました: ' + error.message);
    }
}

function applyFilters() {
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    const searchFilter = document.getElementById('search-filter')?.value.toLowerCase() || '';
    
    const filteredRequests = allRequests.filter(request => {
        const matchStatus = !statusFilter || request.status === statusFilter;
        const matchCategory = !categoryFilter || request.foodType === categoryFilter;
        const matchSearch = !searchFilter || request.organizationName.toLowerCase().includes(searchFilter);
        
        return matchStatus && matchCategory && matchSearch;
    });
    
    displayRequests(filteredRequests);
    
    if (filteredRequests.length === 0 && allRequests.length > 0) {
        document.getElementById('request-list-body').innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="fas fa-filter me-2"></i>
                    フィルター条件に一致するリクエストがありません
                </td>
            </tr>
        `;
    }
}

// Copy utility functions from app.js
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Include request details and dashboard functions from app.js
async function showRequestDetails(requestId) {
    document.getElementById('app-container').innerHTML = `
        <div class="container mt-3">
            <div class="card">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">リクエスト詳細</h5>
                    <button class="btn btn-light btn-sm" onclick="navigateTo('/list')">
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
    
    // Load request details (same as app.js but with admin UI)
    loadRequestDetails(requestId);
}

// Copy the rest of the functions from app.js...
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
        
        // Staff always have admin privileges
        const isAdmin = true;
        
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
                                <td><a href="tel:${request.contactPhone}" class="btn btn-sm btn-outline-primary"><i class="fas fa-phone"></i> ${escapeHtml(request.contactPhone)}</a></td>
                            </tr>
                            ${request.contactEmail ? `
                            <tr>
                                <td><strong>メールアドレス:</strong></td>
                                <td><a href="mailto:${request.contactEmail}" class="btn btn-sm btn-outline-primary"><i class="fas fa-envelope"></i> ${escapeHtml(request.contactEmail)}</a></td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td><strong>受益者数:</strong></td>
                                <td><span class="badge bg-info">${request.beneficiaryCount}名</span></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <h6 class="text-muted mb-3 mt-4">食品情報</h6>
                    <table class="table table-borderless">
                        <tbody>
                            <tr>
                                <td width="150"><strong>食品カテゴリ:</strong></td>
                                <td><span class="badge bg-secondary fs-6">${escapeHtml(request.foodType)}</span></td>
                            </tr>
                            ${request.quantityNeeded ? `
                            <tr>
                                <td><strong>希望数量:</strong></td>
                                <td>${escapeHtml(request.quantityNeeded)}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td><strong>受取予定日:</strong></td>
                                <td><strong class="text-primary">${formatDate(request.pickupDate)}</strong></td>
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
                            <h6 class="mb-0">ステータス管理</h6>
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
                            
                            <hr>
                            <div class="d-grid gap-2">
                                ${request.status === 'pending' ? `
                                <button class="btn btn-success" onclick="updateRequestStatus('${request.requestId}', 'approved')">
                                    <i class="fas fa-check"></i> 承認する
                                </button>
                                ` : ''}
                                ${request.status === 'approved' ? `
                                <button class="btn btn-info" onclick="updateRequestStatus('${request.requestId}', 'ready')">
                                    <i class="fas fa-box"></i> 受取準備完了
                                </button>
                                ` : ''}
                                ${request.status === 'ready' ? `
                                <button class="btn btn-primary" onclick="updateRequestStatus('${request.requestId}', 'completed')">
                                    <i class="fas fa-check-double"></i> 受取完了
                                </button>
                                ` : ''}
                                ${['pending', 'approved'].includes(request.status) ? `
                                <button class="btn btn-danger" onclick="updateRequestStatus('${request.requestId}', 'cancelled')">
                                    <i class="fas fa-times"></i> キャンセル
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mt-3">
                        <div class="card-header">
                            <h6 class="mb-0">申請者情報</h6>
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

// Simple dashboard for staff
async function showDashboard() {
    document.getElementById('app-container').innerHTML = `
        <div class="container mt-3">
            <div class="card">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">スタッフダッシュボード</h5>
                    <button class="btn btn-light btn-sm" onclick="navigateTo('/list')">
                        <i class="fas fa-list"></i> リクエスト一覧
                    </button>
                </div>
                <div class="card-body">
                    <p class="mb-4">リクエストの統計情報とクイックアクセス</p>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="card bg-warning text-dark">
                                <div class="card-body text-center">
                                    <h3 id="pending-count">-</h3>
                                    <p class="mb-0">承認待ち</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="card bg-info text-white">
                                <div class="card-body text-center">
                                    <h3 id="ready-count">-</h3>
                                    <p class="mb-0">受取準備完了</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12">
                            <button class="btn btn-primary btn-lg w-100" onclick="navigateTo('/list')">
                                <i class="fas fa-list me-2"></i>
                                すべてのリクエストを管理
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load simple stats
    loadSimpleStats();
}

async function loadSimpleStats() {
    try {
        const response = await fetch(`${window.WAREHOUSE_API_URL}?action=getDashboardData&userId=${window.appState.userProfile.userId}`);
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('pending-count').textContent = result.data.pendingRequests || 0;
            document.getElementById('ready-count').textContent = (result.data.statusCounts?.ready || 0);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

window.navigateTo = function(route, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    window.location.hash = queryString ? `#${route}?${queryString}` : `#${route}`;
};