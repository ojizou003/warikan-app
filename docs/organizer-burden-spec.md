# 幹事負担パターン - 詳細技術仕様書

## 1. 機能概要

割り勘計算において、幹事が特別な負担をするパターンをサポートする機能です。以下の4つのパターンを実装します：

1. **幹事多め負担** - 幹事が指定額だけ多く支払う
2. **幹事少なめ負担** - 幹事が指定額だけ少なく支払う
3. **幹事固定負担** - 幹事の支払額を固定し、残りを均等割り
4. **参加者別指定** - 各参加者の支払額を個別指定（将来的な拡張）

## 2. 計算ロジック設計

### 2.1 計算タイプ定義

```javascript
enum CalculationType {
  EQUAL = 'equal',                    // 均等割り（既存）
  ORGANIZER_MORE = 'organizer_more',  // 幹事多め負担
  ORGANIZER_LESS = 'organizer_less',  // 幹事少なめ負担
  ORGANIZER_FIXED = 'organizer_fixed', // 幹事固定負担
  CUSTOM = 'custom'                   // カスタム割り勘
}

interface CalculationInput {
  totalAmount: number;        // 総額
  numberOfPeople: number;     // 人数
  type: CalculationType;       // 計算タイプ

  // タイプ別の追加パラメータ
  organizerBurden?: number;    // 幹事の追加/減額負担（ORGANIZER_MORE/LESS用）
  organizerFixed?: number;     // 幹事の固定負担額（ORGANIZER_FIXED用）
  customAllocations?: number[]; // 個別指定額（CUSTOM用）
}

interface CalculationResult {
  // 基本情報
  totalAmount: number;         // 総額
  numberOfPeople: number;      // 人数
  type: CalculationType;       // 計算タイプ
  perPerson: number;           // 参加者1人あたりの金額

  // 幹事関連
  organizerPayment: number;    // 幹事の支払額
  organizerBurden: number;     // 幹事の追加/減額負担

  // 参加者関連
  participantPayment: number;  // 参加者1人の支払額
  participantTotal: number;    // 参加者の支払額合計

  // 端数処理
  remainder: number;           // 最終的な端数
  remainderRecipient: string;  // 端数の受取人（'organizer' | 'participants'）

  // 検算用
  totalCheck: number;          // 支払額の合計（総額と一致すること）
}
```

### 2.2 各パターンの計算ロジック

#### パターン1: 幹事多め負担（ORGANIZER_MORE）

```javascript
/**
 * 幹事が指定額だけ多く支払うパターン
 *
 * 計算式：
 * 1. 参加者全員で均等割りした金額を計算
 * 2. 幹事の支払額 = 均等額 + 追加負担額
 * 3. 参加者の支払額 = 均等額（変化なし）
 * 4. 端数処理：元の計算と同じロジック
 */
function calculateOrganizerMore(total, people, burden) {
  // バリデーション
  if (burden >= total) {
    throw new Error('幹事の負担額が総額を超えています');
  }

  // 基本計算（均等割り）
  const baseCalculation = Math.floor(total / people);
  const baseRemainder = total % people;

  // 参加者の支払額
  const participantPayment = baseCalculation;

  // 幹事の支払額
  const organizerPayment = baseCalculation + burden;

  // 参加者の合計支払額
  const participantTotal = participantPayment * (people - 1);

  // 総支払額
  const totalPayment = organizerPayment + participantTotal;

  // 端数調整（元の総額との差額）
  const difference = total - totalPayment;

  return {
    totalAmount: total,
    numberOfPeople: people,
    type: CalculationType.ORGANIZER_MORE,
    perPerson: participantPayment,
    organizerPayment: organizerPayment,
    organizerBurden: burden,
    participantPayment: participantPayment,
    participantTotal: participantTotal,
    remainder: Math.abs(difference),
    remainderRecipient: difference > 0 ? 'organizer' : 'participants',
    totalCheck: totalPayment + difference
  };
}

// 具体例
// 総額: 10,000円、人数: 4人、幹事負担: +1,000円
// 1. 均等割り: 10,000 ÷ 4 = 2,500円
// 2. 幹事: 2,500 + 1,000 = 3,500円
// 3. 参加者: 2,500円 × 3人 = 7,500円
// 4. 合計: 3,500 + 7,500 = 11,000円 → 調整が必要
// 5. 実際: 参加者を 2,333円に調整 → 3,500 + 6,999 = 10,499円（端数1円）
```

