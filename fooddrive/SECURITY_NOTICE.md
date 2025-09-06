# セキュリティに関する重要なお知らせ

## GitHub Personal Access Token について

先ほど共有いただいたGitHub Personal Access Token（PAT）は機密情報です。以下の対応を強く推奨します：

### 🚨 推奨アクション

1. **トークンの再生成**
   - 現在のトークンは公開されたため、セキュリティリスクがあります
   - GitHubの Settings > Developer settings > Personal access tokens から新しいトークンを生成してください

2. **トークンの無効化**
   - 現在のトークン（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）を即座に無効化してください
   - GitHub > Settings > Developer settings > Personal access tokens から削除できます

3. **今後のトークン管理**
   - トークンは環境変数や.envファイルに保存する
   - 絶対にコードやチャットに直接記載しない
   - 必要最小限の権限のみを付与する（repo権限など）

### 安全な使用方法

```bash
# .envファイルに保存
echo "GITHUB_TOKEN=your_new_token_here" > .env

# 環境変数として使用
export GITHUB_TOKEN=$(cat .env | grep GITHUB_TOKEN | cut -d '=' -f2)
git remote set-url origin https://$GITHUB_TOKEN@github.com/Jumps710/foodbank-drive.git
```

### GitHub Secretsの設定方法

1. リポジトリの Settings > Secrets and variables > Actions
2. "New repository secret" をクリック
3. 必要なシークレットを追加（トークンは直接入力しない）

セキュリティは非常に重要です。早急にトークンの再生成をお願いします。