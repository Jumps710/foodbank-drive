/**
 * フードドライブ入庫管理システム - Google Apps Script
 * 
 * このスクリプトは、LINE WORKSアプリからの食品寄付データを
 * Google Sheetsに記録し、写真をGoogle Driveに保存します。
 */

// 設定値
const SHEET_ID = '1JH_bJs9Gtxp-UBu-qY7AV4hxtFzj6jUQJ-daINbJNP4';
const SHEET_NAME = 'フードドライブ記録';
const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID'; // 写真保存用フォルダID（要設定）

/**
 * Web Appのエントリーポイント（POSTリクエスト処理）
 * @param {Object} e - リクエストイベントオブジェクト
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function doPost(e) {
  try {
    // リクエストパラメータの取得
    const params = e.parameter;
    
    // パラメータのログ出力（デバッグ用）
    console.log('Received parameters:', params);
    
    // 必須パラメータの検証
    if (!params.donator || !params.weight || !params.contents) {
      throw new Error('必須項目が不足しています');
    }
    
    // タイムスタンプの生成
    const timestamp = new Date();
    
    // 写真の処理
    let photoUrl = '';
    if (params.photo) {
      photoUrl = savePhotoToDrive(params.photo, timestamp, params.donator);
    }
    
    // スプレッドシートへのデータ保存
    const result = saveToSheet({
      timestamp: timestamp,
      tweet: params.tweet === 'true' ? 'する' : 'しない',
      donator: params.donator,
      weight: params.weight,
      contents: params.contents,
      memo: params.memo || '',
      photoUrl: photoUrl,
      inputUser: params.inputUser || '',
      inputUserId: params.inputUserId || ''
    });
    
    // 成功レスポンスの返却
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'データを正常に保存しました',
        recordId: result.recordId
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // エラーログ出力
    console.error('Error in doPost:', error);
    
    // エラーレスポンスの返却
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.message || '処理中にエラーが発生しました'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Google Sheetsにデータを保存
 * @param {Object} data - 保存するデータ
 * @returns {Object} 保存結果
 */
function saveToSheet(data) {
  try {
    // スプレッドシートを開く
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // シートが存在しない場合は作成
    if (!sheet) {
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      const newSheet = spreadsheet.insertSheet(SHEET_NAME);
      
      // ヘッダー行の設定
      const headers = [
        '記録日時',
        'Tweet',
        '寄付者',
        '重量(kg)',
        '寄付内容',
        'メモ',
        '写真URL',
        '入力者',
        '入力者ID',
        'レコードID'
      ];
      newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      sheet = newSheet;
    }
    
    // レコードIDの生成
    const recordId = Utilities.getUuid();
    
    // データの配列化
    const rowData = [
      data.timestamp,
      data.tweet,
      data.donator,
      data.weight,
      data.contents,
      data.memo,
      data.photoUrl,
      data.inputUser,
      data.inputUserId,
      recordId
    ];
    
    // 最終行の次に追加
    sheet.appendRow(rowData);
    
    return {
      recordId: recordId,
      rowNumber: sheet.getLastRow()
    };
    
  } catch (error) {
    console.error('Error in saveToSheet:', error);
    throw new Error('データの保存に失敗しました: ' + error.message);
  }
}

/**
 * 写真をGoogle Driveに保存
 * @param {string} base64Data - Base64エンコードされた画像データ
 * @param {Date} timestamp - タイムスタンプ
 * @param {string} donator - 寄付者名
 * @returns {string} 保存された画像のURL
 */
function savePhotoToDrive(base64Data, timestamp, donator) {
  try {
    // Base64データをBlobに変換
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/jpeg',
      `fooddrive_${formatDate(timestamp)}_${donator}.jpg`
    );
    
    // 保存先フォルダの取得または作成
    let folder;
    try {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    } catch (e) {
      // フォルダが存在しない場合は作成
      folder = DriveApp.createFolder('フードドライブ写真');
      console.log('Created new folder with ID:', folder.getId());
    }
    
    // ファイルの作成
    const file = folder.createFile(blob);
    
    // 共有設定（リンクを知っている人は閲覧可能）
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // URLの取得
    return file.getUrl();
    
  } catch (error) {
    console.error('Error in savePhotoToDrive:', error);
    // 写真保存エラーは記録処理を止めない
    return 'エラー: 写真の保存に失敗しました';
  }
}

/**
 * 日付を指定フォーマットに変換
 * @param {Date} date - 日付オブジェクト
 * @returns {string} フォーマットされた日付文字列
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * テスト用関数（開発時のデバッグ用）
 */
function testDoPost() {
  const testData = {
    parameter: {
      tweet: 'true',
      donator: 'テスト寄付者',
      weight: '5.5',
      contents: 'テスト商品',
      memo: 'テストメモ',
      inputUser: 'テストユーザー',
      inputUserId: 'test123'
    }
  };
  
  const result = doPost(testData);
  console.log(result.getContent());
}