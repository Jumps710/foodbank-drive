/**
 * 既存データを新システム形式に変換するヘルパー関数
 * 新しいスプレッドシート: 1XyNivqVU8J6pyF9CA5XNmkv40rAedsnKGdRAn3qniAU
 */

function verifyDataMigration() {
  const newSpreadsheetId = '1XyNivqVU8J6pyF9CA5XNmkv40rAedsnKGdRAn3qniAU';
  
  try {
    const spreadsheet = SpreadsheetApp.openById(newSpreadsheetId);
    console.log('スプレッドシートアクセス成功: ' + spreadsheet.getName());
    
    // 既存データの確認
    const existingData = spreadsheet.getSheetByName('パントリー予約');
    if (existingData) {
      console.log('既存データシート発見: ' + existingData.getName());
      console.log('データ行数: ' + existingData.getLastRow());
      
      // 新システム用データの変換
      convertExistingDataToNewFormat();
      
      return {
        success: true,
        message: '既存データの確認と変換が完了しました'
      };
    } else {
      console.log('既存データシートが見つかりません');
      return {
        success: false,
        message: '既存データシートが見つかりません'
      };
    }
    
  } catch (error) {
    console.error('データ確認エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

function convertExistingDataToNewFormat() {
  const newSpreadsheetId = '1XyNivqVU8J6pyF9CA5XNmkv40rAedsnKGdRAn3qniAU';
  const spreadsheet = SpreadsheetApp.openById(newSpreadsheetId);
  
  // 既存データシートを取得
  const existingSheet = spreadsheet.getSheetByName('パントリー予約');
  if (!existingSheet) {
    console.log('既存データシートが見つかりません');
    return;
  }
  
  const existingData = existingSheet.getDataRange().getValues();
  const headers = existingData[0];
  const dataRows = existingData.slice(1);
  
  console.log('既存データ: ' + dataRows.length + '行');
  
  // 新システムのシートを準備
  ensureNewSystemSheets(spreadsheet);
  
  // ユーザーデータを抽出・変換
  const users = extractUsersFromExistingData(dataRows, headers);
  insertUsersToNewSystem(spreadsheet, users);
  
  // 予約データを抽出・変換
  const reservations = extractReservationsFromExistingData(dataRows, headers);
  insertReservationsToNewSystem(spreadsheet, reservations);
  
  // 利用履歴を作成
  createUsageHistory(spreadsheet, reservations);
  
  console.log('データ変換完了');
}

function ensureNewSystemSheets(spreadsheet) {
  const requiredSheets = ['Users_v2', 'Reservations_v2', 'UsageHistory_v2', 'Pantries_v2', 'EventLogs_v2', 'Settings_v2'];
  
  requiredSheets.forEach(sheetName => {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      console.log('新しいシートを作成: ' + sheetName);
    }
    
    // ヘッダーを設定
    setSheetHeaders(sheet, sheetName);
  });
}

function setSheetHeaders(sheet, sheetName) {
  switch (sheetName) {
    case 'Users_v2':
      sheet.getRange(1, 1, 1, 14).setValues([[
        'user_id', 'name_kana', 'name_kanji', 'area', 'email', 'phone',
        'household_adults', 'household_children', 'household_details',
        'first_visit_date', 'total_visits', 'last_visit_date', 'created_at', 'updated_at'
      ]]);
      break;
      
    case 'Reservations_v2':
      sheet.getRange(1, 1, 1, 15).setValues([[
        'reservation_id', 'pantry_id', 'user_id', 'name_kana', 'event_date',
        'pickup_location', 'requested_items', 'special_needs', 'allergies',
        'cooking_equipment', 'support_info', 'visit_count', 'notes', 'status', 'created_at'
      ]]);
      break;
      
    case 'UsageHistory_v2':
      sheet.getRange(1, 1, 1, 8).setValues([[
        'history_id', 'user_id', 'name_kana', 'pantry_id', 'event_date',
        'pickup_location', 'visit_count', 'created_at'
      ]]);
      break;
      
    case 'Pantries_v2':
      sheet.getRange(1, 1, 1, 15).setValues([[
        'pantry_id', 'event_date', 'event_time', 'registration_start', 'registration_end',
        'location', 'location_address', 'location_access', 'capacity_total', 'capacity_used',
        'title', 'header_message', 'auto_reply_message', 'status', 'created_at'
      ]]);
      break;
      
    case 'EventLogs_v2':
      sheet.getRange(1, 1, 1, 9).setValues([[
        'log_id', 'event_type', 'admin_user', 'pantry_id', 'user_name_kana',
        'reservation_id', 'event_detail', 'ip_address', 'created_at'
      ]]);
      break;
      
    case 'Settings_v2':
      sheet.getRange(1, 1, 1, 4).setValues([[
        'setting_key', 'setting_value', 'description', 'updated_at'
      ]]);
      break;
  }
  
  // ヘッダーの書式設定
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setBackground('#f8f9fa');
  headerRange.setFontWeight('bold');
}

function extractUsersFromExistingData(dataRows, headers) {
  const users = {};
  let userIdCounter = 1;
  
  dataRows.forEach(row => {
    const nameKana = row[getColumnIndex(headers, '氏名（カタカナ・フルネームでお願いします）')];
    const nameKanji = row[getColumnIndex(headers, '氏名（漢字）')];
    const area = row[getColumnIndex(headers, '住んでいる地域（真間、八幡、曽谷など）')];
    const email = row[getColumnIndex(headers, 'メールアドレス')];
    const phone = row[getColumnIndex(headers, '連絡先（メールアドレスまたは電話など）')];
    const householdDetails = row[getColumnIndex(headers, '世帯構成（ご自身を含む）')];
    const createdAt = row[getColumnIndex(headers, 'タイムスタンプ')];
    
    if (nameKana && !users[nameKana]) {
      users[nameKana] = {
        user_id: 'USR' + String(userIdCounter).padStart(3, '0'),
        name_kana: nameKana,
        name_kanji: nameKanji || '',
        area: area || '',
        email: email || '',
        phone: phone || '',
        household_adults: '',
        household_children: '',
        household_details: householdDetails || '',
        first_visit_date: createdAt || '',
        total_visits: 1,
        last_visit_date: createdAt || '',
        created_at: new Date(),
        updated_at: new Date()
      };
      userIdCounter++;
    } else if (nameKana && users[nameKana]) {
      // 既存ユーザーの場合、訪問回数を増やす
      users[nameKana].total_visits++;
      users[nameKana].last_visit_date = createdAt;
    }
  });
  
  return Object.values(users);
}

function extractReservationsFromExistingData(dataRows, headers) {
  const reservations = [];
  let reservationIdCounter = 1;
  
  dataRows.forEach(row => {
    const nameKana = row[getColumnIndex(headers, '氏名（カタカナ・フルネームでお願いします）')];
    const eventDate = row[getColumnIndex(headers, '取りに来られる日（毎月第２土曜日）')];
    const location = row[getColumnIndex(headers, '食材を受け取る場所')];
    const requestedItems = row[getColumnIndex(headers, '希望する食品')];
    const specialNeeds = row[getColumnIndex(headers, 'おむつ・粉ミルクの要否')];
    const allergies = row[getColumnIndex(headers, 'アレルギーの有無')];
    const cookingEquipment = row[getColumnIndex(headers, 'お手持ちの調理器具（複数選択可）')];
    const supportInfo = row[getColumnIndex(headers, '以下のうち、支援を受けている団体/機関があれば選んで下さい。')];
    const notes = row[getColumnIndex(headers, '備考欄・連絡したいことなど')];
    const createdAt = row[getColumnIndex(headers, 'タイムスタンプ')];
    
    if (nameKana) {
      const reservationId = generateReservationId(createdAt, reservationIdCounter);
      const pantryId = generatePantryId(eventDate, location);
      
      reservations.push({
        reservation_id: reservationId,
        pantry_id: pantryId,
        user_id: '', // 後で設定
        name_kana: nameKana,
        event_date: eventDate || '',
        pickup_location: location || '',
        requested_items: requestedItems || '',
        special_needs: specialNeeds || '',
        allergies: allergies || '',
        cooking_equipment: cookingEquipment || '',
        support_info: supportInfo || '',
        visit_count: 1, // 後で調整
        notes: notes || '',
        status: 'completed',
        created_at: createdAt || new Date()
      });
      
      reservationIdCounter++;
    }
  });
  
  return reservations;
}

function generateReservationId(createdAt, counter) {
  if (!createdAt) return 'RSV' + String(counter).padStart(6, '0');
  
  const date = new Date(createdAt);
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const seq = String(counter).padStart(3, '0');
  
  return year + month + day + seq;
}

function generatePantryId(eventDate, location) {
  if (!eventDate) return 'PANTRY_UNKNOWN';
  
  const date = new Date(eventDate);
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const locationMap = {
    '市川市大和田3丁目23-10（二九八家いわせ様の隣）': 'ニコット',
    'アンカー市川  （住所：市川市真間２丁目１６−１２）': '市役所本庁舎'
  };
  
  const shortLocation = locationMap[location] || location || 'その他';
  
  return year + '.' + month + '.' + day + '.' + shortLocation;
}

function insertUsersToNewSystem(spreadsheet, users) {
  const sheet = spreadsheet.getSheetByName('Users_v2');
  
  if (users.length > 0) {
    const userData = users.map(user => [
      user.user_id,
      user.name_kana,
      user.name_kanji,
      user.area,
      user.email,
      user.phone,
      user.household_adults,
      user.household_children,
      user.household_details,
      user.first_visit_date,
      user.total_visits,
      user.last_visit_date,
      user.created_at,
      user.updated_at
    ]);
    
    sheet.getRange(2, 1, userData.length, 14).setValues(userData);
    console.log('ユーザーデータを挿入: ' + users.length + '件');
  }
}

function insertReservationsToNewSystem(spreadsheet, reservations) {
  const sheet = spreadsheet.getSheetByName('Reservations_v2');
  
  if (reservations.length > 0) {
    const reservationData = reservations.map(reservation => [
      reservation.reservation_id,
      reservation.pantry_id,
      reservation.user_id,
      reservation.name_kana,
      reservation.event_date,
      reservation.pickup_location,
      reservation.requested_items,
      reservation.special_needs,
      reservation.allergies,
      reservation.cooking_equipment,
      reservation.support_info,
      reservation.visit_count,
      reservation.notes,
      reservation.status,
      reservation.created_at
    ]);
    
    sheet.getRange(2, 1, reservationData.length, 15).setValues(reservationData);
    console.log('予約データを挿入: ' + reservations.length + '件');
  }
}

function createUsageHistory(spreadsheet, reservations) {
  const sheet = spreadsheet.getSheetByName('UsageHistory_v2');
  
  if (reservations.length > 0) {
    const historyData = reservations.map((reservation, index) => [
      'HIS' + String(index + 1).padStart(6, '0'),
      reservation.user_id,
      reservation.name_kana,
      reservation.pantry_id,
      reservation.event_date,
      reservation.pickup_location,
      reservation.visit_count,
      reservation.created_at
    ]);
    
    sheet.getRange(2, 1, historyData.length, 8).setValues(historyData);
    console.log('利用履歴データを挿入: ' + reservations.length + '件');
  }
}

function getColumnIndex(headers, columnName) {
  const index = headers.indexOf(columnName);
  return index >= 0 ? index : -1;
}

function insertInitialSystemLog() {
  const newSpreadsheetId = '1XyNivqVU8J6pyF9CA5XNmkv40rAedsnKGdRAn3qniAU';
  const spreadsheet = SpreadsheetApp.openById(newSpreadsheetId);
  const sheet = spreadsheet.getSheetByName('EventLogs_v2');
  
  const logData = [
    [
      'LOG001',
      'data_migration',
      'system',
      '',
      '',
      '',
      '既存データからの移行が完了しました',
      '',
      new Date()
    ]
  ];
  
  sheet.getRange(2, 1, 1, 9).setValues(logData);
  console.log('初期ログを挿入');
}

// メイン実行関数
function runDataMigration() {
  console.log('=== データ移行開始 ===');
  
  const result = verifyDataMigration();
  if (result.success) {
    console.log('データ移行成功');
    insertInitialSystemLog();
    console.log('=== データ移行完了 ===');
  } else {
    console.error('データ移行失敗: ' + result.error);
  }
}