document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('foodDriveForm');
    const photoInput = document.getElementById('photo');
    const fileNameDisplay = document.getElementById('fileName');
    const modal = document.getElementById('reviewModal');
    const modalSummary = document.getElementById('modalSummary');
    const confirmSubmit = document.getElementById('confirmSubmit');
    const closeModal = document.getElementsByClassName('close')[0];
    const photoPreview = document.getElementById('photoPreview');  

    // ファイル選択後、ファイル名を表示
    photoInput.addEventListener('change', function () {
        const file = photoInput.files[0];
        fileNameDisplay.textContent = file ? file.name : '選択されていません';
    });

    // モーダルを表示
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

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const tweet = document.querySelector('input[name="tweet"]:checked').value === 'true' ? 'する' : 'しない';
        const donator = document.getElementById('donator').value;
        const weight = document.getElementById('weight').value;
        const contents = document.getElementById('contents').value;
        const memo = document.getElementById('memo').value;

        const file = photoInput.files[0];

        const createSummary = (imageTag = '') => `
            <div><strong>Tweet:</strong> ${tweet}</div>
            <div><strong>寄付者:</strong> ${donator}</div>
            <div><strong>重量:</strong> ${weight} kg</div>
            <div><strong>寄付内容:</strong> ${contents}</div>
            <div><strong>メモ:</strong> ${memo}</div>
            <div><strong>写真:</strong> ${imageTag ? imageTag : 'なし'}</div>
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

    confirmSubmit.onclick = function () {
        hideModal();
        submitForm();
    };

    function submitForm() {
        const file = photoInput.files[0];

        // ファイルがある場合はBase64エンコードする
        if (file) {
            const reader = new FileReader();
            reader.onload = function () {
                const base64Image = reader.result.split(',')[1];  // Base64の画像データ部分を抽出
                sendData({
                    tweet: document.querySelector('input[name="tweet"]:checked').value,
                    donator: document.getElementById('donator').value,
                    weight: document.getElementById('weight').value,
                    contents: document.getElementById('contents').value,
                    memo: document.getElementById('memo').value,
                    photo: base64Image  // 画像データをBase64で送信
                });
            };
            reader.readAsDataURL(file);
        } else {
            sendData({
                tweet: document.querySelector('input[name="tweet"]:checked').value,
                donator: document.getElementById('donator').value,
                weight: document.getElementById('weight').value,
                contents: document.getElementById('contents').value,
                memo: document.getElementById('memo').value
            });
        }
    }

    function sendData(data) {
        const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

        // URLSearchParamsでデータをシリアライズ
        const params = new URLSearchParams();
        for (let key in data) {
            params.append(key, data[key]);
        }

        fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',  // 参考記事に基づき修正
            },
            body: params,  // URLSearchParamsを使用
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
