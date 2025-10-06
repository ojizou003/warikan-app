# 技術仕様と設計方針

## 1. アーキテクチャ概要

### 1.1 全体構成

```
割り勘アプリ（Single Page Application）
├── フロントエンド（Vanilla JavaScript）
│   ├── 計算エンジン
│   ├── UIコントローラー
│   ├── ローカルストレージ管理
│   └── シェア機能
├── データ層
│   ├── LocalStorage（ブラウザ）
│   └── URLパラメータ
└── スタイル層
    ├── CSSカスタムプロパティ
    ├── レスポンシブデザイン
    └── アニメーション
```

### 1.2 技術スタック

| カテゴリ | 技術選定 | バージョン | 理由 |
|----------|----------|----------|------|
| 言語 | JavaScript | ES6+ | モダンブラウザ対応、クラスベース設計 |
| CSS | CSS3 | 最新 | カスタムプロパティ、グリッド/フレックスボックス |
| テスト | Vitest | ^2.1.1 | 高速テスト実行、Jest互換 |
| ビルド | Vite | 最新 | 高速な開発サーバー、モジュールバンドラー |
| バージョン管理 | Git | 最新 | 分散バージョン管理 |
| エディタ | VS Code | 最新 | デバッグ支援、拡張機能豊富 |

---

## 2. データアーキテクチャ

### 2.1 データフロー

```
ユーザー入力 → バリデーション → 計算エンジン → 結果表示
     ↓                ↓             ↓           ↓
  UI更新        エラーメッセージ    履歴保存     シェア機能
     ↓                ↓             ↓           ↓
  URL更新        フォーカス移動   LocalStorage  クリップボード
```

### 2.2 データモデル

```javascript
// 計算入力モデル
interface CalculationInput {
  totalAmount: number;        // 総額（1〜100億）
  numberOfPeople: number;     // 人数（1〜9999）
  type: CalculationType;       // 計算タイプ
  organizerBurden?: number;    // 幹事負担額（オプション）
  organizerFixed?: number;     // 幹事固定額（オプション）
}

// 計算結果モデル
interface CalculationResult {
  totalAmount: number;         // 総額
  numberOfPeople: number;      // 人数
  type: CalculationType;       // 計算タイプ
  perPerson: number;           // 1人あたりの金額
  remainder: number;           // 端数
  organizerPayment?: number;   // 幹事の支払額
  participantPayment?: number; // 参加者の支払額
  timestamp: number;           // 計算日時
}

// 履歴エントリモデル
interface HistoryEntry {
  id: string;                  // 一意識別子
  calculationResult: CalculationResult; // 計算結果
  note?: string;               // ユーザーメモ
  tags?: string[];             // タグ（将来拡張用）
}
```

### 2.3 ストレージ設計

```javascript
// LocalStorage構造
{
  "warikan_history": {
    "version": "1.0.0",
    "entries": [...],          // 履歴エントリ配列（最大50件）
    "settings": {
      "maxEntries": 50,
      "autoCleanup": true
    },
    "metadata": {
      "createdAt": 1640995200000,
      "lastModified": 1641081600000
    }
  },
  "warikan_settings": {
    "defaultType": "equal",
    "showAnimation": true,
    "autoSave": true
  }
}
```

---

## 3. コンポーネント設計

### 3.1 モジュール構成

```
src/
├── main.js                 // メインアプリケーション
├── calculation.js          // 計算ロジック
├── validation.js           // 入力バリデーション
├── storage.js              // LocalStorage管理
├── share.js                // シェア機能
├── components/
│   ├── HistoryList.js      // 履歴リストコンポーネント
│   ├── ShareUI.js          // シェアUIコンポーネント
│   └── OrganizerUI.js      // 幹事負担UIコンポーネント
└── utils/
    ├── format.js           // 数値フォーマット
    ├── dom.js              // DOM操作ユーティリティ
    └── constants.js        // 定数定義
```

### 3.2 クラス設計

