# セットアップガイド

## 必要なアイテム

ClaudeからコードをメンテナンスするためPに、以下の情報・設定が必要です：

### 1. Google Apps Script関連
- **Google Account**: GASを使用するためのGoogleアカウント
- **Script ID**: Claspでプッシュ/プルするためのスクリプトID
- **Drive Folder ID**: 写真保存用のGoogle DriveフォルダID

### 2. GitHub関連
- **GitHub Repository**: コードを管理するリポジトリ（既存: Jumps710/foodbank-drive）
- **GitHub Secrets**（GitHub Actionsで必要）:
  - `CLASP_CREDENTIALS`: Claspの認証情報（~/.clasprc.jsonの内容）
  - `GAS_SCRIPT_ID`: Google Apps ScriptのスクリプトID

### 3. LINE WORKS関連
- **WOFF ID**: 現在使用中のID（Bv2kAkzN6gcZ0nD0brpMpg）
- **LINE WORKSアプリ**: テスト用のLINE WORKSアカウントとアプリ

## 初期設定手順

### 1. Clasp設定

```bash
# 依存関係のインストール
npm install

# Claspにログイン
npm run login

# 新規GASプロジェクト作成（初回のみ）
npm run create

# または既存のプロジェクトに接続
cp .clasp.json.example .clasp.json
# .clasp.jsonのscriptIdを実際のIDに変更

# GASにコードをプッシュ
npm run push
```

### 2. GitHub Actions設定

1. GitHubリポジトリの Settings > Secrets and variables > Actions
2. 以下のシークレットを追加：
   - `CLASP_CREDENTIALS`: `~/.clasprc.json`の内容をコピー
   - `GAS_SCRIPT_ID`: GASのスクリプトID

### 3. Google Drive設定

1. Google Driveで「フードドライブ写真」フォルダを作成
2. フォルダのIDを取得（URLの/folders/以降の文字列）
3. `gas/Code.js`のDRIVE_FOLDER_ID定数を更新

## 開発フロー

### ローカル開発

```bash
# コード編集後、GASにプッシュ
npm run push

# GASからコードをプル
npm run pull

# ログを確認
npm run logs

# ブラウザでGASエディタを開く
npm run open
```

### 自動デプロイ

- mainブランチへのプッシュで自動的に：
  - GitHub Pagesにフロントエンドがデプロイ
  - Google Apps Scriptにバックエンドがデプロイ

## トラブルシューティング

### Clasp認証エラー
```bash
# 再度ログイン
npm run login
```

### GASプッシュエラー
- スクリプトIDが正しいか確認
- 権限があるGoogleアカウントでログインしているか確認

### GitHub Actions失敗
- Secretsが正しく設定されているか確認
- ワークフローのログを確認