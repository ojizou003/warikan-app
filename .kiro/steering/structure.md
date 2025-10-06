# 割り勘アプリ - プロジェクト構造

## ルートディレクトリ構成
```
warikan-app/
├── index.html          # メインHTMLファイル（エントリーポイント）
├── main.js            # JavaScriptロジック（すべての機能を含む）
├── package.json       # npm設定と依存関係
├── vitest.config.js   # Vitestテスト設定
├── README.md          # プロジェクトドキュメント
├── .git/              # Gitリポジトリ
├── .gitignore         # Git無視ファイル
├── .claude/           # Claude Code設定
│   └── commands/      # カスタムコマンド
├── .kiro/             # Kiro spec-driven開発設定
│   └── steering/      # Steeringドキュメント
│       ├── product.md # 製品概要
│       ├── tech.md    # 技術スタック
│       └── structure.md # プロジェクト構造
└── node_modules/       # npm依存関係（git無視）
```

## サブディレクトリ構造
### 現状
```
warikan-app/
├── index.html          # メインHTMLファイル
├── assets/             # 静的リソース
│   └── css/
│       └── styles.css  # CSSスタイルシート
├── test/               # テストコード（単体テスト）
│   ├── setup.js        # テスト設定
│   ├── calculation.test.js  # 計算ロジックテスト
│   └── validation.test.js   # 入力検証テスト
├── tests/              # セキュリティ・結合テスト
│   └── security.test.js     # セキュリティテスト
├── .claude/            # Claude Code設定
│   └── commands/       # カスタムコマンド
├── .kiro/              # Kiro設定
│   └── steering/       # ステアリングドキュメント
└── node_modules/       # npm依存関係（git無視）
```

### 今後の拡張案
```
warikan-app/
├── index.html
├── assets/
│   ├── css/
│   │   ├── styles.css
│   │   └── components.css  # コンポーネントごとのCSS
│   ├── js/
│   │   ├── main.js
│   │   ├── modules/       # 機能モジュール
│   │   │   ├── calculator.js
│   │   │   ├── validator.js
│   │   │   └── ui.js
│   │   └── utils.js       # ユーティリティ関数
│   └── audio/             # 音声ファイル（将来的）
├── tests/
│   ├── unit/              # 単体テスト
│   ├── integration/       # 結合テスト
│   └── e2e/              # E2Eテスト
├── docs/                  # ドキュメント
└── examples/             # 使用例
```

## コード編成パターン
### 現在のアーキテクチャ
- **モノリシック**: 単一JSファイルにすべてのロジック
- **関数型プログラミング**: 純粋関数とイベントハンドラの分離
- **イベント駆動**: DOMイベント中心の設計

### 関数のカテゴリ分け
```javascript
// DOM要素定数
const priceInput = ...;
const countInput = ...;
const organizerModeToggle = ...;
const organizerPriceInput = ...;
const calculateButton = ...;
const answerDisplay = ...;
const organizerInputArea = ...;

// イベントハンドラ
calculateButton.addEventListener('click', calculateSplit);
priceInput.addEventListener('input', handleInputChange);
countInput.addEventListener('input', handleInputChange);
organizerModeToggle.addEventListener('change', handleOrganizerModeToggle);
organizerPriceInput.addEventListener('input', handleOrganizerPriceChange);

// コアビジネスロジック
function calculateSplit() { ... }
function performCalculation(price, count, organizerPrice = null) { ... }

// セキュリティ関数
function escapeHTML(str) { ... }

// ユーティリティ関数
function convertFullWidthToHalfWidth(str) { ... }
function isValidInput(price, count, organizerPrice = null) { ... }
function getErrorHints(type, value) { ... }

// UI関数
function displayResult(result) { ... }
function displayValidationError(message, hints = []) { ... }
function resetDisplay() { ... }
function playSuccessSound() { ... }

// 入力制御関数
function enforceHalfWidthNumbers(input) { ... }
function enforceHalfWidthNumbersOnPaste(e) { ... }
function disableIME(input) { ... }
```

## ファイル命名規則
### 現状
- **HTML**: `index.html`（スネークケース）
- **JavaScript**: `main.js`（スネークケース）
- **CSS**: `styles.css`（スネークケース）
- **テスト**: `*.test.js`（ドット記法）
- **設定**: `vitest.config.js`（ドット記法）
- **ドキュメント**: `README.md`（スネークケース）

