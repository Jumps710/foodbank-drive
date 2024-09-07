let displayName = '';

// WOFF APIの初期化とプロファイル取得の流れ
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
    const customFileLabel = document.querySelector('.custom-file-label');
    const fileNameDisplay = document.getElementById('fileName');
    const form = document.getElementById('foodDriveForm');
    const modal = document.getElementById('reviewModal');
    const modalSummary = document.getElementById('modalSummary');
    const confirmSubmit = document.getElementById('confirmSubmit');
    const closeModal = document.getElementsByClassName('close')[0];

    let formData = new FormData();

    // カスタムファイル選択ラベルをクリックしたらファイル選択を開く
    customFileLabel.addEventListener('click', function () {
        photoInput.click();
    });

    // ファイル選択後、ファイル名を表示
    photoInput.addEventListener('change', function () {
        const file = photoInput.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
        } else {
            fileNameDisplay.textContent = '選択されていません';
        }
    });

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
        const halfWidthValue = value.replace(/[！-～]/g, function (ch) {
            return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
        });

        if (isNaN(halfWidthValue)) {
            alert("数字だけ入力してください");
            weightInput.value = '';
        } else {
            weightInput.value = halfWidthValue;
        }
    });

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

    confirmSubmit.onclick = function () {
        hideModal();
        submitForm();
    };

 function submitForm() {
    const formData = new FormData(form);

    const file = photoInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function () {
            const base64Image = reader.result.split(',')[1];
            formData.append('photo', base64Image);
            sendData(new URLSearchParams(formData));  // URLSearchParamsを使用
        };
        reader.readAsDataURL(file);
    } else {
        sendData(new URLSearchParams(formData));  // URLSearchParamsを使用
    }
}

function sendData(params) {
    const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

    fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: params,  // URLSearchParamsを送信
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',  // Content-Typeをtext/plainに設定
        },
        redirect: 'follow'  // リダイレクトに対応
    })
    .then(response => response.text())  // テキストとして処理
    .then(result => {
        try {
            const jsonResult = JSON.parse(result);  // レスポンスをJSONとして処理
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
