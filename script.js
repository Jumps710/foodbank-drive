let displayName = '';  // displayNameを格納する変数

// WOFF APIの初期化とユーザープロファイルの取得
woff
    .init({
        woffId: "Bv2kAkzN6gcZ0nD0brpMpg" // 発行された WOFF ID を指定する
    })
    .then(() => {
        console.log("WOFF APIが正常に初期化されました。");

        // ユーザー情報を取得
        return woff.getProfile();
    })
    .then((profile) => {
        displayName = profile.displayName;  // displayNameを変数に格納
        console.log("取得したユーザー名:", displayName);
    })
    .catch((err) => {
        console.error("WOFF APIの初期化中にエラーが発生しました:", err.code, err.message);
    });

document.addEventListener('DOMContentLoaded', function () {
    const donatorSelect = document.getElementById('donator');
    const otherDonatorField = document.getElementById('otherDonatorField');
    const otherDonatorInput = document.getElementById('otherDonator');
    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photoPreview');
    const form = document.getElementById('foodDriveForm');

    console.log("DOM Content Loaded: フォームの要素が正常に読み込まれました。");

    // 寄付者選択時の処理
    donatorSelect.addEventListener('change', function () {
        if (this.value === 'その他') {
            otherDonatorField.style.display = 'block';
            otherDonatorInput.required = true;
            console.log("寄付者: その他が選択されました。");
        } else {
            otherDonatorField.style.display = 'none';
            otherDonatorInput.required = false;
            otherDonatorInput.value = '';
            console.log(`寄付者: ${this.value} が選択されました。`);
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
                photoPreview.appendChild(img);
                console.log("画像が正常に読み込まれ、プレビューに表示されました。");
            };
            reader.readAsDataURL(file);
        } else {
            console.log("画像が選択されませんでした。");
        }
    });

    // フォーム送信時の処理
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // 入力内容のダイジェストを取得
        const tweet = document.querySelector('input[name="tweet"]:checked').value === 'true' ? 'する' : 'しない';
        const donator = donatorSelect.value === 'その他' ? otherDonatorInput.value + '様' : donatorSelect.value + '様';
        const weight = document.getElementById('weight').value;
        const contents = document.getElementById('contents').value;
        const memo = document.getElementById('memo').value;
        const photo = photoInput.files[0] ? photoInput.files[0].name : 'なし';

        console.log("フォーム送信の確認:");
        console.log(`Tweet: ${tweet}`);
        console.log(`寄付者: ${donator}`);
        console.log(`重量: ${weight}`);
        console.log(`寄付内容: ${contents}`);
        console.log(`メモ: ${memo}`);
        console.log(`写真: ${photo}`);

        // 確認ダイアログ
        if (confirm("入力内容を確認してください。\nこれでよろしいですか？")) {
            console.log("フォーム送信がユーザーによって承認されました。");
            submitForm();
        } else {
            console.log("フォーム送信がキャンセルされました。");
        }
    });

    // フォーム送信処理
    function submitForm() {
        const formData = new FormData(form);

        // 画像ファイルをBase64に変換
        const file = photoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function () {
                const base64Image = reader.result.split(',')[1];
                formData.append('photo', base64Image);
                formData.append('inputter', displayName);  // ユーザー名を追加
                console.log("画像がBase64に変換されました。");
                sendData(Object.fromEntries(formData));
            };
            reader.readAsDataURL(file);
        } else {
            formData.append('inputter', displayName);  // ユーザー名を追加
            console.log("画像が添付されていない状態で送信されます。");
            sendData(Object.fromEntries(formData));
        }
    }

    // データ送信
    function sendData(data) {
        // GASのWebアプリURLを設定
        const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

        console.log("データ送信中...");
        fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'omit',
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
                console.log("フォームデータが正常に送信されました。");
            } else {
                alert('送信に失敗しました。再度お試しください。');
                console.log("エラーが発生しました:", result);
            }
        })
        .catch(error => {
            console.error('データ送信中にエラーが発生しました:', error);
            alert('送信中にエラーが発生しました。');
        });
    }
});