### 一貫性
- ✅ 現在の命名規則は一貫している
- ✅ Web標準（小文字スネークケース）に準拠
- ✅ ファイルタイプごとに明確な区別あり

## インポート/依存関係編成
### 現状
- **依存関係**: 
  - 開発: Vitest, jsdom, @vitest/ui
  - ビルド: Vite
- **モジュールシステム**: なし（ヴァニラJS）
- **読み込み順序**: HTMLでスクリプトをdefer読み込み

### 改善提案
```javascript
// ES6モジュール化
import { calculateSplit, validateInput } from './modules/calculator.js';
import { formatCurrency } from './utils/formatters.js';
import { playSound } from './utils/audio.js';
import { escapeHTML } from './utils/security.js';
```

## 主要なアーキテクチャ原則
### 現状で適用されている原則
1. **関心の分離**: UI、ロジック、イベントハンドラを分離
2. **単一責任**: 各関数が単一の責務を担う
3. **DRY**: 共通処理を関数化
4. **KISS**: シンプルな実装を維持
5. **セキュリティ**: XSS対策を組み込み

### 改善の余地がある原則
1. **開放閉鎖原則**: 機能追加時に既存コード修正不要
2. **依存性逆転**: 具象ではなく抽象に依存

## コンポーネント化戦略
### 現状
- **単一コンポーネント**: アプリ全体が一つのコンポーネント

### 将来的なコンポーネント化案
```javascript
// クラスベースのコンポーネント
class Calculator {
    constructor() {
        this.priceInput = document.getElementById('price');
        this.countInput = document.getElementById('count');
        this.resultDisplay = document.getElementById('answer');
    }
}

// または関数ベースのコンポーネント
function createCalculator() {
    // 状態とロジックをカプセル化
}
```

## 状態管理
### 現状
- **DOMベース**: 状態をDOM要素に保存
- **グローバル状態なし**: 状態はローカル変数で管理
- **リアクティブでない**: 手動でのDOM更新

### 改善提案
```javascript
// シンプルな状態管理
const state = {
    price: 0,
    count: 0,
    organizerPrice: null,
    result: null
};

function updateState(key, value) {
    state[key] = value;
    render();
}
```

## データフロー
```
ユーザー入力 → イベント検知 → バリデーション → セキュリティチェック → 計算実行 → UI更新
     ↓              ↓            ↓            ↓              ↓           ↓
 DOM要素    イベントリスナー  isValidInput  escapeHTML   calculate  displayResult
```

## CSS編成パターン
### 現状（外部CSSファイル）
- **階層構造**: BEM未使用
- **命名規則**: ハイフン区切り（kebab-case）
- **モバイルファースト**: 320pxベース
- **CSSカスタムプロパティ**: 使用済み（--color-primary, --spacing-*等）

### 推奨される改善
```css
/* BEM記法 */
.calculator {}
.calculator__input {}
.calculator__input--focused {}
.calculator__result {}

/* CSSカスタムプロパティ */
:root {
    --primary-color: #667eea;
    --border-radius: 10px;
}
```

## テスト構成
### 現状
- **テストフレームワーク**: Vitest + jsdom
- **テストファイル**:
  - test/setup.js（テスト設定）
  - test/calculation.test.js（計算ロジックテスト）
  - test/validation.test.js（入力検証テスト）
  - tests/security.test.js（セキュリティテスト）
- **カバレッジ**: 95%以上目標

### 推奨テスト構成
```
tests/
├── unit/
│   ├── calculator.test.js
│   ├── validation.test.js
│   └── utils.test.js
├── integration/
│   └── calculator-ui.test.js
├── security/
│   └── security.test.js
└── e2e/
    └── user-flow.test.js
```

## ドキュメント構成
### 現状
- **README.md**: プロジェクト概要
- **コードコメント**: 最小限
- **ステアリングドキュメント**: .kiro/steering/ 配下

### 改善提案
```
docs/
├── api.md           # APIドキュメント
├── design.md        # 設計方針
├── development.md   # 開発ガイド
├── security.md      # セキュリティ考慮事項
└── deployment.md    # デプロイ手順
```

## Gitリポジトリ構成
- **ブランチ**: feature（開発中）
- **タグ**: なし
- **リモート**: origin
- **ワークフロー**: Feature Branch

## ビルド出力構成
### Viteビルド後
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].css
│   └── index-[hash].js
└── ...
```

## 環境構成
- **開発環境**: npm run dev
- **テスト環境**: npm test
- **本番環境**: npm run build
- **プレビュー**: npm run preview