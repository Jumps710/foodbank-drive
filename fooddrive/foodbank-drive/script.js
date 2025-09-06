document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('foodDriveForm');
    const donatorSelect = document.getElementById('donator');
    const otherDonatorField = document.getElementById('otherDonatorField');
    const photoInput = document.getElementById('photo');
    const fileNameDisplay = document.getElementById('fileName');
    const modal = document.getElementById('reviewModal');
    const modalSummary = document.getElementById('modalSummary');
    const confirmSubmit = document.getElementById('confirmSubmit');
    const closeModal = document.getElementsByClassName('close')[0];
    const photoPreview = document.getElementById('photoPreview');
    const processingMessage = document.createElement('p');  // 処理中メッセージを作成
    processingMessage.innerText = "処理中・・・しばらくお待ちください";
    processingMessage.style.display = 'none';  // 初期状態では非表示
    processingMessage.style.color = 'red';  // メッセージを赤字で表示
    confirmSubmit.parentNode.insertBefore(processingMessage, confirmSubmit.nextSibling);  // メッセージを送信ボタンの下に配置

    let displayName = '';  // WOFF APIで取得するユーザー名を保持する変数
    let userId = '';       // WOFF APIで取得するユーザーIDを保持する変数
    let donatorForSubmit = ''; // 送信用のdonator名を保持する変数

    // デバッグ情報表示用の要素を作成
    const createDebugInfo = () => {
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debugInfo';
        debugDiv.style.cssText = `
            position: fixed; 
            bottom: 10px; 
            right: 10px; 
            background: rgba(0,0,0,0.8); 
            color: white; 
            padding: 10px; 
            font-size: 12px; 
            max-width: 300px; 
            z-index: 9999; 
            border-radius: 5px;
            font-family: monospace;
        `;
        debugDiv.innerHTML = `
            <div><strong>🔍 デバッグ情報</strong></div>
            <div>UA: ${navigator.userAgent.includes('WORKS') ? '✅ WORKS' : '❌ 非WORKS'}</div>
            <div>URL: ${location.href}</div>
            <div id="woffStatus">WOFF: 初期化中...</div>
            <div id="userInfo">User: 未取得</div>
        `;
        document.body.appendChild(debugDiv);
        return debugDiv;
    };

    const debugDiv = createDebugInfo();

    // 初期状態でフォームを無効化（認証完了まで）
    const initializeFormState = () => {
        const form = document.getElementById('foodDriveForm');
        const submitBtn = document.getElementById('submitBtn');
        
        if (form && submitBtn) {
            // フォームの各入力要素を無効化
            const inputs = form.querySelectorAll('input, select, button');
            inputs.forEach(input => {
                if (input.id !== 'resetBtn') { // リセットボタンは除外
                    input.disabled = true;
                    input.style.opacity = '0.5';
                }
            });
            
            // 送信ボタンに認証待ちメッセージを表示
            submitBtn.textContent = 'LINE WORKS認証中...';
            console.log('📝 フォームを認証待ち状態に設定');
        }
    };

    // フォームを有効化する関数
    const enableForm = () => {
        const form = document.getElementById('foodDriveForm');
        const submitBtn = document.getElementById('submitBtn');
        
        if (form && submitBtn) {
            const inputs = form.querySelectorAll('input, select, button');
            inputs.forEach(input => {
                input.disabled = false;
                input.style.opacity = '1';
            });
            
            submitBtn.textContent = '送信';
            console.log('✅ フォームを使用可能状態に設定');
        }
    };

    // 初期化
    initializeFormState();

    // デバッグ情報を更新する関数
    const updateDebugInfo = (status, userInfo = '') => {
        const woffStatusEl = document.getElementById('woffStatus');
        const userInfoEl = document.getElementById('userInfo');
        if (woffStatusEl) woffStatusEl.textContent = `WOFF: ${status}`;
        if (userInfoEl && userInfo) userInfoEl.textContent = `User: ${userInfo}`;
    };

// クエリパラメータをコンソールに表示する
function logQueryParameters() {
    const params = new URLSearchParams(window.location.search);
    const queryObject = {};

    params.forEach((value, key) => {
        queryObject[key] = value;
    });

    console.log("📋 Query Parameters:", queryObject);
}

