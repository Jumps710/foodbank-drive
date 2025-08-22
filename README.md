# フードバンク管理システム

このプロジェクトは2つの独立したシステムから構成されています：

## システム構成

### 1. パントリーシステム (pantry-system/)
月次のフードパントリー予約管理システム

- **フロントエンド**: GitHub Pages でホスティング
- **バックエンド**: Google Apps Script + Google Sheets
- **認証**: Firebase Authentication
- **URL**: https://jumps710.github.io/foodbank/

#### 主な機能
- 予約フォーム (index.html)
- 管理ダッシュボード (admin.html)
- ユーザー自動同期機能
- 統計・レポート機能

### 2. 倉庫システム (warehouse-system/)
フードバンク倉庫への食品リクエスト管理システム

- **フロントエンド**: LIFF (LINE Mini App)
- **バックエンド**: Google Apps Script + Google Sheets
- **認証**: LINE認証
- **LIFF URL**: https://miniapp.line.me/2007977152-VaXgDOXk

#### 主な機能
- 食品リクエストフォーム
- リクエスト一覧・詳細表示
- 管理者ダッシュボード
- LINE通知機能

## アクセス方法

### パントリーシステム
- **予約フォーム**: https://jumps710.github.io/foodbank/
- **管理画面**: https://jumps710.github.io/foodbank/admin.html

### 倉庫システム
- **LIFF URL**: https://miniapp.line.me/2007977152-VaXgDOXk
- **管理コンソール**: 実装中

## 開発・デプロイ

各システムは独立してデプロイ可能です。詳細は各システムのREADMEを参照してください。

- pantry-system/README.md
- warehouse-system/README.md