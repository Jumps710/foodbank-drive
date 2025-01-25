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
    const processingMessage = document.createElement('p');
    processingMessage.innerText = "処理中・・・しばらくお待ちください";
    processingMessage.style.display = 'none';
    processingMessage.style.color = 'red';
    confirmSubmit.parentNode.insertBefore(processingMessage, confirmSubmit.nextSibling);

    let displayName = '';  // WOFF APIで取得するユーザー名
    let userId = '';       // WOFF APIで取得するユーザーID
    let donatorForSubmit = ''; // 送信用の寄付者名

    // クエリパラメータをログに記録
    function logQueryParameters() {
        const params = new URLSearchParams(window.location.search);
        console.log("Query Parameters:", Object.fromEntries(params.entries()));
    }
    logQueryParameters();

    // WOFF初期化処理
    const initializeWoff = () => {
        woff
            .init({ woffId: "Bv2kAkzN6gcZ0nD0brpMpg" })
            .then(() => {
                console.log("WOFF APIが正常に初期化されました。");

                if (!woff.isInClient()) {
                    alert("この機能はLINE WORKSアプリ内でのみ使用できます。");
                    return Promise.reject("LINE WORKSアプリ外での利用");
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
                console.error("WOFF初期化エラー:", err.message || err);
            });
    };
    initializeWoff();

    // 「その他」が選択された場合のフィールド切り替え
    const toggleOtherDonatorField = () => {
        otherDonatorField.style.display = (donatorSelect.value === 'その他') ? 'block' : 'none';
    };
    toggleOtherDonatorField();
    donatorSelect.addEventListener('change', toggleOtherDonatorField);

    // ファイル選択時のプレビュー生成
    photoInput.addEventListener('change', function () {
        const file = this.files[0];
        fileNameDisplay.textContent = file ? file.name : '選択されていません';
        photoPreview.innerHTML = '';

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.maxWidth = '100px';
                photoPreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    // モーダル操作
    const showModal = (summary) => {
        modalSummary.innerHTML = summary;
        modal.style.display = 'block';
    };
    const hideModal = () => {
        modal.style.display = 'none';
    };
    closeModal.onclick = hideModal;
    window.onclick = (event) => {
        if (event.target === modal) hideModal();
    };

    // フォーム送信時の確認処理
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const tweet = document.querySelector('input[name="tweet"]:checked').value === 'true' ? 'する' : 'しない';
        const weight = document.getElementById('weight').value;
        const contents = document.getElementById('contents').value;
        const memo = document.getElementById('memo').value;

        donatorForSubmit = (donatorSelect.value === 'その他')
            ? document.getElementById('otherDonator').value
            : donatorSelect.value;

        const file = photoInput.files[0];
        const createSummary = (imageTag = '') => `
            <div><strong>Tweet:</strong> ${tweet}</div>
            <div><strong>寄付者:</strong> ${donatorForSubmit}</div>
            <div><strong>重量:</strong> ${weight} kg</div>
            <div><strong>寄付内容:</strong> ${contents}</div>
            <div><strong>メモ:</strong> ${memo}</div>
            <div><strong>ユーザー名:</strong> ${displayName}</div>
            <div><strong>写真:</strong> ${imageTag || 'なし'}</div>
        `;

        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const base64Image = e.target.result;
                const imgTag = `<img src="${base64Image}" style="max-width:100px;" alt="写真プレビュー">`;
                showModal(createSummary(imgTag));
            };
            reader.readAsDataURL(file);
        } else {
            showModal(createSummary());
        }
    });

    // 確認後の送信処理
    confirmSubmit.addEventListener('click', function () {
        confirmSubmit.disabled = true;
        processingMessage.style.display = 'block';

        const tweet = document.querySelector('input[name="tweet"]:checked').value;
        const weight = document.getElementById('weight').value;
        const contents = document.getElementById('contents').value;
        const memo = document.getElementById('memo').value;

        const formData = new FormData();
        formData.append('tweet', tweet);
        formData.append('donator', donatorForSubmit);
        formData.append('weight', weight);
        formData.append('contents', contents);
        formData.append('memo', memo);
        formData.append('inputUser', displayName);
        formData.append('inputUserId', userId);

        const file = photoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                formData.append('photo', e.target.result.split(',')[1]);
                sendToBackend(formData);
            };
            reader.readAsDataURL(file);
        } else {
            sendToBackend(formData);
        }
    });

    // バックエンド送信処理
    function sendToBackend(formData) {
        const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

        fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: formData,
        })
            .then((response) => response.json())
            .then((result) => {
                confirmSubmit.disabled = false;
                processingMessage.style.display = 'none';
                if (result.status === 'success') {
                    alert('送信が完了しました。');
                    form.reset();
                    photoPreview.innerHTML = '';
                    hideModal();
                } else {
                    alert('エラー: ' + result.message);
                }
            })
            .catch((error) => {
                confirmSubmit.disabled = false;
                processingMessage.style.display = 'none';
                console.error('送信中のエラー:', error);
                alert('送信に失敗しました。');
            });
    }
});