#### パターン2: 幹事少なめ負担（ORGANIZER_LESS）

```javascript
/**
 * 幹事が指定額だけ少なく支払うパターン
 *
 * 計算式：
 * 1. 参加者で均等割りするべき金額を計算
 * 2. 幹事の支払額 = 均等額 - 減額
 * 3. 参加者の支払額 = (総額 - 幹事の支払額) ÷ (人数 - 1)
 */
function calculateOrganizerLess(total, people, reduction) {
  // バリデーション
  const basePerPerson = Math.floor(total / people);
  if (reduction >= basePerPerson) {
    throw new Error('幹事の減額が大きすぎます');
  }

  // 幹事の支払額
  const organizerPayment = basePerPerson - reduction;

  // 参加者で割るべき金額
  const amountForParticipants = total - organizerPayment;
  const participantCount = people - 1;

  // 参加者の支払額（均等割り）
  const participantPayment = Math.floor(amountForParticipants / participantCount);
  const participantRemainder = amountForParticipants % participantCount;

  // 参加者の合計支払額
  const participantTotal = participantPayment * participantCount;

  // 総支払額
  const totalPayment = organizerPayment + participantTotal;

  return {
    totalAmount: total,
    numberOfPeople: people,
    type: CalculationType.ORGANIZER_LESS,
    perPerson: participantPayment,
    organizerPayment: organizerPayment,
    organizerBurden: -reduction,  // 負の値で減額を表現
    participantPayment: participantPayment,
    participantTotal: participantTotal,
    remainder: participantRemainder,
    remainderRecipient: 'participants',
    totalCheck: totalPayment
  };
}

// 具体例
// 総額: 10,000円、人数: 4人、幹事減額: 500円
// 1. 基本均等額: 10,000 ÷ 4 = 2,500円
// 2. 幹事: 2,500 - 500 = 2,000円
// 3. 参加者で割る額: 10,000 - 2,000 = 8,000円
// 4. 参加者1人: 8,000 ÷ 3 = 2,666円
// 5. 参加者合計: 2,666 × 3 = 7,998円
// 6. 端数: 8,000 - 7,998 = 2円
```

#### パターン3: 幹事固定負担（ORGANIZER_FIXED）

```javascript
/**
 * 幹事の支払額を固定するパターン
 *
 * 計算式：
 * 1. 幹事の支払額を固定
 * 2. 残りを参加者で均等割り
 */
function calculateOrganizerFixed(total, people, fixedAmount) {
  // バリデーション
  if (fixedAmount >= total) {
    throw new Error('幹事の固定額が総額を超えています');
  }

  const participantCount = people - 1;

  // 幹事の支払額（固定）
  const organizerPayment = fixedAmount;

  // 参加者で割る金額
  const amountForParticipants = total - fixedAmount;

  // 参加者の支払額
  const participantPayment = Math.floor(amountForParticipants / participantCount);
  const participantRemainder = amountForParticipants % participantCount;

  // 参加者の合計支払額
  const participantTotal = participantPayment * participantCount;

  // 総支払額
  const totalPayment = organizerPayment + participantTotal;

  return {
    totalAmount: total,
    numberOfPeople: people,
    type: CalculationType.ORGANIZER_FIXED,
    perPerson: participantPayment,
    organizerPayment: organizerPayment,
    organizerBurden: organizerPayment - Math.floor(total / people),
    participantPayment: participantPayment,
    participantTotal: participantTotal,
    remainder: participantRemainder,
    remainderRecipient: 'participants',
    totalCheck: totalPayment
  };
}

// 具体例
// 総額: 10,000円、人数: 4人、幹事固定: 3,000円
// 1. 幹事: 3,000円（固定）
// 2. 参加者で割る額: 10,000 - 3,000 = 7,000円
// 3. 参加者1人: 7,000 ÷ 3 = 2,333円
// 4. 参加者合計: 2,333 × 3 = 6,999円
// 5. 端数: 7,000 - 6,999 = 1円
```

### 2.3 統合計算関数

