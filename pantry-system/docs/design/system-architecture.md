# フードバンク予約システム 設計書

## 1. システム概要

### 目的
- Google Formベースの予約システムをGAS Web Appに移行
- 予約管理の自動化と効率化
- 利用者データの分析・可視化

### 主要機能
1. **予約フォーム** - Google Form代替のWebフォーム
2. **管理コンソール** - 予約管理・リスト出力
3. **ユーザー管理** - カタカナ氏名による利用者識別
4. **分析ダッシュボード** - 利用傾向の可視化

## 2. システム構成

```
┌─────────────────────────────────────────────────────┐
│                    Google Apps Script                 │
├─────────────────────────────────────────────────────┤
│  Web App (doGet/doPost)                             │
│  ├── 予約フォーム (HTML/CSS/JS)                     │
│  ├── 管理コンソール (HTML/CSS/JS)                   │
│  └── ダッシュボード (HTML/CSS/JS)                   │
├─────────────────────────────────────────────────────┤
│  Server Functions                                    │
│  ├── reservation.gs (予約処理)                      │
│  ├── user.gs (ユーザー管理)                        │
│  ├── admin.gs (管理機能)                           │
│  └── analytics.gs (分析機能)                       │
├─────────────────────────────────────────────────────┤
│  Data Layer (Google Sheets)                         │
│  ├── Users シート                                  │
│  ├── Reservations シート                           │
│  └── Events シート                                 │
└─────────────────────────────────────────────────────┘
```

## 3. データスキーマ

### Users シート
| カラム名 | 型 | 説明 | 備考 |
|---------|---|------|------|
| user_id | String | ユーザーID | 自動採番 (U + 連番) |
| name_kana | String | カタカナ氏名 | **主キー代替** |
| name_kanji | String | 漢字氏名 | |
| area | String | 居住地域 | |
| email | String | メールアドレス | |
| phone | String | 電話番号 | |
| household_adults | Number | 大人の人数 | |
| household_children | Number | 子供の人数 | |
| household_details | String | 世帯構成詳細 | |
| first_visit_date | Date | 初回利用日 | |
| total_visits | Number | 総利用回数 | |
| last_visit_date | Date | 最終利用日 | |
| created_at | Datetime | 作成日時 | |
| updated_at | Datetime | 更新日時 | |

### Reservations シート
| カラム名 | 型 | 説明 | 備考 |
|---------|---|------|------|
| reservation_id | String | 予約ID | R + タイムスタンプ |
| user_id | String | ユーザーID | Users.user_id |
| name_kana | String | カタカナ氏名 | 冗長だが検索用 |
| event_date | Date | 開催日 | |
| time_slot | String | 時間帯 | 10-12/13-15/15-17 |
| pickup_location | String | 受取場所 | |
| requested_items | String | 希望食品 | |
| special_needs | String | 特別な要望 | おむつ・粉ミルク等 |
| allergies | String | アレルギー | |
| cooking_equipment | String | 調理器具 | |
| support_info | String | 支援団体情報 | |
| notes | String | 備考 | |
| status | String | ステータス | confirmed/cancelled |
| created_at | Datetime | 予約日時 | |

### Events シート
| カラム名 | 型 | 説明 | 備考 |
|---------|---|------|------|
| event_id | String | イベントID | E + 年月 |
| event_date | Date | 開催日 | 毎月第2土曜 |
| registration_start | Datetime | 受付開始日時 | 毎月第2日曜 |
| registration_end | Datetime | 受付終了日時 | 毎月第2水曜22時 |
| location | String | 開催場所 | |
| capacity_morning | Number | 午前枠上限 | |
| capacity_afternoon | Number | 午後枠上限 | |
| capacity_evening | Number | 夕方枠上限 | |
| status | String | ステータス | upcoming/open/closed |

## 4. ユーザー識別ロジック

```javascript
// カタカナ氏名による同一ユーザー判定
function findOrCreateUser(formData) {
  // 1. カタカナ氏名で既存ユーザーを検索
  const existingUser = findUserByNameKana(formData.name_kana);
  
  if (existingUser) {
    // 2. 既存ユーザーの情報を更新
    updateUser(existingUser.user_id, formData);
    return existingUser.user_id;
  } else {
    // 3. 新規ユーザーとして登録
    return createNewUser(formData);
  }
}
```

## 5. 運用フロー

### 月次サイクル
1. **第2日曜 0:00** - 予約受付自動開始
2. **第2水曜 22:00** - 予約受付自動終了
3. **第2木曜** - 管理者が予約リストを確認・印刷
4. **第2土曜** - フードパントリー開催

### 予約フロー
1. 利用者が予約フォームにアクセス
2. 必要情報を入力（認証なし）
3. カタカナ氏名で既存ユーザーか判定
4. 予約情報を保存
5. 確認メール送信（メールアドレスがある場合）

## 6. セキュリティ考慮事項

- 個人情報保護のため、管理コンソールへのアクセス制限
- Google Sheetsの共有設定を適切に管理
- 予約フォームはreCAPTCHAで保護（スパム対策）

## 7. 今後の拡張性

- LINE通知連携
- QRコードによる受付確認
- 在庫管理システムとの連携
- 多言語対応