// 環境情報をログ出力
function logEnvironmentInfo() {
    console.log("🌐 環境情報:");
    console.log("- User Agent:", navigator.userAgent);
    console.log("- URL:", window.location.href);
    console.log("- Referrer:", document.referrer);
    console.log("- Protocol:", window.location.protocol);
    console.log("- Host:", window.location.host);
    console.log("- WORKS in UA:", navigator.userAgent.includes('WORKS'));
}

// ページが読み込まれたときに環境情報をログに記録する
document.addEventListener('DOMContentLoaded', function () {
    logQueryParameters();
    logEnvironmentInfo();
});



    
    // WOFF初期化処理
    const initializeWoff = () => {
        console.log("🔄 WOFF初期化開始");
        updateDebugInfo("初期化開始");
        
        console.log("User Agent:", navigator.userAgent);
        console.log("Location:", window.location.href);
        console.log("Referrer:", document.referrer);
        
        // WOFFオブジェクトの存在確認
        if (typeof woff === 'undefined') {
            console.error("❌ WOFFオブジェクトが見つかりません");
            updateDebugInfo("❌ WOFF未読込");
            alert("WOFFライブラリの読み込みに失敗しました");
            return;
        }
        
        console.log("✅ WOFFオブジェクト確認済み");
        updateDebugInfo("WOFF読込済み");
        
        // WOFF SDK のバージョンや詳細情報をログ出力
        console.log("🔍 WOFF SDK詳細情報:");
        console.log("- woff object:", woff);
        console.log("- woff methods:", Object.getOwnPropertyNames(woff));
        
        woff
            .init({
                woffId: "Bv2kAkzN6gcZ0nD0brpMpg"
            })
            .then(() => {
                console.log("✅ WOFF APIが正常に初期化されました");
                updateDebugInfo("初期化完了");
                console.log("🔍 クライアント環境チェック開始");
                
                // 複数の方法でクライアント判定を試す
                const isInClient = woff.isInClient();
                console.log("isInClient()結果:", isInClient);
                
                // User Agentでの追加チェック
                const userAgentCheck = navigator.userAgent.includes('WORKS');
                console.log("User AgentでのWORKSチェック:", userAgentCheck);
                
                // URLでの追加チェック（iframeやwebview内での実行）
                const urlCheck = window.location !== window.parent.location;
                console.log("iframe/webview内チェック:", urlCheck);
                
                if (!isInClient) {
                    console.warn("⚠️ 外部ブラウザでの実行を検出（PC/Web版では正常）");
                    console.log("現在のURL:", window.location.href);
                    console.log("現在のUserAgent:", navigator.userAgent);
                    console.log("Window parent check:", window.parent !== window);
                    updateDebugInfo("🔑 ログイン処理中");
                    
                    // 外部ブラウザでは明示的なログイン処理が必要
                    console.log("🔑 外部ブラウザログイン処理を開始");
                    return woff.login();
                }
                
                console.log("✅ 認証済み環境での実行を確認");
                console.log("🔍 ユーザープロファイル取得開始");
                updateDebugInfo("プロファイル取得中");
                
                return woff.getProfile();
            })
            .then((profile) => {
                console.log("📋 プロファイル取得結果:", profile);
                
                // ログイン処理の結果として返されるオブジェクトかプロファイルかを判定
                if (profile && profile.redirectUri) {
                    // ログイン処理の場合、リダイレクトが発生する
                    console.log("🔑 ログイン処理が実行されました");
                    updateDebugInfo("🔑 認証中", "ログイン画面表示");
                    // ログイン後は自動的にリダイレクトされるため、ここでは処理終了
                    return;
                }
                
                if (profile) {
                    displayName = profile.displayName || '';
                    userId = profile.userId || '';
                    
                    console.log("✅ ユーザー情報取得成功");
                    console.log("- displayName:", displayName);
                    console.log("- userId:", userId);
                    updateDebugInfo("✅ 完了", displayName);
                    
                    // フォーム全体を有効化
                    enableForm();
                } else {
                    console.warn("⚠️ プロファイル情報が空です");
                    updateDebugInfo("⚠️ プロファイル空");
                    
                    // プロファイルが取得できない場合は再度ログイン処理を試行
                    console.log("🔄 プロファイル再取得のため、ログイン処理を再実行");
                    return woff.login();
                }
            })
            .catch((err) => {
                console.error("❌ WOFF初期化エラー詳細:");
                console.error("- エラーコード:", err.code);
                console.error("- エラーメッセージ:", err.message);
                console.error("- エラーオブジェクト全体:", err);
                
                updateDebugInfo(`❌ エラー: ${err.code || 'UNKNOWN'}`);
                
                // エラーに応じた詳細情報
                if (err.code) {
                    switch(err.code) {
                        case 'INVALID_WOFF_ID':
                            console.error("💡 WOFF IDが無効です");
                            break;
                        case 'NOT_IN_CLIENT':
                            console.error("💡 LINE WORKSクライアント外で実行されています");
                            break;
                        case 'PERMISSION_DENIED':
                            console.error("💡 アクセス権限がありません");
                            break;
                        default:
                            console.error("💡 不明なエラーです");
                    }
                }
            });
    };

    // 代替のクライアント判定方法
    const alternativeClientCheck = () => {
        console.log("🔍 代替クライアント判定を実行");
        
        // 1. User Agent チェック
        const userAgent = navigator.userAgent;
        const hasWorksUA = userAgent.includes('WORKS') || userAgent.includes('WorksMobile');
        console.log("UA check:", hasWorksUA, userAgent);
        
        // 2. URL パラメータチェック
        const urlParams = new URLSearchParams(window.location.search);
        const hasWorksParam = urlParams.has('worksmobile') || urlParams.has('wm');
        console.log("URL param check:", hasWorksParam);
        
        // 3. Referrer チェック
        const referrer = document.referrer;
        const hasWorksReferrer = referrer.includes('worksmobile') || referrer.includes('works');
        console.log("Referrer check:", hasWorksReferrer, referrer);
        
        // 4. Window プロパティチェック
        const isInFrame = window.self !== window.top;
        console.log("Frame check:", isInFrame);
        
        // 5. 特定のオブジェクトの存在チェック
        const hasWorksObjects = !!(window.WorksMobile || window.wm || window.webkit);
        console.log("Works objects check:", hasWorksObjects);
        
        const alternativeResult = hasWorksUA || hasWorksParam || hasWorksReferrer || isInFrame || hasWorksObjects;
        console.log("🎯 代替判定結果:", alternativeResult);
        
        return alternativeResult;
    };

    // 遅延初期化（WOFF SDKの読み込み完了を待つ）
    const delayedInitialize = (retryCount = 0) => {
        const maxRetries = 5;
        
        if (typeof woff !== 'undefined') {
            console.log(`✅ WOFF SDK確認済み (${retryCount}回目)`);
            initializeWoff();
        } else if (retryCount < maxRetries) {
            console.log(`⏳ WOFF SDK待機中 (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => delayedInitialize(retryCount + 1), 1000);
        } else {
            console.error("❌ WOFF SDK読み込みタイムアウト");
            updateDebugInfo("❌ SDK未読込");
            
            // 代替判定を実行
            const alternativeOK = alternativeClientCheck();
            if (alternativeOK) {
                console.log("💡 代替判定でLINE WORKS環境を検出");
                updateDebugInfo("⚠️ 代替判定OK");
                alert("WOFF SDKの読み込みに失敗しましたが、LINE WORKS環境を検出しました。一部機能が制限される可能性があります。");
            } else {
                console.log("💡 代替判定でもLINE WORKS環境を検出できませんでした");
                updateDebugInfo("❌ 環境不適合");
            }
        }
    };

    // 初期化開始
    delayedInitialize();

    // 「その他」が選択された場合に企業/団体名の入力フィールドを表示
    const toggleOtherDonatorField = () => {
        if (donatorSelect.value === 'その他') {
            otherDonatorField.style.display = 'block';
        } else {
            otherDonatorField.style.display = 'none';
        }
    };

    // ページが読み込まれたときに現在の選択状態に応じてフィールドを初期化
    toggleOtherDonatorField();

    // 寄付者が変更された時に即座に「その他」のフィールドを表示/非表示に
    donatorSelect.addEventListener('change', toggleOtherDonatorField);

photoInput.addEventListener('change', function () {
    fileNameDisplay.textContent = this.files[0] ? this.files[0].name : '選択されていません';
    photoPreview.innerHTML = '';

    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100px';
            photoPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});



    // モーダル表示関数
    const showModal = (summary) => {
        modalSummary.innerHTML = summary;
        modal.style.display = 'block';
    };

    const hideModal = () => {
        modal.style.display = 'none';
    };

    closeModal.onclick = hideModal;
    window.onclick = (event) => {
        if (event.target == modal) {
            hideModal();
        }
    };

    // フォーム送信時のプレビュー画面表示処理
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const tweet = document.querySelector('input[name="tweet"]:checked').value === 'true' ? 'する' : 'しない';

        // "その他"が選択された場合はotherDonatorの値を使用、そうでなければdonatorの値をそのまま使用
        let donator = document.getElementById('donator').value;
        if (donator === 'その他') {
            donator = document.getElementById('otherDonator').value;
        }

        donatorForSubmit = donator;  // 送信用にdonator名を保持

        const weight = document.getElementById('weight').value;
        const contents = document.getElementById('contents').value;
        const memo = document.getElementById('memo').value;

        const file = photoInput.files[0];
        let base64Image = '';

        const createSummary = (imageTag = '') => `
            <div><strong>Tweet:</strong> ${tweet}</div>
            <div><strong>寄付者:</strong> ${donator}</div>
            <div><strong>重量:</strong> ${weight} kg</div>
            <div><strong>寄付内容:</strong> ${contents}</div>
            <div><strong>メモ:</strong> ${memo}</div>
            <div><strong>ユーザー名:</strong> ${displayName}</div>  <!-- WOFF APIから取得したユーザー名を表示 -->
            <div><strong>写真:</strong> ${imageTag ? imageTag : 'なし'}</div>
        `;

        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                base64Image = e.target.result;
                const imgTag = `<img src="${base64Image}" style="max-width:100px;" alt="写真プレビュー">`;
                showModal(createSummary(imgTag));
            };
            reader.readAsDataURL(file);
        } else {
            showModal(createSummary());
        }
    });

    // モーダル内の確認ボタン押下時に送信処理を実行
    confirmSubmit.addEventListener('click', function () {
        // 送信ボタンを非活性化し、処理中メッセージを表示
        confirmSubmit.disabled = true;
        processingMessage.style.display = 'block';

        const tweet = document.querySelector('input[name="tweet"]:checked').value;
        const weight = document.getElementById('weight').value;
        const contents = document.getElementById('contents').value;
        const memo = document.getElementById('memo').value;

        const params = new URLSearchParams();
        params.append('tweet', tweet);
        params.append('donator', donatorForSubmit); // 送信用に保持したdonator名をそのまま使用
        params.append('weight', weight);
        params.append('contents', contents);
        params.append('memo', memo);
        params.append('inputUser', displayName);  // WOFF APIで取得したdisplayNameを送信データに追加
        params.append('inputUserId', userId);  // WOFF APIで取得したdisplayNameIdを送信データに追加

        const file = photoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const base64Image = e.target.result.split(',')[1];
                params.append('photo', base64Image);
                sendData(params);
            };
            reader.readAsDataURL(file);
        } else {
            sendData(params);
        }
    });

    function resizeAndConvertToBase64(file, callback) {
  const img = new Image();
  const reader = new FileReader();

  reader.onload = function (e) {
    img.src = e.target.result;
  };

  img.onload = function () {
    const canvas = document.createElement("canvas");
    const MAX_SIZE = 1000;
    let width = img.width;
    let height = img.height;

    if (width > height && width > MAX_SIZE) {
      height *= MAX_SIZE / width;
      width = MAX_SIZE;
    } else if (height > MAX_SIZE) {
      width *= MAX_SIZE / height;
      height = MAX_SIZE;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        callback(base64);
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.7); // JPEGで70%圧縮
  };

  reader.readAsDataURL(file);
}

    function sendData(params) {
        const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwIdZiP3KB3Tf6wMegdXXcorGE6E-djR3rewZLbBI2QBZa_VHYUrODRpdkO8jIhLvnD/exec';

        fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: params,
            redirect: 'follow'
        })
        .then(response => response.json())
        .then(result => {
            confirmSubmit.disabled = false;  // 処理が完了したらボタンを再度活性化
            processingMessage.style.display = 'none';  // 処理中メッセージを非表示
            if (result.status === 'success') {
                alert('送信が完了しました。');
                form.reset();  // フォームをリセット
                photoPreview.innerHTML = '';  // 写真プレビューをリセット
                hideModal();  // モーダルを閉じる
            } else {
                alert('送信に失敗しました。再度お試しください。');
            }
        })
        .catch(error => {
            confirmSubmit.disabled = false;  // エラー時にもボタンを再度活性化
            processingMessage.style.display = 'none';  // 処理中メッセージを非表示
            console.error('送信中にエラーが発生しました:', error);
            alert('送信中にエラーが発生しました。');
        });
    }
});