```javascript
/**
 * 統合計算関数
 * @param {CalculationInput} input - 計算入力
 * @returns {CalculationResult} - 計算結果
 */
function performCalculation(input) {
  const { totalAmount, numberOfPeople, type, ...params } = input;

  // 基本バリデーション
  validateBasicInput(totalAmount, numberOfPeople);

  switch (type) {
    case CalculationType.EQUAL:
      return calculateEqual(totalAmount, numberOfPeople);

    case CalculationType.ORGANIZER_MORE:
      validateOrganizerMoreInput(totalAmount, numberOfPeople, params.organizerBurden);
      return calculateOrganizerMore(totalAmount, numberOfPeople, params.organizerBurden);

    case CalculationType.ORGANIZER_LESS:
      validateOrganizerLessInput(totalAmount, numberOfPeople, params.organizerBurden);
      return calculateOrganizerLess(totalAmount, numberOfPeople, params.organizerBurden);

    case CalculationType.ORGANIZER_FIXED:
      validateOrganizerFixedInput(totalAmount, numberOfPeople, params.organizerFixed);
      return calculateOrganizerFixed(totalAmount, numberOfPeople, params.organizerFixed);

    case CalculationType.CUSTOM:
      // 将来的な拡張用
      throw new Error('カスタム割り勘は未実装です');

    default:
      throw new Error('無効な計算タイプです');
  }
}

/**
 * 既存の均等割り計算（後方互換性）
 */
function calculateEqual(total, people) {
  const perPerson = Math.floor(total / people);
  const remainder = total % people;

  return {
    totalAmount: total,
    numberOfPeople: people,
    type: CalculationType.EQUAL,
    perPerson: perPerson,
    organizerPayment: perPerson,
    organizerBurden: 0,
    participantPayment: perPerson,
    participantTotal: perPerson * people,
    remainder: remainder,
    remainderRecipient: 'organizer',
    totalCheck: total
  };
}

// バリデーション関数
function validateBasicInput(total, people) {
  if (total <= 0) {
    throw new Error('総額は1円以上でなければなりません');
  }
  if (people < 2) {
    throw new Error('人数は2人以上でなければなりません');
  }
}

function validateOrganizerMoreInput(total, people, burden) {
  if (burden === undefined || burden <= 0) {
    throw new Error('幹事の追加負担額を指定してください');
  }
  if (burden >= total) {
    throw new Error('幹事の負担額が総額を超えています');
  }
  const basePerPerson = Math.floor(total / people);
  if (burden > basePerPeople * 2) {
    throw new Error('幹事の負担額が大きすぎます');
  }
}

function validateOrganizerLessInput(total, people, reduction) {
  if (reduction === undefined || reduction <= 0) {
    throw new Error('幹事の減額を指定してください');
  }
  const basePerPerson = Math.floor(total / people);
  if (reduction >= basePerPerson) {
    throw new Error('幹事の減額が大きすぎます');
  }
}

function validateOrganizerFixedInput(total, people, fixedAmount) {
  if (fixedAmount === undefined || fixedAmount <= 0) {
    throw new Error('幹事の固定額を指定してください');
  }
  if (fixedAmount >= total) {
    throw new Error('幹事の固定額が総額を超えています');
  }
  const minPerParticipant = Math.floor((total - fixedAmount) / (people - 1));
  if (minPerParticipant <= 0) {
    throw new Error('参加者の支払額が0円以下になります');
  }
}
```

## 3. UI設計

### 3.1 計算タイプ選択UI

```html
<!-- 計算タイプ選択セクション -->
<div class="calculation-type-section">
  <h3>計算方法を選択</h3>

  <div class="type-options">
    <label class="type-option">
      <input type="radio" name="calculationType" value="equal" checked>
      <div class="option-content">
        <span class="option-title">均等割り</span>
        <span class="option-desc">全員で均等に割り勘</span>
      </div>
    </label>

    <label class="type-option">
      <input type="radio" name="calculationType" value="organizer_more">
      <div class="option-content">
        <span class="option-title">幹事多め負担</span>
        <span class="option-desc">幹事が指定額だけ多く支払う</span>
      </div>
    </label>

    <label class="type-option">
      <input type="radio" name="calculationType" value="organizer_less">
      <div class="option-content">
        <span class="option-title">幹事少なめ負担</span>
        <span class="option-desc">幹事が指定額だけ少なく支払う</span>
      </div>
    </label>

    <label class="type-option">
      <input type="radio" name="calculationType" value="organizer_fixed">
      <div class="option-content">
        <span class="option-title">幹事固定負担</span>
        <span class="option-desc">幹事の支払額を固定</span>
      </div>
    </label>
  </div>
</div>

<!-- 幹事負担設定（動的に表示/非表示） -->
<div class="organizer-settings" id="organizerMoreSettings" style="display: none;">
  <label for="organizerBurden">幹事の追加負担額</label>
  <div class="input-with-help">
    <input type="number" id="organizerBurden" min="1" max="10000" step="100">
    <span class="input-help">例: 1000円多く支払う</span>
  </div>
</div>

<div class="organizer-settings" id="organizerLessSettings" style="display: none;">
  <label for="organizerReduction">幹事の減額</label>
  <div class="input-with-help">
    <input type="number" id="organizerReduction" min="1" max="10000" step="100">
    <span class="input-help">例: 500円少なく支払う</span>
  </div>
</div>

<div class="organizer-settings" id="organizerFixedSettings" style="display: none;">
  <label for="organizerFixed">幹事の支払額</label>
  <div class="input-with-help">
    <input type="number" id="organizerFixed" min="1" max="100000" step="100">
    <span class="input-help">幹事が支払う固定額</span>
  </div>
</div>
```

