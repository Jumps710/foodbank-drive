document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('foodDriveForm');
    const photoInput = document.getElementById('photo');
    const fileNameDisplay = document.getElementById('fileName');
    const modal = document.getElementById('reviewModal');
    const modalSummary = document.getElementById('modalSummary');
    const confirmSubmit = document.getElementById('confirmSubmit');
    const closeModal = document.getElementsByClassName('close')[0];

    console.log("ページ読み込み完了");  // ステップ1: ページが読み込まれた

    // ファイル選択後、ファイル名を表示
    photoInput.addEventListener('change', function () {
        const file = photoInput.files[0];
        fileNameDisplay.textContent = file ? file.name : '選択されていません';
        console.log("ファイル選択:", file ? file.name : 'ファイルが選択されていません');  // ステップ2: ファイルが選択された
    });

    // モーダルを表示
    const showModal = (summary) => {
        modalSummary.innerHTML = summary;
        modal.style.display = 'block';
        console.log("モーダルを表示:", summary);  // ステップ3: モーダルが表示された
    };

    const hideModal = () => {
        modal.style.display = 'none';
        console.log("モーダルを閉じた");  // ステップ4: モーダルが閉じられた
    };

    closeModal.onclick = hideModal;
    window.onclick = (event) => {
        if (event.target == modal) {
            hideModal();
        }
    };

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log("フォーム送信開始");  // ステップ5: フォーム送信が開始された

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

        console.log("送信データ:", { tweet, donator, weight, contents, memo });  // ステップ6: 送信データの表示

        // ファイルが選択されている場合、base64に変換して送信
        const file = photoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const base64Image = e.target.result.split(',')[1];  // base64部分を取得
                params.append('photo', base64Image);  // base64データを追加
                console.log("画像がbase64に変換されました");  // ステップ7: 画像が変換された
                sendData(params);
            };
            reader.readAsDataURL(file);  // ファイルをbase64に変換
        } else {
            sendData(params);  // ファイルがない場合はそのまま送信
        }
    });

    function sendData(params) {
        const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwIdZiP3KB3Tf6wMegdXXcorGE6E-djR3rewZLbBI2QBZa_VHYUrODRpdkO8jIhLvnD/exec';

        console.log("データ送信中...");  // ステップ8: データ送信開始
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
            console.log("送信結果:", result);  // ステップ9: サーバーからの応答を表示
            if (result.status === 'success') {
                alert('送信が完了しました。');
                form.reset();
                console.log("送信が成功し、フォームがリセットされました");  // ステップ10: 送信成功
            } else {
                alert('送信に失敗しました。再度お試しください。');
                console.log("送信が失敗しました");  // ステップ11: 送信失敗
            }
        })
        .catch(error => {
            console.error('送信中にエラーが発生しました:', error);
            alert('送信中にエラーが発生しました。');
            console.log("送信エラー:", error);  // ステップ12: エラーが発生
        });
    }
});
