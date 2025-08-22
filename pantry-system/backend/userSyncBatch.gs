/**
 * ユーザー同期バッチ処理
 * 
 * このファイルはreservationシートからuserシートへの
 * データ同期に関する全ての処理を管理します
 */

/**
 * 日時トリガーの設定・管理
 */
function setupUserSyncTrigger() {
  try {
    // 既存のトリガーを削除
    deleteUserSyncTriggers();
    
    // 毎日午前2時に実行するトリガーを設定
    ScriptApp.newTrigger('scheduledUserSync')
      .timeBased()
      .everyDays(1)
      .atHour(2)
      .create();
    
    logToSheet('INFO', 'User Sync Trigger Setup', {
      message: '日時トリガーを設定しました（毎日午前2時実行）'
    });
    
    return {
      success: true,
      message: 'ユーザー同期トリガーを設定しました（毎日午前2時実行）'
    };
    
  } catch (error) {
    logToSheet('ERROR', 'Trigger Setup Error', { error: error.toString() });
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ユーザー同期トリガーの削除
 */
function deleteUserSyncTriggers() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'scheduledUserSync') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    logToSheet('INFO', 'User Sync Triggers Deleted', {
      message: '既存のユーザー同期トリガーを削除しました'
    });
    
    return {
      success: true,
      message: 'ユーザー同期トリガーを削除しました'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * スケジュール実行用のユーザー同期関数
 */
function scheduledUserSync() {
  try {
    logToSheet('INFO', 'Scheduled User Sync Started', {
      timestamp: new Date().toISOString()
    });
    
    // userシート初期化
    const initResult = initializeUserSheet();
    if (!initResult.success) {
      throw new Error('userシート初期化に失敗: ' + initResult.error);
    }
    
    // 全データ同期
    const syncResult = syncAllUsersFromReservations();
    if (!syncResult.success) {
      throw new Error('ユーザーデータ同期に失敗: ' + syncResult.error);
    }
    
    logToSheet('INFO', 'Scheduled User Sync Completed', {
      message: 'スケジュールされたユーザー同期が正常に完了しました',
      userCount: syncResult.data?.userCount || 0,
      totalVisits: syncResult.data?.totalVisits || 0
    });
    
    return {
      success: true,
      message: `スケジュール同期完了: ${syncResult.data?.userCount || 0}名のユーザーを同期しました`
    };
    
  } catch (error) {
    logToSheet('ERROR', 'Scheduled User Sync Error', {
      error: error.toString(),
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * トリガー状態の確認
 */
function getUserSyncTriggerStatus() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    const userSyncTriggers = triggers.filter(trigger => 
      trigger.getHandlerFunction() === 'scheduledUserSync'
    );
    
    const triggerInfo = userSyncTriggers.map(trigger => ({
      id: trigger.getUniqueId(),
      type: trigger.getTriggerSource().toString(),
      eventType: trigger.getEventType().toString(),
      handlerFunction: trigger.getHandlerFunction()
    }));
    
    return {
      success: true,
      data: {
        triggerCount: userSyncTriggers.length,
        triggers: triggerInfo,
        isActive: userSyncTriggers.length > 0
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * userシートの初期化（手動作成されたシートに対応）
 */
function initializeUserSheet() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let userSheet = sheet.getSheetByName('user');
    
    if (!userSheet) {
      return {
        success: false,
        error: 'userシートが見つかりません。Google Sheetsで手動作成してください。'
      };
    }
    
    // ヘッダー行を設定（16列構造）
    const userHeaders = [
      'user_id',
      'name_kana',
      'name_kanji',
      'email',
      'phone',
      'normalized_area',
      'total_visits',
      'first_visit_date',
      'last_visit_date',
      'avg_household_size',
      'recent_household_sizes', // JSON配列として最新10件の世帯人数を記録
      'visit_locations',        // JSON配列として利用場所を記録
      'visit_history',          // JSON配列として詳細な利用履歴を記録
      'created_at',
      'updated_at',
      'status'
    ];
    
    // ヘッダー行を設定
    userSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
    userSheet.getRange(1, 1, 1, userHeaders.length).setFontWeight('bold');
    
    logToSheet('INFO', 'User Sheet Initialized', {
      message: 'userシートを16列構造で初期化しました'
    });
    
    return {
      success: true,
      message: 'userシートを初期化しました'
    };
    
  } catch (error) {
    logToSheet('ERROR', 'Initialize User Sheet Error', { error: error.toString() });
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * reservationシートから全ユーザーデータを同期
 */
function syncAllUsersFromReservations() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const reservationSheet = sheet.getSheetByName('reservation');
    const userSheet = sheet.getSheetByName('user');
    
    if (!reservationSheet || !userSheet) {
      throw new Error('必要なシートが見つかりません');
    }
    
    // reservationデータを取得
    const reservationData = reservationSheet.getDataRange().getValues();
    if (reservationData.length <= 1) {
      return {
        success: true,
        message: '同期するデータがありません',
        data: { userCount: 0, totalVisits: 0 }
      };
    }
    
    // ヘッダー行を取得してインデックスマップを作成
    const headers = reservationData[0];
    const colIndex = {};
    headers.forEach((header, index) => {
      colIndex[header] = index;
    });
    
    // ユーザーごとにデータを集約
    const userMap = new Map();
    let totalVisits = 0;
    
    // データ行を処理（ヘッダーを除く）
    for (let i = 1; i < reservationData.length; i++) {
      const row = reservationData[i];
      const nameKana = row[colIndex['name_kana']] || '';
      
      if (!nameKana) continue;
      
      // ユーザーデータを取得または初期化
      if (!userMap.has(nameKana)) {
        userMap.set(nameKana, {
          name_kana: nameKana,
          name_kanji: row[colIndex['name_kanji']] || '',
          email: row[colIndex['email']] || '',
          phone: row[colIndex['phone']] || '',
          area: row[colIndex['area']] || '',
          visits: [],
          household_sizes: [],
          locations: new Set()
        });
      }
      
      const user = userMap.get(nameKana);
      
      // 訪問データを追加
      const visitDate = row[colIndex['created_at']] || row[colIndex['timestamp']];
      const pantryId = row[colIndex['pantry_id']] || '';
      const location = pantryId.split('.').pop() || '不明';
      const householdSize = parseInt(row[colIndex['household_adult']] || 0) + 
                           parseInt(row[colIndex['household_child']] || 0);
      
      user.visits.push({
        date: visitDate,
        pantry_id: pantryId,
        location: location,
        household_size: householdSize,
        status: row[colIndex['status']] || 'confirmed'
      });
      
      if (householdSize > 0) {
        user.household_sizes.push(householdSize);
      }
      
      user.locations.add(location);
      
      // 最新の連絡先情報で更新
      if (row[colIndex['email']]) user.email = row[colIndex['email']];
      if (row[colIndex['phone']]) user.phone = row[colIndex['phone']];
      if (row[colIndex['area']]) user.area = row[colIndex['area']];
      
      totalVisits++;
    }
    
    // userシートに書き込むデータを準備
    const userData = [];
    const now = new Date();
    
    userMap.forEach((user, nameKana) => {
      // 訪問履歴を日付でソート（新しい順）
      user.visits.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // 統計を計算
      const confirmedVisits = user.visits.filter(v => v.status !== 'cancelled');
      const totalVisitCount = confirmedVisits.length;
      const firstVisit = confirmedVisits.length > 0 ? 
        confirmedVisits[confirmedVisits.length - 1].date : null;
      const lastVisit = confirmedVisits.length > 0 ? 
        confirmedVisits[0].date : null;
      
      // 平均世帯人数を計算
      const validHouseholdSizes = user.household_sizes.filter(size => size > 0);
      const avgHouseholdSize = validHouseholdSizes.length > 0 ?
        Math.round(validHouseholdSizes.reduce((sum, size) => sum + size, 0) / validHouseholdSizes.length * 10) / 10 : 0;
      
      // 最新10件の世帯人数
      const recentHouseholdSizes = validHouseholdSizes.slice(0, 10);
      
      // 最新50件の訪問履歴
      const visitHistory = confirmedVisits.slice(0, 50).map(v => ({
        date: v.date,
        pantry_id: v.pantry_id,
        location: v.location,
        household_size: v.household_size
      }));
      
      // 住所の正規化
      const normalizedArea = normalizeAddress(user.area);
      
      // user_idの生成（name_kanaのハッシュ値）
      const userId = 'U' + Utilities.computeDigest(
        Utilities.DigestAlgorithm.MD5, 
        nameKana
      ).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('').substring(0, 8);
      
      userData.push([
        userId,
        user.name_kana,
        user.name_kanji,
        user.email,
        user.phone,
        normalizedArea,
        totalVisitCount,
        firstVisit,
        lastVisit,
        avgHouseholdSize,
        JSON.stringify(recentHouseholdSizes),
        JSON.stringify(Array.from(user.locations)),
        JSON.stringify(visitHistory),
        now,
        now,
        'active'
      ]);
    });
    
    // userシートをクリアして新しいデータを書き込み
    if (userData.length > 0) {
      // ヘッダー行以外をクリア
      const lastRow = userSheet.getLastRow();
      if (lastRow > 1) {
        userSheet.getRange(2, 1, lastRow - 1, 16).clearContent();
      }
      
      // データを書き込み
      userSheet.getRange(2, 1, userData.length, 16).setValues(userData);
    }
    
    logToSheet('INFO', 'User Sync Completed', {
      userCount: userData.length,
      totalVisits: totalVisits
    });
    
    return {
      success: true,
      message: `${userData.length}名のユーザーデータを同期しました`,
      data: {
        userCount: userData.length,
        totalVisits: totalVisits
      }
    };
    
  } catch (error) {
    logToSheet('ERROR', 'Sync All Users Error', { error: error.toString() });
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 新しい予約が追加された時の個別ユーザー更新
 * onEditトリガーから呼び出される
 */
function updateUserOnNewReservation(nameKana) {
  try {
    if (!nameKana) return;
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const userSheet = sheet.getSheetByName('user');
    
    if (!userSheet) return;
    
    // 既存のユーザーを検索
    const userData = userSheet.getDataRange().getValues();
    let userRowIndex = -1;
    
    for (let i = 1; i < userData.length; i++) {
      if (userData[i][1] === nameKana) { // name_kana列
        userRowIndex = i;
        break;
      }
    }
    
    // ユーザーが見つからない場合は全体同期を実行
    if (userRowIndex === -1) {
      syncAllUsersFromReservations();
      return;
    }
    
    // 該当ユーザーのreservationデータを再集計
    const reservationSheet = sheet.getSheetByName('reservation');
    const reservationData = reservationSheet.getDataRange().getValues();
    
    // ヘッダー行のインデックスマップ
    const headers = reservationData[0];
    const colIndex = {};
    headers.forEach((header, index) => {
      colIndex[header] = index;
    });
    
    // ユーザーの全予約を集計
    const userVisits = [];
    const householdSizes = [];
    const locations = new Set();
    let email = '';
    let phone = '';
    let area = '';
    let nameKanji = '';
    
    for (let i = 1; i < reservationData.length; i++) {
      const row = reservationData[i];
      if (row[colIndex['name_kana']] === nameKana) {
        const visitDate = row[colIndex['created_at']] || row[colIndex['timestamp']];
        const pantryId = row[colIndex['pantry_id']] || '';
        const location = pantryId.split('.').pop() || '不明';
        const householdSize = parseInt(row[colIndex['household_adult']] || 0) + 
                             parseInt(row[colIndex['household_child']] || 0);
        
        userVisits.push({
          date: visitDate,
          pantry_id: pantryId,
          location: location,
          household_size: householdSize,
          status: row[colIndex['status']] || 'confirmed'
        });
        
        if (householdSize > 0) {
          householdSizes.push(householdSize);
        }
        
        locations.add(location);
        
        // 最新の情報で更新
        if (row[colIndex['email']]) email = row[colIndex['email']];
        if (row[colIndex['phone']]) phone = row[colIndex['phone']];
        if (row[colIndex['area']]) area = row[colIndex['area']];
        if (row[colIndex['name_kanji']]) nameKanji = row[colIndex['name_kanji']];
      }
    }
    
    // 統計を再計算
    userVisits.sort((a, b) => new Date(b.date) - new Date(a.date));
    const confirmedVisits = userVisits.filter(v => v.status !== 'cancelled');
    const totalVisitCount = confirmedVisits.length;
    const firstVisit = confirmedVisits.length > 0 ? 
      confirmedVisits[confirmedVisits.length - 1].date : null;
    const lastVisit = confirmedVisits.length > 0 ? 
      confirmedVisits[0].date : null;
    
    const validHouseholdSizes = householdSizes.filter(size => size > 0);
    const avgHouseholdSize = validHouseholdSizes.length > 0 ?
      Math.round(validHouseholdSizes.reduce((sum, size) => sum + size, 0) / validHouseholdSizes.length * 10) / 10 : 0;
    
    const recentHouseholdSizes = validHouseholdSizes.slice(0, 10);
    const visitHistory = confirmedVisits.slice(0, 50).map(v => ({
      date: v.date,
      pantry_id: v.pantry_id,
      location: v.location,
      household_size: v.household_size
    }));
    
    const normalizedArea = normalizeAddress(area);
    
    // userシートの該当行を更新
    const updateRow = userRowIndex + 1;
    userSheet.getRange(updateRow, 3).setValue(nameKanji);  // name_kanji
    userSheet.getRange(updateRow, 4).setValue(email);      // email
    userSheet.getRange(updateRow, 5).setValue(phone);      // phone
    userSheet.getRange(updateRow, 6).setValue(normalizedArea); // normalized_area
    userSheet.getRange(updateRow, 7).setValue(totalVisitCount); // total_visits
    userSheet.getRange(updateRow, 8).setValue(firstVisit);  // first_visit_date
    userSheet.getRange(updateRow, 9).setValue(lastVisit);   // last_visit_date
    userSheet.getRange(updateRow, 10).setValue(avgHouseholdSize); // avg_household_size
    userSheet.getRange(updateRow, 11).setValue(JSON.stringify(recentHouseholdSizes)); // recent_household_sizes
    userSheet.getRange(updateRow, 12).setValue(JSON.stringify(Array.from(locations))); // visit_locations
    userSheet.getRange(updateRow, 13).setValue(JSON.stringify(visitHistory)); // visit_history
    userSheet.getRange(updateRow, 15).setValue(new Date()); // updated_at
    
    logToSheet('INFO', 'User Updated', {
      nameKana: nameKana,
      totalVisits: totalVisitCount
    });
    
  } catch (error) {
    logToSheet('ERROR', 'Update User Error', {
      error: error.toString(),
      nameKana: nameKana
    });
  }
}

/**
 * reservationシートが編集された時のトリガー関数
 */
function onEdit(e) {
  try {
    // 編集されたシートがreservationシートか確認
    if (e.source.getActiveSheet().getName() !== 'reservation') {
      return;
    }
    
    // 編集された行を取得
    const row = e.range.getRow();
    if (row <= 1) return; // ヘッダー行は無視
    
    // name_kana列の値を取得
    const sheet = e.source.getActiveSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const nameKanaCol = headers.indexOf('name_kana') + 1;
    
    if (nameKanaCol > 0) {
      const nameKana = sheet.getRange(row, nameKanaCol).getValue();
      if (nameKana) {
        // 非同期でユーザー情報を更新
        updateUserOnNewReservation(nameKana);
      }
    }
    
  } catch (error) {
    logToSheet('ERROR', 'onEdit Trigger Error', {
      error: error.toString()
    });
  }
}