### 3.2 結果表示UIの拡張

```html
<!-- 計算結果表示（拡張版） -->
<div class="result-container" id="resultContainer">
  <div class="result-header">
    <span class="result-type-label" id="resultTypeLabel">均等割り</span>
    <button class="btn-copy-result" id="copyResult">
      <i class="icon-copy"></i> 結果をコピー
    </button>
  </div>

  <div class="result-summary" id="resultSummary">
    <div class="total-amount">
      <span class="label">総額</span>
      <span class="value" id="resultTotal">¥5,000</span>
    </div>

    <div class="division-result">
      <div class="participant-result" id="participantResult">
        <span class="label">参加者</span>
        <span class="amount" id="participantAmount">¥1,000</span>
        <span class="count" id="participantCount">× 4人</span>
      </div>

      <div class="organizer-result" id="organizerResult" style="display: none;">
        <span class="label">幹事</span>
        <span class="amount" id="organizerAmount">¥1,500</span>
        <span class="burden" id="organizerBurdenLabel">(+500円)</span>
      </div>
    </div>
  </div>

  <div class="result-details" id="resultDetails">
    <div class="detail-row">
      <span>端数</span>
      <span id="remainderAmount">¥0</span>
    </div>

    <div class="detail-row total-check">
      <span>合計</span>
      <span id="totalCheck">¥5,000</span>
    </div>

    <div class="calculation-breakdown" id="calculationBreakdown">
      <!-- 計算の内訳を表示 -->
    </div>
  </div>
</div>
```

### 3.3 JavaScript実装

