# 割り勘アプリ - プロジェクト構造

## ルートディレクトリ構成
```
warikan-app/
├── index.html          # メインHTMLファイル（エントリーポイント）
├── main.js            # JavaScriptロジック（すべての機能を含む）
├── README.md          # プロジェクトドキュメント
├── .git/              # Gitリポジトリ
├── .gitignore         # Git無視ファイル（存在しないが推奨）
├── .claude/           # Claude Code設定
│   └── settings.local.json
└── .kiro/             # Kiro spec-driven開発設定
    └── steering/      # Steeringドキュメント
        ├── product.md # 製品概要
        ├── tech.md    # 技術スタック
        └── structure.md # プロジェクト構造
```

## サブディレクトリ構造
### 現状
- サブディレクトリなし（フラット構造）

### 推奨される改善案
```
warikan-app/
├── index.html
├── assets/            # 静的リソース
│   ├── css/
│   │   └── styles.css # CSSを分離
│   ├── js/
│   │   ├── main.js
│   │   └── utils.js   # ユーティリティ関数
│   └── audio/         # 音声ファイル（将来的）
├── tests/             # テストコード
├── docs/              # ドキュメント
└── examples/          # 使用例
```

## コード編成パターン
### 現在のアーキテクチャ
- **モノリシック**: 単一JSファイルにすべてのロジック
- **関数型プログラミング**: 純粋関数とイベントハンドラの分離
- **イベント駆動**: DOMイベント中心の設計

### 関数のカテゴリ分け
```javascript
// DOM要素定数
const priceInput = ...
const countInput = ...

// イベントハンドラ
calculateButton.addEventListener('click', calculateSplit);
priceInput.addEventListener('input', handleInputChange);

// コアビジネスロジック
function calculateSplit() { ... }
function performCalculation(price, count) { ... }

// ユーティリティ関数
function convertFullWidthToHalfWidth(str) { ... }
function isValidInput(price, count) { ... }

// UI関数
function displayResult(result) { ... }
function playSuccessSound() { ... }
```

## ファイル命名規則
### 現状
- **HTML**: `index.html`（スネークケース）
- **JavaScript**: `main.js`（スネークケース）
- **ドキュメント**: `README.md`（スネークケース）

### 一貫性
- ✅ 現在の命名規則は一貫している
- ✅ Web標準（小文字スネークケース）に準拠

## インポート/依存関係編成
### 現状
- **依存関係**: なし（ヴァニラJS）
- **モジュールシステム**: なし
- **読み込み順序**: HTMLでスクリプトをdefer読み込み

### 改善提案
```javascript
// ES6モジュール化
import { calculateSplit, validateInput } from './modules/calculator.js';
import { formatCurrency } from './utils/formatters.js';
import { playSound } from './utils/audio.js';
```

## 主要なアーキテクチャ原則
### 現状で適用されている原則
1. **関心の分離**: UI、ロジック、イベントハンドラを分離
2. **単一責任**: 各関数が単一の責務を担う
3. **DRY**: 共通処理を関数化
4. **KISS**: シンプルな実装を維持

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
    // 状態とロジックをカプル化
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
    result: null
};

function updateState(key, value) {
    state[key] = value;
    render();
}
```

## データフロー
```
ユーザー入力 → イベント検知 → バリデーション → 計算実行 → UI更新
     ↓              ↓            ↓           ↓          ↓
 DOM要素    イベントリスナー  isValidInput  calculate  displayResult
```

## CSS編成パターン
### 現状（インラインCSS）
- **階層構造**: BEM未使用
- **命名規則**: ハイフン区切り（kebab-case）
- **モバイルファースト**: 320pxベース

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
- **テストなし**: 手動テストのみ

### 推奨テスト構成
```
tests/
├── unit/
│   ├── calculator.test.js
│   └── utils.test.js
├── integration/
│   └── calculator-ui.test.js
└── e2e/
    └── user-flow.test.js
```

## ドキュメント構成
### 現状
- **README.md**: プロジェクト概要
- **コードコメント**: 最小限

### 改善提案
```
docs/
├── api.md           # APIドキュメント
├── design.md        # 設計方針
├── development.md   # 開発ガイド
└── deployment.md    # デプロイ手順
```