-- フードパントリー予約システム データスキーマ
-- Google Sheetsをデータベースとして使用するため、SQLライクな定義で示す

-- ユーザーテーブル（Usersシート）
-- カタカナ氏名による一意識別（認証なし）
CREATE TABLE Users (
    user_id VARCHAR(100) PRIMARY KEY,         -- カタカナ氏名をそのままIDとして使用
    name_kana VARCHAR(100) NOT NULL UNIQUE,   -- カタカナ氏名（唯一の識別子）
    name_kanji VARCHAR(100),                  -- 漢字氏名
    area VARCHAR(50) NOT NULL,                -- 居住地域
    email VARCHAR(255),                       -- メールアドレス
    phone VARCHAR(20),                        -- 電話番号
    household_adults INTEGER DEFAULT 0,       -- 大人の人数
    household_children INTEGER DEFAULT 0,     -- 子供の人数
    household_details TEXT,                   -- 世帯構成詳細
    first_visit_date DATE,                    -- 初回利用日
    total_visits INTEGER DEFAULT 0,           -- 総利用回数
    last_visit_date DATE,                     -- 最終利用日
    created_at TIMESTAMP NOT NULL,            -- 作成日時
    updated_at TIMESTAMP NOT NULL             -- 更新日時
);

-- 予約テーブル（Reservationsシート）
CREATE TABLE Reservations (
    reservation_id VARCHAR(12) PRIMARY KEY,   -- YYMMDDNNN形式（例: 240511001）
    pantry_id VARCHAR(30) NOT NULL,           -- パントリーID
    user_id VARCHAR(100) NOT NULL,            -- ユーザーID（カタカナ氏名）
    name_kana VARCHAR(100) NOT NULL,          -- カタカナ氏名（主要識別子・検索用）
    event_date DATE NOT NULL,                 -- 開催日
    pickup_location VARCHAR(255),             -- 受取場所
    requested_items TEXT,                     -- 希望食品
    special_needs TEXT,                       -- おむつ・粉ミルク等の特別な要望
    allergies TEXT,                           -- アレルギー情報
    cooking_equipment TEXT,                   -- 調理器具
    support_info TEXT,                        -- 支援団体情報
    visit_count VARCHAR(20),                  -- 利用回数（はじめて、2回目等）
    notes TEXT,                              -- 備考
    status VARCHAR(20) DEFAULT 'confirmed',   -- ステータス（confirmed/cancelled）
    created_at TIMESTAMP NOT NULL,            -- 予約日時
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- パントリーテーブル（Pantriesシート）
-- 各開催イベントの詳細設定
CREATE TABLE Pantries (
    pantry_id VARCHAR(30) PRIMARY KEY,        -- YY.MM.DD.開催場所名（例: 24.05.11.市役所本庁舎）
    event_date DATE NOT NULL,                 -- 開催日
    event_time VARCHAR(50),                   -- 開催時間
    registration_start TIMESTAMP NOT NULL,    -- 予約開始日時
    registration_end TIMESTAMP NOT NULL,      -- 予約終了日時
    location VARCHAR(255) NOT NULL,           -- 開催場所（市役所本庁舎/ニコット）
    location_address TEXT,                    -- 開催場所住所（自動設定）
    location_access TEXT,                     -- アクセス方法（自動設定）
    capacity_total INTEGER DEFAULT 100,       -- 総定員数
    title TEXT NOT NULL,                      -- タイトル文
    header_message TEXT,                      -- ヘッダー案内文
    auto_reply_message TEXT,                  -- 自動応答メール案内文
    status VARCHAR(20) DEFAULT 'upcoming',    -- ステータス（upcoming/open/closed/completed）
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(100),                  -- 作成者
    updated_by VARCHAR(100)                   -- 更新者
);

-- 利用履歴テーブル（Usage_Historyシート）
-- 統計・分析用
CREATE TABLE Usage_History (
    history_id VARCHAR(12) PRIMARY KEY,       -- YYMMDDNNN形式（例: H240511001）
    user_id VARCHAR(100) NOT NULL,            -- ユーザーID（カタカナ氏名）
    reservation_id VARCHAR(12) NOT NULL,      -- 予約ID
    event_date DATE NOT NULL,                 -- 開催日
    attendance BOOLEAN DEFAULT TRUE,          -- 実際の来場有無
    items_received TEXT,                      -- 実際に受け取った物資
    feedback TEXT,                            -- フィードバック
    created_at TIMESTAMP NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (reservation_id) REFERENCES Reservations(reservation_id)
);

-- イベントログテーブル（Event_Logsシート）
-- システムログの記録（簡素化）
CREATE TABLE Event_Logs (
    log_id VARCHAR(20) PRIMARY KEY,           -- ログID（タイムスタンプベース）
    event_type VARCHAR(50) NOT NULL,          -- イベントタイプ（reservation_created/admin_access/pantry_created/error等）
    admin_user VARCHAR(100),                  -- 管理者ユーザー（管理画面操作時）
    pantry_id VARCHAR(30),                    -- パントリーID（該当する場合）
    user_name_kana VARCHAR(100),              -- ユーザー名（カナ）（予約時）
    reservation_id VARCHAR(12),               -- 予約ID（該当する場合）
    event_detail TEXT,                        -- イベント詳細
    ip_address VARCHAR(50),                   -- IPアドレス
    created_at TIMESTAMP NOT NULL             -- 記録日時
);

-- 管理者テーブル（Adminsシート）
-- Firebase認証ベースの管理者管理
CREATE TABLE Admins (
    admin_id VARCHAR(100) PRIMARY KEY,        -- Firebase UID
    email VARCHAR(255) NOT NULL UNIQUE,       -- メールアドレス
    username VARCHAR(100) NOT NULL,           -- ユーザー名
    role VARCHAR(50) DEFAULT 'admin',         -- 役割（admin/super_admin等）
    is_active BOOLEAN DEFAULT TRUE,           -- アクティブ状態
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    last_login TIMESTAMP                      -- 最終ログイン日時
);

-- 設定テーブル（Settingsシート）
-- システム全体の設定管理
CREATE TABLE Settings (
    setting_key VARCHAR(50) PRIMARY KEY,      -- 設定キー
    setting_value TEXT NOT NULL,              -- 設定値
    description TEXT,                         -- 説明
    updated_at TIMESTAMP NOT NULL             -- 更新日時
);

-- 初期設定データ
INSERT INTO Settings VALUES 
    ('auto_registration_enabled', 'true', '自動受付開始/終了の有効化', NOW()),
    ('email_notifications_enabled', 'true', 'メール通知の有効化', NOW()),
    ('max_reservations_per_user', '1', '1ユーザーあたりの最大予約数', NOW()),
    ('location_city_hall', '市川市八幡1丁目1番1号', '市役所本庁舎の住所', NOW()),
    ('location_nicotto', '市川市大和田3丁目23-10', 'ニコットの住所', NOW()),
    ('access_city_hall', 'JR総武線本八幡駅より徒歩5分', '市役所本庁舎のアクセス', NOW()),
    ('access_nicotto', 'JR総武線市川駅よりバス10分', 'ニコットのアクセス', NOW());

-- Google Sheetsでの実装時のカラム順序
-- 
-- Usersシート:
-- A: user_id | B: name_kana | C: name_kanji | D: area | E: email | F: phone
-- G: household_adults | H: household_children | I: household_details
-- J: first_visit_date | K: total_visits | L: last_visit_date | M: created_at | N: updated_at
--
-- Reservationsシート:
-- A: reservation_id | B: user_id | C: name_kana | D: event_date | E: time_slot
-- F: pickup_location | G: requested_items | H: special_needs | I: allergies
-- J: cooking_equipment | K: support_info | L: visit_count | M: notes | N: status | O: created_at
--
-- Eventsシート:
-- A: event_id | B: event_date | C: registration_start | D: registration_end
-- E: location | F: capacity_morning | G: capacity_afternoon | H: capacity_evening
-- I: status | J: notes | K: created_at | L: updated_at

-- 予約ID生成ルール
-- フォーマット: YYMMDDNNN (9桁)
-- YY: 年（24 = 2024年）
-- MM: 月（05 = 5月）
-- DD: 日（11 = 11日）
-- NNN: 3桁連番（001～999）
-- 例: 240511001, 240511002, 240511003

-- 主要なクエリパターン（GASでの実装参考）
-- 
-- 1. ユーザー検索（カタカナ氏名による）
-- SELECT * FROM Users WHERE name_kana = 'ヤマダタロウ'
--
-- 2. ユーザー存在確認・作成またはデータ更新
-- IF EXISTS(SELECT 1 FROM Users WHERE name_kana = 'ヤマダタロウ')
--   UPDATE Users SET ... WHERE name_kana = 'ヤマダタロウ'
-- ELSE
--   INSERT INTO Users (name_kana, ...) VALUES ('ヤマダタロウ', ...)
--
-- 3. 当月の予約一覧
-- SELECT r.*, u.area, u.email FROM Reservations r 
-- JOIN Users u ON r.name_kana = u.name_kana 
-- WHERE event_date = '2024-05-11' ORDER BY time_slot, created_at
--
-- 4. 利用回数更新
-- UPDATE Users SET total_visits = total_visits + 1, last_visit_date = ? WHERE name_kana = ?
--
-- 5. 時間帯別予約数
-- SELECT time_slot, COUNT(*) as count FROM Reservations 
-- WHERE event_date = '2024-05-11' AND status = 'confirmed'
-- GROUP BY time_slot
--
-- 6. 次の予約ID生成
-- SELECT MAX(reservation_id) FROM Reservations WHERE reservation_id LIKE '2405%'