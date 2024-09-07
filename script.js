document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('foodDriveForm');
    const photoInput = document.getElementById('photo');
    const fileNameDisplay = document.getElementById('fileName');
    const modal = document.getElementById('reviewModal');
    const modalSummary = document.getElementById('modalSummary');
    const confirmSubmit = document.getElementById('confirmSubmit');
    const closeModal = document.getElementsByClassName('close')[0];
    const photoPreview = document.getElementById('photoPreview');  // 追加

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
        submitForm();  // `submitForm()`が関数外に移動しているか確認
    };

    function submitForm() {
        const formData = new FormData(form);  // FormDataオブジェクトをそのまま使用
        const file = photoInput.files[0];
        if (file) {
            formData.append('photo', file);  // ファイルもFormDataに追加
        }

        sendData(formData);
    }

function sendData(address, profile) {
    const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

    const params = new URLSearchParams();
    params.append('address', address);
    params.append('profile', JSON.stringify(profile));

    fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: params,  // URLSearchParamsを送信
        redirect: 'follow'
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            alert('送信が完了しました。');
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
