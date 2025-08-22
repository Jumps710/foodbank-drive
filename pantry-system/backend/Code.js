/**
 * フードパントリー予約システム - シンプルAPI
 */

// スプレッドシートID（正しいID）
const SPREADSHEET_ID = '1XyNivqVU8J6pyF9CA5XNmkv40rAedsnKGdRAn3qniAU';

/**
 * スプレッドシート初期化（ハイブリッドアプローチ）
 */
function initializeSpreadsheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 既存のreservationシートを確認
  const masterSheet = spreadsheet.getSheetByName('reservation');
  if (!masterSheet) {
    return {
      success: false,
      error: 'マスターデータ（reservation）シートが見つかりません'
    };
  }
  
  // ビューシートの定義（集計用）
  const viewSheets = {
    'view_pantries': ['pantry_id', 'event_date', 'location', 'reservation_count', 'unique_users', 'last_updated'],
    'view_users': ['name_kana', 'total_visits', 'first_visit', 'last_visit', 'areas', 'household_size'],
    'view_dashboard': ['metric_name', 'metric_value', 'category', 'last_updated']
  };
  
  // 管理用シートの定義
  const adminSheets = {
    'admins': ['uid', 'email', 'display_name', 'status', 'created_at', 'last_login', 'created_by'],
    'log': ['timestamp', 'level', 'message', 'details', 'user_agent']
  };
  
  // ビューシートの作成
  for (const [sheetName, headers] of Object.entries(viewSheets)) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      console.log(`Created view sheet: ${sheetName}`);
    }
  }
  
  // 管理シートの作成
  for (const [sheetName, headers] of Object.entries(adminSheets)) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      console.log(`Created admin sheet: ${sheetName}`);
    }
  }
  
  // 初回のビュー更新を実行
  updateAllViews();
  
  return {
    success: true,
    message: 'ハイブリッド構成で初期化完了。マスターデータ（reservation）を維持しつつ、集計ビューを作成しました。'
  };
}

/**
 * すべてのビューを更新
 */
function updateAllViews() {
  try {
    const masterData = getMasterData();
    updatePantriesView(masterData);
    updateUsersView(masterData);
    updateDashboardView(masterData);
    
    return {
      success: true,
      message: 'すべてのビューを更新しました'
    };
  } catch (error) {
    logToSheet('ERROR', 'View update failed', { error: error.toString() });
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * マスターデータを取得してクレンジング
 */
function getMasterData() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const masterSheet = sheet.getSheetByName('reservation');
  
  if (!masterSheet || masterSheet.getLastRow() <= 1) {
    return [];
  }
  
  const data = masterSheet.getDataRange().getValues();
  const headers = data[0];
  
  // ヘッダーインデックスを取得
  const indices = {
    timestamp: 0,
    eventDate: headers.indexOf('取りに来られる日（毎月第２土曜日）'),
    location: headers.indexOf('食材を受け取る場所'),
    nameKana: headers.indexOf('氏名（カタカナ・フルネームでお願いします）'),
    nameKanji: headers.indexOf('氏名（漢字）'),
    area: headers.indexOf('住んでいる地域（真間、八幡、曽谷など）'),
    email: headers.indexOf('メールアドレス'),
    householdComposition: headers.indexOf('世帯構成（ご自身を含む）'),
    householdTotal: headers.indexOf('世帯の合計人数（ご自身を含む）')
  };
  
  // データをクレンジング
  const cleanedData = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[indices.timestamp]) continue;
    
    cleanedData.push({
      timestamp: row[indices.timestamp],
      eventDate: parseEventDate(row[indices.eventDate]),
      location: extractLocation(row[indices.location]),
      nameKana: normalizeKanaName(row[indices.nameKana]),
      nameKanji: row[indices.nameKanji] || '',
      area: normalizeAddress(row[indices.area] || ''),
      email: row[indices.email] || '',
      householdSize: parseHouseholdSize(row[indices.householdTotal] || row[indices.householdComposition]),
      rawData: row
    });
  }
  
  return cleanedData;
}

/**
 * イベント日付をパース
 */
function parseEventDate(dateStr) {
  if (!dateStr) return null;
  
  // "8月12日 10:00〜12:00" のような形式をパース
  const match = dateStr.match(/(\d+)月(\d+)日/);
  if (match) {
    const year = new Date().getFullYear();
    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    return new Date(year, month - 1, day);
  }
  
  return null;
}

/**
 * 場所を抽出
 */
function extractLocation(locationStr) {
  if (!locationStr) return '不明';
  
  if (locationStr.includes('市役所')) return '市役所本庁舎';
  if (locationStr.includes('大和田')) return 'ニコット';
  
  return locationStr;
}

/**
 * カナ名を正規化
 */