```javascript
/**
 * 幹事負担パターンのUI制御
 */
class OrganizerBurdenUI {
  constructor() {
    this.currentType = CalculationType.EQUAL;
    this.init();
  }

  init() {
    this.bindTypeSelection();
    this.bindOrganizerSettings();
    this.bindCalculation();
    this.updateVisibility();
  }

  bindTypeSelection() {
    const typeInputs = document.querySelectorAll('input[name="calculationType"]');

    typeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.currentType = e.target.value;
        this.updateVisibility();
        this.validateInputs();
        this.autoCalculate();
      });
    });
  }

  bindOrganizerSettings() {
    // 幹事多め負担
    const burdenInput = document.getElementById('organizerBurden');
    burdenInput?.addEventListener('input', () => {
      this.validateOrganizerBurden();
      this.autoCalculate();
    });

    // 幹事少なめ負担
    const reductionInput = document.getElementById('organizerReduction');
    reductionInput?.addEventListener('input', () => {
      this.validateOrganizerReduction();
      this.autoCalculate();
    });

    // 幹事固定負担
    const fixedInput = document.getElementById('organizerFixed');
    fixedInput?.addEventListener('input', () => {
      this.validateOrganizerFixed();
      this.autoCalculate();
    });
  }

  updateVisibility() {
    // すべての設定パネルを非表示
    const allSettings = document.querySelectorAll('.organizer-settings');
    allSettings.forEach(panel => {
      panel.style.display = 'none';
    });

    // 該当する設定パネルを表示
    const targetPanel = document.getElementById(`${this.currentType}Settings`);
    if (targetPanel && this.currentType !== CalculationType.EQUAL) {
      targetPanel.style.display = 'block';
    }

    // 結果表示エリアの幹事部分
    const organizerResult = document.getElementById('organizerResult');
    if (organizerResult) {
      organizerResult.style.display =
        this.currentType === CalculationType.EQUAL ? 'none' : 'flex';
    }
  }

  validateInputs() {
    const total = this.getTotalAmount();
    const people = this.getNumberOfPeople();

    switch (this.currentType) {
      case CalculationType.ORGANIZER_MORE:
        this.validateOrganizerBurden();
        break;
      case CalculationType.ORGANIZER_LESS:
        this.validateOrganizerReduction();
        break;
      case CalculationType.ORGANIZER_FIXED:
        this.validateOrganizerFixed();
        break;
    }
  }

  validateOrganizerBurden() {
    const input = document.getElementById('organizerBurden');
    const total = this.getTotalAmount();
    const people = this.getNumberOfPeople();
    const value = parseInt(input.value) || 0;

    // バリデーション
    if (value <= 0) {
      this.showInputError(input, '1円以上で入力してください');
      return false;
    }

    if (value >= total) {
      this.showInputError(input, '総額より少ない額にしてください');
      return false;
    }

    const basePerPerson = Math.floor(total / people);
    if (value > basePerPerson * 2) {
      this.showInputError(input, '幹事の負担が大きすぎます');
      return false;
    }

    this.clearInputError(input);
    return true;
  }

  validateOrganizerReduction() {
    const input = document.getElementById('organizerReduction');
    const total = this.getTotalAmount();
    const value = parseInt(input.value) || 0;

    if (value <= 0) {
      this.showInputError(input, '1円以上で入力してください');
      return false;
    }

    const basePerPerson = Math.floor(total / this.getNumberOfPeople());
    if (value >= basePerPerson) {
      this.showInputError(input, '均等額より少なくしてください');
      return false;
    }

    this.clearInputError(input);
    return true;
  }

  validateOrganizerFixed() {
    const input = document.getElementById('organizerFixed');
    const total = this.getTotalAmount();
    const people = this.getNumberOfPeople();
    const value = parseInt(input.value) || 0;

    if (value <= 0) {
      this.showInputError(input, '1円以上で入力してください');
      return false;
    }

    if (value >= total) {
      this.showInputError(input, '総額より少ない額にしてください');
      return false;
    }

    const minPerParticipant = Math.floor((total - value) / (people - 1));
    if (minPerParticipant <= 0) {
      this.showInputError(input, '参加者の支払額が0円以下になります');
      return false;
    }

    this.clearInputError(input);
    return true;
  }

  async autoCalculate() {
    // 入力値の取得
    const total = this.getTotalAmount();
    const people = this.getNumberOfPeople();

    if (!total || !people || people < 2) {
      return;
    }

    // 幹事負担パラメータの取得
    let organizerParams = {};
    switch (this.currentType) {
      case CalculationType.ORGANIZER_MORE:
        const burden = parseInt(document.getElementById('organizerBurden').value) || 0;
        if (burden > 0) {
          organizerParams.organizerBurden = burden;
        }
        break;

      case CalculationType.ORGANIZER_LESS:
        const reduction = parseInt(document.getElementById('organizerReduction').value) || 0;
        if (reduction > 0) {
          organizerParams.organizerBurden = -reduction;
        }
        break;

      case CalculationType.ORGANIZER_FIXED:
        const fixed = parseInt(document.getElementById('organizerFixed').value) || 0;
        if (fixed > 0) {
          organizerParams.organizerFixed = fixed;
        }
        break;
    }

    // 計算実行
    try {
      const input = {
        totalAmount: total,
        numberOfPeople: people,
        type: this.currentType,
        ...organizerParams
      };

      const result = performCalculation(input);
      this.displayResult(result);

    } catch (error) {
      this.displayError(error.message);
    }
  }

  displayResult(result) {
    // タイプラベル更新
    const typeLabel = document.getElementById('resultTypeLabel');
    typeLabel.textContent = this.getTypeLabel(result.type);

    // 総額表示
    document.getElementById('resultTotal').textContent = `¥${this.formatNumber(result.totalAmount)}`;

    // 参加者情報
    const participantAmount = document.getElementById('participantAmount');
    const participantCount = document.getElementById('participantCount');

    if (result.type === CalculationType.EQUAL) {
      participantAmount.textContent = `¥${this.formatNumber(result.perPerson)}`;
      participantCount.textContent = `× ${result.numberOfPeople}人`;
    } else {
      participantAmount.textContent = `¥${this.formatNumber(result.participantPayment)}`;
      participantCount.textContent = `× ${result.numberOfPeople - 1}人`;
    }

    // 幹事情報
    if (result.type !== CalculationType.EQUAL) {
      const organizerAmount = document.getElementById('organizerAmount');
      const organizerBurdenLabel = document.getElementById('organizerBurdenLabel');

      organizerAmount.textContent = `¥${this.formatNumber(result.organizerPayment)}`;

      if (result.organizerBurden > 0) {
        organizerBurdenLabel.textContent = `(+¥${this.formatNumber(result.organizerBurden)})`;
        organizerBurdenLabel.className = 'burden positive';
      } else if (result.organizerBurden < 0) {
        organizerBurdenLabel.textContent = `(¥${this.formatNumber(result.organizerBurden)})`;
        organizerBurdenLabel.className = 'burden negative';
      }
    }

    // 端数表示
    document.getElementById('remainderAmount').textContent =
      result.remainder > 0 ? `¥${this.formatNumber(result.remainder)}` : 'なし';

    // 合計検算
    document.getElementById('totalCheck').textContent = `¥${this.formatNumber(result.totalCheck)}`;

    // 計算内訳表示
    this.displayCalculationBreakdown(result);

    // 結果コンテナを表示
    document.getElementById('resultContainer').style.display = 'block';
    document.getElementById('resultContainer').className = 'result-container show';
  }

  displayCalculationBreakdown(result) {
    const breakdown = document.getElementById('calculationBreakdown');

    let html = '<div class="breakdown-title">計算内訳</div>';

    switch (result.type) {
      case CalculationType.ORGANIZER_MORE:
        html += `
          <div class="breakdown-item">
            <span>基本均等額</span>
            <span>¥${this.formatNumber(Math.floor(result.totalAmount / result.numberOfPeople))}</span>
          </div>
          <div class="breakdown-item highlight">
            <span>幹事の追加負担</span>
            <span>+¥${this.formatNumber(result.organizerBurden)}</span>
          </div>
          <div class="breakdown-item">
            <span>参加者支払額</span>
            <span>¥${this.formatNumber(result.participantPayment)} × ${result.numberOfPeople - 1}人</span>
          </div>
        `;
        break;

      case CalculationType.ORGANIZER_LESS:
        html += `
          <div class="breakdown-item">
            <span>基本均等額</span>
            <span>¥${this.formatNumber(Math.floor(result.totalAmount / result.numberOfPeople))}</span>
          </div>
          <div class="breakdown-item highlight">
            <span>幹事の減額</span>
            <span>-¥${this.formatNumber(Math.abs(result.organizerBurden))}</span>
          </div>
          <div class="breakdown-item">
            <span>参加者支払額</span>
            <span>¥${this.formatNumber(result.participantPayment)} × ${result.numberOfPeople - 1}人</span>
          </div>
        `;
        break;

      case CalculationType.ORGANIZER_FIXED:
        html += `
          <div class="breakdown-item highlight">
            <span>幹事の固定額</span>
            <span>¥${this.formatNumber(result.organizerPayment)}</span>
          </div>
          <div class="breakdown-item">
            <span>参加者で割る額</span>
            <span>¥${this.formatNumber(result.totalAmount - result.organizerPayment)}</span>
          </div>
          <div class="breakdown-item">
            <span>参加者支払額</span>
            <span>¥${this.formatNumber(result.participantPayment)} × ${result.numberOfPeople - 1}人</span>
          </div>
        `;
        break;

      default:
        html = '';
    }

    breakdown.innerHTML = html;
  }

  // ユーティリティメソッド
  getTypeLabel(type) {
    const labels = {
      equal: '均等割り',
      organizer_more: '幹事多め負担',
      organizer_less: '幹事少なめ負担',
      organizer_fixed: '幹事固定負担',
      custom: 'カスタム'
    };
    return labels[type] || type;
  }

  formatNumber(num) {
    return num.toLocaleString('ja-JP');
  }

  getTotalAmount() {
    return parseInt(document.getElementById('price').value) || 0;
  }

  getNumberOfPeople() {
    return parseInt(document.getElementById('count').value) || 0;
  }

  showInputError(input, message) {
    input.classList.add('error');

    let errorElement = input.parentNode.querySelector('.error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      input.parentNode.appendChild(errorElement);
    }

    errorElement.textContent = message;
  }

  clearInputError(input) {
    input.classList.remove('error');
    const errorElement = input.parentNode.querySelector('.error-message');
    if (errorElement) {
      errorElement.remove();
    }
  }

  displayError(message) {
    const answerElement = document.getElementById('answer');
    answerElement.innerHTML = `<div class="error-message">${message}</div>`;
    answerElement.className = 'error';
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  new OrganizerBurdenUI();
});
```

