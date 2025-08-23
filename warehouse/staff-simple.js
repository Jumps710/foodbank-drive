// Staff App - Simple Implementation based on working WOFF apps

// Configuration - using the same WOFF API structure as cruto apps
const config = {
    woffId: 'z-vHKyt_a0GkVpsS9j46NQ', // Your WOFF ID from CLAUDE.md
    apiUrl: 'https://script.google.com/macros/s/AKfycby3cljD8FT5yBB2VM4Q2pw7Za8OfT6L5m67dtdVfUjnhedNBDK384E3GNBp1XzQFK1g/exec'
};

// Global variables
let userProfile = null;
let allRequests = [];

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Staff app DOM loaded, starting initialization...');
    
    try {
        // WOFF initialization - simple and direct
        console.log('🔄 Starting WOFF initialization...');
        userProfile = await WOFFManager.init(config.woffId);
        console.log('✅ WOFF initialization successful:', userProfile);
        console.log('👤 User ID:', userProfile.userId);
        console.log('👤 Display Name:', userProfile.displayName);
        
        // Hide loading and show app
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        
        // Initialize the staff interface
        initStaffInterface();
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        
        // Show error message
        document.getElementById('loading').innerHTML = `
            <div class="text-center">
                <div class="alert alert-danger">
                    <h5>初期化エラー</h5>
                    <p>WOFF SDKの初期化に失敗しました。</p>
                    <p class="small">エラー: ${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">再試行</button>
                </div>
            </div>
        `;
    }
});

function initStaffInterface() {
    console.log('🏢 Initializing staff interface...');
    
    // Show request list by default
    showRequestList();
    
    console.log('✅ Staff interface initialized');
}

function showRequestList() {
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
                            <small class="text-muted">スタッフ: ${userProfile.displayName}</small>
                        </div>
                        <div class="col-auto">
                            <button class="btn btn-outline-primary btn-sm" onclick="loadRequests()">
                                <i class="fas fa-refresh"></i> 更新
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Request List -->
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">リクエスト一覧</h5>
                </div>
                <div class="card-body">
                    <div id="request-loading" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">読み込み中...</span>
                        </div>
                        <p class="mt-2">リクエストを読み込み中...</p>
                    </div>
                    
                    <div id="request-content" style="display: none;">
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
                    
                    <div id="no-requests" style="display: none;" class="text-center py-4">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <p class="text-muted">リクエストがありません</p>
                    </div>
                    
                    <div id="request-error" style="display: none;" class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <span id="error-message"></span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load requests
    loadRequests();
}

async function loadRequests() {
    console.log('📋 Loading requests...');
    
    try {
        document.getElementById('request-loading').style.display = 'block';
        document.getElementById('request-content').style.display = 'none';
        document.getElementById('no-requests').style.display = 'none';
        document.getElementById('request-error').style.display = 'none';
        
        // API call to get requests
        const url = `${config.apiUrl}?action=getRequests&userId=${userProfile.userId}&isAdmin=true`;
        console.log('🌐 API URL:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📦 API Response:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'データの取得に失敗しました');
        }
        
        allRequests = result.requests || [];
        console.log('📊 Loaded requests:', allRequests.length);
        
        if (allRequests.length === 0) {
            document.getElementById('request-loading').style.display = 'none';
            document.getElementById('no-requests').style.display = 'block';
            return;
        }
        
        // Display requests
        displayRequests(allRequests);
        document.getElementById('request-loading').style.display = 'none';
        document.getElementById('request-content').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Failed to load requests:', error);
        document.getElementById('request-loading').style.display = 'none';
        document.getElementById('request-error').style.display = 'block';
        document.getElementById('error-message').textContent = error.message;
    }
}

