# フードバンク倉庫システム設計書

## システム概要

フードバンク倉庫への食品リクエスト管理システム。
福祉団体や他のフードバンクからのリクエストを効率的に管理し、配送まで一元管理する。

## 基本仕様

### ユーザー種別
1. **Requester（依頼者）**: フードバンク・福祉団体
2. **Staff（スタッフ）**: 倉庫管理者
3. **Driver（配送）**: 配送業者・ボランティア
4. **Admin（管理者）**: システム管理者

### アクセス方法
- **LIFF（LINE Mini App）**: https://miniapp.line.me/2007977152-VaXgDOXk
  - 対象: Requester（一般ユーザー）
- **WOFF（LINE WORKS Front-end Framework）**: https://woff.worksmobile.com/woff/z-vHKyt_a0GkVpsS9j46NQ
  - 対象: Staff, Driver（内部ユーザー）
- **直接アクセス**: https://jumps710.github.io/foodbank/warehouse/
  - 対象: Admin（管理者）

## 技術スタック

### フロントエンド
- **LIFF SDK**: LINE Front-end Framework（Requester用）
- **WOFF SDK**: LINE WORKS Front-end Framework（Staff/Driver用）
- **Bootstrap 5.3.0**: UIフレームワーク
- **Vanilla JavaScript**: SPA（Single Page Application）
- **Chart.js**: ダッシュボード可視化

### バックエンド
- **Google Apps Script (GAS)**: サーバーレスAPI
- **Google Sheets**: データベース
- **LINE Messaging API**: 通知システム
- **LINE WORKS Bot API**: スタッフ通知
- **Google Calendar API**: 配送スケジュール管理

## 画面設計

### 1. Request Form（リクエストフォーム）
**URL**: `#/form`
**対象ユーザー**: Requester

#### 機能
- 食品リクエスト新規作成
- 必要数量・種類の選択
- 希望配送日時の指定
- 受取先情報の入力

#### フォーム項目
```
- 団体名 *
- 担当者名 *
- 連絡先（電話番号） *
- メールアドレス
- 受取先住所 *
- 希望配送日 *
- 食品カテゴリ（複数選択可）
  - 米・パン
  - 野菜・果物
  - 肉・魚
  - 調味料・加工品
  - その他
- 詳細要望（自由記述）
```

### 2. Request Table（リクエスト一覧）
**URL**: `#/table`
**対象ユーザー**: All
**アクセス方法**: 
- Requester: LIFF
- Staff/Driver: WOFF  
- Admin: 直接アクセス

#### 機能
- 全リクエストの一覧表示
- ステータス別フィルタリング
- 検索機能（団体名・担当者名）
- リクエスト詳細への遷移

#### 表示項目
```
- リクエストID
- 申請日
- 団体名
- 担当者名
- 食品カテゴリ
- ステータス（申請中/承認済み/配送中/完了/キャンセル）
- 配送予定日
```

### 3. Request Details（リクエスト詳細）
**URL**: `#/details?id={requestId}`
**対象ユーザー**: All
**アクセス方法**: 
- Requester: LIFF
- Staff/Driver: WOFF
- Admin: 直接アクセス

#### 機能
- リクエスト詳細情報表示
- ステータス更新（権限に応じて）
- コメント機能
- 配送情報の管理

#### ユーザー別権限
```
Requester: 閲覧のみ
Staff: ステータス更新、在庫割当
Driver: 配送ステータス更新
Admin: 全ての操作
```

### 4. Dashboard（ダッシュボード）
**URL**: `#/dashboard`
**対象ユーザー**: Staff, Admin

#### 機能
- リクエスト状況の可視化
- 在庫状況の表示
- 配送スケジュール管理
- 統計情報の表示

#### 表示内容
```
- 月別リクエスト数（グラフ）
- ステータス別内訳（円グラフ）
- 人気食品カテゴリ（棒グラフ）
- 団体別利用回数ランキング
- 今日の配送予定
- 在庫アラート
```

