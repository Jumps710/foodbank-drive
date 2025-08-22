# ユーザーDB設計 - 動的管理システム

## 現在の課題
- 毎回reservation sheetから全データを読み取り → 遅い
- ユーザー詳細画面が未実装
- リアルタイム性とパフォーマンスのトレードオフ

## 提案: 段階的DB構造改善

### フェーズ1: ユーザーDBシート作成
```
users シート構造:
- user_id (自動生成: USER001, USER002...)
- name_kana (カタカナ氏名 - 識別キー)
- name_kanji (漢字氏名)
- normalized_area (正規化済み住所)
- email (最新のメールアドレス)
- phone (最新の電話番号)
- total_visits (利用回数)
- first_visit_date (初回利用日)
- last_visit_date (最終利用日)
- avg_household_size (平均世帯人数)
- created_at (レコード作成日)
- updated_at (最終更新日)
- visit_history (JSON形式の利用履歴)
```

### フェーズ2: 自動同期システム
```javascript
// 新規予約時の処理フロー
1. [Google Form] → reservation sheet に追加
2. GAS トリガー実行
3. updateUserDatabase() 関数が実行
4. users sheet を更新 (upsert処理)
```

### フェーズ3: 高速化されたAPI
```javascript
// 変更前（遅い）
function getUsers() {
  const masterData = getMasterData(); // 全予約データ読み取り
  // 毎回集計処理...
}

// 変更後（高速）
function getUsers() {
  const usersSheet = getSheet('users'); // 集計済みデータ読み取り
  return usersSheet.getDataRange().getValues();
}
```

## 実装メリット

### パフォーマンス改善
- API応答速度: 3-5秒 → 0.5-1秒
- ユーザー一覧表示の高速化
- ダッシュボード読み込み時間短縮

### 機能拡張性
- ユーザー詳細ページの実装が容易
- 利用履歴の詳細表示
- ユーザー検索・フィルタリング機能

### データ整合性
- 正規化済みデータの永続化
- 集計データの一貫性保証
- 手動メンテナンス工数削減

## 同期タイミング

### 自動同期
1. **新規予約時**: フォーム送信と同時
2. **定期実行**: 1時間ごと（データ整合性チェック）
3. **手動実行**: 管理画面からのボタン操作

### 差分更新
```javascript
function updateUserDatabase() {
  // 最終更新以降の予約データのみ処理
  const lastUpdateTime = getLastUpdateTime();
  const newReservations = getReservationsSince(lastUpdateTime);
  
  newReservations.forEach(reservation => {
    upsertUser(reservation);
  });
}
```

## ユーザー詳細画面設計

### 表示内容
```
ユーザー詳細 - タナカ タロウ
┌─────────────────────────────────┐
│ 基本情報                        │
│ ・氏名: タナカ タロウ (田中太郎) │
│ ・住所: 市川真間                │
│ ・利用回数: 12回               │
│ ・初回利用: 2024/01/15         │
│ ・最終利用: 2025/01/15         │
├─────────────────────────────────┤
│ 利用履歴                        │
│ 2025/01/15 - 25.01.15.市役所    │
│ 2024/12/20 - 24.12.20.ニコット  │
│ 2024/11/18 - 24.11.18.市役所    │
│ ...                             │
├─────────────────────────────────┤
│ 統計情報                        │
│ ・平均世帯人数: 3名            │
│ ・利用場所: 市役所(8回), ニコット(4回) │
│ ・最新連絡先: xxx@example.com  │
└─────────────────────────────────┘
```

## 実装手順

### Step 1: users シート作成
```javascript
function createUsersSheet() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = sheet.insertSheet('users');
  
  const headers = [
    'user_id', 'name_kana', 'name_kanji', 'normalized_area',
    'email', 'phone', 'total_visits', 'first_visit_date',
    'last_visit_date', 'avg_household_size', 'created_at',
    'updated_at', 'visit_history'
  ];
  
  usersSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}
```

### Step 2: 初回データ移行
```javascript
function migrateExistingData() {
  const masterData = getMasterData();
  const userStats = aggregateUserData(masterData);
  
  const usersSheet = getSheet('users');
  writeUsersToSheet(usersSheet, userStats);
}
```

### Step 3: リアルタイム同期
```javascript
function onFormSubmit(e) {
  // フォーム送信時に自動実行
  const newReservation = parseFormData(e);
  updateUserDatabase(newReservation);
}
```

## 移行スケジュール

### 第1週: 基盤整備
- users シート作成
- 初回データ移行
- 基本API修正

### 第2週: 機能実装
- ユーザー詳細画面作成
- 自動同期システム構築
- テスト・調整

### 第3週: 本格運用
- トリガー設定
- 監視体制構築
- ドキュメント整備

## 互換性とリスク対策

### バックアップ
- reservation sheet は引き続きマスターデータとして維持
- users sheet は集計ビューとして位置づけ
- データ不整合時は reservation から再構築可能

### 段階的移行
1. users sheet 作成・データ移行
2. 新APIを並行運用（A/Bテスト）
3. 問題なければ切り替え
4. 旧処理を削除

この設計により、パフォーマンスと機能性を両立できます。