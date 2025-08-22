# 🚀 クイックスタート - 自動デプロイ

## ワンコマンドで完全デプロイ

### 🎯 即座に実行

```bash
# 完全自動デプロイ（Git + Clasp）
npm run deploy
```

または

```bash
# 直接実行
./auto-deploy.sh
```

### 📋 事前準備（初回のみ）

#### 1. Claspのログイン
```bash
npx clasp login
```

#### 2. 環境確認
```bash
# Node.js, npm, Gitが必要
node --version
npm --version
git --version
```

### 🔧 利用可能なコマンド

#### フル自動デプロイ
```bash
npm run deploy          # 完全自動デプロイ（Git + Clasp）
npm run full-deploy     # 上記と同じ
```

#### 高速デプロイ
```bash
npm run deploy-fast     # Claspのみ（Gitスキップ）
npm run quick-update    # 簡易更新（Git + Clasp）
```

#### 個別操作
```bash
npm run push           # GASにファイルプッシュのみ
npm run commit         # Gitコミットのみ
npm run push-git       # GitHubプッシュのみ
npm run status         # GASプロジェクト状態確認
npm run logs           # GASログ表示
npm run open           # GASエディタを開く
```

#### Git操作
```bash
npm run git-setup      # Git初期設定
git add .              # 変更をステージング
git commit -m "更新"   # コミット
git push               # GitHubにプッシュ
```

### 🎉 実行結果

自動デプロイが成功すると以下が表示されます：

```
🎉 自動デプロイ完了！
==================================
✅ 全ての処理が正常に完了しました

📋 デプロイ情報:
   🕒 デプロイ時刻: 2025-01-17 22:30:15
   🏷️  デプロイタグ: v2-20250117-223015
   📄 スクリプトID: [YOUR_SCRIPT_ID]
   📊 スプレッドシートID: 1XyNivqVU8J6pyF9CA5XNmkv40rAedsnKGdRAn3qniAU
   🌐 デプロイURL: [YOUR_DEPLOY_URL]
   📱 GitHub: https://github.com/Jumps710/foodbank

🔗 主要なリンク:
   - 管理ダッシュボード: [URL]?page=admin-dashboard
   - パントリー管理: [URL]?page=admin-pantries
   - 予約フォーム: [URL]
```

### 🔍 動作確認

デプロイ後、以下をチェック：

1. **管理ダッシュボード**: `[デプロイURL]?page=admin-dashboard`
2. **パントリー管理**: `[デプロイURL]?page=admin-pantries`  
3. **予約フォーム**: `[デプロイURL]`
4. **データ表示**: 既存データが正しく表示されるか

### 🔧 トラブルシューティング

#### Claspログインエラー
```bash
npx clasp logout
npx clasp login
```

#### デプロイエラー
```bash
npm run logs  # エラーログ確認
npm run status  # プロジェクト状態確認
```

#### 権限エラー
```bash
chmod +x auto-deploy.sh  # 実行権限付与
```

### 📁 ファイル構成

```
foodbank/
├── auto-deploy.sh          # 🚀 メイン自動デプロイスクリプト
├── package.json            # 📦 npmスクリプト設定
├── .gitignore              # 📝 Git除外設定
├── .github/workflows/      # 🤖 GitHub Actions（将来用）
└── gas-project/            # 📄 GASファイル群
```

### 🛡️ 安全性

- **既存システム保護**: 一切影響なし
- **自動バックアップ**: デプロイ前に自動作成
- **復元可能**: 問題時は即座に復元
- **段階的確認**: 各ステップで状態確認

### 💡 ヒント

- **定期更新**: コード変更後は `npm run deploy` で即座にデプロイ
- **高速更新**: 小さな変更なら `npm run quick-update`
- **状態確認**: 問題時は `npm run status` と `npm run logs`
- **手動確認**: 重要な変更前は各ステップを個別実行

---

**🌟 準備完了！`npm run deploy` でスタートしましょう！**