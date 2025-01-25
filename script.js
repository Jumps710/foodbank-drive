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
    let donatorForSubmit = ''; // 送信用のdonator名を保持する変数

    

// クエリパラメータをコンソールに表示する
function logQueryParameters() {
    const params = new URLSearchParams(window.location.search);
    const queryObject = {};

    params.forEach((value, key) => {
        queryObject[key] = value;
    });

    console.log("Query Parameters:", queryObject);
}

// ページが読み込まれたときにクエリパラメータをログに記録する
document.addEventListener('DOMContentLoaded', function () {
    logQueryParameters();
});



    
    // WOFF初期化処理
    const initializeWoff = () => {
        woff
            .init({
                woffId: "Bv2kAkzN6gcZ0nD0brpMpg"
            })
            .then(() => {
                console.log("WOFF APIが正常に初期化されました。");

                if (!woff.isInClient()) {
                    alert("この機能はLINE WORKSアプリ内でのみ使用できます。");
                    return;
                }

                return woff.getProfile();
            })
            .then((profile) => {
                if (profile) {
                    displayName = profile.displayName;
                    userId = profile.userId;
                    console.log("取得したユーザー名:", displayName);
                }
            })
            .catch((err) => {
                console.error("WOFF APIの初期化中にエラーが発生しました:", err.code, err.message);
            });
    };

    // WOFF初期化の呼び出し
    initializeWoff();

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

    // ファイル選択後、ファイル名を表示し、画像プレビューを生成
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
