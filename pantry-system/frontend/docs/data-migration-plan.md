# フードパントリー データ移行・アーキテクチャ計画

## 現状分析
- **データ件数**: 約20件/月 × 12ヶ月 = 年間240件程度
- **ユーザー数**: 推定100-200名（重複あり）
- **データソース**: Google Form → reservation シート

## 推奨アーキテクチャ

### フェーズ1: ハイブリッドアプローチ（推奨）
既存のreservationシートを「マスターデータ」として維持しつつ、集計用のビューシートを作成

```
[Google Form] 
    ↓
[reservation シート]（マスター・読み取り専用）
    ↓ 
[GAS定期実行（1時間ごと）]
    ↓
┌─────────────┬─────────────┬─────────────┐
│ view_pantries │ view_users  │ view_stats  │
└─────────────┴─────────────┴─────────────┘
```

### 実装手順

#### 1. マスターデータのクレンジング関数
```javascript
function cleanMasterData() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const masterSheet = sheet.getSheetByName('reservation');
  const data = masterSheet.getDataRange().getValues();
  
  // ヘッダー行のマッピング
  const headers = data[0];
  const nameKanaIndex = headers.indexOf('氏名（カタカナ・フルネームでお願いします）');
  const dateIndex = headers.indexOf('取りに来られる日（毎月第２土曜日）');
  const locationIndex = headers.indexOf('食材を受け取る場所');
  
  // クレンジング済みデータ
  const cleanedData = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    cleanedData.push({
      timestamp: row[0],
      eventDate: parseEventDate(row[dateIndex]),
      location: extractLocation(row[locationIndex]),
      nameKana: normalizeKanaName(row[nameKanaIndex]),
      // ... 他のフィールド
    });
  }
  
  return cleanedData;
}
```

#### 2. 集計ビューの更新
```javascript
function updatePantriesView() {
  const cleanedData = cleanMasterData();
  const pantries = {};
  
  // パントリーごとに集計
  cleanedData.forEach(reservation => {
    const key = `${reservation.eventDate}_${reservation.location}`;
    if (!pantries[key]) {
      pantries[key] = {
        pantryId: generatePantryId(reservation.eventDate, reservation.location),
        eventDate: reservation.eventDate,
        location: reservation.location,
        reservationCount: 0,
        uniqueUsers: new Set()
      };
    }
    pantries[key].reservationCount++;
    pantries[key].uniqueUsers.add(reservation.nameKana);
  });
  
  // view_pantriesシートに書き込み
  writeToViewSheet('view_pantries', pantries);
}
```

### フェーズ2: 将来の拡張（必要に応じて）

データ量が増えた場合（年間1万件以上）:

1. **BigQuery連携**
   - Google Sheets → BigQuery自動同期
   - SQLでの高度な分析
   - コスト: 月$5程度〜

2. **Looker Studio統合**
   - リアルタイムダッシュボード
   - ドラッグ&ドロップでのレポート作成
   - 無料枠あり

## コスト比較

| アプローチ | 初期コスト | 月額コスト | 技術難易度 | 推奨規模 |
|-----------|-----------|-----------|-----------|----------|
| 現在（複数シート） | ¥0 | ¥0 | 低 | 〜1,000件/年 |
| ハイブリッド | ¥0 | ¥0 | 中 | 〜10,000件/年 |
| BigQuery | ¥0 | ¥500〜 | 高 | 10,000件/年〜 |

## 結論

現在の規模では「ハイブリッドアプローチ」が最適：
- ✅ Google Formとの互換性維持
- ✅ 段階的な移行が可能
- ✅ コストゼロ
- ✅ 将来の拡張性確保