## データ構造

### Requests Sheet
```
request_id | created_at | requester_name | organization | phone | email | 
address | requested_date | food_categories | details | status | 
assigned_staff | driver_id | delivery_date | comments | updated_at
```

### Organizations Sheet
```
org_id | name | type | address | phone | email | contact_person | 
registration_date | total_requests | last_request_date | status
```

### Users Sheet
```
user_id | line_user_id | name | role | organization | phone | email | 
registration_date | last_login | status
```

### Inventory Sheet
```
item_id | category | name | quantity | unit | expiry_date | 
location | status | updated_at
```

## 通知システム

### LINE通知トリガー
1. **新規リクエスト作成時**
   - 対象: スタッフグループ
   - 内容: リクエスト概要

2. **ステータス変更時**
   - 対象: リクエスト作成者
   - 内容: ステータス更新通知

3. **配送開始時**
   - 対象: 受取団体
   - 内容: 配送開始・到着予定時刻

4. **配送完了時**
   - 対象: スタッフ・リクエスト作成者
   - 内容: 配送完了報告

### LINE WORKS通知
- **対象**: 倉庫スタッフ
- **内容**: 緊急対応が必要なアラート

## セキュリティ・権限管理

### アクセス制御
```
画面               | Requester | Staff | Driver | Admin
=====================================
Request Form      |    ○     |   ○   |   ×   |   ○
Request Table     |    ○     |   ○   |   ○   |   ○
Request Details   |    ○*    |   ○   |   ○*  |   ○
Dashboard         |    ×     |   ○   |   ×   |   ○

○: 全機能利用可能
○*: 自分に関連する項目のみ
×: アクセス不可
```

### データ保護
- LINE認証による本人確認
- 個人情報の暗号化（必要に応じて）
- アクセスログの記録

## デプロイ・運用

### GAS設定
```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {
    "enabledAdvancedServices": []
  },
  "executionApi": {
    "access": "ANYONE_ANONYMOUS"
  },
  "webapp": {
    "access": "ANYONE_ANONYMOUS",
    "executeAs": "USER_DEPLOYING"
  }
}
```

### LIFF設定（Requester用）
- **LIFF ID**: 2007977152-VaXgDOXk
- **Channel ID**: 0512a05c10a4dd420f261bc3d1672e4f
- **Channel Secret**: [設定済み]
- **エンドポイント**: https://jumps710.github.io/foodbank/warehouse/

### WOFF設定（Staff/Driver用）
- **WOFF ID**: z-vHKyt_a0GkVpsS9j46NQ
- **WOFF URL**: https://woff.worksmobile.com/woff/z-vHKyt_a0GkVpsS9j46NQ
- **エンドポイント**: https://jumps710.github.io/foodbank/warehouse/
- **対象ユーザー**: LINE WORKSユーザー（Staff, Driver）
- **デフォルトルート**: #/table（リクエスト一覧）

### API URL
- **本番環境**: https://script.google.com/macros/s/{deployment-id}/exec
- **テスト用**: ?action=test

## 開発ロードマップ

### Phase 1: 基本機能実装
- [ ] LIFF認証機能
- [ ] リクエストフォーム
- [ ] 基本的なリスト表示
- [ ] GAS API基盤

### Phase 2: 管理機能拡張
- [ ] ダッシュボード実装
- [ ] ステータス管理機能
- [ ] 在庫管理機能
- [ ] ユーザー権限管理

### Phase 3: 通知・自動化
- [ ] LINE通知システム
- [ ] 自動ステータス更新
- [ ] 配送スケジュール自動化
- [ ] レポート機能

### Phase 4: 高度な機能
- [ ] 在庫予測機能
- [ ] 配送ルート最適化
- [ ] データ分析・インサイト
- [ ] モバイルアプリ対応