```javascript
/**
 * 計算エンジンクラス
 */
class CalculationEngine {
  constructor() {
    this.types = {
      EQUAL: 'equal',
      ORGANIZER_MORE: 'organizer_more',
      ORGANIZER_LESS: 'organizer_less',
      ORGANIZER_FIXED: 'organizer_fixed'
    };
  }

  // 計算実行
  calculate(input) {
    // 共通バリデーション
    // タイプ別計算ロジック呼び出し
    // 結果オブジェクト生成
  }

  // タイプ別計算メソッド
  calculateEqual(total, people) { ... }
  calculateOrganizerMore(total, people, burden) { ... }
  calculateOrganizerLess(total, people, reduction) { ... }
  calculateOrganizerFixed(total, people, fixed) { ... }
}

/**
 * UIコントローラークラス
 */
class UIController {
  constructor() {
    this.calculationEngine = new CalculationEngine();
    this.storage = new HistoryStorage();
    this.shareManager = new ShareManager();
    this.init();
  }

  // イベントハンドラ
  bindEvents() {
    // 計算ボタン
    // 入力値変更
    // 履歴操作
    // シェア操作
  }

  // UI更新
  updateResult(result) { ... }
  showError(message) { ... }
  clearResult() { ... }
}

/**
 * 履歴管理クラス
 */
class HistoryStorage {
  constructor() {
    this.storageKey = 'warikan_history';
    this.maxEntries = 50;
  }

  // CRUD操作
  save(result) { ... }
  findAll(options) { ... }
  delete(id) { ... }
  clear() { ... }

  // ユーティリティ
  export() { ... }
  import(data) { ... }
  migrate(data) { ... }
}
```

### 3.3 イベント駆動アーキテクチャ

```javascript
// カスタムイベント定義
const EVENTS = {
  CALCULATED: 'warikan:calculated',
  HISTORY_UPDATED: 'warikan:history-updated',
  SHARE_COMPLETED: 'warikan:share-completed',
  ERROR_OCCURRED: 'warikan:error'
};

// イベント発行
function dispatchCalculated(result) {
  const event = new CustomEvent(EVENTS.CALCULATED, {
    detail: { result }
  });
  document.dispatchEvent(event);
}

// イベントリスナー
document.addEventListener(EVENTS.CALCULATED, (e) => {
  const { result } = e.detail;
  // 履歴保存
  // UI更新
  // URL更新
});
```

---

## 4. UI/UX設計方針

### 4.1 デザイン原則

1. **シンプルさ**
   - 最小限の操作で目的を達成
   - 余計な機能を削除
   - 直感的なインターフェース

2. **一貫性**
   - 統一されたカラーパレット
   - 一貫したインタラクションパターン
   - 予測可能な動作

3. **アクセシビリティ**
   - キーボード操作対応
   - スクリーンリーダー対応
   - 十分なコントラスト比

4. **レスポンシブ**
   - モバイルファースト
   - あらゆる画面サイズに対応
   - タッチフレンドリー

### 4.2 CSS設計

```css
/* カスタムプロパティによる一元管理 */
:root {
  /* カラー */
  --color-primary: #667eea;
  --color-primary-dark: #764ba2;
  --color-white: #ffffff;
  --color-gray-light: #f8f9fa;
  --color-gray-medium: #e0e0e0;
  --color-gray-dark: #666;
  --color-gray-darker: #333;
  --color-success: #27ae60;
  --color-error: #e74c3c;

  /* スペーシング */
  --spacing-xs: 5px;
  --spacing-sm: 10px;
  --spacing-md: 20px;
  --spacing-lg: 30px;
  --spacing-xl: 40px;

  /* タイポグラフィ */
  --font-family: 'Helvetica Neue', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
  --font-size-xs: 0.95rem;
  --font-size-sm: 1rem;
  --font-size-md: 1.1rem;
  --font-size-lg: 1.2rem;
  --font-size-xl: 1.4rem;

  /* アニメーション */
  --transition-fast: 0.3s ease;
  --transition-normal: 0.5s ease;
}

/* コンポーネントベースのスタイル */
.component-base {
  /* 基本スタイル */
}

.component-variant {
  /* バリエーションスタイル */
}

/* ユーティリティクラス */
.text-center { text-align: center; }
.mb-0 { margin-bottom: 0; }
.visually-hidden { /* スクリーンリーダー専用 */ }
```

### 4.3 インタラクション設計

