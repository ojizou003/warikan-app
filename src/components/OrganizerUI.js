/**
 * 幹事負担UIコンポーネント
 *
 * @description
 * 幹事負担パターンのユーザーインターフェースを提供します。
 * パターン選択、入力フォーム、リアルタイム計算を実装。
 *
 * @module OrganizerUI
 * @version 1.0.0
 */

import { CalculationEngine, CalculationType } from '../calculation.js';

/**
 * 幹事負担UIクラス
 *
 * @class
 * @classdesc
 * 幹事負担パターンのUIコンポーネントを管理するクラス。
 */
class OrganizerUI {
    /**
     * コンストラクタ
     *
     * @description
     * 幹事負担UIを初期化します。
     *
     * @param {HTMLElement} container - コンテナ要素
     * @param {Object} [options={}] - オプション
     * @param {Function} [options.onCalculate] - 計算実行時のコールバック
     * @param {Object} [options.defaultValues] - デフォルト値
     */
    constructor(container, options = {}) {
        /** @type {HTMLElement} コンテナ要素 */
        this.container = container;

        /** @type {Object} オプション */
        this.options = {
            onCalculate: null,
            defaultValues: {
                totalAmount: 3000,
                numberOfPeople: 3,
                organizerBurden: 20,
                organizerFixed: 1000
            },
            ...options
        };

        /** @type {CalculationEngine} 計算エンジン */
        this.calculationEngine = new CalculationEngine();

        /** @type {string} 現在の計算タイプ */
        this.currentType = CalculationType.EQUAL;

        /** @type {HTMLElement} パターン選択コンテナ */
        this.patternContainer = null;

        /** @type {HTMLElement} 入力コンテナ */
        this.inputContainer = null;

        /** @type {HTMLElement} 結果表示コンテナ */
        this.resultContainer = null;

        /** @type {HTMLElement} 履歴ボタンコンテナ */
        this.historyButtonContainer = null;

        // 初期化
        this.init();
    }

    /**
     * 初期化
     *
     * @description
     * UIコンポーネントを初期化します。
     *
     * @returns {void}
     */
    init() {
        this.createUI();
        this.bindEvents();
        this.setupValidation();

        // デフォルト値を設定
        this.setDefaultValues();
    }

