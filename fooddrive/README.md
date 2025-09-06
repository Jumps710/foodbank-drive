# フードドライブ入庫管理システム

LINE WORKSのWOFFを通じて、食品寄付（フードドライブ）の報告をするWebアプリケーションです。

## システム構成

### プロジェクト構造
```
fooddrive/
├── foodbank-drive/          # メインアプリケーションディレクトリ
│   ├── index.html          # メインフォーム画面
│   ├── script.js           # フロントエンドロジック
│   ├── styles.css          # スタイルシート
│   ├── rgb_02_fs(2).jpg   # ロゴ画像
│   ├── log.txt            # ログファイル（現在未使用）
│   └── readme             # GitHubページURL
├── backup/                 # バックアップディレクトリ
└── gas/                   # Google Apps Script関連（要作成）
```

### 技術スタック
- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **バックエンド**: Google Apps Script (GAS)
- **データ保存**: Google Sheets
- **連携プラットフォーム**: LINE WORKS (WOFF SDK)
- **ホスティング**: GitHub Pages

### 主な機能
1. **寄付情報入力フォーム**
   - Tweet設定（する/しない）
   - 寄付者選択（ドロップダウン + その他入力）
   - 重量入力（kg）
   - 寄付内容記入
   - メモ欄
   - 写真アップロード（JPEG/PNG/HEIC対応）

2. **LINE WORKS連携**
   - WOFF SDK v3.6使用
   - ユーザープロファイル取得
   - アプリ内動作検証

3. **データ送信**
   - Google Apps Scriptエンドポイントへのデータ送信
   - Base64形式での画像送信
   - 送信前確認モーダル

## 外部リソース

- **GitHub Pages**: https://jumps710.github.io/foodbank-drive/
- **Google Sheet ID**: 1JH_bJs9Gtxp-UBu-qY7AV4hxtFzj6jUQJ-daINbJNP4
- **GAS Endpoint**: https://script.google.com/macros/s/AKfycbwIdZiP3KB3Tf6wMegdXXcorGE6E-djR3rewZLbBI2QBZa_VHYUrODRpdkO8jIhLvnD/exec

## セットアップ手順

### 1. リポジトリのクローン
```bash
git clone https://github.com/Jumps710/foodbank-drive.git
cd foodbank-drive
```

### 2. LINE WORKS設定
- WOFF ID: `Bv2kAkzN6gcZ0nD0brpMpg`
- LINE WORKSアプリ内でのみ動作

### 3. Google Apps Script設定
- 後述のClasp設定を参照

## 開発環境構築

### 必要なツール
- Node.js (v14以上推奨)
- npm または yarn
- Google Account (GAS用)
- clasp CLI ツール

### Clasp設定（予定）
```bash
npm install -g @google/clasp
clasp login
clasp create --type webapp --title "フードドライブ入庫管理"
```

## デプロイ

### GitHub Pages
- mainブランチへのpushで自動デプロイ

### Google Apps Script
- Claspを使用した自動デプロイ（設定予定）

## 今後の実装予定
1. Clasp設定によるGASコード管理
2. GitHub Actionsによる自動デプロイ
3. システム構成図・フロー図の作成
4. テスト環境の構築