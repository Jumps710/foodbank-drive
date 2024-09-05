let displayName = '';  // displayNameを格納する変数

woff
    .init({
        woffId: "xVi8e_NseC51iDNs50uwWA" // 発行された WOFF ID を指定する
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
            }
            reader.readAsDataURL(file);
        }
    });

    // フォーム送信時の処理
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // 入力内容のダイジェストを取得
        const tweet = document.querySelector('input[name="tweet"]:checked').value === 'true' ? 'はい' : 'いいえ';
        const donator = donatorSelect.value === 'その他' ? otherDonatorInput.value + '様' : donatorSelect.value + '様';
        const weight = document.getElementById('weight').value;
        const contents = document.getElementById('contents').value;
        const memo = document.getElementById('memo').value;
        const photo = photoInput.files[0] ? photoInput.files[0].name : 'なし';

        const summary = `
        **入力内容の確認**
        1. tweetする/しない: ${tweet}
        2. 寄付者: ${donator}
        3. 重量: ${weight} kg
        4. 寄付内容: ${contents}
        5. メモ: ${memo}
        6. 写真: ${photo}
        `;

        // 確認ダイアログ
        if (confirm(`${summary}\n\nこれでよろしいですか？`)) {
            submitForm();
        } else {
            // キャンセル時の処理（特に何もしない）
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
                sendData(Object.fromEntries(formData));
            }
            reader.readAsDataURL(file);
        } else {
            formData.append('inputter', displayName);  // ユーザー名を追加
            sendData(Object.fromEntries(formData));
        }
    }

    // データ送信
    function sendData(data) {
        // GASのWebアプリURLを設定
        const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/あなたのGASのデプロイURL/exec';

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
                } else {
                    alert('送信に失敗しました。再度お試しください。');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('送信中にエラーが発生しました。');
            });
    }
});