## 4. CSSスタイル

```css
/* 幹事負担パターン専用スタイル */
.calculation-type-section {
  background: var(--color-gray-light);
  padding: 20px;
  border-radius: var(--radius-lg);
  margin: 20px 0;
}

.type-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.type-option {
  display: flex;
  align-items: center;
  padding: 15px;
  background: var(--color-white);
  border: 2px solid var(--color-gray-medium);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.type-option:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-light);
}

.type-option input[type="radio"] {
  margin-right: 12px;
}

.type-option input[type="radio"]:checked + .option-content {
  color: var(--color-primary);
}

.option-content {
  display: flex;
  flex-direction: column;
}

.option-title {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-md);
  margin-bottom: 4px;
}

.option-desc {
  font-size: var(--font-size-sm);
  color: var(--color-gray-dark);
}

.organizer-settings {
  background: var(--color-white);
  padding: 20px;
  border-radius: var(--radius-md);
  margin-top: 15px;
  border: 1px solid var(--color-gray-medium);
}

.input-with-help {
  margin-top: 10px;
}

.input-with-help input {
  width: 100%;
  max-width: 300px;
  padding: 12px;
  font-size: var(--font-size-lg);
  border: 2px solid var(--color-gray-medium);
  border-radius: var(--radius-md);
}

.input-help {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-gray);
  margin-top: 5px;
}

/* 結果表示の拡張 */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.result-type-label {
  display: inline-block;
  padding: 5px 15px;
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.btn-copy-result {
  padding: 8px 16px;
  background: var(--color-gray-light);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-copy-result:hover {
  background: var(--color-gray-medium);
}

.division-result {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 20px 0;
}

.participant-result,
.organizer-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: var(--color-white);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-medium);
}

.participant-result .amount,
.organizer-result .amount {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin: 5px 0;
}

.organizer-result .amount {
  color: var(--color-success);
}

.burden {
  font-size: var(--font-size-sm);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.burden.positive {
  background: #dcfce7;
  color: #166534;
}

.burden.negative {
  background: #fee2e2;
  color: #991b1b;
}

.calculation-breakdown {
  margin-top: 20px;
  padding: 15px;
  background: var(--color-gray-light);
  border-radius: var(--radius-md);
}

.breakdown-title {
  font-weight: var(--font-weight-medium);
  margin-bottom: 10px;
  color: var(--color-gray-darker);
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-gray-medium);
}

.breakdown-item:last-child {
  border-bottom: none;
}

.breakdown-item.highlight {
  background: #fef3c7;
  padding: 8px 12px;
  margin: 5px -12px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
}

/* エラー表示 */
.error-message {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-top: 5px;
}

input.error {
  border-color: var(--color-error) !important;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1) !important;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .type-options {
    grid-template-columns: 1fr;
  }

  .division-result {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .result-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .btn-copy-result {
    width: 100%;
  }
}
```

