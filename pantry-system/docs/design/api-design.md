# API設計書

## Google Apps Script Web App エンドポイント設計

### 基本URL
```
https://script.google.com/macros/s/{SCRIPT_ID}/exec
```

## 1. フロントエンド エンドポイント（doGet）

### 1.1 予約フォーム
```
GET /?page=form
```
- 予約フォームのHTMLを返す
- 現在の受付状況を含む

### 1.2 管理コンソール
```
GET /?page=admin
```
- 管理コンソールのHTMLを返す
- 認証チェック含む

### 1.3 ダッシュボード
```
GET /?page=dashboard
```
- 分析ダッシュボードのHTMLを返す

## 2. API エンドポイント（doPost）

### 2.1 予約関連

#### 予約作成
```javascript
POST /
Content-Type: application/json

{
  "action": "createReservation",
  "data": {
    "nameKana": "ヤマダタロウ",
    "nameKanji": "山田太郎",
    "area": "八幡",
    "contact": "yamada@example.com",
    "timeSlot": "13:00-15:00",
    "adults": 2,
    "children": 1,
    "householdDetails": "男性40代1名、女性30代1名、男の子8歳1名",
    "requestedItems": "お米、調味料",
    "babyNeeds": "不要",
    "cookingEquipment": ["電子レンジ", "炊飯器"],
    "allergies": "",
    "visitCount": "2回目",
    "notes": ""
  }
}

Response:
{
  "success": true,
  "reservationId": "2405001",
  "message": "予約が完了しました"
}
```

#### 予約一覧取得
```javascript
POST /
Content-Type: application/json

{
  "action": "getReservations",
  "data": {
    "eventDate": "2024-05-11",
    "timeSlot": null,  // 全時間帯
    "status": "confirmed"
  }
}

Response:
{
  "success": true,
  "data": [
    {
      "reservationId": "2405001",
      "nameKana": "ヤマダタロウ",
      "timeSlot": "13:00-15:00",
      "adults": 2,
      "children": 1,
      "contact": "yamada@example.com",
      "area": "八幡"
    }
  ]
}
```

### 2.2 ユーザー管理

#### ユーザー検索
```javascript
POST /
Content-Type: application/json

{
  "action": "searchUser",
  "data": {
    "nameKana": "ヤマダタロウ"
  }
}

Response:
{
  "success": true,
  "data": {
    "userId": "U0001",
    "nameKana": "ヤマダタロウ",
    "nameKanji": "山田太郎",
    "area": "八幡",
    "totalVisits": 5,
    "lastVisitDate": "2024-04-13"
  }
}
```

#### ユーザー利用履歴
```javascript
POST /
Content-Type: application/json

{
  "action": "getUserHistory",
  "data": {
    "userId": "U0001"
  }
}

Response:
{
  "success": true,
  "data": [
    {
      "eventDate": "2024-04-13",
      "timeSlot": "13:00-15:00",
      "attendance": true
    }
  ]
}
```

### 2.3 管理機能

#### 予約受付状態変更
```javascript
POST /
Content-Type: application/json

{
  "action": "updateRegistrationStatus",
  "data": {
    "eventId": "E202405",
    "status": "open"  // open/closed
  }
}

Response:
{
  "success": true,
  "message": "予約受付を開始しました"
}
```

#### 容量制限設定
```javascript
POST /
Content-Type: application/json

{
  "action": "updateCapacity",
  "data": {
    "eventId": "E202405",
    "capacityMorning": 30,
    "capacityAfternoon": 25,
    "capacityEvening": 20
  }
}

Response:
{
  "success": true,
  "message": "容量制限を更新しました"
}
```

### 2.4 データ出力

#### 予約リスト出力
```javascript
POST /
Content-Type: application/json

{
  "action": "exportReservations",
  "data": {
    "eventDate": "2024-05-11",
    "format": "pdf"  // pdf/excel/print
  }
}

Response:
{
  "success": true,
  "downloadUrl": "https://drive.google.com/file/d/{FILE_ID}/view",
  "message": "リストを生成しました"
}
```

### 2.5 統計・分析

#### 統計データ取得
```javascript
POST /
Content-Type: application/json

{
  "action": "getStatistics",
  "data": {
    "type": "monthly",  // monthly/yearly/custom
    "year": 2024,
    "month": 5
  }
}

Response:
{
  "success": true,
  "data": {
    "totalReservations": 42,
    "timeSlotDistribution": {
      "10:00-12:00": 18,
      "13:00-15:00": 15,
      "15:00-17:00": 9
    },
    "areaDistribution": {
      "八幡": 12,
      "真間": 8,
      "曽谷": 6
    },
    "newUsers": 8,
    "returningUsers": 34
  }
}
```

## 3. エラーハンドリング

### 標準エラーレスポンス
```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "必須項目が入力されていません",
    "details": {
      "field": "nameKana",
      "reason": "カタカナ氏名は必須です"
    }
  }
}
```

### エラーコード一覧
- `VALIDATION_ERROR`: 入力値検証エラー
- `DUPLICATE_RESERVATION`: 重複予約エラー
- `CAPACITY_EXCEEDED`: 容量超過エラー
- `REGISTRATION_CLOSED`: 受付終了エラー
- `USER_NOT_FOUND`: ユーザー未検出エラー
- `INTERNAL_ERROR`: 内部エラー

## 4. 認証・セキュリティ

### 管理機能の認証
```javascript
// 管理機能呼び出し時のヘッダー
{
  "action": "adminAction",
  "adminKey": "ADMIN_SECRET_KEY",
  "data": {}
}
```

### reCAPTCHA検証
```javascript
// 予約フォーム送信時
{
  "action": "createReservation",
  "recaptchaToken": "RECAPTCHA_TOKEN",
  "data": {}
}
```

## 5. 自動化トリガー

### 定期実行関数
```javascript
// 毎日実行される関数
function dailyCheck() {
  // 予約受付開始/終了の自動制御
}

// 毎月第2日曜に実行
function startMonthlyRegistration() {
  // 新月のイベント作成と受付開始
}

// 毎月第2水曜22時に実行
function closeMonthlyRegistration() {
  // 受付終了処理
}
```