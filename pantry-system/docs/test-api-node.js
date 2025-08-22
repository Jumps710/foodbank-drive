#!/usr/bin/env node

/**
 * Node.js でのAPIテスト（ブラウザのfetch()をシミュレート）
 */

const https = require('https');
const { URL, URLSearchParams } = require('url');

// 設定
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxNS8TKGfDlyKGPZvcVx-Ad7QWmc2RCPd-drkXNsXmcaf8v8MEoclrnd98VDJIrSdvCNQ/exec';

/**
 * APIリクエスト関数（kodomonwパターン）
 */
async function apiRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`🌐 API Request: ${method} ${path}`, data);
      
      let url = API_BASE_URL;
      let options = {
        method: method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Claude-Code-Test/1.0)',
          'Accept': 'application/json, text/plain, */*',
        }
      };
      
      let postData = null;
      
      if (method === 'GET') {
        // GETリクエストの場合
        if (path.includes('?')) {
          const [action, params] = path.split('?');
          url += `?action=${action}&${params}`;
        } else {
          url += `?action=${path}`;
        }
      } else {
        // POSTリクエストの場合
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        
        const params = new URLSearchParams();
        params.append('action', path);
        if (data) {
          for (const [key, value] of Object.entries(data)) {
            params.append(key, value);
          }
        }
        postData = params.toString();
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }
      
      console.log(`📍 Final URL: ${url}`);
      console.log(`📋 Options:`, options);
      if (postData) console.log(`📤 POST Data: ${postData}`);
      
      const urlObj = new URL(url);
      options.hostname = urlObj.hostname;
      options.path = urlObj.pathname + urlObj.search;
      options.port = 443;
      
      const req = https.request(options, (res) => {
        let responseBody = '';
        
        console.log(`📡 Status Code: ${res.statusCode}`);
        console.log(`📋 Response Headers:`, res.headers);
        
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        
        res.on('end', () => {
          try {
            // JSONレスポンスを試行
            const result = JSON.parse(responseBody);
            console.log(`✅ JSON Response:`, result);
            resolve(result);
          } catch (parseError) {
            // HTMLレスポンスの場合
            console.log(`📄 HTML Response (first 500 chars):`, responseBody.substring(0, 500));
            
            if (responseBody.includes('Moved Temporarily')) {
              reject(new Error('GAS API returned authentication redirect'));
            } else if (responseBody.includes('ページが見つかりません')) {
              reject(new Error('GAS API returned page not found error'));
            } else {
              reject(new Error(`Invalid response format: ${parseError.message}`));
            }
          }
        });
      });
      
      req.on('error', (error) => {
        console.error(`❌ Request Error:`, error);
        reject(error);
      });
      
      if (postData) {
        req.write(postData);
      }
      
      req.end();
      
    } catch (error) {
      console.error(`❌ Setup Error:`, error);
      reject(error);
    }
  });
}

/**
 * テスト実行
 */
async function runTests() {
  console.log('=== GAS API テスト開始 ===');
  
  const tests = [
    { name: 'Test Endpoint (GET)', action: 'test', method: 'GET' },
    { name: 'Test Endpoint (POST)', action: 'test', method: 'POST' },
    { name: 'Statistics (GET)', action: 'getStatistics', method: 'GET' },
    { name: 'Pantries (GET)', action: 'adminGetPantries', method: 'GET' },
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`\n--- ${test.name} ---`);
      const result = await apiRequest(test.action, test.method);
      results.push({
        test: test.name,
        success: true,
        result: result
      });
      console.log(`✅ ${test.name} 成功`);
    } catch (error) {
      results.push({
        test: test.name,
        success: false,
        error: error.message
      });
      console.log(`❌ ${test.name} 失敗: ${error.message}`);
    }
    
    // 次のテストまで少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== テスト結果サマリー ===');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.success ? 'SUCCESS' : result.error}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 成功: ${successCount}/${results.length}`);
  
  return results;
}

// メイン実行
if (require.main === module) {
  runTests()
    .then(results => {
      console.log('\n🎉 テスト完了');
      process.exit(results.every(r => r.success) ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 テスト実行エラー:', error);
      process.exit(1);
    });
}

module.exports = { apiRequest, runTests };