## 5. テスト仕様

### 5.1 単体テスト

```javascript
// test/organizer-burden.test.js
import { describe, it, expect } from 'vitest';
import {
  performCalculation,
  calculateOrganizerMore,
  calculateOrganizerLess,
  calculateOrganizerFixed
} from '../src/calculation.js';

describe('幹事負担パターンの計算', () => {
  describe('calculateOrganizerMore', () => {
    it('基本的な幹事多め負担計算', () => {
      const result = calculateOrganizerMore(10000, 4, 1000);

      expect(result.type).toBe('organizer_more');
      expect(result.totalAmount).toBe(10000);
      expect(result.numberOfPeople).toBe(4);
      expect(result.organizerPayment).toBe(3500);
      expect(result.participantPayment).toBe(2166);
      expect(result.organizerBurden).toBe(1000);
      expect(result.totalCheck).toBe(10098); // 端数調整後
    });

    it('境界値テスト', () => {
      // 最小の追加負担
      let result = calculateOrganizerMore(1000, 2, 1);
      expect(result.organizerPayment).toBe(501);
      expect(result.participantPayment).toBe(499);

      // 大きな追加負担
      result = calculateOrganizerMore(100000, 10, 10000);
      expect(result.organizerBurden).toBe(10000);
    });

    it('エラーケース', () => {
      // 負担額が総額を超える
      expect(() => calculateOrganizerMore(5000, 3, 5000))
        .toThrow('幹事の負担額が総額を超えています');

      // 負担額が0
      expect(() => calculateOrganizerMore(5000, 3, 0))
        .toThrow();
    });
  });

  describe('calculateOrganizerLess', () => {
    it('基本的な幹事少なめ負担計算', () => {
      const result = calculateOrganizerLess(10000, 4, 500);

      expect(result.type).toBe('organizer_less');
      expect(result.organizerPayment).toBe(2000);
      expect(result.participantPayment).toBe(2666);
      expect(result.organizerBurden).toBe(-500);
      expect(result.remainder).toBe(2);
    });

    it('最小人数での計算', () => {
      const result = calculateOrganizerLess(1000, 2, 100);

      expect(result.organizerPayment).toBe(400);
      expect(result.participantPayment).toBe(600);
      expect(result.totalCheck).toBe(1000);
    });
  });

  describe('calculateOrganizerFixed', () => {
    it('基本的な幹事固定負担計算', () => {
      const result = calculateOrganizerFixed(10000, 4, 3000);

      expect(result.type).toBe('organizer_fixed');
      expect(result.organizerPayment).toBe(3000);
      expect(result.participantPayment).toBe(2333);
      expect(result.remainder).toBe(1);
    });

    it('参加者の支払額が均等になる場合', () => {
      const result = calculateOrganizerFixed(10000, 5, 2000);

      expect(result.organizerPayment).toBe(2000);
      expect(result.participantPayment).toBe(2000);
      expect(result.remainder).toBe(0);
    });
  });

  describe('performCalculation', () => {
    it('すべての計算タイプを正しく処理', () => {
      // 均等割り
      let result = performCalculation({
        totalAmount: 5000,
        numberOfPeople: 5,
        type: 'equal'
      });
      expect(result.type).toBe('equal');
      expect(result.perPerson).toBe(1000);

      // 幹事多め
      result = performCalculation({
        totalAmount: 5000,
        numberOfPeople: 5,
        type: 'organizer_more',
        organizerBurden: 500
      });
      expect(result.type).toBe('organizer_more');
      expect(result.organizerBurden).toBe(500);

      // 幹事少なめ
      result = performCalculation({
        totalAmount: 5000,
        numberOfPeople: 5,
        type: 'organizer_less',
        organizerBurden: -200
      });
      expect(result.type).toBe('organizer_less');
      expect(result.organizerBurden).toBe(-200);

      // 幹事固定
      result = performCalculation({
        totalAmount: 5000,
        numberOfPeople: 5,
        type: 'organizer_fixed',
        organizerFixed: 1500
      });
      expect(result.type).toBe('organizer_fixed');
      expect(result.organizerPayment).toBe(1500);
    });
  });
});
```