    /**
     * UIを作成
     *
     * @description
     * UIコンポーネントを構築します。
     *
     * @returns {void}
     */
    createUI() {
        this.container.innerHTML = `
            <div class="organizer-ui" data-component="organizer-ui">
                <!-- パターン選択 -->
                <div class="pattern-selection" data-element="pattern-selection">
                    <h2 style="margin: 0 0 16px 0; font-size: 1.3rem; color: #333;">割り勘パターンを選択</h2>
                    <div class="pattern-buttons" data-element="pattern-buttons" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 12px;
                        margin-bottom: 24px;
                    ">
                        <button class="pattern-button active" data-pattern="equal" style="
                            padding: 16px;
                            border: 2px solid #667eea;
                            border-radius: 8px;
                            background: #667eea;
                            color: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            font-size: 1rem;
                            font-weight: 500;
                        ">
                            <div style="font-size: 1.5rem; margin-bottom: 4px;">👥</div>
                            <div>均等割り</div>
                            <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 4px;">全員で均等に</div>
                        </button>

                        <button class="pattern-button" data-pattern="organizer_more" style="
                            padding: 16px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            color: #333;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            font-size: 1rem;
                            font-weight: 500;
                        ">
                            <div style="font-size: 1.5rem; margin-bottom: 4px;">💰</div>
                            <div>幹事多め</div>
                            <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 4px;">幹事が多く負担</div>
                        </button>

                        <button class="pattern-button" data-pattern="organizer_less" style="
                            padding: 16px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            color: #333;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            font-size: 1rem;
                            font-weight: 500;
                        ">
                            <div style="font-size: 1.5rem; margin-bottom: 4px;">🎁</div>
                            <div>幹事少なめ</div>
                            <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 4px;">幹事が少なく負担</div>
                        </button>

                        <button class="pattern-button" data-pattern="organizer_fixed" style="
                            padding: 16px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            color: #333;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            font-size: 1rem;
                            font-weight: 500;
                        ">
                            <div style="font-size: 1.5rem; margin-bottom: 4px;">💵</div>
                            <div>幹事固定</div>
                            <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 4px;">幹事の額を固定</div>
                        </button>
                    </div>
                </div>

                <!-- 基本入力 -->
                <div class="basic-inputs" data-element="basic-inputs" style="
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                ">
                    <div class="input-group" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 16px;
                    ">
                        <div class="input-wrapper">
                            <label for="total-amount" style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 500;
                                color: #333;
                            ">総額（円）</label>
                            <div class="price-wrapper" style="position: relative;">
                                <input type="number" id="total-amount" data-input="total-amount" style="
                                    width: 100%;
                                    padding: 12px 40px 12px 12px;
                                    border: 2px solid #ddd;
                                    border-radius: 6px;
                                    font-size: 1.1rem;
                                    transition: border-color 0.2s ease;
                                " placeholder="0" min="1" max="10000000000">
                                <span style="
                                    position: absolute;
                                    right: 12px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #666;
                                    font-weight: 500;
                                ">円</span>
                            </div>
                            <div class="input-error" data-error="total-amount" style="
                                color: #e74c3c;
                                font-size: 0.9rem;
                                margin-top: 4px;
                                display: none;
                            "></div>
                        </div>

                        <div class="input-wrapper">
                            <label for="number-of-people" style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 500;
                                color: #333;
                            ">人数</label>
                            <div class="count-wrapper" style="position: relative;">
                                <input type="number" id="number-of-people" data-input="number-of-people" style="
                                    width: 100%;
                                    padding: 12px 40px 12px 12px;
                                    border: 2px solid #ddd;
                                    border-radius: 6px;
                                    font-size: 1.1rem;
                                    transition: border-color 0.2s ease;
                                " placeholder="0" min="1" max="9999">
                                <span style="
                                    position: absolute;
                                    right: 12px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #666;
                                    font-weight: 500;
                                ">人</span>
                            </div>
                            <div class="input-error" data-error="number-of-people" style="
                                color: #e74c3c;
                                font-size: 0.9rem;
                                margin-top: 4px;
                                display: none;
                            "></div>
                        </div>
                    </div>
                </div>

                <!-- 幹事負担入力 -->
                <div class="organizer-inputs" data-element="organizer-inputs" style="
                    background: #f0f4ff;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    display: none;
                ">
                    <h3 style="margin: 0 0 16px 0; font-size: 1.2rem; color: #333;">
                        幹事の負担設定
                    </h3>

                    <!-- 幹事多め負担 -->
                    <div class="organizer-more-input" data-input-type="organizer_more" style="display: none;">
                        <label for="organizer-burden-more" style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 500;
                            color: #333;
                        ">幹事の追加負担（%）</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="organizer-burden-slider-more" data-input="organizer-burden-slider" style="
                                flex: 1;
                                -webkit-appearance: none;
                                height: 8px;
                                border-radius: 4px;
                                background: #ddd;
                                outline: none;
                            " min="1" max="100" value="20">
                            <input type="number" id="organizer-burden-more" data-input="organizer-burden" style="
                                width: 80px;
                                padding: 8px;
                                border: 2px solid #ddd;
                                border-radius: 6px;
                                text-align: center;
                                font-size: 1rem;
                            " min="1" max="100" value="20">
                            <span>%</span>
                        </div>
                        <div class="burden-preview" data-preview="organizer-more" style="
                            margin-top: 12px;
                            padding: 12px;
                            background: white;
                            border-radius: 6px;
                            font-size: 0.9rem;
                            color: #666;
                        "></div>
                    </div>

                    <!-- 幹事少なめ負担 -->
                    <div class="organizer-less-input" data-input-type="organizer_less" style="display: none;">
                        <label for="organizer-burden-less" style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 500;
                            color: #333;
                        ">幹事の軽減率（%）</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="organizer-burden-slider-less" data-input="organizer-burden-slider" style="
                                flex: 1;
                                -webkit-appearance: none;
                                height: 8px;
                                border-radius: 4px;
                                background: #ddd;
                                outline: none;
                            " min="1" max="99" value="20">
                            <input type="number" id="organizer-burden-less" data-input="organizer-burden" style="
                                width: 80px;
                                padding: 8px;
                                border: 2px solid #ddd;
                                border-radius: 6px;
                                text-align: center;
                                font-size: 1rem;
                            " min="1" max="99" value="20">
                            <span>%</span>
                        </div>
                        <div class="burden-preview" data-preview="organizer-less" style="
                            margin-top: 12px;
                            padding: 12px;
                            background: white;
                            border-radius: 6px;
                            font-size: 0.9rem;
                            color: #666;
                        "></div>
                    </div>

                    <!-- 幹事固定額 -->
                    <div class="organizer-fixed-input" data-input-type="organizer_fixed" style="display: none;">
                        <label for="organizer-fixed" style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 500;
                            color: #333;
                        ">幹事の固定額</label>
                        <div class="price-wrapper" style="position: relative;">
                            <input type="number" id="organizer-fixed" data-input="organizer-fixed" style="
                                width: 100%;
                                max-width: 300px;
                                padding: 12px 40px 12px 12px;
                                border: 2px solid #ddd;
                                border-radius: 6px;
                                font-size: 1.1rem;
                                transition: border-color 0.2s ease;
                            " placeholder="0" min="0">
                            <span style="
                                position: absolute;
                                right: 12px;
                                top: 50%;
                                transform: translateY(-50%);
                                color: #666;
                                font-weight: 500;
                            ">円</span>
                        </div>
                        <div class="burden-preview" data-preview="organizer-fixed" style="
                            margin-top: 12px;
                            padding: 12px;
                            background: white;
                            border-radius: 6px;
                            font-size: 0.9rem;
                            color: #666;
                        "></div>
                    </div>
                </div>

                <!-- 計算ボタン -->
                <div class="calculate-section" style="text-align: center; margin-bottom: 24px;">
                    <button class="calculate-button" data-element="calculate-button" style="
                        padding: 16px 48px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 1.2rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                    ">
                        計算する
                    </button>
                </div>

                <!-- 結果表示 -->
                <div class="result-section" data-element="result-section" style="
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 24px;
                    display: none;
                ">
                    <h3 style="margin: 0 0 20px 0; font-size: 1.3rem; color: #333;">計算結果</h3>
                    <div class="result-details" data-element="result-details">
                        <!-- 結果がここに表示される -->
                    </div>
                </div>

                <!-- アクションボタン -->
                <div class="action-buttons" data-element="action-buttons" style="
                    display: none;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 12px;
                    margin-top: 20px;
                ">
                    <button class="action-button share-button" data-action="share" style="
                        padding: 12px;
                        border: 2px solid #667eea;
                        border-radius: 8px;
                        background: white;
                        color: #667eea;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-weight: 500;
                    ">
                        <span style="margin-right: 8px;">📤</span>
                        シェア
                    </button>

                    <button class="action-button save-button" data-action="save" style="
                        padding: 12px;
                        border: 2px solid #27ae60;
                        border-radius: 8px;
                        background: white;
                        color: #27ae60;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-weight: 500;
                    ">
                        <span style="margin-right: 8px;">💾</span>
                        履歴に保存
                    </button>

                    <button class="action-button history-button" data-action="history" style="
                        padding: 12px;
                        border: 2px solid #e67e22;
                        border-radius: 8px;
                        background: white;
                        color: #e67e22;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-weight: 500;
                    ">
                        <span style="margin-right: 8px;">📋</span>
                        履歴を見る
                    </button>

                    <button class="action-button clear-button" data-action="clear" style="
                        padding: 12px;
                        border: 2px solid #95a5a6;
                        border-radius: 8px;
                        background: white;
                        color: #95a5a6;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-weight: 500;
                    ">
                        <span style="margin-right: 8px;">🔄</span>
                        クリア
                    </button>
                </div>
            </div>
        `;

        // CSSを追加
        this.addStyles();

        // 要素参照を保存
        this.patternContainer = this.container.querySelector('[data-element="pattern-selection"]');
        this.inputContainer = this.container.querySelector('[data-element="basic-inputs"]');
        this.resultContainer = this.container.querySelector('[data-element="result-section"]');
        this.historyButtonContainer = this.container.querySelector('[data-element="action-buttons"]');
    }

