/**
 * Firebase移行専用スクリプト
 * Google Sheets → Firebase Firestore データ移行
 */

// Firebase Admin SDK設定（スクリプトプロパティから取得）
const FIREBASE_CONFIG = {
  projectId: 'foodbank-management-467813',
  serviceAccountEmail: 'firebase-migration-service@foodbank-management-467813.iam.gserviceaccount.com',
  privateKey: PropertiesService.getScriptProperties().getProperty('FIREBASE_PRIVATE_KEY'),
  privateKeyId: 'd5ca3a75e1d49162e6158f9b241b7d36cc3a612e'
};

/**
 * メイン移行処理
 */
function executeMigrationToFirebase() {
  try {
    console.log('🔄 Firebase移行開始...');
    
    // 1. 既存データの取得とクレンジング
    const sourceData = getMasterDataForMigration();
    console.log(`📊 取得データ件数: ${sourceData.length}件`);
    
    // 2. データ変換と統合
    const transformedData = transformDataForFirebase(sourceData);
    console.log(`✨ 変換完了 - ユーザー: ${transformedData.users.length}件, 予約: ${transformedData.reservations.length}件`);
    
    // 3. Firebase REST API経由でデータ送信
    const migrationResult = sendDataToFirebase(transformedData);
    
    // 4. 移行結果をGoogleシートに記録
    recordMigrationLog(migrationResult);
    
    return {
      success: true,
      message: '移行が正常に完了しました',
      summary: migrationResult
    };
    
  } catch (error) {
    console.error('❌ 移行エラー:', error);
    recordMigrationLog({
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

/**
 * 移行用データ取得（既存のgetMasterDataを拡張）
 */
function getMasterDataForMigration() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const reservationSheet = sheet.getSheetByName('reservation');
  
  if (!reservationSheet || reservationSheet.getLastRow() <= 1) {
    throw new Error('予約データが見つかりません');
  }
  
  const data = reservationSheet.getDataRange().getValues();
  const headers = data[0];
  
  console.log(`📋 ヘッダー: ${headers.join(', ')}`);
  
  // ヘッダーインデックスを取得
  const indices = {
    timestamp: 0,
    eventDate: headers.indexOf('取りに来られる日（毎月第２土曜日）'),
    location: headers.indexOf('食材を受け取る場所'),
    nameKana: headers.indexOf('氏名（カタカナ・フルネームでお願いします）'),
    nameKanji: headers.indexOf('氏名（漢字）'),
    area: headers.indexOf('住んでいる地域（真間、八幡、曽谷など）'),
    email: headers.indexOf('メールアドレス'),
    phone: headers.indexOf('電話番号'),
    householdComposition: headers.indexOf('世帯構成（ご自身を含む）'),
    householdTotal: headers.indexOf('世帯の合計人数（ご自身を含む）'),
    specialRequests: headers.indexOf('その他・ご要望等')
  };
  
  const sourceData = [];
  let skippedCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // タイムスタンプがない行はスキップ
    if (!row[indices.timestamp]) {
      skippedCount++;
      continue;
    }
    
    const record = {
      rowIndex: i,
      timestamp: row[indices.timestamp],
      eventDate: parseEventDate(row[indices.eventDate]),
      location: extractLocation(row[indices.location]),
      nameKana: normalizeKanaName(row[indices.nameKana]),
      nameKanji: row[indices.nameKanji] || '',
      area: normalizeAddress(row[indices.area] || ''),
      email: row[indices.email] || '',
      phone: row[indices.phone] || '',
      householdSize: parseHouseholdSize(row[indices.householdTotal] || row[indices.householdComposition]),
      specialRequests: row[indices.specialRequests] || '',
      rawData: row
    };
    
    // 必須フィールドの検証
    if (record.nameKana && record.timestamp) {
      sourceData.push(record);
    } else {
      console.warn(`⚠️ 無効なデータ（行${i}）:`, record.nameKana, record.timestamp);
      skippedCount++;
    }
  }
  
  console.log(`✅ 有効データ: ${sourceData.length}件, スキップ: ${skippedCount}件`);
  return sourceData;
}

/**
 * Firebase用のデータ構造に変換
 */
function transformDataForFirebase(sourceData) {
  const userMap = new Map(); // カタカナ名でユーザーを統合
  const reservations = [];
  const pantries = new Map();
  
  let userCounter = 1;
  let reservationCounter = 1;
  
  for (const record of sourceData) {
    const normalizedName = record.nameKana;
    
    // ユーザーデータの統合処理
    if (!userMap.has(normalizedName)) {
      const userId = `USER_${String(userCounter++).padStart(3, '0')}`;
      userMap.set(normalizedName, {
        userId: userId,
        profile: {
          nameKana: normalizedName,
          nameKanji: record.nameKanji,
          email: record.email,
          phone: record.phone,
          address: {
            normalized: record.area,
            raw: record.area
          },
          householdSize: record.householdSize || 1,
          status: 'active'
        },
        statistics: {
          totalVisits: 0,
          firstVisitDate: null,
          lastVisitDate: null,
          averageHouseholdSize: 0,
          visitLocations: [],
          visitHistory: []
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'MIGRATION_SYSTEM'
        }
      });
    }
    
    // ユーザー統計の更新
    const user = userMap.get(normalizedName);
    user.statistics.totalVisits++;
    
    const visitDate = new Date(record.timestamp).toISOString();
    if (!user.statistics.firstVisitDate || visitDate < user.statistics.firstVisitDate) {
      user.statistics.firstVisitDate = visitDate;
    }
    if (!user.statistics.lastVisitDate || visitDate > user.statistics.lastVisitDate) {
      user.statistics.lastVisitDate = visitDate;
    }
    
    // 訪問場所の追加
    if (!user.statistics.visitLocations.includes(record.location)) {
      user.statistics.visitLocations.push(record.location);
    }
    
    // 訪問履歴の追加
    user.statistics.visitHistory.push({
      date: record.eventDate,
      location: record.location,
      householdSize: record.householdSize,
      reservationId: `RES_${String(reservationCounter).padStart(3, '0')}`
    });
    
    // パントリー情報の生成
    const pantryId = generatePantryId(record.eventDate, record.location);
    if (!pantries.has(pantryId)) {
      pantries.set(pantryId, {
        pantryId: pantryId,
        details: {
          title: `${getPantryMonth(record.eventDate)}月のフードパントリー`,
          eventDate: record.eventDate,
          location: record.location,
          address: getLocationAddress(record.location),
          capacity: 50, // デフォルト値
          reservationPeriod: {
            startDate: new Date(new Date(record.eventDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(new Date(record.eventDate).getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          status: 'completed',
          description: '月例フードパントリーです',
          autoReplyEmail: 'ご予約ありがとうございます。当日は時間に余裕を持ってお越しください。'
        },
        statistics: {
          totalReservations: 0,
          uniqueUsers: new Set(),
          waitingList: 0,
          lastUpdated: new Date().toISOString()
        },
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: 'MIGRATION_SYSTEM',
          updatedAt: new Date().toISOString()
        }
      });
    }
    
    // パントリー統計の更新
    const pantry = pantries.get(pantryId);
    pantry.statistics.totalReservations++;
    pantry.statistics.uniqueUsers.add(user.userId);
    
    // 予約データの生成
    const reservationId = `RES_${String(reservationCounter++).padStart(3, '0')}`;
    reservations.push({
      reservationId: reservationId,
      pantryId: pantryId,
      userId: user.userId,
      details: {
        nameKana: record.nameKana,
        nameKanji: record.nameKanji,
        email: record.email,
        phone: record.phone,
        householdSize: record.householdSize,
        area: record.area,
        specialRequests: record.specialRequests
      },
      status: 'completed',
      timestamps: {
        reservedAt: new Date(record.timestamp).toISOString(),
        confirmedAt: new Date(record.timestamp).toISOString(),
        completedAt: record.eventDate
      },
      metadata: {
        source: 'migration',
        originalRowIndex: record.rowIndex
      }
    });
  }
  
  // ユーザー統計の計算完了
  for (const user of userMap.values()) {
    const householdSizes = user.statistics.visitHistory
      .map(v => v.householdSize)
      .filter(s => s > 0);
    
    user.statistics.averageHouseholdSize = householdSizes.length > 0 
      ? householdSizes.reduce((a, b) => a + b, 0) / householdSizes.length 
      : 1;
  }
  
  // パントリー統計の finalize
  const pantryArray = Array.from(pantries.values()).map(pantry => ({
    ...pantry,
    statistics: {
      ...pantry.statistics,
      uniqueUsers: pantry.statistics.uniqueUsers.size
    }
  }));
  
  return {
    users: Array.from(userMap.values()),
    pantries: pantryArray,
    reservations: reservations
  };
}

/**
 * FirebaseにデータをREST API経由で送信
 */
function sendDataToFirebase(transformedData) {
  const results = {
    users: { success: 0, errors: [] },
    pantries: { success: 0, errors: [] },
    reservations: { success: 0, errors: [] }
  };
  
  try {
    // Firebase REST API endpoint
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;
    
    // 認証トークンを取得（簡略化版）
    const accessToken = getFirebaseAccessToken();
    
    // ユーザーデータの送信
    console.log('👥 ユーザーデータ送信開始...');
    for (const user of transformedData.users) {
      try {
        const response = createFirestoreDocument(baseUrl, accessToken, 'users', user.userId, user);
        if (response.getResponseCode() === 200) {
          results.users.success++;
        } else {
          throw new Error(`HTTP ${response.getResponseCode()}: ${response.getContentText()}`);
        }
      } catch (error) {
        results.users.errors.push({ userId: user.userId, error: error.toString() });
      }
    }
    
    // パントリーデータの送信
    console.log('🏪 パントリーデータ送信開始...');
    for (const pantry of transformedData.pantries) {
      try {
        const response = createFirestoreDocument(baseUrl, accessToken, 'pantries', pantry.pantryId, pantry);
        if (response.getResponseCode() === 200) {
          results.pantries.success++;
        } else {
          throw new Error(`HTTP ${response.getResponseCode()}: ${response.getContentText()}`);
        }
      } catch (error) {
        results.pantries.errors.push({ pantryId: pantry.pantryId, error: error.toString() });
      }
    }
    
    // 予約データの送信
    console.log('📝 予約データ送信開始...');
    for (const reservation of transformedData.reservations) {
      try {
        const response = createFirestoreDocument(baseUrl, accessToken, 'reservations', reservation.reservationId, reservation);
        if (response.getResponseCode() === 200) {
          results.reservations.success++;
        } else {
          throw new Error(`HTTP ${response.getResponseCode()}: ${response.getContentText()}`);
        }
      } catch (error) {
        results.reservations.errors.push({ reservationId: reservation.reservationId, error: error.toString() });
      }
    }
    
    console.log('✅ データ送信完了');
    return results;
    
  } catch (error) {
    console.error('❌ Firebase送信エラー:', error);
    throw error;
  }
}

/**
 * Firebase Access Token取得
 */
function getFirebaseAccessToken() {
  // Google Apps ScriptのOAuth2ライブラリを使用
  // 実際の実装では、サービスアカウントキーでJWTを生成
  
  const jwt = createJWT();
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  
  const payload = {
    'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    'assertion': jwt
  };
  
  const options = {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    'payload': Object.keys(payload).map(key => `${key}=${encodeURIComponent(payload[key])}`).join('&')
  };
  
  const response = UrlFetchApp.fetch(tokenEndpoint, options);
  const data = JSON.parse(response.getContentText());
  
  return data.access_token;
}

/**
 * JWT生成（サービスアカウント用）
 */
function createJWT() {
  // 実際の実装では、サービスアカウントキーを使用してJWTを生成
  // ここでは簡略化
  
  const header = {
    "alg": "RS256",
    "typ": "JWT"
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    "iss": FIREBASE_CONFIG.serviceAccountEmail,
    "scope": "https://www.googleapis.com/auth/datastore",
    "aud": "https://oauth2.googleapis.com/token",
    "exp": now + 3600,
    "iat": now
  };
  
  // Base64 encode
  const encodedHeader = Utilities.base64EncodeWebSafe(JSON.stringify(header));
  const encodedPayload = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  
  // Sign with private key (simplified)
  const signature = signWithPrivateKey(`${encodedHeader}.${encodedPayload}`, FIREBASE_CONFIG.privateKey);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Firestore ドキュメント作成
 */
function createFirestoreDocument(baseUrl, accessToken, collection, documentId, data) {
  const url = `${baseUrl}/${collection}/${documentId}`;
  
  const firestoreData = convertToFirestoreFormat(data);
  
  const options = {
    'method': 'PATCH',
    'headers': {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    'payload': JSON.stringify({ fields: firestoreData })
  };
  
  return UrlFetchApp.fetch(url, options);
}

/**
 * Firestore形式にデータ変換
 */
function convertToFirestoreFormat(data) {
  const result = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      result[key] = { nullValue: null };
    } else if (typeof value === 'string') {
      result[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      result[key] = { doubleValue: value };
    } else if (typeof value === 'boolean') {
      result[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      result[key] = { 
        arrayValue: { 
          values: value.map(item => ({ stringValue: String(item) }))
        }
      };
    } else if (typeof value === 'object') {
      result[key] = { 
        mapValue: { 
          fields: convertToFirestoreFormat(value)
        }
      };
    } else {
      result[key] = { stringValue: String(value) };
    }
  }
  
  return result;
}

/**
 * ユーティリティ関数
 */
function generatePantryId(eventDate, location) {
  if (!eventDate) return 'PANTRY_UNKNOWN';
  
  const date = new Date(eventDate);
  const yymmdd = date.getFullYear().toString().slice(-2) +
                 String(date.getMonth() + 1).padStart(2, '0') +
                 String(date.getDate()).padStart(2, '0');
  const locationCode = location === '市役所本庁舎' ? 'CITY' : 'NICOT';
  return `PANTRY_${yymmdd}_${locationCode}`;
}

function getPantryMonth(eventDate) {
  return eventDate ? new Date(eventDate).getMonth() + 1 : '不明';
}

function getLocationAddress(location) {
  const addresses = {
    '市役所本庁舎': '市川市八幡1-1-1',
    'ニコット': '市川市大和田1-1-5'
  };
  return addresses[location] || '';
}

/**
 * 移行ログの記録
 */
function recordMigrationLog(result) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let logSheet = sheet.getSheetByName('migration_log');
  
  if (!logSheet) {
    logSheet = sheet.insertSheet('migration_log');
    logSheet.getRange(1, 1, 1, 6).setValues([
      ['timestamp', 'status', 'users_migrated', 'pantries_migrated', 'reservations_migrated', 'details']
    ]);
  }
  
  const row = [
    new Date().toISOString(),
    result.success ? 'SUCCESS' : 'ERROR',
    result.users?.success || 0,
    result.pantries?.success || 0,
    result.reservations?.success || 0,
    JSON.stringify(result)
  ];
  
  logSheet.appendRow(row);
}

/**
 * 移行状況確認用API
 */
function getMigrationStatus() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const logSheet = sheet.getSheetByName('migration_log');
  
  if (!logSheet) {
    return { status: 'not_started', message: '移行は開始されていません' };
  }
  
  const data = logSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { status: 'not_started', message: '移行ログがありません' };
  }
  
  const lastLog = data[data.length - 1];
  return {
    status: lastLog[1],
    timestamp: lastLog[0],
    summary: {
      users: lastLog[2],
      pantries: lastLog[3],
      reservations: lastLog[4]
    },
    details: JSON.parse(lastLog[5])
  };
}

/**
 * 移行テスト実行（少量データ）
 */
function testMigration() {
  const sourceData = getMasterDataForMigration().slice(0, 5); // 最初の5件のみ
  const transformedData = transformDataForFirebase(sourceData);
  
  console.log('🧪 テストデータ:');
  console.log(`ユーザー数: ${transformedData.users.length}`);
  console.log(`パントリー数: ${transformedData.pantries.length}`);
  console.log(`予約数: ${transformedData.reservations.length}`);
  
  return transformedData;
}