```javascript
// フィードバック設計
const Feedback = {
  // 成功フィードバック
  success: (message) => {
    // トースト通知
    // 視覚的フィードバック（緑色）
    // サウンド（オプション）
  },

  // エラーフィードバック
  error: (message) => {
    // エラーメッセージ表示
    // 視覚的フィードバック（赤色）
    // 入力フィールドのハイライト
  },

  // ローディングフィードバック
  loading: () => {
    // スピナー表示
    // 操作無効化
    // 進捗インジケーター
  }
};

// アニメーション効果
const Animations = {
  fadeIn: (element) => {
    element.classList.add('fade-in');
    element.style.animation = 'fadeIn 0.5s ease-in';
  },

  shake: (element) => {
    element.classList.add('shake');
    element.style.animation = 'shake 0.5s ease-in-out';
  },

  pulse: (element) => {
    element.classList.add('pulse');
    element.style.animation = 'pulse 0.3s ease-in-out';
  }
};
```

---

## 5. パフォーマンス最適化

### 5.1 計算パフォーマンス

```javascript
// 計算結果キャッシュ
class CalculationCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  // キャッシュキー生成
  generateKey(input) {
    return `${input.totalAmount}_${input.numberOfPeople}_${input.type}_${input.organizerBurden || 0}`;
  }

  // キャッシュ取得
  get(input) {
    const key = this.generateKey(input);
    return this.cache.get(key);
  }

  // キャッシュ保存
  set(input, result) {
    const key = this.generateKey(input);

    // LRU削除
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }
}

// 使用例
const cache = new CalculationCache();

function performCalculationWithCache(input) {
  // キャッシュ確認
  const cached = cache.get(input);
  if (cached) {
    return cached.result;
  }

  // 計算実行
  const result = calculationEngine.calculate(input);

  // キャッシュ保存
  cache.set(input, result);

  return result;
}
```

### 5.2 レンダリング最適化

```javascript
// スロットリングによるUI更新
class UIUpdater {
  constructor() {
    this.pendingUpdates = [];
    this.isUpdating = false;
  }

  // 更新をスケジュール
  scheduleUpdate(updateFn) {
    this.pendingUpdates.push(updateFn);

    if (!this.isUpdating) {
      this.flushUpdates();
    }
  }

  // バッチ更新実行
  flushUpdates() {
    if (this.pendingUpdates.length === 0) return;

    this.isUpdating = true;

    // requestAnimationFrameで最適なタイミングで更新
    requestAnimationFrame(() => {
      const updates = this.pendingUpdates.splice(0);

      // DOM変更をまとめて実行
      const fragment = document.createDocumentFragment();

      updates.forEach(update => {
        update(fragment);
      });

      // 一度にDOMに反映
      if (fragment.children.length > 0) {
        document.body.appendChild(fragment);
      }

      this.isUpdating = false;

      // 残りの更新があれば再帰呼び出し
      if (this.pendingUpdates.length > 0) {
        this.flushUpdates();
      }
    });
  }
}
```

### 5.3 LocalStorage最適化

```javascript
// 遅延書き込み
class DelayedStorage {
  constructor() {
    this.pendingWrites = new Map();
    this.writeDelay = 1000; // 1秒遅延
  }

  // 書き込みスケジュール
  scheduleWrite(key, value) {
    // 既存のタイムアウトをクリア
    const existingTimeout = this.pendingWrites.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 新しいタイムアウトを設定
    const timeout = setTimeout(() => {
      this.performWrite(key, value);
      this.pendingWrites.delete(key);
    }, this.writeDelay);

    this.pendingWrites.set(key, timeout);
  }

  // 実際の書き込み実行
  performWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage書き込みエラー:', error);
      this.handleStorageError(error);
    }
  }

  // ストレージエラー処理
  handleStorageError(error) {
    if (error.name === 'QuotaExceededError') {
      // 古いデータを削除して容量確保
      this.cleanupOldData();
    }
  }

  // 古いデータ削除
  cleanupOldData() {
    const history = JSON.parse(localStorage.getItem('warikan_history') || '{}');

    if (history.entries && history.entries.length > 10) {
      // 半分に削減
      history.entries = history.entries.slice(0, 5);
      localStorage.setItem('warikan_history', JSON.stringify(history));
    }
  }
}
```

---

## 6. セキュリティ設計

### 6.1 入力バリデーション

