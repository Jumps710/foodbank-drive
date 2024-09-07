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

        const tweet = document.querySelector('input[name="tweet"]:checked').value;
        const donator = document.getElementById('donator').value;
        const weight = document.getElementById('weight').value;
        const contents = document.getElementById('contents').value;
        const memo = document.getElementById('memo').value;

        const params = new URLSearchParams();
        params.append('tweet', tweet);
        params.append('donator', donator);
        params.append('weight', weight);
        params.append('contents', contents);
        params.append('memo', memo);

        // データ送信
        sendData(params);
    });

    function sendData(params) {
        const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

        fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: params,  // URLSearchParamsでデータを送信
            redirect: 'follow'
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                alert('送信が完了しました。');
                form.reset();
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
