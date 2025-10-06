/**
 * 割り勘計算アプリケーション
 *
 * @description
 * 簡単な割り勘計算を行うWebアプリケーション。
 * 金額と人数を入力すると、一人当たりの金額と余りを計算します。
 * 履歴機能、幹事負担パターン、シェア機能に対応。
 *
 * @module WarikanApp
 * @version 2.0.0
 * @author Warikan App Team
 */

"use strict";

// インポート
import { CalculationEngine, CalculationType } from './src/calculation.js';
import { historyStorage } from './src/storage.js';
import { OrganizerUI } from './src/components/OrganizerUI.js';
import { HistoryList } from './src/components/HistoryList.js';
import { ShareUI } from './src/components/ShareUI.js';
import { shareManager } from './src/share.js';

// アプリケーションクラス
class WarikanApp {
    constructor() {
        this.calculationEngine = new CalculationEngine();
        this.storage = historyStorage;

        // UIコンポーネント
        this.organizerUI = null;
        this.historyList = null;
        this.shareUI = null;

        // 状態
        this.currentResult = null;
        this.isHistoryVisible = false;

        this.init();
    }

    /**
     * 初期化
     */
    init() {
        this.setupUI();
        this.bindEvents();
        this.loadFromURL();
        this.initializeStyles();
    }

    /**
     * UIを設定
     */
    setupUI() {
        // メインコンテナを取得
        const mainContainer = document.querySelector('.container');
        if (!mainContainer) {
            console.error('メインコンテナが見つかりません');
            return;
        }

        // 既存のUIをクリア
        mainContainer.innerHTML = '';

        // ヘッダー
        const header = document.createElement('header');
        header.innerHTML = `
            <h1 style="text-align: center; color: #333; margin-bottom: 32px;">
                割り勘計算機
                <span style="font-size: 0.8rem; color: #666; display: block; margin-top: 8px;">
                    履歴保存・シェア機能付き
                </span>
            </h1>
        `;

        // オーガナイザーUIコンテナ
        const organizerContainer = document.createElement('div');
        organizerContainer.id = 'organizer-container';

        // 履歴コンテナ
        const historyContainer = document.createElement('div');
        historyContainer.id = 'history-container';
        historyContainer.style.cssText = `
            display: none;
            margin-top: 32px;
            padding: 24px;
            background: #f8f9fa;
            border-radius: 8px;
        `;

        // シェアUI用オーバーレイ（後で動的に追加）
        const shareOverlay = document.createElement('div');
        shareOverlay.id = 'share-overlay';

        mainContainer.appendChild(header);
        mainContainer.appendChild(organizerContainer);
        mainContainer.appendChild(historyContainer);
        document.body.appendChild(shareOverlay);

        // UIコンポーネントを初期化
        this.organizerUI = new OrganizerUI(organizerContainer, {
            onCalculate: (result) => this.handleCalculate(result)
        });

        this.historyList = new HistoryList(historyContainer, {
            maxDisplayItems: 10,
            enableAnimation: true
        });

        this.shareUI = new ShareUI(shareOverlay);
    }