## 6. 実装手順

1. **計算エンジン拡張**（2日）
   - 新しい計算タイプのロジック実装
   - 既存コードとの互換性確保
   - バリデーション機能追加

2. **UIコンポーネント実装**（2日）
   - 計算タイプ選択UI
   - 動的な設定パネル
   - リアルタイム計算更新

3. **結果表示拡張**（1日）
   - 幹事負担の表示
   - 計算内訳の表示
   - コピー機能の拡張

4. **スタイリング実装**（1日）
   - 新しいUIコンポーネントのスタイル
   - レスポンシブ対応
   - アニメーション効果

5. **テストとデバッグ**（2日）
   - 単体テスト作成
   - 統合テスト
   - エッジケースのテスト

---

## 7. 注意事項

1. **数値精度**
   - すべての計算で整数を使用
   - 端数処理のルールを明確に定義
   - 浮動小数点数の誤差を避ける

2. **ユーザビリティ**
   - 計算タイプの変更時に自動で再計算
   - エラー入力の即時フィードバック
   - 計算結果の分かりやすい表示

3. **パフォーマンス**
   - リアルタイム計算の遅延を最小化
   - 不要な再計算を避ける
   - 効率的なバリデーション実装

4. **拡張性**
   - 将来的なカスタム割り勘に備えた設計
   - 新しい計算パターンを追加しやすい構造
   - 設定の保存・読み込み機能