```javascript
// 厳格なバリデーション
class Validator {
  static rules = {
    totalAmount: {
      required: true,
      type: 'number',
      min: 1,
      max: 10000000000, // 100億円
      integer: true
    },
    numberOfPeople: {
      required: true,
      type: 'number',
      min: 2,
      max: 9999,
      integer: true
    },
    organizerBurden: {
      required: false,
      type: 'number',
      min: 1,
      max: 100000000,
      integer: true
    }
  };

  static validate(input) {
    const errors = [];

    Object.entries(this.rules).forEach(([field, rules]) => {
      const value = input[field];

      // 必須チェック
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field}は必須です`);
        return;
      }

      // 型チェック
      if (value !== undefined && rules.type === 'number') {
        if (isNaN(value) || !isFinite(value)) {
          errors.push(`${field}は有効な数値ではありません`);
          return;
        }

        // 整数チェック
        if (rules.integer && !Number.isInteger(value)) {
          errors.push(`${field}は整数でなければなりません`);
        }

        // 範囲チェック
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field}は${rules.min}以上でなければなりません`);
        }

        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field}は${rules.max}以下でなければなりません`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

### 6.2 XSS対策

```javascript
// HTMLエスケープ
class Sanitizer {
  static escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // サニタイズ済みHTML生成
  static createSafeHTML(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = data[key];
      if (value === undefined || value === null) {
        return '';
      }
      return this.escapeHTML(String(value));
    });
  }

  // DOMセーフな要素作成
  static createElement(tag, properties = {}) {
    const element = document.createElement(tag);

    Object.entries(properties).forEach(([key, value]) => {
      if (key === 'textContent' || key === 'innerHTML') {
        element[key] = this.escapeHTML(value);
      } else {
        element.setAttribute(key, value);
      }
    });

    return element;
  }
}
```

### 6.3 プライバシー保護

```javascript
// プライバシーコントロール
class PrivacyManager {
  constructor() {
    this.privacySettings = {
      saveHistory: true,
      includeTimestamp: false,
      shareAnalytics: false
    };
  }

  // プライバシー設定保存
  savePrivacySettings(settings) {
    // 機密情報は保存しない
    const safeSettings = { ...settings };
    delete safeSettings.userData;
    delete safeSettings.sensitiveInfo;

    localStorage.setItem('warikan_privacy', JSON.stringify(safeSettings));
  }

  // データの匿名化
  anonymizeData(data) {
    const anonymized = { ...data };

    // 個人識別可能な情報を削除
    delete anonymized.userId;
    delete anonymized.ipAddress;
    delete anonymized.userAgent;

    // タイムスタンプを丸める（日単位）
    if (anonymized.timestamp) {
      anonymized.timestamp = Math.floor(anonymized.timestamp / 86400000) * 86400000;
    }

    return anonymized;
  }

  // データ完全削除
  wipeAllData() {
    // すべてのLocalStorageデータを削除
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('warikan_')) {
        localStorage.removeItem(key);
      }
    });

    // キャッシュもクリア
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      });
    }
  }
}
```

---

## 7. テスト戦略

### 7.1 テストピラミッド

```
      /\
     /  \
    / E2E \     ← 少ない（2-3個）
   /______\
  /        \
 / Integration \ ← 適度（10-15個）
/____________\
/  Unit Tests   \ ← 多い（50+個）
```

### 7.2 テストカテゴリ

#### 単体テスト
- 計算ロジックのテスト
- バリデーションのテスト
- ユーティリティ関数のテスト

#### 統合テスト
- コンポーネント間連携
- LocalStorage操作
- URL生成/解析

#### E2Eテスト
- ユーザーストーリーのテスト
- クロスブラウザテスト
- デバイス互換性テスト

### 7.3 テストカバレッジ目標

| カテゴリ | 目標カバレッジ |
|----------|----------------|
| ステートメント | 90%以上 |
| ブランチ | 80%以上 |
| 関数 | 95%以上 |
| 行 | 85%以上 |

---

## 8. デプロイ戦略

### 8.1 環境構成

```
開発環境
├── ローカル開発サーバー（Vite）
├── ホットリロード
├── ソースマップ
└── デバッグツール

テスト環境
├── プレビュー環境（GitHub Pages）
├── 自動テスト実行
├── カバレッジレポート
└── パフォーマンス測定

本番環境
├── 静的ホスティング（GitHub Pages）
├── CDN配信
├── GZIP圧縮
└── キャッシュ最適化
```

### 8.2 ビルドプロセス

