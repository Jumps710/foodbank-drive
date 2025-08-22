# 倉庫システム (Warehouse System)

フードバンク倉庫への食品リクエスト管理システム

## システム概要

### アクセス方法
- **LIFF URL（Requester用）**: https://miniapp.line.me/2007977152-VaXgDOXk  
- **WOFF URL（Staff/Driver用）**: https://woff.worksmobile.com/woff/z-vHKyt_a0GkVpsS9j46NQ
- **直接アクセス（Admin用）**: https://jumps710.github.io/foodbank/warehouse/
- **管理コンソール**: https://jumps710.github.io/foodbank/warehouse/#/dashboard

### 技術スタック
- **フロントエンド**: LIFF (LINE Front-end Framework)
- **バックエンド**: Google Apps Script + Google Sheets
- **認証**: LINE認証
- **通知**: LINE Messaging API + LINE WORKS

### 主な機能
1. 食品リクエストフォーム
2. リクエスト一覧・詳細表示  
3. 管理者ダッシュボード
4. LINE通知機能

## ファイル構成

```
warehouse-system/
├── frontend/
│   ├── index.html          # メインLIFFアプリ
│   ├── app.js              # メインルーター
│   ├── common/
│   │   ├── css/style.css   # 共通スタイル
│   │   └── js/liff-init.js # LIFF初期化
│   └── views/              # 各画面のコンポーネント
├── backend/
│   └── gas-project/        # Google Apps Script
│       ├── Code.gs         # メインAPI
│       └── appsscript.json # GAS設定
├── line-config/
│   └── liff-config.json    # LIFF設定
└── docs/                   # ドキュメント
```

## 開発・デプロイ

### GAS デプロイ
```bash
cd warehouse-system/backend/gas-project
clasp push
clasp deploy
```

### LIFF 設定（Requester用）
- LIFF ID: 2007977152-VaXgDOXk
- エンドポイント URL: https://jumps710.github.io/foodbank/warehouse/

### WOFF 設定（Staff/Driver用）
- **エンドポイント URL**: https://jumps710.github.io/foodbank/warehouse/
- WOFF ID: z-vHKyt_a0GkVpsS9j46NQ
- WOFF URL: https://woff.worksmobile.com/woff/z-vHKyt_a0GkVpsS9j46NQ
- 対象ユーザー: LINE WORKSユーザー（Staff, Driver）

### 検証URL
- **LIFF App（Requester）**: https://miniapp.line.me/2007977152-VaXgDOXk
- **WOFF App（Staff/Driver）**: https://woff.worksmobile.com/woff/z-vHKyt_a0GkVpsS9j46NQ
- **直接アクセス（Admin）**: https://jumps710.github.io/foodbank/warehouse/
- **管理コンソール**: https://jumps710.github.io/foodbank/warehouse/#/dashboard