function displayRequests(requests) {
    const tableBody = document.getElementById('request-table-body');
    
    tableBody.innerHTML = requests.map(request => {
        const statusBadge = getStatusBadge(request.status);
        const formattedDate = formatDate(request.pickupDate);
        
        return `
            <tr>
                <td><code>${escapeHtml(request.requestId)}</code></td>
                <td>
                    <strong>${escapeHtml(request.organizationName)}</strong><br>
                    <small class="text-muted">${escapeHtml(request.contactPerson)}</small>
                </td>
                <td><span class="badge bg-secondary">${escapeHtml(request.foodType)}</span></td>
                <td>${formattedDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="showRequestDetails('${request.requestId}')">
                        <i class="fas fa-eye"></i> 詳細
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function showRequestDetails(requestId) {
    console.log('📋 Showing details for request:', requestId);
    
    // Find the request
    const request = allRequests.find(r => r.requestId === requestId);
    if (!request) {
        alert('リクエストが見つかりません');
        return;
    }
    
    document.getElementById('app-container').innerHTML = `
        <div class="container mt-3">
            <div class="card">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">リクエスト詳細: ${request.requestId}</h5>
                    <button class="btn btn-light btn-sm" onclick="showRequestList()">
                        <i class="fas fa-arrow-left"></i> 一覧に戻る
                    </button>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h6 class="text-muted mb-3">基本情報</h6>
                            <table class="table table-borderless">
                                <tbody>
                                    <tr>
                                        <td width="150"><strong>団体名:</strong></td>
                                        <td>${escapeHtml(request.organizationName)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>担当者:</strong></td>
                                        <td>${escapeHtml(request.contactPerson)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>電話番号:</strong></td>
                                        <td><a href="tel:${request.contactPhone}" class="btn btn-sm btn-outline-primary">
                                            <i class="fas fa-phone"></i> ${escapeHtml(request.contactPhone)}
                                        </a></td>
                                    </tr>
                                    ${request.contactEmail ? `
                                    <tr>
                                        <td><strong>メール:</strong></td>
                                        <td><a href="mailto:${request.contactEmail}" class="btn btn-sm btn-outline-primary">
                                            <i class="fas fa-envelope"></i> ${escapeHtml(request.contactEmail)}
                                        </a></td>
                                    </tr>
                                    ` : ''}
                                    <tr>
                                        <td><strong>食品カテゴリ:</strong></td>
                                        <td><span class="badge bg-secondary fs-6">${escapeHtml(request.foodType)}</span></td>
                                    </tr>
                                    <tr>
                                        <td><strong>受取予定日:</strong></td>
                                        <td><strong class="text-primary">${formatDate(request.pickupDate)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td><strong>受益者数:</strong></td>
                                        <td><span class="badge bg-info">${request.beneficiaryCount}名</span></td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <h6 class="text-muted mb-3 mt-4">詳細情報</h6>
                            <div class="mb-3">
                                <strong>使用目的・配布予定:</strong>
                                <div class="border rounded p-3 mt-2 bg-light">
                                    ${escapeHtml(request.usagePurpose).replace(/\\n/g, '<br>')}
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">ステータス管理</h6>
                                </div>
                                <div class="card-body text-center">
                                    ${getStatusBadge(request.status)}
                                    <hr>
                                    <small class="text-muted">申請日: ${formatDate(request.submittedAt)}</small>
                                    
                                    <hr>
                                    <div class="d-grid gap-2">
                                        ${getStatusButtons(request)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getStatusButtons(request) {
    let buttons = '';
    
    switch (request.status) {
        case 'pending':
            buttons = `<button class="btn btn-success" onclick="updateStatus('${request.requestId}', 'approved')">
                <i class="fas fa-check"></i> 承認する
            </button>`;
            break;
        case 'approved':
            buttons = `<button class="btn btn-info" onclick="updateStatus('${request.requestId}', 'ready')">
                <i class="fas fa-box"></i> 受取準備完了
            </button>`;
            break;
        case 'ready':
            buttons = `<button class="btn btn-primary" onclick="updateStatus('${request.requestId}', 'completed')">
                <i class="fas fa-check-double"></i> 受取完了
            </button>`;
            break;
    }
    
    if (['pending', 'approved'].includes(request.status)) {
        buttons += `<button class="btn btn-danger" onclick="updateStatus('${request.requestId}', 'cancelled')">
            <i class="fas fa-times"></i> キャンセル
        </button>`;
    }
    
    return buttons;
}

async function updateStatus(requestId, newStatus) {
    const statusText = {
        'approved': '承認済み',
        'ready': '受取準備完了', 
        'completed': '受取完了',
        'cancelled': 'キャンセル'
    };
    
    if (!confirm(`ステータスを「${statusText[newStatus]}」に変更しますか？`)) {
        return;
    }
    
    try {
        console.log('🔄 Updating status:', requestId, newStatus);
        
        const response = await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'updateRequestStatus',
                requestId: requestId,
                status: newStatus,
                updatedBy: userProfile.userId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('ステータスが正常に更新されました');
            // Update local data and reload
            const request = allRequests.find(r => r.requestId === requestId);
            if (request) {
                request.status = newStatus;
            }
            showRequestDetails(requestId);
        } else {
            throw new Error(result.error || 'ステータスの更新に失敗しました');
        }
        
    } catch (error) {
        console.error('❌ Status update failed:', error);
        alert('ステータスの更新中にエラーが発生しました: ' + error.message);
    }
}

// Utility functions
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