    /**
     * スタイルを追加
     *
     * @description
     * コンポーネントのCSSスタイルを追加します。
     *
     * @returns {void}
     */
    addStyles() {
        const styleId = 'organizer-ui-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .pattern-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .pattern-button.active {
                    border-color: #667eea;
                    background: #667eea;
                    color: white;
                }

                input[type="number"]:focus,
                input[type="range"]:focus {
                    outline: none;
                    border-color: #667eea;
                }

                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #667eea;
                    border-radius: 50%;
                    cursor: pointer;
                }

                input[type="range"]::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    background: #667eea;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                }

                .calculate-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                }

                .calculate-button:active {
                    transform: translateY(0);
                }

                .action-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .result-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .result-item {
                    text-align: center;
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .result-item .label {
                    font-size: 0.9rem;
                    color: #666;
                    margin-bottom: 8px;
                }

                .result-item .value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #333;
                }

                .result-item.organizer .value {
                    color: #667eea;
                }

                .result-item.participant .value {
                    color: #27ae60;
                }

                .result-item.remainder .value {
                    color: #e67e22;
                }

                .breakdown-section {
                    background: #f8f9fa;
                    padding: 16px;
                    border-radius: 8px;
                    margin-top: 16px;
                }

                .breakdown-section h4 {
                    margin: 0 0 12px 0;
                    color: #333;
                }

                .breakdown-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #e0e0e0;
                }

                .breakdown-item:last-child {
                    border-bottom: none;
                    font-weight: 600;
                    color: #333;
                }

                @media (max-width: 768px) {
                    .pattern-buttons {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .result-summary {
                        grid-template-columns: 1fr;
                    }

                    .action-buttons {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * イベントをバインド
     *
     * @description
     * イベントハンドラを設定します。
     *
     * @returns {void}
     */
    bindEvents() {
        // パターンボタン
        const patternButtons = this.container.querySelectorAll('[data-pattern]');
        patternButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const pattern = e.currentTarget.dataset.pattern;
                this.selectPattern(pattern);
            });
        });

        // 入力フィールド
        const inputs = this.container.querySelectorAll('input[data-input]');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.handleInputChange(input);
            });

            input.addEventListener('change', () => {
                this.validateInput(input);
            });
        });

        // 計算ボタン
        const calculateButton = this.container.querySelector('[data-element="calculate-button"]');
        calculateButton.addEventListener('click', () => {
            this.calculate();
        });

        // Enterキーで計算
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                e.preventDefault();
                this.calculate();
            }
        });

        // アクションボタン
        const actionButtons = this.container.querySelectorAll('[data-action]');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });
    }

    /**
     * パターンを選択
     *
     * @description
     * 割り勘パターンを選択します。
     *
     * @param {string} pattern - パターン種別
     * @returns {void}
     */
    selectPattern(pattern) {
        this.currentType = pattern;

        // ボタンの見た目を更新
        const patternButtons = this.container.querySelectorAll('[data-pattern]');
        patternButtons.forEach(button => {
            if (button.dataset.pattern === pattern) {
                button.classList.add('active');
                button.style.borderColor = '#667eea';
                button.style.background = '#667eea';
                button.style.color = 'white';
            } else {
                button.classList.remove('active');
                button.style.borderColor = '#e0e0e0';
                button.style.background = 'white';
                button.style.color = '#333';
            }
        });

        // 入力フォームを切り替え
        this.toggleOrganizerInputs(pattern);

        // プレビューを更新
        this.updatePreview();
    }

    /**
     * 幹事入力を切り替え
     *
     * @description
     * パターンに応じて幹事入力フォームを切り替えます。
     *
     * @param {string} pattern - パターン種別
     * @returns {void}
     */
    toggleOrganizerInputs(pattern) {
        const organizerInputs = this.container.querySelector('[data-element="organizer-inputs"]');
        const inputTypes = organizerInputs.querySelectorAll('[data-input-type]');

        if (pattern === CalculationType.EQUAL) {
            organizerInputs.style.display = 'none';
        } else {
            organizerInputs.style.display = 'block';

            // 該当する入力を表示
            inputTypes.forEach(input => {
                if (input.dataset.inputType === pattern) {
                    input.style.display = 'block';
                } else {
                    input.style.display = 'none';
                }
            });
        }
    }

    /**
     * 入力変更を処理
     *
     * @description
     * 入力値の変更を処理します。
     *
     * @param {HTMLInputElement} input - 入力要素
     * @returns {void}
     */
    handleInputChange(input) {
        // スライダーと数値入力の同期
        if (input.dataset.input === 'organizer-burden-slider') {
            const numberInput = this.container.querySelector('[data-input="organizer-burden"]');
            numberInput.value = input.value;
        } else if (input.dataset.input === 'organizer-burden') {
            const sliderInput = this.container.querySelector('[data-input="organizer-burden-slider"]');
            sliderInput.value = input.value;
        }

        // プレビューを更新
        this.updatePreview();
    }

    /**
     * プレビューを更新
     *
     * @description
     - リアルタイムプレビューを更新します。
     *
     * @returns {void}
     */
    updatePreview() {
        if (this.currentType === CalculationType.EQUAL) return;

        const totalAmount = this.getInputValue('total-amount');
        const numberOfPeople = this.getInputValue('number-of-people');

        if (!totalAmount || !numberOfPeople) return;

        let previewText = '';

        switch (this.currentType) {
            case CalculationType.ORGANIZER_MORE:
                const burdenPercent = this.getInputValue('organizer-burden') || 20;
                const organizerRate = 1 + (burdenPercent / 100);
                const participantRate = (numberOfPeople - organizerRate) / (numberOfPeople - 1);
                const organizerPayment = Math.floor(totalAmount * (organizerRate / numberOfPeople));
                const participantPayment = Math.floor(totalAmount * (participantRate / numberOfPeople));
                previewText = `幹事: ${organizerPayment.toLocaleString()}円、参加者: ${participantPayment.toLocaleString()}円（概算）`;
                break;

            case CalculationType.ORGANIZER_LESS:
                const reductionPercent = this.getInputValue('organizer-burden') || 20;
                const orgRate = 1 - (reductionPercent / 100);
                const partRate = (numberOfPeople - orgRate) / (numberOfPeople - 1);
                const orgPayment = Math.floor(totalAmount * (orgRate / numberOfPeople));
                const partPayment = Math.floor(totalAmount * (partRate / numberOfPeople));
                previewText = `幹事: ${orgPayment.toLocaleString()}円、参加者: ${partPayment.toLocaleString()}円（概算）`;
                break;

            case CalculationType.ORGANIZER_FIXED:
                const fixedAmount = this.getInputValue('organizer-fixed') || 1000;
                const remaining = totalAmount - fixedAmount;
                const participantCount = numberOfPeople - 1;
                const perParticipant = participantCount > 0 ? Math.floor(remaining / participantCount) : 0;
                previewText = `幹事: ${fixedAmount.toLocaleString()}円、参加者: ${perParticipant.toLocaleString()}円（概算）`;
                break;
        }

        const previewElement = this.container.querySelector(`[data-preview="${this.currentType}"]`);
        if (previewElement) {
            previewElement.textContent = previewText;
        }
    }

    /**
     * 入力値を取得
     *
     * @description
     * 指定された入力値を取得します。
     *
     * @param {string} inputName - 入力名
     * @returns {number|null} 入力値
     */
    getInputValue(inputName) {
        const input = this.container.querySelector(`[data-input="${inputName}"]`);
        if (!input) return null;
        const value = parseInt(input.value, 10);
        return isNaN(value) ? null : value;
    }

    /**
     * 計算を実行
     *
     * @description
     * 割り勘計算を実行します。
     *
     * @returns {void}
     */
    calculate() {
        // 入力値を取得
        const totalAmount = this.getInputValue('total-amount');
        const numberOfPeople = this.getInputValue('number-of-people');

        // バリデーション
        if (!this.validateAllInputs()) {
            return;
        }

        // 計算入力を作成
        const input = {
            totalAmount,
            numberOfPeople,
            type: this.currentType
        };

        // パターン別パラメータを追加
        switch (this.currentType) {
            case CalculationType.ORGANIZER_MORE:
                input.organizerBurden = this.getInputValue('organizer-burden');
                break;
            case CalculationType.ORGANIZER_LESS:
                input.organizerBurden = this.getInputValue('organizer-burden');
                break;
            case CalculationType.ORGANIZER_FIXED:
                input.organizerFixed = this.getInputValue('organizer-fixed');
                break;
        }

        try {
            // 計算実行
            const result = this.calculationEngine.calculate(input);
            this.displayResult(result);

            // コールバック実行
            if (this.options.onCalculate) {
                this.options.onCalculate(result);
            }

            // 保存イベントを発行
            const saveEvent = new CustomEvent('organizerUI:save', {
                detail: { result, note: '' }
            });
            this.container.dispatchEvent(saveEvent);

        } catch (error) {
            console.error('計算エラー:', error);
            this.showError('計算中にエラーが発生しました');
        }
    }

    /**
     * 結果を表示
     *
     * @description
     * 計算結果を表示します。
     *
     * @param {CalculationResultExtended} result - 計算結果
     * @returns {void}
     */
    displayResult(result) {
        const resultDetails = this.container.querySelector('[data-element="result-details"]');
        const actionButtons = this.container.querySelector('[data-element="action-buttons"]');

        // 結果HTMLを生成
        let html = '<div class="result-summary">';

        if (result.type === CalculationType.EQUAL) {
            html += `
                <div class="result-item">
                    <div class="label">一人当たり</div>
                    <div class="value">${result.perPerson.toLocaleString()}円</div>
                </div>
                ${result.remainder > 0 ? `
                    <div class="result-item remainder">
                        <div class="label">余り</div>
                        <div class="value">${result.remainder}円</div>
                    </div>
                ` : ''}
            `;
        } else {
            html += `
                <div class="result-item organizer">
                    <div class="label">幹事</div>
                    <div class="value">${result.organizerPayment.toLocaleString()}円</div>
                </div>
                <div class="result-item participant">
                    <div class="label">参加者一人</div>
                    <div class="value">${result.participantPayment.toLocaleString()}円</div>
                </div>
                ${result.remainder > 0 ? `
                    <div class="result-item remainder">
                        <div class="label">余り</div>
                        <div class="value">${result.remainder}円</div>
                    </div>
                ` : ''}
            `;
        }

        html += '</div>';

        // 詳細表示
        html += '<div class="breakdown-section">';
        html += '<h4>内訳</h4>';
        html += '<div class="breakdown-item">';
        html += `<span>総額</span><span>${result.totalAmount.toLocaleString()}円</span>`;
        html += '</div>';
        html += '<div class="breakdown-item">';
        html += `<span>人数</span><span>${result.numberOfPeople}人</span>`;
        html += '</div>';

        if (result.type !== CalculationType.EQUAL) {
            html += '<div class="breakdown-item">';
            html += `<span>幹事支払額</span><span>${result.organizerPayment.toLocaleString()}円</span>`;
            html += '</div>';
            html += '<div class="breakdown-item">';
            html += `<span>参加者計</span><span>${(result.participantPayment * (result.numberOfPeople - 1)).toLocaleString()}円</span>`;
            html += '</div>';
        }

        html += '<div class="breakdown-item">';
        html += `<span>合計</span><span>${(result.type === CalculationType.EQUAL ?
            result.perPerson * result.numberOfPeople + result.remainder :
            result.organizerPayment + result.participantPayment * (result.numberOfPeople - 1)).toLocaleString()}円</span>`;
        html += '</div>';
        html += '</div>';

        resultDetails.innerHTML = html;

        // 結果セクションとアクションボタンを表示
        this.resultContainer.style.display = 'block';
        actionButtons.style.display = 'grid';

        // スムーズスクロール
        this.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * アクションを処理
     *
     * @description
     * アクションボタンの処理を実行します。
     *
     * @param {string} action - アクション種別
     * @returns {void}
     */
    handleAction(action) {
        // カスタムイベントを発行
        const event = new CustomEvent('organizerUI:action', {
            detail: { action, currentType: this.currentType }
        });
        this.container.dispatchEvent(event);
    }

    /**
     * バリデーションを設定
     *
     * @description
     * 入力バリデーションを設定します。
     *
     * @returns {void}
     */
    setupValidation() {
        const rules = {
            'total-amount': {
                min: 1,
                max: 10000000000,
                required: true,
                message: '1〜100億の間で入力してください'
            },
            'number-of-people': {
                min: 1,
                max: 9999,
                required: true,
                message: '1〜9999の間で入力してください'
            },
            'organizer-burden': {
                min: 1,
                max: 100,
                required: false,
                message: '1〜100の間で入力してください'
            },
            'organizer-fixed': {
                min: 0,
                required: false,
                message: '0以上の値を入力してください'
            }
        };

        this.validationRules = rules;
    }

    /**
     * 入力を検証
     *
     * @description
     * 個別の入力値を検証します。
     *
     * @param {HTMLInputElement} input - 入力要素
     * @returns {boolean} 検証結果
     */
    validateInput(input) {
        const inputName = input.dataset.input;
        const rule = this.validationRules[inputName];
        if (!rule) return true;

        const value = parseInt(input.value, 10);
        const errorElement = this.container.querySelector(`[data-error="${inputName}"]`);

        let isValid = true;
        let errorMessage = '';

        // 必須チェック
        if (rule.required && (isNaN(value) || value === null || value === '')) {
            isValid = false;
            errorMessage = 'この項目は必須です';
        } else if (!isNaN(value) && value !== null) {
            // 範囲チェック
            if (rule.min !== undefined && value < rule.min) {
                isValid = false;
                errorMessage = rule.message;
            } else if (rule.max !== undefined && value > rule.max) {
                isValid = false;
                errorMessage = rule.message;
            }
        }

        // エラー表示
        if (errorElement) {
            if (isValid) {
                errorElement.style.display = 'none';
                errorElement.textContent = '';
                input.style.borderColor = '#ddd';
            } else {
                errorElement.style.display = 'block';
                errorElement.textContent = errorMessage;
                input.style.borderColor = '#e74c3c';
            }
        }

        return isValid;
    }

    /**
     * 全入力を検証
     *
     * @description
     * 全ての入力値を検証します。
     *
     * @returns {boolean} 検証結果
     */
    validateAllInputs() {
        const inputs = this.container.querySelectorAll('input[data-input]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });

        // 特殊なバリデーション
        if (this.currentType === CalculationType.ORGANIZER_FIXED) {
            const totalAmount = this.getInputValue('total-amount');
            const organizerFixed = this.getInputValue('organizer-fixed');

            if (organizerFixed >= totalAmount) {
                const fixedInput = this.container.querySelector('[data-input="organizer-fixed"]');
                const errorElement = this.container.querySelector('[data-error="organizer-fixed"]');

                if (errorElement) {
                    errorElement.style.display = 'block';
                    errorElement.textContent = '総額より少ない額を設定してください';
                }

                if (fixedInput) {
                    fixedInput.style.borderColor = '#e74c3c';
                }

                isValid = false;
            }
        }

        if (!isValid) {
            this.showError('入力内容を確認してください');
        }

        return isValid;
    }

    /**
     * エラーを表示
     *
     * @description
     * エラーメッセージを表示します。
     *
     * @param {string} message - エラーメッセージ
     * @returns {void}
     */
    showError(message) {
        // 既存のエラーを削除
        const existingError = this.container.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // 新しいエラーを作成
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.cssText = `
            background: #fadbd8;
            color: #e74c3c;
            padding: 12px 16px;
            border-radius: 6px;
            margin: 16px 0;
            border-left: 4px solid #e74c3c;
        `;
        errorElement.textContent = message;

        // 計算ボタンの前に挿入
        const calculateButton = this.container.querySelector('[data-element="calculate-button"]');
        calculateButton.parentNode.insertBefore(errorElement, calculateButton);

        // 3秒後に自動で非表示
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 3000);
    }

    /**
     * デフォルト値を設定
     *
     * @description
     * 入力フィールドにデフォルト値を設定します。
     *
     * @returns {void}
     */
    setDefaultValues() {
        Object.entries(this.options.defaultValues).forEach(([key, value]) => {
            const input = this.container.querySelector(`[data-input="${key}"]`);
            if (input && !input.value) {
                input.value = value;
            }
        });

        // プレビューを更新
        this.updatePreview();
    }

    /**
     * 値をクリア
     *
     * @description
     * 全ての入力値をクリアします。
     *
     * @returns {void}
     */
    clear() {
        const inputs = this.container.querySelectorAll('input[data-input]');
        inputs.forEach(input => {
            input.value = '';
            input.style.borderColor = '#ddd';
        });

        const errors = this.container.querySelectorAll('[data-error]');
        errors.forEach(error => {
            error.style.display = 'none';
            error.textContent = '';
        });

        this.resultContainer.style.display = 'none';
        this.historyButtonContainer.style.display = 'none';

        // デフォルト値を再設定
        this.setDefaultValues();
    }

    /**
     * 現在の計算タイプを取得
     *
     * @description
     * 現在選択されている計算タイプを返します。
     *
     * @returns {string} 計算タイプ
     */
    getCurrentType() {
        return this.currentType;
    }

    /**
     * 計算結果を取得
     *
     * @description
     * 最後の計算結果を返します。
     *
     * @returns {CalculationResultExtended|null} 計算結果
     */
    getLastResult() {
        // 結果表示からデータを抽出
        const resultDetails = this.container.querySelector('[data-element="result-details"]');
        if (!resultDetails || this.resultContainer.style.display === 'none') {
            return null;
        }

        // 結果を再構築（簡易的な実装）
        const totalAmount = this.getInputValue('total-amount');
        const numberOfPeople = this.getInputValue('number-of-people');

        if (!totalAmount || !numberOfPeople) return null;

        const input = {
            totalAmount,
            numberOfPeople,
            type: this.currentType
        };

        if (this.currentType !== CalculationType.EQUAL) {
            switch (this.currentType) {
                case CalculationType.ORGANIZER_MORE:
                case CalculationType.ORGANIZER_LESS:
                    input.organizerBurden = this.getInputValue('organizer-burden');
                    break;
                case CalculationType.ORGANIZER_FIXED:
                    input.organizerFixed = this.getInputValue('organizer-fixed');
                    break;
            }
        }

        try {
            return this.calculationEngine.calculate(input);
        } catch (error) {
            console.error('計算結果の取得エラー:', error);
            return null;
        }
    }
}

// エクスポート
export { OrganizerUI };