function normalizeKanaName(name) {
  if (!name) return '';
  
  // 全角スペースを半角に、連続スペースを1つに
  return name.replace(/　/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * 住所を正規化
 */
function normalizeAddress(address) {
  if (!address) return '';
  
  // 基本的なクリーニング
  let normalized = address.toString().trim();
  
  // 数字を半角に統一
  normalized = normalized.replace(/[０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  
  // ハイフンとマイナスを統一
  normalized = normalized.replace(/[−‐―ー]/g, '-');
  
  // 全角スペースを削除
  normalized = normalized.replace(/\s+/g, '');
  
  // 電話番号が混入している場合は除去
  normalized = normalized.replace(/\d{10,11}$/, '');
  
  // 市川市の地域名マッピング
  const areaMapping = {
    // 真間関連
    '市川真間': '市川真間',
    '市川市真間': '市川真間',
    '真間': '市川真間',
    '市川市真間2丁目': '市川真間',
    '市川市真間２丁目': '市川真間',
    '市川真間2丁目': '市川真間',
    '市川真間２丁目': '市川真間',
    
    // 八幡関連
    '市川八幡': '市川八幡',
    '市川市八幡': '市川八幡',
    '八幡': '市川八幡',
    '市川市八幡1丁目': '市川八幡',
    '市川市八幡１丁目': '市川八幡',
    
    // 曽谷関連
    '市川曽谷': '市川曽谷',
    '市川市曽谷': '市川曽谷',
    '曽谷': '市川曽谷',
    
    // 大洲関連
    '市川大洲': '市川大洲',
    '市川市大洲': '市川大洲',
    '大洲': '市川大洲',
    
    // 大和田関連
    '市川大和田': '市川大和田',
    '市川市大和田': '市川大和田',
    '大和田': '市川大和田',
    '市川市大和田3丁目': '市川大和田',
    '市川市大和田３丁目': '市川大和田',
    
    // 東大和田関連
    '市川東大和田': '市川東大和田',
    '市川市東大和田': '市川東大和田',
    '東大和田': '市川東大和田',
    
    // 稲荷木関連
    '市川稲荷木': '市川稲荷木',
    '市川市稲荷木': '市川稲荷木',
    '稲荷木': '市川稲荷木',
    
    // 稲越関連
    '市川稲越': '市川稲越',
    '市川市稲越': '市川稲越',
    '稲越': '市川稲越',
    
    // 市川関連
    '市川市市川': '市川市川',
    '市川': '市川市川',
    
    // 南八幡関連
    '市川南八幡': '市川南八幡',
    '市川市南八幡': '市川南八幡',
    '南八幡': '市川南八幡',
    
    // 鬼越関連
    '市川鬼越': '市川鬼越',
    '市川市鬼越': '市川鬼越',
    '鬼越': '市川鬼越',
    
    // 菅野関連
    '市川菅野': '市川菅野',
    '市川市菅野': '市川菅野',
    '菅野': '市川菅野',
    
    // 中国分関連
    '市川中国分': '市川中国分',
    '市川市中国分': '市川中国分',
    '中国分': '市川中国分',
    
    // 国府台関連
    '市川国府台': '市川国府台',
    '市川市国府台': '市川国府台',
    '国府台': '市川国府台',
    
    // 妙典関連
    '市川妙典': '市川妙典',
    '市川市妙典': '市川妙典',
    '妙典': '市川妙典',
    
    // 富浜関連
    '市川富浜': '市川富浜',
    '市川市富浜': '市川富浜',
    '富浜': '市川富浜',
    
    // 市川大野関連
    '市川大野': '市川大野',
    '市川市大野': '市川大野',
    '大野': '市川大野',
    
    // 相之川関連
    '市川相之川': '市川相之川',
    '市川市相之川': '市川相之川',
    '相之川': '市川相之川'
  };
  
  // 詳細な住所から地域名を抽出
  for (const [pattern, standardName] of Object.entries(areaMapping)) {
    if (normalized.includes(pattern)) {
      return standardName;
    }
  }
  
  // パターンマッチングで地域を特定
  const regionPatterns = [
    { pattern: /市川市?真間/, area: '市川真間' },
    { pattern: /市川市?八幡/, area: '市川八幡' },
    { pattern: /市川市?曽谷/, area: '市川曽谷' },
    { pattern: /市川市?大洲/, area: '市川大洲' },
    { pattern: /市川市?大和田/, area: '市川大和田' },
    { pattern: /市川市?東大和田/, area: '市川東大和田' },
    { pattern: /市川市?稲荷木/, area: '市川稲荷木' },
    { pattern: /市川市?稲越/, area: '市川稲越' },
    { pattern: /市川市?南八幡/, area: '市川南八幡' },
    { pattern: /市川市?鬼越/, area: '市川鬼越' },
    { pattern: /市川市?菅野/, area: '市川菅野' },
    { pattern: /市川市?中国分/, area: '市川中国分' },
    { pattern: /市川市?国府台/, area: '市川国府台' },
    { pattern: /市川市?妙典/, area: '市川妙典' },
    { pattern: /市川市?富浜/, area: '市川富浜' },
    { pattern: /市川市?大野/, area: '市川大野' },
    { pattern: /市川市?相之川/, area: '市川相之川' },
    { pattern: /真間/, area: '市川真間' },
    { pattern: /八幡/, area: '市川八幡' },
    { pattern: /曽谷/, area: '市川曽谷' }
  ];
  
  for (const { pattern, area } of regionPatterns) {
    if (pattern.test(normalized)) {
      return area;
    }
  }
  
  // 市川市の場合
  if (normalized.includes('市川市') || normalized.includes('市川')) {
    return '市川市内';
  }
  
  // その他の場合は元の値を返す（短縮版）
  if (normalized.length > 10) {
    return normalized.substring(0, 10) + '...';
  }
  
  return normalized || '不明';
}

/**
 * 住所正規化テスト
 */
function testAddressNormalization() {
  try {
    const masterData = getMasterData();
    
    // 各ユーザーの住所バリエーションを集計
    const userAddresses = {};
    
    masterData.forEach(record => {
      if (!record.nameKana) return;
      
      if (!userAddresses[record.nameKana]) {
        userAddresses[record.nameKana] = {
          original: new Set(),
          normalized: record.area
        };
      }
      
      // 元の住所情報を収集
      if (record.rawData && record.rawData.length > 5) {
        const originalArea = record.rawData[5] || ''; // area列の元データ
        if (originalArea) {
          userAddresses[record.nameKana].original.add(originalArea);
        }
      }
    });
    
    // 住所バリエーションが多いユーザーを抽出
    const results = [];
    
    Object.entries(userAddresses).forEach(([name, data]) => {
      if (data.original.size > 1) {
        results.push({
          name: name,
          normalized: data.normalized,
          originalCount: data.original.size,
          originalAddresses: Array.from(data.original)
        });
      }
    });
    
    // バリエーション数でソート
    results.sort((a, b) => b.originalCount - a.originalCount);
    
    return {
      success: true,
      data: {
        summary: `${results.length}名のユーザーに住所バリエーションあり`,
        totalUsers: Object.keys(userAddresses).length,
        normalizedCount: results.length,
        details: results.slice(0, 20) // 上位20名のみ
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
 * 世帯人数をパース
 */
function parseHouseholdSize(sizeStr) {
  if (!sizeStr) return 1;
  
  // "4名以上", "2〜3名" などをパース
  const match = sizeStr.toString().match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

/**
 * パントリービューを更新
 */
function updatePantriesView(masterData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const viewSheet = sheet.getSheetByName('view_pantries');
  
  // パントリーごとに集計
  const pantries = {};
  
  masterData.forEach(record => {
    if (!record.eventDate) return;
    
    const year = record.eventDate.getFullYear().toString().slice(-2);
    const month = String(record.eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(record.eventDate.getDate()).padStart(2, '0');
    const pantryId = `${year}.${month}.${day}.${record.location}`;
    
    if (!pantries[pantryId]) {
      pantries[pantryId] = {
        pantryId: pantryId,
        eventDate: record.eventDate,
        location: record.location,
        reservationCount: 0,
        uniqueUsers: new Set()
      };
    }
    
    pantries[pantryId].reservationCount++;
    if (record.nameKana) {
      pantries[pantryId].uniqueUsers.add(record.nameKana);
    }
  });
  
  // シートに書き込み
  if (viewSheet.getLastRow() > 1) {
    viewSheet.getRange(2, 1, viewSheet.getLastRow() - 1, viewSheet.getLastColumn()).clearContent();
  }
  
  const rows = Object.values(pantries).map(p => [
    p.pantryId,
    p.eventDate,
    p.location,
    p.reservationCount,
    p.uniqueUsers.size,
    new Date()
  ]);
  
  if (rows.length > 0) {
    viewSheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }
}

/**
 * ユーザービューを更新
 */
function updateUsersView(masterData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const viewSheet = sheet.getSheetByName('view_users');
  
  // ユーザーごとに集計
  const users = {};
  
  masterData.forEach(record => {
    if (!record.nameKana) return;
    
    if (!users[record.nameKana]) {
      users[record.nameKana] = {
        nameKana: record.nameKana,
        visits: [],
        areas: new Set(),
        householdSizes: []
      };
    }
    
    users[record.nameKana].visits.push(record.timestamp);
    if (record.area) users[record.nameKana].areas.add(record.area);
    if (record.householdSize) users[record.nameKana].householdSizes.push(record.householdSize);
  });
  
  // シートに書き込み
  if (viewSheet.getLastRow() > 1) {
    viewSheet.getRange(2, 1, viewSheet.getLastRow() - 1, viewSheet.getLastColumn()).clearContent();
  }
  
  const rows = Object.values(users).map(u => {
    const sortedVisits = u.visits.sort((a, b) => a - b);
    const avgHouseholdSize = u.householdSizes.length > 0 
      ? Math.round(u.householdSizes.reduce((a, b) => a + b, 0) / u.householdSizes.length)
      : 1;
    
    return [
      u.nameKana,
      u.visits.length,
      sortedVisits[0],
      sortedVisits[sortedVisits.length - 1],
      Array.from(u.areas).join(', '),
      avgHouseholdSize
    ];
  });
  
  if (rows.length > 0) {
    viewSheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }
}

/**
 * ダッシュボードビューを更新
 */
function updateDashboardView(masterData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const viewSheet = sheet.getSheetByName('view_dashboard');
  
  // メトリクスを計算
  const metrics = [];
  
  // 総予約数
  metrics.push(['total_reservations', masterData.length, 'summary', new Date()]);
  
  // ユニークユーザー数
  const uniqueUsers = new Set(masterData.map(r => r.nameKana).filter(n => n));
  metrics.push(['unique_users', uniqueUsers.size, 'summary', new Date()]);
  
  // 世帯人数別集計
  const householdStats = { 1: 0, 2: 0, 3: 0, 4: 0 };
  masterData.forEach(record => {
    const size = record.householdSize || 1;
    if (size === 1) householdStats[1]++;
    else if (size <= 3) householdStats[2]++;
    else householdStats[4]++;
  });
  
  metrics.push(['household_size_1', householdStats[1], 'household', new Date()]);
  metrics.push(['household_size_2_3', householdStats[2], 'household', new Date()]);
  metrics.push(['household_size_4_plus', householdStats[4], 'household', new Date()]);
  
  // 場所別集計
  const locationStats = {};
  masterData.forEach(record => {
    if (!locationStats[record.location]) {
      locationStats[record.location] = 0;
    }
    locationStats[record.location]++;
  });
  
  Object.entries(locationStats).forEach(([location, count]) => {
    metrics.push([`location_${location}`, count, 'location', new Date()]);
  });
  
  // シートに書き込み
  if (viewSheet.getLastRow() > 1) {
    viewSheet.getRange(2, 1, viewSheet.getLastRow() - 1, viewSheet.getLastColumn()).clearContent();
  }
  
  if (metrics.length > 0) {
    viewSheet.getRange(2, 1, metrics.length, 4).setValues(metrics);
  }
}

/**
 * サンプルデータ作成
 */
function createSampleData() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // パントリーデータ作成
  const pantrySheet = spreadsheet.getSheetByName('pantries');
  if (pantrySheet && pantrySheet.getLastRow() === 1) {
    const now = new Date();
    const pantryData = [
      ['25.01.25.市役所本庁舎', '2025-01-25', '市役所本庁舎', 50, 35, '1月フードパントリー（市役所）', '市役所本庁舎で開催します。', '予約ありがとうございます。', now, new Date('2025-01-15'), new Date('2025-01-22'), 15],
      ['25.01.26.ニコット', '2025-01-26', 'ニコット', 40, 25, '1月フードパントリー（ニコット）', 'ニコットで開催します。', '予約ありがとうございます。', now, new Date('2025-01-15'), new Date('2025-01-22'), 15],
      ['25.02.15.市役所本庁舎', '2025-02-15', '市役所本庁舎', 50, 50, '2月フードパントリー（市役所）', '市役所本庁舎で開催します。', '予約ありがとうございます。', now, new Date('2025-02-05'), new Date('2025-02-12'), 0]
    ];
    pantrySheet.getRange(2, 1, pantryData.length, pantryData[0].length).setValues(pantryData);
  }
  
  // ユーザーデータ作成
  const userSheet = spreadsheet.getSheetByName('users');
  if (userSheet && userSheet.getLastRow() === 1) {
    const userData = [
      ['タナカ タロウ', '田中 太郎', '市川市八幡', 'tanaka@example.com', '090-1234-5678', 12, new Date('2024-01-15'), new Date('2024-12-20'), new Date()],
      ['サトウ ハナコ', '佐藤 花子', '市川市新田', 'sato@example.com', '080-2345-6789', 8, new Date('2024-03-10'), new Date('2024-11-15'), new Date()],
      ['スズキ イチロウ', '鈴木 一郎', '市川市大和田', 'suzuki@example.com', '070-3456-7890', 15, new Date('2024-01-01'), new Date('2025-01-15'), new Date()],
      ['タカハシ ユカリ', '高橋 ゆかり', '市川市中国分', 'takahashi@example.com', '090-4567-8901', 6, new Date('2024-05-20'), new Date('2024-10-25'), new Date()],
      ['ワタナベ ケンジ', '渡辺 健二', '市川市国府台', 'watanabe@example.com', '080-5678-9012', 10, new Date('2024-02-15'), new Date('2024-12-01'), new Date()]
    ];
    userSheet.getRange(2, 1, userData.length, userData[0].length).setValues(userData);
  }
  
  // 予約データ作成
  const reservationSheet = spreadsheet.getSheetByName('reservations');
  if (reservationSheet && reservationSheet.getLastRow() === 1) {
    const reservationData = [
      ['25011501', '25.01.25.市役所本庁舎', 'タナカ タロウ', '田中 太郎', '市川市八幡', 'tanaka@example.com', '090-1234-5678', 2, 1, 'なし', 'ガス・電子レンジあり', '', new Date('2025-01-16'), 'confirmed', 'true'],
      ['25011502', '25.01.25.市役所本庁舎', 'サトウ ハナコ', '佐藤 花子', '市川市新田', 'sato@example.com', '080-2345-6789', 1, 0, 'なし', '電子レンジのみ', '', new Date('2025-01-16'), 'confirmed', 'true'],
      ['25011503', '25.01.26.ニコット', 'スズキ イチロウ', '鈴木 一郎', '市川市大和田', 'suzuki@example.com', '070-3456-7890', 3, 2, '小麦アレルギー', 'ガス・電子レンジあり', '', new Date('2025-01-17'), 'confirmed', 'true'],
      ['25011504', '25.01.26.ニコット', 'タカハシ ユカリ', '高橋 ゆかり', '市川市中国分', 'takahashi@example.com', '090-4567-8901', 2, 0, 'なし', 'ガス・電子レンジあり', '階段が困難です', new Date('2025-01-17'), 'confirmed', 'true'],
      ['25011505', '25.01.25.市役所本庁舎', 'ワタナベ ケンジ', '渡辺 健二', '市川市国府台', 'watanabe@example.com', '080-5678-9012', 1, 3, 'なし', 'なし', '', new Date('2025-01-18'), 'cancelled', 'true']
    ];
    reservationSheet.getRange(2, 1, reservationData.length, reservationData[0].length).setValues(reservationData);
  }
  
  // 管理者データ作成
  const adminSheet = spreadsheet.getSheetByName('admins');
  if (adminSheet && adminSheet.getLastRow() === 1) {
    const adminData = [
      ['default-admin-001', 'admin@example.com', '管理者', 'active', new Date(), new Date(), 'system'],
      ['admin-002', 'nonattonolife@gmail.com', 'NATTO Admin', 'active', new Date(), new Date(), 'system']
    ];
    adminSheet.getRange(2, 1, adminData.length, adminData[0].length).setValues(adminData);
  }
  
  return {
    success: true,
    message: 'Sample data created successfully'
  };
}

/**
 * GET リクエスト処理
 */
function doGet(e) {
  const action = e.parameter.action;
  
  // actionパラメータがない場合はテストページを表示
  if (!action) {
    return HtmlService.createHtmlOutput('<h1>テストページ: ?action=test でAPIアクセスしてください</h1>');
  }
  
  return handleApiRequest(action, e.parameter);
}

/**
 * POST リクエスト処理
 */
function doPost(e) {
  let data = {};
  let action = '';
  
  try {
    if (e.postData && e.postData.contents) {
      const params = e.postData.contents.split('&');
      params.forEach(param => {
        const [key, value] = param.split('=');
        data[decodeURIComponent(key)] = decodeURIComponent(value);
      });
      action = data.action || '';
    }
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: 'Invalid POST data'
    });
  }
  
  return handleApiRequest(action, data);
}

/**
 * ログ記録関数
 */
function logToSheet(level, message, details = {}) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = sheet.getSheetByName('log');
    
    // logシートが存在しない場合は作成
    if (!logSheet) {
      logSheet = sheet.insertSheet('log');
      logSheet.getRange(1, 1, 1, 5).setValues([['Timestamp', 'Level', 'Message', 'Details', 'User Agent']]);
    }
    
    const timestamp = new Date();
    const detailsJson = JSON.stringify(details);
    const userAgent = details.userAgent || 'Unknown';
    
    logSheet.appendRow([timestamp, level, message, detailsJson, userAgent]);
    
  } catch (error) {
    Logger.log('ログ記録エラー: ' + error.toString());
  }
}

/**
 * APIリクエスト処理
 */
function handleApiRequest(action, params) {
  try {
    logToSheet('INFO', 'API Request', {
      action: action,
      params: params,
      timestamp: new Date().toISOString()
    });
    
    let result;
    
    switch (action) {
      case 'test':
        result = {
          success: true,
          message: 'API is working!',
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'initializeSpreadsheet':
        result = initializeSpreadsheet();
        break;
        
      case 'createSampleData':
        result = createSampleData();
        break;
        
      case 'updateAllViews':
        result = updateAllViews();
        break;
        
      case 'testAddressNormalization':
        result = testAddressNormalization();
        break;
        
      case 'createUsersSheet':
        result = createUsersSheet();
        break;
        
      // Firebase移行関連API
      case 'createBackup':
        result = createMigrationBackup();
        break;
        
      case 'testMigration':
        result = testMigration();
        break;
        
      case 'executeMigration':
        result = executeMigrationToFirebase();
        break;
        
      case 'getMigrationStatus':
        result = getMigrationStatus();
        break;
        
      case 'getDataStatistics':
        result = generateDataStatistics();
        break;
        
      case 'migrateToUsersDB':
        result = migrateToUsersDB();
        break;
        
      case 'initializeUserSheet':
        result = initializeUserSheet();
        break;
        
      case 'syncAllUsersFromReservations':
        result = syncAllUsersFromReservations();
        break;
        
      case 'setupUserSyncTrigger':
        result = setupUserSyncTrigger();
        break;
        
      case 'deleteUserSyncTriggers':
        result = deleteUserSyncTriggers();
        break;
        
      case 'getUserSyncTriggerStatus':
        result = getUserSyncTriggerStatus();
        break;
        
      case 'scheduledUserSync':
        result = scheduledUserSync();
        break;
        
      case 'getUserDetail':
        result = getUserDetail(params.nameKana);
        break;
        
      case 'getStatistics':
        result = getStatistics();
        break;
        
      case 'adminGetPantries':
        result = getPantries();
        break;
        
      case 'adminGetReservations':
        result = getReservations();
        break;
        
      case 'adminGetUsers':
        result = getUsersFast();
        break;
        
      case 'adminGetLogs':
        result = getLogs(params.levelFilter);
        break;
        
      case 'adminCreatePantry':
        result = createPantry(params);
        break;
        
      case 'adminUpdatePantry':
        result = updatePantry(params);
        break;
        
      case 'adminDeletePantry':
        result = deletePantry(params.pantryId);
        break;
        
      case 'adminGetReservationDetail':
        result = getReservationDetail(params.reservationId);
        break;
        
      case 'adminGetUserDetail':
        result = getUserDetailFromDB(params.nameKana || params.userId);
        break;
        
      case 'adminCancelReservation':
        result = cancelReservation(params.reservationId);
        break;
        
      case 'adminExportLogs':
        result = exportLogs();
        break;
        
      case 'createReservation':
        result = createReservation(params);
        break;
        
      case 'getCurrentPantry':
        result = getCurrentPantry();
        break;
        
      case 'adminGetReservationsByPantry':
        result = getReservationsByPantry(params.pantryId);
        break;
        
      case 'getDashboardStats':
        result = getDashboardStats(params.filter);
        break;
        
      case 'adminGetTopUsers':
        result = getTopUsers(params.filter);
        break;
        
      case 'adminGetUsageHistory':
        result = getUsageHistory(params.filter, params.userFilter);
        break;
        
      case 'adminExportUsageHistory':
        result = exportUsageHistory(params.filter, params.userFilter);
        break;
        
      case 'adminGetAdmins':
        result = getAdmins();
        break;
        
      case 'adminAddAdmin':
        result = addAdmin(params);
        break;
        
      case 'adminGetAdminDetail':
        result = getAdminDetail(params.adminId);
        break;
        
      case 'adminToggleAdminStatus':
        result = toggleAdminStatus(params.adminId);
        break;
        
      case 'getCurrentActivePantry':
        result = getCurrentPantry(); // 既存のgetCurrentPantry関数を使用
        break;
        
      default:
        result = {
          success: false,
          error: 'Unknown action: ' + action
        };
    }
    
    logToSheet('SUCCESS', 'API Request Success', {
      action: action,
      resultSize: JSON.stringify(result).length
    });
    
    return createJsonResponse(result);
    
  } catch (error) {
    logToSheet('ERROR', 'API Request Error', {
      action: action,
      error: error.toString(),
      stack: error.stack
    });
    
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * JSONレスポンス作成
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 統計データ取得
 */
function getStatistics() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const reservationSheet = sheet.getSheetByName('reservation');
    
    if (!reservationSheet) {
      return {
        success: false,
        error: 'reservation sheet not found'
      };
    }
    
    const data = reservationSheet.getDataRange().getValues();
    const totalReservations = data.length - 1; // ヘッダー行を除く
    
    return {
      success: true,
      data: {
        totalReservations: totalReservations,
        totalUsers: 150, // 仮の値
        monthlyReservations: 45,
        activeEvents: 2
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
 * パントリー一覧取得（reservationシートから直接）
 */
function getPantries() {
  try {
    const masterData = getMasterData();
    
    if (masterData.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    
    // パントリーごとに集計
    const pantries = {};
    const now = new Date();
    
    masterData.forEach(record => {
      if (!record.eventDate) return;
      
      const year = record.eventDate.getFullYear().toString().slice(-2);
      const month = String(record.eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(record.eventDate.getDate()).padStart(2, '0');
      const pantryId = `${year}.${month}.${day}.${record.location}`;
      
      if (!pantries[pantryId]) {
        // 仮の予約期間を設定（イベント日の2週間前から1週間前まで）
        const reservationStart = new Date(record.eventDate);
        reservationStart.setDate(reservationStart.getDate() - 14);
        const reservationEnd = new Date(record.eventDate);
        reservationEnd.setDate(reservationEnd.getDate() - 7);
        
        // ステータスを動的に決定
        let status = 'upcoming';
        if (now >= reservationStart && now <= reservationEnd) {
          status = 'active';
        } else if (now > reservationEnd) {
          status = 'closed';
        }
        
        pantries[pantryId] = {
          pantry_id: pantryId,
          event_date: record.eventDate,
          location: record.location,
          reservation_count: 0,
          unique_users: new Set(),
          capacity_total: 50, // デフォルト値
          status: status,
          reservation_start: reservationStart,
          reservation_end: reservationEnd,
          title: `${record.eventDate.getMonth() + 1}月フードパントリー（${record.location}）`
        };
      }
      
      pantries[pantryId].reservation_count++;
      if (record.nameKana) {
        pantries[pantryId].unique_users.add(record.nameKana);
      }
    });
    
    // 配列に変換
    const pantryList = Object.values(pantries).map(p => ({
      pantry_id: p.pantry_id,
      event_date: p.event_date,
      location: p.location,
      reservation_count: p.reservation_count,
      capacity_total: p.capacity_total,
      status: p.status,
      title: p.title,
      reservation_start: p.reservation_start,
      reservation_end: p.reservation_end
    }));
    
    // 開催日の新しい順でソート
    pantryList.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    
    return {
      success: true,
      data: pantryList
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 予約一覧取得
 */
function getReservations() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const reservationSheet = sheet.getSheetByName('reservation');
    
    if (!reservationSheet) {
      return {
        success: false,
        error: 'reservation sheet not found'
      };
    }
    
    const data = reservationSheet.getDataRange().getValues();
    const headers = data[0];
    const reservations = [];
    
    // 最新10件を取得
    for (let i = Math.max(1, data.length - 10); i < data.length; i++) {
      const row = data[i];
      reservations.push({
        timestamp: row[0],
        name_kana: row[1] || 'Unknown',
        pantry_id: '25.01.12.本庁舎',
        status: 'confirmed'
      });
    }
    
    return {
      success: true,
      data: reservations
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ユーザー一覧取得（reservationシートから直接）
 */
function getUsers() {
  try {
    const masterData = getMasterData();
    
    if (masterData.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    
    // ユーザー別に情報を集計
    const userStats = {};
    
    masterData.forEach(record => {
      if (!record.nameKana) return;
      
      if (!userStats[record.nameKana]) {
        userStats[record.nameKana] = {
          name_kana: record.nameKana,
          name_kanji: record.nameKanji || '',
          areas: new Set(),
          emails: new Set(),
          total_visits: 0,
          first_visit_date: record.timestamp,
          last_visit_date: record.timestamp,
          household_sizes: []
        };
      }
      
      userStats[record.nameKana].total_visits++;
      
      // 最初と最後の利用日を更新
      if (record.timestamp < userStats[record.nameKana].first_visit_date) {
        userStats[record.nameKana].first_visit_date = record.timestamp;
      }
      if (record.timestamp > userStats[record.nameKana].last_visit_date) {
        userStats[record.nameKana].last_visit_date = record.timestamp;
      }
      
      // 複数の情報を集約
      if (record.area) userStats[record.nameKana].areas.add(record.area);
      if (record.email) userStats[record.nameKana].emails.add(record.email);
      if (record.householdSize) userStats[record.nameKana].household_sizes.push(record.householdSize);
    });
    
    // 配列に変換
    const users = Object.values(userStats).map(user => ({
      name_kana: user.name_kana,
      name_kanji: user.name_kanji,
      area: Array.from(user.areas).join(', '),
      email: Array.from(user.emails).join(', '),
      total_visits: user.total_visits,
      first_visit_date: user.first_visit_date,
      last_visit_date: user.last_visit_date,
      avg_household_size: user.household_sizes.length > 0 
        ? Math.round(user.household_sizes.reduce((a, b) => a + b, 0) / user.household_sizes.length)
        : 1
    }));
    
    // 最終利用日の新しい順でソート
    users.sort((a, b) => new Date(b.last_visit_date) - new Date(a.last_visit_date));
    
    return {
      success: true,
      data: users
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ログ一覧取得
 */
function getLogs(levelFilter = 'all') {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const logSheet = sheet.getSheetByName('log');
    
    if (!logSheet) {
      return {
        success: true,
        data: []
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    const logs = [];
    
    // 最新100件を取得してフィルタリング
    const startRow = Math.max(1, data.length - 100);
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      const level = row[1];
      
      // レベルフィルター
      if (levelFilter !== 'all' && level !== levelFilter) {
        continue;
      }
      
      // 重要なイベントのみを記録対象とする
      const message = row[2];
      const isImportantEvent = 
        message.includes('Reservation Created') ||
        message.includes('Reservation Cancelled') ||
        message.includes('Pantry Created') ||
        message.includes('Pantry Updated') ||
        message.includes('Pantry Deleted') ||
        message.includes('Admin Access') ||
        message.includes('API Request Error') ||
        level === 'ERROR';
      
      if (isImportantEvent) {
        logs.push({
          created_at: row[0],
          level: level,
          message: message,
          details: row[3] || '',
          user_agent: row[4] || ''
        });
      }
    }
    
    return {
      success: true,
      data: logs.reverse() // 新しい順に並び替え
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * パントリー作成
 */
function createPantry(params) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let pantrySheet = sheet.getSheetByName('pantries');
    
    // pantriesシートが存在しない場合は作成
    if (!pantrySheet) {
      pantrySheet = sheet.insertSheet('pantries');
      pantrySheet.getRange(1, 1, 1, 15).setValues([[
        'pantry_id', 'event_date', 'location', 'capacity_total',
        'reservation_count', 'status', 'title', 'header_message', 'email_message',
        'reservation_start', 'reservation_end', 'location_address', 'location_access',
        'created_at', 'updated_at'
      ]]);
    }
    
    // パントリーIDを生成 (YY.MM.DD.場所名)
    const eventDate = new Date(params.event_date);
    const year = eventDate.getFullYear().toString().slice(-2);
    const month = (eventDate.getMonth() + 1).toString().padStart(2, '0');
    const day = eventDate.getDate().toString().padStart(2, '0');
    const locationShort = params.location.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF66-\uFF9F]/g, '').slice(0, 5);
    const pantryId = `${year}.${month}.${day}.${locationShort}`;
    
    const now = new Date();
    const newRow = [
      pantryId,
      params.event_date, // 日付部分のみ
      params.location || '',
      parseInt(params.capacity_total) || 50,
      0, // 初期予約数は0
      'upcoming', // 初期ステータスは常に upcoming
      params.title || '',
      params.header_message || '',
      params.email_message || '',
      params.reservation_start || '',
      params.reservation_end || '',
      params.location_address || '',
      params.location_access || '',
      now,
      now
    ];
    
    pantrySheet.appendRow(newRow);
    
    logToSheet('INFO', 'Pantry Created', {
      pantry_id: pantryId,
      location: params.location,
      event_date: params.event_date
    });
    
    return {
      success: true,
      data: {
        pantry_id: pantryId,
        message: 'パントリーを作成しました'
      }
    };
    
  } catch (error) {
    logToSheet('ERROR', 'Create Pantry Error', {
      error: error.toString(),
      params: params
    });
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * パントリー更新
 */
function updatePantry(params) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const pantrySheet = sheet.getSheetByName('pantries');
    
    if (!pantrySheet) {
      return {
        success: false,
        error: 'pantriesシートが見つかりません'
      };
    }
    
    const data = pantrySheet.getDataRange().getValues();
    const headers = data[0];
    
    // パントリーIDで検索
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === params.pantry_id) {
        // 見つかった行を更新
        pantrySheet.getRange(i + 1, 2).setValue(params.event_date?.split('T')[0] || data[i][1]);
        pantrySheet.getRange(i + 1, 4).setValue(params.location || data[i][3]);
        pantrySheet.getRange(i + 1, 5).setValue(parseInt(params.capacity_total) || data[i][4]);
        pantrySheet.getRange(i + 1, 7).setValue(params.status || data[i][6]);
        
        logToSheet('INFO', 'Pantry Updated', {
          pantry_id: params.pantry_id,
          changes: params
        });
        
        return {
          success: true,
          message: 'パントリーを更新しました'
        };
      }
    }
    
    return {
      success: false,
      error: '指定されたパントリーが見つかりません'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * パントリー削除
 */
function deletePantry(pantryId) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const pantrySheet = sheet.getSheetByName('pantries');
    
    if (!pantrySheet) {
      return {
        success: false,
        error: 'pantriesシートが見つかりません'
      };
    }
    
    const data = pantrySheet.getDataRange().getValues();
    
    // パントリーIDで検索して削除
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === pantryId) {
        pantrySheet.deleteRow(i + 1);
        
        logToSheet('INFO', 'Pantry Deleted', {
          pantry_id: pantryId
        });
        
        return {
          success: true,
          message: 'パントリーを削除しました'
        };
      }
    }
    
    return {
      success: false,
      error: '指定されたパントリーが見つかりません'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 予約詳細取得
 */
function getReservationDetail(reservationId) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const reservationSheet = sheet.getSheetByName('reservation');
    
    if (!reservationSheet) {
      return {
        success: false,
        error: 'reservationシートが見つかりません'
      };
    }
    
    const data = reservationSheet.getDataRange().getValues();
    const headers = data[0];
    
    // 予約IDまたは行番号で検索（現在のデータ構造に合わせて）
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const currentReservationId = `R${i.toString().padStart(3, '0')}`;
      
      if (currentReservationId === reservationId || i.toString() === reservationId) {
        return {
          success: true,
          data: {
            reservation_id: currentReservationId,
            name_kana: row[1] || 'Unknown',
            pantry_id: '25.01.12.本庁舎', // 仮の値
            created_at: row[0],
            status: 'confirmed',
            phone: row[3] || '',
            email: row[4] || '',
            household_total: (parseInt(row[5]) || 0) + (parseInt(row[6]) || 0)
          }
        };
      }
    }
    
    return {
      success: false,
      error: '指定された予約が見つかりません'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ユーザー詳細取得
 */
function getUserDetail(userId) {
  try {
    // 仮のユーザー詳細データ（実際の実装では reservation シートから集計）
    return {
      success: true,
      data: {
        user_id: userId,
        name_kana: 'タナカ タロウ',
        area: '市川市八幡',
        household_adults: 2,
        household_children: 1,
        total_visits: 5,
        last_visit_date: '2025-01-10',
        visit_history: [
          { date: '2025-01-10', pantry_id: '25.01.12.本庁舎' },
          { date: '2024-12-15', pantry_id: '24.12.15.ニコット' },
          { date: '2024-11-10', pantry_id: '24.11.10.本庁舎' }
        ]
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
 * 予約キャンセル
 */
function cancelReservation(reservationId) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const reservationSheet = sheet.getSheetByName('reservation');
    
    if (!reservationSheet) {
      return {
        success: false,
        error: 'reservationシートが見つかりません'
      };
    }
    
    // 実際の実装では該当する予約行に「キャンセル」フラグを追加
    // 今回は仮の実装
    logToSheet('INFO', 'Reservation Cancelled', {
      reservation_id: reservationId
    });
    
    return {
      success: true,
      message: '予約をキャンセルしました'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ログエクスポート
 */
function exportLogs() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const logSheet = sheet.getSheetByName('log');
    
    if (!logSheet) {
      return {
        success: true,
        data: 'Timestamp,Level,Message,Details,UserAgent\n'
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    let csvContent = '';
    
    // CSV形式に変換
    data.forEach(row => {
      const escapedRow = row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`);
      csvContent += escapedRow.join(',') + '\n';
    });
    
    return {
      success: true,
      data: csvContent
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 予約作成
 */
function createReservation(params) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 現在アクティブなパントリーを取得
    const currentPantryResult = getCurrentPantry();
    if (!currentPantryResult.success) {
      return {
        success: false,
        error: '現在予約受付中のパントリーがありません'
      };
    }
    const currentPantry = currentPantryResult.data;
    
    // reservationsシートを初期化（なければ作成）
    let reservationSheet = sheet.getSheetByName('reservations');
    if (!reservationSheet) {
      reservationSheet = sheet.insertSheet('reservations');
      reservationSheet.getRange(1, 1, 1, 12).setValues([[
        'reservation_id', 'pantry_id', 'name_kana', 'name_kanji', 'phone', 'email',
        'household_adults', 'household_children', 'household_total', 'area',
        'notes', 'created_at', 'status'
      ]]);
    }
    
    // 新しい予約IDを生成（YYMMDD001形式）
    const eventDate = new Date(currentPantry.event_date);
    const year = eventDate.getFullYear().toString().slice(-2);
    const month = (eventDate.getMonth() + 1).toString().padStart(2, '0');
    const day = eventDate.getDate().toString().padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    // 同じ日付の既存予約数を取得
    const data = reservationSheet.getDataRange().getValues();
    let maxSequence = 0;
    for (let i = 1; i < data.length; i++) {
      const existingId = data[i][0];
      if (existingId && existingId.startsWith(datePrefix)) {
        const sequence = parseInt(existingId.slice(-3));
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }
    const newSequence = (maxSequence + 1).toString().padStart(3, '0');
    const reservationId = `${datePrefix}${newSequence}`;
    
    // 世帯人数を計算
    const householdAdults = parseInt(params.household_adults) || 0;
    const householdChildren = parseInt(params.household_children) || 0;
    const householdTotal = householdAdults + householdChildren;
    
    // 新しい予約を追加
    const newRow = [
      reservationId,
      currentPantry.pantry_id,
      params.name_kana || '',
      params.name_kanji || '',
      params.phone || '',
      params.email || '',
      householdAdults,
      householdChildren,
      householdTotal,
      params.area || '',
      params.notes || '',
      new Date(),
      'confirmed'
    ];
    
    reservationSheet.appendRow(newRow);
    
    // パントリーの予約数を更新
    updatePantryReservationCount(currentPantry.pantry_id);
    
    // ユーザー情報を更新
    updateUserInfo(params.name_kana, {
      name_kanji: params.name_kanji,
      area: params.area,
      household_adults: householdAdults,
      household_children: householdChildren,
      pantry_id: currentPantry.pantry_id
    });
    
    logToSheet('INFO', 'Reservation Created', {
      reservation_id: reservationId,
      pantry_id: currentPantry.pantry_id,
      name_kana: params.name_kana,
      household_total: householdTotal
    });
    
    return {
      success: true,
      data: {
        reservation_id: reservationId,
        pantry_id: currentPantry.pantry_id,
        message: '予約を作成しました'
      }
    };
    
  } catch (error) {
    logToSheet('ERROR', 'Create Reservation Error', {
      error: error.toString(),
      params: params
    });
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * パントリーの予約数を更新
 */
function updatePantryReservationCount(pantryId) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const pantrySheet = sheet.getSheetByName('pantries');
    const reservationSheet = sheet.getSheetByName('reservations');
    
    if (!pantrySheet || !reservationSheet) return;
    
    // 該当パントリーの予約数を計算
    const reservationData = reservationSheet.getDataRange().getValues();
    let count = 0;
    for (let i = 1; i < reservationData.length; i++) {
      if (reservationData[i][1] === pantryId && reservationData[i][12] === 'confirmed') {
        count++;
      }
    }
    
    // パントリーシートの予約数を更新
    const pantryData = pantrySheet.getDataRange().getValues();
    for (let i = 1; i < pantryData.length; i++) {
      if (pantryData[i][0] === pantryId) {
        pantrySheet.getRange(i + 1, 5).setValue(count); // reservation_count列
        pantrySheet.getRange(i + 1, 15).setValue(new Date()); // updated_at列
        break;
      }
    }
  } catch (error) {
    Logger.log('予約数更新エラー: ' + error.toString());
  }
}

/**
 * ユーザー情報を更新
 */
function updateUserInfo(nameKana, info) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let userSheet = sheet.getSheetByName('users');
    
    // usersシートが存在しない場合は作成
    if (!userSheet) {
      userSheet = sheet.insertSheet('users');
      userSheet.getRange(1, 1, 1, 10).setValues([[
        'user_id', 'name_kana', 'name_kanji', 'area', 'household_adults',
        'household_children', 'total_visits', 'last_visit_date', 'created_at', 'updated_at'
      ]]);
    }
    
    const data = userSheet.getDataRange().getValues();
    let userFound = false;
    
    // 既存ユーザーを検索
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === nameKana) { // name_kana列で一致
        // 既存ユーザーの情報を更新
        const totalVisits = (data[i][6] || 0) + 1;
        userSheet.getRange(i + 1, 3).setValue(info.name_kanji || data[i][2]); // name_kanji
        userSheet.getRange(i + 1, 4).setValue(info.area || data[i][3]); // area
        userSheet.getRange(i + 1, 5).setValue(info.household_adults || data[i][4]); // household_adults
        userSheet.getRange(i + 1, 6).setValue(info.household_children || data[i][5]); // household_children
        userSheet.getRange(i + 1, 7).setValue(totalVisits); // total_visits
        userSheet.getRange(i + 1, 8).setValue(new Date()); // last_visit_date
        userSheet.getRange(i + 1, 10).setValue(new Date()); // updated_at
        userFound = true;
        break;
      }
    }
    
    // 新規ユーザーの場合
    if (!userFound) {
      const newRow = [
        nameKana, // user_id（カタカナ名をIDとして使用）
        nameKana, // name_kana
        info.name_kanji || '',
        info.area || '',
        info.household_adults || 0,
        info.household_children || 0,
        1, // total_visits
        new Date(), // last_visit_date
        new Date(), // created_at
        new Date()  // updated_at
      ];
      userSheet.appendRow(newRow);
    }
    
  } catch (error) {
    Logger.log('ユーザー情報更新エラー: ' + error.toString());
  }
}

/**
 * パントリーごとの予約一覧取得
 */
function getReservationsByPantry(pantryId) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const reservationSheet = sheet.getSheetByName('reservations');
    
    if (!reservationSheet) {
      return {
        success: true,
        data: []
      };
    }
    
    const data = reservationSheet.getDataRange().getValues();
    const reservations = [];
    
    // 指定されたパントリーIDの予約を抽出
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === pantryId) { // pantry_id列
        reservations.push({
          reservation_id: row[0],
          pantry_id: row[1],
          name_kana: row[2],
          name_kanji: row[3],
          phone: row[4],
          email: row[5],
          household_adults: row[6],
          household_children: row[7],
          household_total: row[8],
          area: row[9],
          notes: row[10],
          created_at: row[11],
          status: row[12]
        });
      }
    }
    
    // 予約ID順でソート
    reservations.sort((a, b) => a.reservation_id.localeCompare(b.reservation_id));
    
    return {
      success: true,
      data: reservations
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ダッシュボード統計データ取得（reservationシートから直接）
 */
function getDashboardStats(filter = 'all') {
  try {
    const masterData = getMasterData();
    
    if (masterData.length === 0) {
      return {
        success: true,
        data: {
          totalReservations: 0,
          redHouseholds: 0,
          yellowHouseholds: 0,
          greenHouseholds: 0,
          newUsers: 0,
          cancelCount: 0,
          usageHistory: { labels: [], data: [] }
        }
      };
    }
    
    // フィルター条件を設定
    const now = new Date();
    let startDate, endDate, locationFilter;
    
    switch (filter) {
      case 'fiscal':
        const fiscalYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        startDate = new Date(fiscalYear, 3, 1); // 4月1日
        endDate = new Date(fiscalYear + 1, 2, 31); // 3月31日
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1); // 1月1日
        endDate = new Date(now.getFullYear(), 11, 31); // 12月31日
        break;
      case 'location-市役所本庁舎':
        locationFilter = '市役所本庁舎';
        break;
      case 'location-ニコット':
        locationFilter = 'ニコット';
        break;
      default: // 'all'
        break;
    }
    
    // 統計を計算
    let totalReservations = 0;
    let redHouseholds = 0;
    let yellowHouseholds = 0;
    let greenHouseholds = 0;
    let cancelCount = 0;
    let monthlyData = {};
    let uniqueUsers = new Set();
    
    // フィルタリング済みデータ
    const filteredData = masterData.filter(record => {
      // 日付フィルター
      if (startDate && endDate && (record.timestamp < startDate || record.timestamp > endDate)) {
        return false;
      }
      
      // 場所フィルター
      if (locationFilter && record.location !== locationFilter) {
        return false;
      }
      
      return true;
    });
    
    filteredData.forEach(record => {
      totalReservations++;
      
      // ユニークユーザー追跡
      if (record.nameKana) {
        uniqueUsers.add(record.nameKana);
      }
      
      // 世帯人数分類
      const householdSize = record.householdSize || 1;
      if (householdSize === 1) {
        redHouseholds++;
      } else if (householdSize <= 3) {
        yellowHouseholds++;
      } else {
        greenHouseholds++;
      }
      
      // 月別データ
      if (record.timestamp) {
        const monthKey = `${record.timestamp.getFullYear()}-${String(record.timestamp.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      }
    });
    
    // 新規利用者数を計算（初回利用者）
    const userVisitCounts = {};
    masterData.forEach(record => {
      if (record.nameKana) {
        userVisitCounts[record.nameKana] = (userVisitCounts[record.nameKana] || 0) + 1;
      }
    });
    
    const newUsers = Object.values(userVisitCounts).filter(count => count === 1).length;
    
    // 月別データをチャート用に変換
    const sortedMonths = Object.keys(monthlyData).sort();
    const usageHistory = {
      labels: sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        return `${year}年${monthNum}月`;
      }),
      data: sortedMonths.map(month => monthlyData[month] || 0)
    };
    
    return {
      success: true,
      data: {
        totalReservations,
        redHouseholds,
        yellowHouseholds,
        greenHouseholds,
        newUsers,
        cancelCount,
        usageHistory
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
 * 利用者ベストテン取得（reservationシートから直接）
 */
function getTopUsers(filter = 'all') {
  try {
    const masterData = getMasterData();
    
    if (masterData.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    
    // フィルター条件を設定
    const now = new Date();
    let startDate, endDate, locationFilter;
    
    switch (filter) {
      case 'fiscal':
        const fiscalYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        startDate = new Date(fiscalYear, 3, 1);
        endDate = new Date(fiscalYear + 1, 2, 31);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'location-市役所本庁舎':
        locationFilter = '市役所本庁舎';
        break;
      case 'location-ニコット':
        locationFilter = 'ニコット';
        break;
      default:
        break;
    }
    
    // フィルタリング済みデータから利用回数を集計
    const filteredData = masterData.filter(record => {
      // 日付フィルター
      if (startDate && endDate && (record.timestamp < startDate || record.timestamp > endDate)) {
        return false;
      }
      
      // 場所フィルター
      if (locationFilter && record.location !== locationFilter) {
        return false;
      }
      
      return true;
    });
    
    // ユーザー別の利用回数を集計
    const userStats = {};
    
    filteredData.forEach(record => {
      if (!record.nameKana) return;
      
      if (!userStats[record.nameKana]) {
        userStats[record.nameKana] = {
          name_kana: record.nameKana,
          name_kanji: record.nameKanji || '',
          total_visits: 0,
          last_visit: record.timestamp
        };
      }
      
      userStats[record.nameKana].total_visits++;
      
      // 最後の利用日を更新
      if (record.timestamp > userStats[record.nameKana].last_visit) {
        userStats[record.nameKana].last_visit = record.timestamp;
      }
    });
    
    // 利用回数順にソートしてトップ10を取得
    const sortedUsers = Object.values(userStats)
      .sort((a, b) => b.total_visits - a.total_visits)
      .slice(0, 10);
    
    return {
      success: true,
      data: sortedUsers
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 利用履歴取得
 */
function getUsageHistory(filter = 'all', userFilter = '') {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const reservationSheet = sheet.getSheetByName('reservations');
    const pantrySheet = sheet.getSheetByName('pantries');
    
    if (!reservationSheet) {
      return {
        success: true,
        data: []
      };
    }
    
    const reservationData = reservationSheet.getDataRange().getValues();
    const pantryData = pantrySheet ? pantrySheet.getDataRange().getValues() : [];
    
    // フィルター条件を設定
    const now = new Date();
    let startDate, endDate, locationFilter;
    
    switch (filter) {
      case 'fiscal':
        const fiscalYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        startDate = new Date(fiscalYear, 3, 1);
        endDate = new Date(fiscalYear + 1, 2, 31);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'location-市役所本庁舎':
        locationFilter = '市役所本庁舎';
        break;
      case 'location-ニコット':
        locationFilter = 'ニコット';
        break;
      default:
        break;
    }
    
    const history = [];
    
    for (let i = 1; i < reservationData.length; i++) {
      const row = reservationData[i];
      const createdAt = new Date(row[11]);
      const nameKana = row[2];
      const pantryId = row[1];
      
      // 日付フィルター
      if (startDate && endDate && (createdAt < startDate || createdAt > endDate)) {
        continue;
      }
      
      // ユーザー名フィルター
      if (userFilter && !nameKana.includes(userFilter)) {
        continue;
      }
      
      // パントリー情報を取得
      const pantryRow = pantryData.find(p => p[0] === pantryId);
      const location = pantryRow ? pantryRow[2] : '不明';
      const eventDate = pantryRow ? pantryRow[1] : '';
      
      // 場所フィルター
      if (locationFilter && location !== locationFilter) {
        continue;
      }
      
      history.push({
        reservation_id: row[0],
        pantry_id: pantryId,
        name_kana: nameKana,
        name_kanji: row[3],
        household_total: row[8],
        area: row[9],
        created_at: row[11],
        status: row[12],
        event_date: eventDate,
        location: location
      });
    }
    
    // 予約日時の新しい順でソート
    history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return {
      success: true,
      data: history
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 利用履歴CSVエクスポート
 */
function exportUsageHistory(filter = 'all', userFilter = '') {
  try {
    const historyResult = getUsageHistory(filter, userFilter);
    
    if (!historyResult.success) {
      return historyResult;
    }
    
    const history = historyResult.data;
    
    // CSVヘッダー
    let csvContent = '予約ID,氏名（カナ）,氏名（漢字）,開催日,場所,世帯人数,地域,予約日時,ステータス\n';
    
    // データ行を追加
    history.forEach(row => {
      const escapedRow = [
        row.reservation_id || '',
        row.name_kana || '',
        row.name_kanji || '',
        row.event_date || '',
        row.location || '',
        row.household_total || '',
        row.area || '',
        row.created_at ? new Date(row.created_at).toLocaleString('ja-JP') : '',
        row.status || ''
      ].map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`);
      
      csvContent += escapedRow.join(',') + '\n';
    });
    
    return {
      success: true,
      data: csvContent
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 現在アクティブなパントリー取得（予約期間内かどうかで判定）
 */
function getCurrentPantry() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const pantrySheet = sheet.getSheetByName('pantries');
    
    if (!pantrySheet) {
      return {
        success: false,
        error: 'pantriesシートが見つかりません'
      };
    }
    
    const data = pantrySheet.getDataRange().getValues();
    const now = new Date();
    
    // 現在時刻が予約期間内のパントリーを検索
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const reservationStart = new Date(row[9]); // reservation_start列
      const reservationEnd = new Date(row[10]); // reservation_end列
      
      // 現在時刻が予約期間内かチェック
      if (now >= reservationStart && now <= reservationEnd) {
        return {
          success: true,
          data: {
            pantry_id: row[0],
            event_date: row[1],
            location: row[2],
            capacity_total: row[3],
            reservation_count: row[4],
            status: 'active', // 期間内は常にactive
            title: row[6],
            header_message: row[7],
            email_message: row[8],
            reservation_start: row[9],
            reservation_end: row[10],
            location_address: row[11],
            location_access: row[12]
          }
        };
      }
    }
    
    return {
      success: false,
      error: '現在予約受付中のパントリーがありません'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 管理者一覧取得
 */
function getAdmins() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let adminSheet = sheet.getSheetByName('admins');
    
    // adminsシートが存在しない場合は作成
    if (!adminSheet) {
      adminSheet = sheet.insertSheet('admins');
      adminSheet.getRange(1, 1, 1, 7).setValues([[
        'admin_id', 'name', 'email', 'role', 'status', 'created_at', 'updated_at'
      ]]);
      
      // デフォルト管理者を追加
      const now = new Date();
      adminSheet.appendRow([
        'admin001',
        'システム管理者',
        'admin@foodbank.example.com',
        'super_admin',
        'active',
        now,
        now
      ]);
    }
    
    const data = adminSheet.getDataRange().getValues();
    const admins = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      admins.push({
        admin_id: row[0],
        name: row[1],
        email: row[2],
        role: row[3],
        status: row[4],
        created_at: row[5],
        updated_at: row[6]
      });
    }
    
    return {
      success: true,
      data: admins
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 管理者追加
 */
function addAdmin(params) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let adminSheet = sheet.getSheetByName('admins');
    
    // adminsシートが存在しない場合は作成
    if (!adminSheet) {
      adminSheet = sheet.insertSheet('admins');
      adminSheet.getRange(1, 1, 1, 7).setValues([[
        'admin_id', 'name', 'email', 'role', 'status', 'created_at', 'updated_at'
      ]]);
    }
    
    // 新しい管理者IDを生成
    const data = adminSheet.getDataRange().getValues();
    let maxId = 0;
    for (let i = 1; i < data.length; i++) {
      const currentId = data[i][0];
      if (currentId && currentId.startsWith('admin')) {
        const num = parseInt(currentId.replace('admin', ''));
        if (num > maxId) {
          maxId = num;
        }
      }
    }
    const newAdminId = `admin${String(maxId + 1).padStart(3, '0')}`;
    
    const now = new Date();
    const newRow = [
      newAdminId,
      params.name || '',
      params.email || '',
      params.role || 'admin',
      'active',
      now,
      now
    ];
    
    adminSheet.appendRow(newRow);
    
    logToSheet('INFO', 'Admin Added', {
      admin_id: newAdminId,
      name: params.name,
      email: params.email
    });
    
    return {
      success: true,
      data: {
        admin_id: newAdminId,
        message: '管理者を追加しました'
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
 * 管理者詳細取得
 */
function getAdminDetail(adminId) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const adminSheet = sheet.getSheetByName('admins');
    
    if (!adminSheet) {
      return {
        success: false,
        error: 'adminsシートが見つかりません'
      };
    }
    
    const data = adminSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === adminId) {
        return {
          success: true,
          data: {
            admin_id: row[0],
            name: row[1],
            email: row[2],
            role: row[3],
            status: row[4],
            created_at: row[5],
            updated_at: row[6]
          }
        };
      }
    }
    
    return {
      success: false,
      error: '指定された管理者が見つかりません'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 管理者ステータス切り替え
 */
function toggleAdminStatus(adminId) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const adminSheet = sheet.getSheetByName('admins');
    
    if (!adminSheet) {
      return {
        success: false,
        error: 'adminsシートが見つかりません'
      };
    }
    
    const data = adminSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === adminId) {
        const currentStatus = row[4];
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        
        adminSheet.getRange(i + 1, 5).setValue(newStatus); // status列
        adminSheet.getRange(i + 1, 7).setValue(new Date()); // updated_at列
        
        logToSheet('INFO', 'Admin Status Toggled', {
          admin_id: adminId,
          old_status: currentStatus,
          new_status: newStatus
        });
        
        return {
          success: true,
          data: {
            admin_id: adminId,
            status: newStatus,
            message: `管理者ステータスを${newStatus}に変更しました`
          }
        };
      }
    }
    
    return {
      success: false,
      error: '指定された管理者が見つかりません'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ユーザーDBシート作成
 */
function createUsersSheet() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let usersSheet = sheet.getSheetByName('users_db');
    
    if (usersSheet) {
      return {
        success: false,
        error: 'users_dbシートは既に存在します'
      };
    }
    
    // 新しいusers_dbシートを作成
    usersSheet = sheet.insertSheet('users_db');
    
    const headers = [
      'user_id',           // USER001, USER002...
      'name_kana',         // カタカナ氏名（識別キー）
      'name_kanji',        // 漢字氏名
      'normalized_area',   // 正規化済み住所
      'email',             // 最新のメールアドレス
      'phone',             // 最新の電話番号
      'total_visits',      // 利用回数
      'first_visit_date',  // 初回利用日
      'last_visit_date',   // 最終利用日
      'avg_household_size', // 平均世帯人数
      'created_at',        // レコード作成日
      'updated_at',        // 最終更新日
      'visit_history',     // JSON形式の利用履歴
      'status'             // ユーザーステータス（active, inactive）
    ];
    
    usersSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    usersSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
    logToSheet('INFO', 'Users DB Sheet Created', {
      sheet_name: 'users_db',
      columns: headers.length
    });
    
    return {
      success: true,
      message: 'users_dbシートを作成しました'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 既存データをusers_dbシートに移行
 */
function migrateToUsersDB() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let usersSheet = sheet.getSheetByName('users_db');
    
    // users_dbシートが存在しない場合は作成
    if (!usersSheet) {
      const createResult = createUsersSheet();
      if (!createResult.success) {
        return createResult;
      }
      usersSheet = sheet.getSheetByName('users_db');
    }
    
    // マスターデータを取得
    const masterData = getMasterData();
    
    if (masterData.length === 0) {
      return {
        success: true,
        message: '移行するデータがありません'
      };
    }
    
    // ユーザー別に情報を集計
    const userStats = {};
    let userIdCounter = 1;
    
    masterData.forEach(record => {
      if (!record.nameKana) return;
      
      if (!userStats[record.nameKana]) {
        userStats[record.nameKana] = {
          user_id: `USER${String(userIdCounter++).padStart(3, '0')}`,
          name_kana: record.nameKana,
          name_kanji: record.nameKanji || '',
          normalized_area: normalizeAddress(record.area || ''),
          emails: new Set(),
          phones: new Set(),
          total_visits: 0,
          first_visit_date: record.timestamp,
          last_visit_date: record.timestamp,
          household_sizes: [],
          visit_history: [],
          created_at: new Date(),
          updated_at: new Date(),
          status: 'active'
        };
      }
      
      const user = userStats[record.nameKana];
      user.total_visits++;
      
      // 最初と最後の利用日を更新
      if (record.timestamp < user.first_visit_date) {
        user.first_visit_date = record.timestamp;
      }
      if (record.timestamp > user.last_visit_date) {
        user.last_visit_date = record.timestamp;
      }
      
      // 複数の情報を集約
      if (record.email) user.emails.add(record.email);
      if (record.phone) user.phones.add(record.phone);
      if (record.householdSize) user.household_sizes.push(record.householdSize);
      
      // 利用履歴を追加
      user.visit_history.push({
        date: record.timestamp,
        pantry_id: `${record.timestamp.getFullYear().toString().slice(-2)}.${String(record.timestamp.getMonth() + 1).padStart(2, '0')}.${String(record.timestamp.getDate()).padStart(2, '0')}.${record.location}`,
        location: record.location,
        household_size: record.householdSize || 1
      });
      
      user.updated_at = new Date();
    });
    
    // データを挿入
    const users = Object.values(userStats);
    const rows = users.map(user => [
      user.user_id,
      user.name_kana,
      user.name_kanji,
      user.normalized_area,
      Array.from(user.emails).join('; '),
      Array.from(user.phones).join('; '),
      user.total_visits,
      user.first_visit_date,
      user.last_visit_date,
      user.household_sizes.length > 0 
        ? Math.round(user.household_sizes.reduce((a, b) => a + b, 0) / user.household_sizes.length)
        : 1,
      user.created_at,
      user.updated_at,
      JSON.stringify(user.visit_history),
      user.status
    ]);
    
    if (rows.length > 0) {
      usersSheet.getRange(2, 1, rows.length, 14).setValues(rows);
    }
    
    logToSheet('INFO', 'Users DB Migration Completed', {
      migrated_users: users.length,
      total_visits: users.reduce((sum, user) => sum + user.total_visits, 0)
    });
    
    return {
      success: true,
      message: `${users.length}名のユーザーデータを移行しました`
    };
    
  } catch (error) {
    logToSheet('ERROR', 'Users DB Migration Error', {
      error: error.toString()
    });
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ユーザー詳細取得（users_dbシートから）
 */
function getUserDetailFromDB(nameKana) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = sheet.getSheetByName('users_db');
    
    if (!usersSheet) {
      // users_dbシートが存在しない場合は従来のgetUserDetailを使用
      return getUserDetail(nameKana);
    }
    
    const data = usersSheet.getDataRange().getValues();
    const headers = data[0];
    
    // カタカナ名で検索
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === nameKana) { // name_kana列
        let visitHistory = [];
        try {
          visitHistory = JSON.parse(row[12] || '[]');
        } catch (e) {
          visitHistory = [];
        }
        
        return {
          success: true,
          data: {
            user_id: row[0],
            name_kana: row[1],
            name_kanji: row[2],
            normalized_area: row[3],
            email: row[4],
            phone: row[5],
            total_visits: row[6],
            first_visit_date: row[7],
            last_visit_date: row[8],
            avg_household_size: row[9],
            created_at: row[10],
            updated_at: row[11],
            visit_history: visitHistory,
            status: row[13]
          }
        };
      }
    }
    
    return {
      success: false,
      error: '指定されたユーザーが見つかりません'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 高速ユーザー一覧取得（users_dbシートから）
 */
function getUsersFast() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = sheet.getSheetByName('users_db');
    
    if (!usersSheet) {
      // users_dbシートが存在しない場合は従来のgetUsersを使用
      return getUsers();
    }
    
    const data = usersSheet.getDataRange().getValues();
    const users = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      users.push({
        user_id: row[0],
        name_kana: row[1],
        name_kanji: row[2],
        normalized_area: row[3],
        email: row[4],
        phone: row[5],
        total_visits: row[6],
        first_visit_date: row[7],
        last_visit_date: row[8],
        avg_household_size: row[9],
        status: row[13]
      });
    }
    
    // 最終利用日の新しい順でソート
    users.sort((a, b) => new Date(b.last_visit_date) - new Date(a.last_visit_date));
    
    return {
      success: true,
      data: users
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ユーザーDBの同期更新（新規予約時に呼び出し）
 */
function updateUserInDB(nameKana, reservationData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let usersSheet = sheet.getSheetByName('users_db');
    
    // users_dbシートが存在しない場合は作成
    if (!usersSheet) {
      const createResult = createUsersSheet();
      if (!createResult.success) {
        return createResult;
      }
      usersSheet = sheet.getSheetByName('users_db');
    }
    
    const data = usersSheet.getDataRange().getValues();
    let userFound = false;
    let userRowIndex = -1;
    
    // 既存ユーザーを検索
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === nameKana) { // name_kana列
        userFound = true;
        userRowIndex = i;
        break;
      }
    }
    
    const now = new Date();
    
    if (userFound) {
      // 既存ユーザーの更新
      const row = data[userRowIndex];
      let visitHistory = [];
      try {
        visitHistory = JSON.parse(row[12] || '[]');
      } catch (e) {
        visitHistory = [];
      }
      
      // 新しい利用履歴を追加
      visitHistory.push({
        date: now,
        pantry_id: reservationData.pantry_id,
        location: reservationData.location || '',
        household_size: reservationData.household_total || 1
      });
      
      const totalVisits = (row[6] || 0) + 1;
      
      // データを更新
      usersSheet.getRange(userRowIndex + 1, 3).setValue(reservationData.name_kanji || row[2]); // name_kanji
      usersSheet.getRange(userRowIndex + 1, 4).setValue(normalizeAddress(reservationData.area) || row[3]); // normalized_area
      usersSheet.getRange(userRowIndex + 1, 5).setValue(reservationData.email || row[4]); // email
      usersSheet.getRange(userRowIndex + 1, 6).setValue(reservationData.phone || row[5]); // phone
      usersSheet.getRange(userRowIndex + 1, 7).setValue(totalVisits); // total_visits
      usersSheet.getRange(userRowIndex + 1, 9).setValue(now); // last_visit_date
      usersSheet.getRange(userRowIndex + 1, 12).setValue(now); // updated_at
      usersSheet.getRange(userRowIndex + 1, 13).setValue(JSON.stringify(visitHistory)); // visit_history
      
    } else {
      // 新規ユーザーの追加
      // 新しいユーザーIDを生成
      let maxUserNum = 0;
      for (let i = 1; i < data.length; i++) {
        const userId = data[i][0];
        if (userId && userId.startsWith('USER')) {
          const num = parseInt(userId.replace('USER', ''));
          if (num > maxUserNum) {
            maxUserNum = num;
          }
        }
      }
      const newUserId = `USER${String(maxUserNum + 1).padStart(3, '0')}`;
      
      const visitHistory = [{
        date: now,
        pantry_id: reservationData.pantry_id,
        location: reservationData.location || '',
        household_size: reservationData.household_total || 1
      }];
      
      const newRow = [
        newUserId,
        nameKana,
        reservationData.name_kanji || '',
        normalizeAddress(reservationData.area || ''),
        reservationData.email || '',
        reservationData.phone || '',
        1, // total_visits
        now, // first_visit_date
        now, // last_visit_date
        reservationData.household_total || 1, // avg_household_size
        now, // created_at
        now, // updated_at
        JSON.stringify(visitHistory), // visit_history
        'active' // status
      ];
      
      usersSheet.appendRow(newRow);
    }
    
    return {
      success: true,
      message: 'ユーザーDBを更新しました'
    };
    
  } catch (error) {
    logToSheet('ERROR', 'Update User DB Error', {
      error: error.toString(),
      nameKana: nameKana
    });
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Firebase移行用バックアップ機能
 */
function createMigrationBackup() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const reservationSheet = sheet.getSheetByName('reservation');
    
    if (!reservationSheet) {
      throw new Error('reservationシートが見つかりません');
    }
    
    const data = reservationSheet.getDataRange().getValues();
    
    // CSVフォーマットに変換
    const csvContent = data.map(row => 
      row.map(cell => {
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return '"' + cell.replace(/"/g, '""') + '"';
        }
        return cell;
      }).join(',')
    ).join('\n');
    
    // DriveにCSVファイルとして保存
    const fileName = `reservation_backup_${new Date().toISOString().slice(0,10)}.csv`;
    const blob = Utilities.newBlob(csvContent, 'text/csv', fileName);
    const file = DriveApp.createFile(blob);
    
    logToSheet('INFO', 'Backup Created', {
      fileName: fileName,
      fileId: file.getId(),
      recordCount: data.length
    });
    
    return {
      success: true,
      fileName: fileName,
      fileId: file.getId(),
      recordCount: data.length,
      downloadUrl: file.getDownloadUrl()
    };
    
  } catch (error) {
    logToSheet('ERROR', 'Backup Creation Failed', {
      error: error.toString()
    });
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * バックアップファイル一覧取得
 */
function listBackupFiles() {
  try {
    const files = DriveApp.searchFiles('title contains "reservation_backup_"');
    const backups = [];
    
    while (files.hasNext()) {
      const file = files.next();
      backups.push({
        name: file.getName(),
        id: file.getId(),
        created: file.getDateCreated(),
        size: file.getSize(),
        downloadUrl: file.getDownloadUrl()
      });
    }
    
    return {
      success: true,
      backups: backups.sort((a, b) => b.created - a.created)
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ユーザー同期機能（userSyncBatch.gsに移動済み）
 * 
 * ユーザー同期に関する全ての機能は userSyncBatch.gs ファイルに移動しました。
 * 以下の関数が利用可能です：
 * - setupUserSyncTrigger()
 * - deleteUserSyncTriggers()
 * - getUserSyncTriggerStatus()
 * - scheduledUserSync()
 * - initializeUserSheet()
 * - syncAllUsersFromReservations()
 * - updateUserOnNewReservation()
 * - onEdit()
 */
