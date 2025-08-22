# フードパントリー予約システム

市川市のフードパントリー予約を管理するWebアプリケーションです。

## 🎯 主な機能

### 📋 予約管理機能
- **HTMLフォームによる予約受付** - Google Formからの移行
- **自動メール通知** - 予約完了時の確認メール
- **予約キャンセル機能** - 管理者による予約取り消し
- **重複予約防止** - カタカナ氏名による同一ユーザー判定

### 🏢 パントリー管理機能
- **パントリーイベント作成** - 日時、場所、定員設定
- **予約受付期間の自動制御** - 開始/終了の自動切り替え
- **容量管理** - 予約上限数の設定と監視
- **場所マスター管理** - 市役所本庁舎、ニコットなど

### 👥 利用者管理機能
- **利用者データベース** - カタカナ氏名をキーとした管理
- **利用履歴追跡** - 利用回数、初回・最終利用日の記録
- **世帯情報管理** - 世帯構成、連絡先情報の保存

### 📊 レポート・分析機能
- **利用統計ダッシュボード** - 全利用者数、利用傾向の可視化
- **期間別レポート** - 年度・月別の利用状況分析
- **CSVエクスポート** - データの外部出力機能

### 🔧 管理機能
- **管理者ダッシュボード** - システム全体の状況監視
- **イベントログ管理** - 予約作成、エラー等の記録
- **設定管理** - システム設定の変更

## 🚀 技術スタック

- **フロントエンド**: HTML, CSS (Bootstrap 5), JavaScript
- **バックエンド**: Google Apps Script (JavaScript)
- **データベース**: Google Sheets
- **認証**: Google アカウント
- **通知**: Gmail API
- **デプロイ**: Google Apps Script Web App, Clasp

## 📁 プロジェクト構成

```
foodbank/
├── docs/                       # フロントエンドファイル（Netlify公開用）
│   ├── index.html              # メインページ
│   ├── admin.html              # 管理画面
│   ├── test-api.html           # API接続テスト
│   └── js/                     # JavaScriptファイル
├── mockups/                    # UIモックアップ
├── src/                        # 開発用ソースファイル
├── package.json                # プロジェクト設定
├── netlify.toml                # Netlify設定
└── README.md                   # このファイル
```

## 🔧 開発・デプロイ

### 最新の更新 (2025-01-23)

**✅ 実装完了:**
- 管理者管理機能（adminGetAdmins, adminAddAdmin, adminGetAdminDetail, adminToggleAdminStatus）
- ダッシュボード統計データ（getDashboardStats）
- 利用者ベストテン（getTopUsers）
- 利用履歴管理（getUsageHistory, exportUsageHistory）
- 新しい予約IDフォーマット（YYMMDD001形式）対応
- 複数スプレッドシートシート（pantries, users, reservations, admins, log）対応
- フィルタ機能（年度別、年別、場所別）

**🗂️ データベース構造:**
- `pantries`: パントリーイベント管理
- `reservations`: 予約データ（新YYMMDD001形式ID）
- `users`: 利用者情報（カタカナ氏名による同一ユーザー判定）
- `admins`: 管理者アカウント管理
- `log`: システムイベントログ

このリポジトリはフロントエンドとGAS両方を含みます。
GASコードは `gas-project/Code.js` で管理されています。

### ローカル開発

1. リポジトリをクローン
```bash
git clone https://github.com/Jumps710/foodbank.git
cd foodbank
```

2. ローカルサーバー起動
```bash
# Python 3がある場合
python -m http.server 8000

# または Node.js/npm がある場合
npm install -g http-server
http-server docs/
```

3. `http://localhost:8000` でアクセス

### 本番環境

- フロントエンド: Netlify自動デプロイ
- API: Google Apps Script Web App

## 🌐 アクセス

- **本番サイト**: Netlify自動デプロイによる公開
- **管理画面**: `/admin.html`でアクセス
- **API接続テスト**: `/test-api.html`でAPI動作確認可能

## 📝 ライセンス

MIT License

## 👥 コントリビューター

- Food Pantry Management Team

## 📞 サポート

システムに関するお問い合わせは、プロジェクトのIssuesまでお願いします。

---

**🌟 このシステムが地域の食料支援活動に貢献できることを願っています 🌟**