    /**
     * イベントをバインド
     */
    bindEvents() {
        // オーガナイザーUIのアクションイベント
        this.organizerUI.container.addEventListener('organizerUI:action', (e) => {
            const { action } = e.detail;
            this.handleAction(action);
        });

        // 履歴イベント
        this.historyList.container.addEventListener('historyList:select', (e) => {
            const { entry } = e.detail;
            this.loadHistoryEntry(entry);
        });

        this.historyList.container.addEventListener('historyList:delete', (e) => {
            const { id } = e.detail;
            this.deleteHistoryEntry(id);
        });

        this.historyList.container.addEventListener('historyList:clear', () => {
            this.clearHistory();
        });

        // 履歴保存イベント
        this.organizerUI.container.addEventListener('organizerUI:save', (e) => {
            const { result, note } = e.detail;
            this.saveToHistory(result, note);
        });

        // URL変更イベント（ブラウザの戻る/進む対応）
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.calculation) {
                this.loadCalculation(e.state.calculation);
            }
        });

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        if (this.currentResult) {
                            this.saveToHistory(this.currentResult);
                        }
                        break;
                    case 'h':
                        e.preventDefault();
                        this.toggleHistory();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (this.currentResult) {
                            this.shareUI.show(this.currentResult);
                        }
                        break;
                }
            }
        });
    }

    /**
     * 計算実行時の処理
     */
    handleCalculate(result) {
        this.currentResult = result;

        // 履歴に自動保存
        this.saveToHistory(result);

        // URLを更新
        this.updateURL(result);

        // アクションボタンを表示
        this.showActionButtons();
    }

    /**
     * アクションを処理
     */
    handleAction(action) {
        switch (action) {
            case 'share':
                if (this.currentResult) {
                    this.shareUI.show(this.currentResult);
                }
                break;

            case 'save':
                if (this.currentResult) {
                    this.saveToHistory(this.currentResult);
                    this.showNotification('履歴に保存しました');
                }
                break;

            case 'history':
                this.toggleHistory();
                break;

            case 'clear':
                this.organizerUI.clear();
                this.currentResult = null;
                this.hideActionButtons();
                this.updateURL(null);
                break;
        }
    }

    /**
     * 履歴に保存
     */
    saveToHistory(result, note = '') {
        try {
            const id = this.storage.saveCalculation(result, note);
            console.log('履歴を保存しました:', id);

            // 履歴表示が有効な場合は更新
            if (this.isHistoryVisible) {
                this.refreshHistory();
            }

            return id;
        } catch (error) {
            console.error('履歴の保存に失敗しました:', error);
            this.showNotification('履歴の保存に失敗しました', true);
            return null;
        }
    }

    /**
     * 履歴を表示/非表示
     */
    toggleHistory() {
        const historyContainer = document.getElementById('history-container');

        if (this.isHistoryVisible) {
            historyContainer.style.display = 'none';
            this.isHistoryVisible = false;
        } else {
            historyContainer.style.display = 'block';
            this.isHistoryVisible = true;
            this.refreshHistory();
        }
    }

    /**
     * 履歴を更新
     */
    refreshHistory() {
        const history = this.storage.getHistory({ limit: 20 });
        this.historyList.renderHistoryList(history);
    }

    /**
     * 履歴エントリを読み込む
     */
    loadHistoryEntry(entry) {
        // 計算結果を復元
        const result = entry.calculationResult;

        // UIに値を設定
        this.loadCalculation(result);

        // 履歴を非表示
        this.toggleHistory();

        // URLを更新
        this.updateURL(result);
    }

    /**
     * 履歴エントリを削除
     */
    deleteHistoryEntry(id) {
        const success = this.storage.deleteHistoryItem(id);
        if (success) {
            this.refreshHistory();
            this.showNotification('履歴を削除しました');
        } else {
            this.showNotification('削除に失敗しました', true);
        }
    }

    /**
     * 履歴をクリア
     */
    clearHistory() {
        if (confirm('すべての履歴を削除してもよろしいですか？')) {
            this.storage.clearHistory();
            this.refreshHistory();
            this.showNotification('履歴をクリアしました');
        }
    }

    /**
     * 計算結果を読み込む
     */
    loadCalculation(result) {
        // 現在のタイプを設定
        this.organizerUI.selectPattern(result.type);

        // 値を設定
        const totalInput = document.getElementById('total-amount');
        const peopleInput = document.getElementById('number-of-people');

        if (totalInput) totalInput.value = result.totalAmount;
        if (peopleInput) peopleInput.value = result.numberOfPeople;

        // 幹事負担の値を設定
        switch (result.type) {
            case CalculationType.ORGANIZER_MORE:
                const burdenInput = document.getElementById('organizer-burden-more');
                if (burdenInput && result.organizerBurdenPercent) {
                    burdenInput.value = result.organizerBurdenPercent;
                }
                break;

            case CalculationType.ORGANIZER_LESS:
                const reductionInput = document.getElementById('organizer-burden-less');
                if (reductionInput && result.organizerReductionPercent) {
                    reductionInput.value = result.organizerReductionPercent;
                }
                break;

            case CalculationType.ORGANIZER_FIXED:
                const fixedInput = document.getElementById('organizer-fixed');
                if (fixedInput && result.organizerFixedAmount) {
                    fixedInput.value = result.organizerFixedAmount;
                }
                break;
        }

        // 計算を実行して結果を表示
        this.currentResult = result;
        this.organizerUI.displayResult(result);
        this.showActionButtons();
    }

    /**
     * URLを更新
     */
    updateURL(result) {
        if (result) {
            const url = shareManager.encodeToUrl(result);
            const newUrl = new URL(window.location);
            newUrl.search = new URL(url).search;

            // 履歴を追加
            history.pushState({ calculation: result }, '', newUrl);
        } else {
            // パラメータをクリア
            const newUrl = new URL(window.location);
            newUrl.search = '';
            history.pushState({}, '', newUrl);
        }
    }

    /**
     * URLから読み込む
     */
    loadFromURL() {
        const input = shareManager.decodeFromUrl();
        if (input) {
            // 計算を実行
            try {
                const result = this.calculationEngine.calculate(input);
                this.loadCalculation(result);
            } catch (error) {
                console.error('URLからの読み込みに失敗:', error);
            }
        }
    }

    /**
     * アクションボタンを表示
     */
    showActionButtons() {
        const actionButtons = document.querySelector('[data-element="action-buttons"]');
        if (actionButtons) {
            actionButtons.style.display = 'grid';
        }
    }

    /**
     * アクションボタンを非表示
     */
    hideActionButtons() {
        const actionButtons = document.querySelector('[data-element="action-buttons"]');
        if (actionButtons) {
            actionButtons.style.display = 'none';
        }
    }

    /**
     * 通知を表示
     */
    showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${isError ? '#e74c3c' : '#27ae60'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-weight: 500;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 表示アニメーション
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // 3秒後に非表示
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * スタイルを初期化
     */
    initializeStyles() {
        const styleId = 'warikan-app-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
                              'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }

                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 32px;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                }

                @media (max-width: 768px) {
                    body {
                        padding: 10px;
                    }

                    .container {
                        padding: 20px;
                    }
                }

                /* 既存のスタイルを維持 */
                .fade-in {
                    animation: fadeIn 0.5s ease-in;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .pulse {
                    animation: pulse 0.5s ease;
                }

                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }

                .error {
                    animation: shake 0.5s ease;
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    new WarikanApp();
});

// エラーハンドリング
window.addEventListener('error', (e) => {
    console.error('アプリケーションエラー:', e.error);
});

// Service Worker登録（PWA対応）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}