let displayName = '';  // displayNameを格納する変数

// WOFF APIの初期化とプロファイル取得の流れ
const initializeWoff = () => {
    woff
        .init({
            woffId: "Bv2kAkzN6gcZ0nD0brpMpg" // 発行された WOFF ID を指定する
        })
        .then(() => {
            console.log("WOFF APIが正常に初期化されました。");

            // WOFFアプリ内で実行されているかを確認
            if (!woff.isInClient()) {
                console.warn("WOFFは外部ブラウザで実行されています。");
                alert("この機能はLINE WORKSアプリ内でのみ使用できます。");
                return;
            }

            // ユーザープロファイルを取得
            return woff.getProfile();
        })
        .then((profile) => {
            if (profile) {
                displayName = profile.displayName;  // displayNameを変数に格納
                console.log("取得したユーザー名:", displayName);
            }
        })
        .catch((err) => {
            console.error("WOFF APIの初期化中にエラーが発生しました:", err.code, err.message);
        });
};



document.addEventListener('DOMContentLoaded', function () {
    const donatorSelect = document.getElementById('donator');
    const otherDonatorField = document.getElementById('otherDonatorField');
    const otherDonatorInput = document.getElementById('otherDonator');
    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photoPreview');
    const form = document.getElementById('foodDriveForm');
    const modal = document.getElementById('reviewModal');
    const modalSummary = document.getElementById('modalSummary');
    const confirmSubmit = document.getElementById('confirmSubmit');
    const closeModal = document.getElementsByClassName('close')[0];

    let formData = new FormData();

    // モーダルを表示
    const showModal = (summary) => {
        modalSummary.innerHTML = summary;
        modal.style.display = 'block';
    };

    // モーダルを閉じる
    const hideModal = () => {
        modal.style.display = 'none';
    };

    // モーダルの閉じるボタン
    closeModal.onclick = hideModal;

    // モーダル外をクリックしたら閉じる
    window.onclick = (event) => {
        if (event.target == modal) {
            hideModal();
        }
    };

    // 寄付者選択時の処理
    donatorSelect.addEventListener('change', function () {
        if (this.value === 'その他') {
            otherDonatorField.style.display = 'block';
            otherDonatorInput.required = true;
        } else {
            otherDonatorField.style.display = 'none';
            otherDonatorInput.required = false;
            otherDonatorInput.value = '';
        }
    });

    const weightInput = document.getElementById('weight');

weightInput.addEventListener('input', function () {
    const value = weightInput.value;

    // 全角数字を半角に変換
    const halfWidthValue = value.replace(/[！-～]/g, function (ch) {
        return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    });

    // 数値以外の文字が入った場合のエラーチェック
    if (isNaN(halfWidthValue)) {
        alert("数字だけ入力してください");
        weightInput.value = ''; // エラーメッセージ表示後、フィールドをクリア
    } else {
        weightInput.value = halfWidthValue; // 半角数字に変換して再設定
    }
});


    // 写真アップロード時のプレビュー表示
    photoInput.addEventListener('change', function () {
        photoPreview.innerHTML = '';
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                photoPreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    // フォーム送信時の処理
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const tweet = document.querySelector('input[name="tweet"]:checked').value === 'true' ? 'する' : 'しない';
        const donator = donatorSelect.value === 'その他' ? otherDonatorInput.value + '様' : donatorSelect.value + '様';
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
            <div><strong>写真:</strong> ${imageTag ? imageTag : 'なし'}</div>
        `;

        // 画像がある場合はBase64に変換し、サムネイルを作成
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                base64Image = e.target.result;
                const imgTag = `<img src="${base64Image}" style="max-width:100px; max-height:100px;" alt="写真プレビュー">`;
                showModal(createSummary(imgTag));
            };
            reader.readAsDataURL(file);
        } else {
            showModal(createSummary());
        }
    });

    // 送信ボタン
    confirmSubmit.onclick = function () {
        hideModal();
        submitForm();
    };


    // フォーム送信処理
    function submitForm() {
        const formData = new FormData(form);

        // 画像ファイルをBase64に変換して追加
        const file = photoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function () {
                const base64Image = reader.result.split(',')[1];
                formData.append('photo', base64Image);
                sendData(Object.fromEntries(formData));
            };
            reader.readAsDataURL(file);
        } else {
            sendData(Object.fromEntries(formData));
        }
    }

    // データ送信処理
    function sendData(data) {
        const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

        fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                alert('送信が完了しました。');
                form.reset();
                photoPreview.innerHTML = '';
            } else {
                alert('送信に失敗しました。再度お試しください。');
            }
        })
        .catch(error => {
            console.error('送信中にエラーが発生しました:', error);
            alert('送信中にエラーが発生しました。');
        });
    }
});