```javascript
// vite.config.js
import { defineConfig } from 'vite/config';

export default defineConfig({
  build: {
    // 最適化
    minify: 'terser',
    sourcemap: false,

    // チャンク分割
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['lodash'],
          utils: ['./src/utils']
        }
      }
    },

    // アセット最適化
    assetsInlineLimit: 4096,

    // ターゲットブラウザ
    target: ['es2015', 'chrome58', 'firefox57']
  },

  // 開発サーバー設定
  server: {
    port: 3000,
    open: true,
    cors: true
  }
});
```

### 8.3 CI/CDパイプライン

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Check coverage
      run: npm run test:coverage

  build:
    needs: test
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

---

## 9. 監視とメンテナンス

### 9.1 エラー監視

```javascript
// エラーハンドリング
class ErrorReporter {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  // エラー記録
  report(error, context = {}) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errors.push(errorReport);

    // 最大数維持
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // 開発環境ではコンソールに表示
    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', errorReport);
    }

    // 本番環境では外部サービスに送信（オプション）
    if (process.env.NODE_ENV === 'production') {
      this.sendToService(errorReport);
    }
  }

  // 外部サービスへの送信
  async sendToService(errorReport) {
    // エラー収集サービスへの送信
    // 例: Sentry, LogRocketなど
  }

  // エラー統計取得
  getErrorStats() {
    const stats = {};
    this.errors.forEach(error => {
      const key = error.message.substring(0, 50);
      stats[key] = (stats[key] || 0) + 1;
    });
    return stats;
  }
}
```

### 9.2 パフォーマンス監視

```javascript
// パフォーマンス計測
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  // 計測開始
  start(label) {
    this.metrics[label] = {
      startTime: performance.now()
    };
  }

  // 計測終了
  end(label) {
    if (!this.metrics[label]) return;

    const duration = performance.now() - this.metrics[label].startTime;
    this.metrics[label].duration = duration;

    // パフォーマンス警告
    if (duration > 100) {
      console.warn(`Slow operation: ${label} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Core Web Vitals計測
  measureCoreWebVitals() {
    // LCP（Largest Contentful Paint）
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID（First Input Delay）
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // CLS（Cumulative Layout Shift）
    new PerformanceObserver((list) => {
      let clsScore = 0;
      list.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      });
      console.log('CLS:', clsScore);
    }).observe({ entryTypes: ['layout-shift'] });
  }
}
```

---

## 10. 今後の拡張計画

### 10.1 短期的な拡張（3ヶ月以内）

1. **機能拡張**
   - グループ分け割り勘
   - 割引率指定機能
   - 通貨対応（USD, EURなど）

2. **UI/UX改善**
   - ダークモード対応
   - カスタムテーマ機能
   - ジェスチャーアニメーション

3. **データ機能**
   - CSV/Excelエクスポート
   - 定期計算テンプレート
   - グラフ表示機能

### 10.2 中期的な拡張（6ヶ月以内）

1. **プラットフォーム対応**
   - PWA化（オフライン対応）
   - モバイルアプリ（React Native）
   - デスクトップアプリ（Electron）

2. **連携機能**
   - 決済連携（PayPay, LINE Payなど）
   - カレンダー連携
   - チャットボット連携

3. **AI機能**
   - 適切な割り勘提案
   - 過去データからの学習
   - レポート生成

### 10.3 長期的な拡張（1年以内）

1. **ビジネス機能**
   - グループ管理
   - 請求書発行
   - 決済管理

2. **ソーシャル機能**
   - 友達との共有
   - イベント作成
   - コミュニティ機能

3. **エンタープライズ機能**
   - チーム管理
   - 経費精算連携
   - 分析ダッシュボード

---

## 11. まとめ

本技術仕様書は、割り勘アプリの開発と保守のための包括的なガイドラインです。以下の重要な点を守ることで、高品質で持続可能なソフトウェアを開発できます：

1. **シンプルさの維持** - 過度な機能追加を避け、コア機能に集中する
2. **一貫性の確保** - コーディング規約、デザインパターンを統一する
3. **テストの重視** - 十分なテストカバレッジを維持する
4. **パフォーマンス意識** - 常にパフォーマンスを測定し改善する
5. **ユーザーファースト** - ユーザーのニーズを最優先に考える

この仕様書は、開発の進捗に応じて更新されます。定期的な見直しと改善を心がけてください。