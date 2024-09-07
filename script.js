document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('foodDriveForm');
    const photoInput = document.getElementById('photo');
    const fileNameDisplay = document.getElementById('fileName');
    const modal = document.getElementById('reviewModal');
    const modalSummary = document.getElementById('modalSummary');
    const confirmSubmit = document.getElementById('confirmSubmit');
    const closeModal = document.getElementsByClassName('close')[0];

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
    const formData = new FormData(form);  // FormDataオブジェクトをそのまま使用
    const file = photoInput.files[0];
    if (file) {
        formData.append('photo', file);  // ファイルもFormDataに追加
    }

    sendData(formData);
}

function sendData(formData) {
    const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

    fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: formData,  // FormDataオブジェクトをそのまま送信
        redirect: 'follow'
    })
    .then(response => response.text())
    .then(result => {
        try {
            const jsonResult = JSON.parse(result);
            if (jsonResult.status === 'success') {
                alert('送信が完了しました。');
                form.reset();
                photoPreview.innerHTML = '';
            } else {
                alert('送信に失敗しました。再度お試しください。');
            }
        } catch (error) {
            console.error('レスポンスの処理中にエラーが発生しました:', error);
            alert('送信中にエラーが発生しました。');
        }
    })
    .catch(error => {
        console.error('送信中にエラーが発生しました:', error);
        alert('送信中にエラーが発生しました。');
    });
}

