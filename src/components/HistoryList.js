/**
 * 履歴リスト表示コンポーネント
 *
 * @description
 * 保存された計算履歴を一覧表示するUIコンポーネント。
 * 履歴の閲覧、再利用、削除、フィルター機能を提供します。
 *
 * @module HistoryList
 * @version 1.0.0
 */

"use strict";

import { historyStorage } from '../storage.js';

/**
 * 履歴リストコンポーネントクラス
 *
 * @class
 * @classdesc
 * 履歴の表示と管理を行うUIコンポーネント。
 */
class HistoryList {
    /**
     * コンストラクタ
     *
     * @param {HTMLElement} container - コンテナ要素
     * @param {Object} [options={}] - オプション設定
     */
    constructor(container, options = {}) {
        /** @type {HTMLElement} コンテナ要素 */
        this.container = container;

        /** @type {Object} オプション設定 */
        this.options = {
            maxDisplayItems: 10,
            enableAnimation: true,
            showTimestamp: true,
            showTags: false,
            onHistorySelect: null,
            onHistoryDelete: null,
            ...options
        };

        /** @type {Array<HistoryEntry>} 表示中の履歴データ */
        this.currentEntries = [];

        /** @type {Object} フィルター状態 */
        this.filters = {
            type: 'all',
            dateFrom: null,
            dateTo: null,
            searchText: ''
        };

        /** @type {number} 現在のページ */
        this.currentPage = 1;

        /** @type {number} 1ページあたりの表示件数 */
        this.itemsPerPage = this.options.maxDisplayItems;

        // 初期化
        this.init();
    }

    /**
     * 初期化
     *
     * @description
     * コンポーネントのDOM構造を構築し、イベントを設定します。
     */
    init() {
        this.render();
        this.bindEvents();
        this.loadHistory();
    }

    /**
     * DOMを描画
     *
     * @description
     * 履歴リストのHTML構造を生成します。
     */
    render() {
        this.container.innerHTML = `
            <div class="history-list-container">
                <div class="history-header">
                    <h3 class="history-title">計算履歴</h3>
                    <div class="history-controls">
                        <select class="history-filter-type" data-filter="type">
                            <option value="all">すべて</option>
                            <option value="equal">均等割り</option>
                            <option value="organizer_more">幹事多め</option>
                            <option value="organizer_less">幹事少なめ</option>
                            <option value="organizer_fixed">幹事固定</option>
                        </select>
                        <button class="history-clear-btn" data-action="clear">
                            全て削除
                        </button>
                        <button class="history-close-btn" data-action="close">
                            ✕
                        </button>
                    </div>
                </div>

                <div class="history-search">
                    <input
                        type="text"
                        class="history-search-input"
                        placeholder="メモを検索..."
                        data-filter="search"
                    />
                </div>

                <div class="history-content">
                    <div class="history-list" data-container="list">
                        <!-- 履歴アイテムがここに挿入されます -->
                    </div>

                    <div class="history-empty" data-state="empty" style="display: none;">
                        <div class="empty-icon">📝</div>
                        <p class="empty-message">計算履歴がありません</p>
                        <p class="empty-description">計算を行うとここに履歴が表示されます</p>
                    </div>

                    <div class="history-loading" data-state="loading" style="display: none;">
                        <div class="loading-spinner"></div>
                        <p>読み込み中...</p>
                    </div>
                </div>

                <div class="history-footer">
                    <div class="history-pagination" data-container="pagination">
                        <!-- ページネーションがここに挿入されます -->
                    </div>
                    <div class="history-stats" data-container="stats">
                        <!-- 統計情報がここに挿入されます -->
                    </div>
                </div>
            </div>
        `;

        // スタイルを追加
        this.addStyles();
    }

    /**
     * スタイルを追加
     *
     * @description
     * コンポーネント用のCSSスタイルをheadに追加します。
     */
    addStyles() {
        if (document.getElementById('history-list-styles')) {
            return; // 既に存在する場合は追加しない
        }

        const style = document.createElement('style');
        style.id = 'history-list-styles';
        style.textContent = `
            .history-list-container {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                max-height: 600px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .history-header {
                padding: 20px;
                border-bottom: 1px solid #e0e0e0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .history-title {
                margin: 0 0 15px 0;
                font-size: 1.2rem;
                font-weight: 600;
            }

            .history-controls {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .history-filter-type {
                padding: 6px 12px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 0.9rem;
            }

            .history-filter-type option {
                background: #333;
            }

            .history-clear-btn {
                padding: 6px 12px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                background: rgba(220, 53, 69, 0.8);
                color: white;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .history-clear-btn:hover {
                background: rgba(220, 53, 69, 1);
                transform: translateY(-1px);
            }

            .history-close-btn {
                width: 30px;
                height: 30px;
                border: none;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: auto;
                transition: all 0.3s ease;
            }

            .history-close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }

            .history-search {
                padding: 15px 20px;
                border-bottom: 1px solid #e0e0e0;
            }

            .history-search-input {
                width: 100%;
                padding: 10px 15px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                font-size: 0.95rem;
                transition: all 0.3s ease;
            }

            .history-search-input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .history-content {
                flex: 1;
                overflow-y: auto;
                padding: 0;
            }

            .history-list {
                padding: 10px;
            }

            .history-item {
                padding: 15px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                animation: slideIn 0.3s ease;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .history-item:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }

            .history-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .history-item-type {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
            }

            .history-item-type.equal {
                background: #e3f2fd;
                color: #1976d2;
            }

            .history-item-type.organizer_more {
                background: #fff3e0;
                color: #f57c00;
            }

            .history-item-type.organizer_less {
                background: #fce4ec;
                color: #c2185b;
            }

            .history-item-type.organizer_fixed {
                background: #f3e5f5;
                color: #7b1fa2;
            }

            .history-item-date {
                font-size: 0.85rem;
                color: #666;
            }

            .history-item-body {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 8px;
            }

            .history-item-amount {
                font-size: 1.1rem;
                font-weight: 600;
                color: #333;
            }

            .history-item-detail {
                font-size: 0.9rem;
                color: #666;
            }

            .history-item-note {
                font-size: 0.85rem;
                color: #888;
                font-style: italic;
                margin-top: 5px;
            }

            .history-item-actions {
                display: flex;
                gap: 5px;
                margin-top: 10px;
            }

            .history-item-btn {
                padding: 5px 10px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                background: white;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .history-item-btn:hover {
                background: #f5f5f5;
            }

            .history-item-btn.delete {
                border-color: #ffcdd2;
                color: #c62828;
            }

            .history-item-btn.delete:hover {
                background: #ffcdd2;
            }

            .history-empty, .history-loading {
                text-align: center;
                padding: 60px 20px;
                color: #666;
            }

            .empty-icon {
                font-size: 3rem;
                margin-bottom: 15px;
            }

            .empty-message {
                font-size: 1.1rem;
                margin: 0 0 5px 0;
            }

            .empty-description {
                font-size: 0.9rem;
                margin: 0;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .history-footer {
                padding: 15px 20px;
                border-top: 1px solid #e0e0e0;
                background: #f8f9fa;
            }

            .history-pagination {
                display: flex;
                justify-content: center;
                gap: 5px;
                margin-bottom: 10px;
            }

            .pagination-btn {
                padding: 5px 10px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                background: white;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .pagination-btn:hover:not(:disabled) {
                background: #f5f5f5;
            }

            .pagination-btn.active {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }

            .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .history-stats {
                text-align: center;
                font-size: 0.85rem;
                color: #666;
            }

            @media (max-width: 600px) {
                .history-item-body {
                    grid-template-columns: 1fr;
                }

                .history-controls {
                    flex-wrap: wrap;
                }

                .history-filter-type {
                    flex: 1;
                    min-width: 150px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * イベントを設定
     *
     * @description
     * UI要素にイベントリスナーを設定します。
     */
    bindEvents() {
        // フィルター変更
        const typeFilter = this.container.querySelector('[data-filter="type"]');
        typeFilter.addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.loadHistory();
        });

        // 検索入力
        const searchInput = this.container.querySelector('[data-filter="search"]');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.searchText = e.target.value.toLowerCase();
                this.loadHistory();
            }, 300);
        });

        // 全削除ボタン
        const clearBtn = this.container.querySelector('[data-action="clear"]');
        clearBtn.addEventListener('click', () => {
            this.clearAllHistory();
        });

        // 閉じるボタン
        const closeBtn = this.container.querySelector('[data-action="close"]');
        closeBtn.addEventListener('click', () => {
            this.hide();
        });

        // コンテナ外クリックで閉じる
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.hide();
            }
        });
    }

    /**
     * 履歴を読み込み
     *
     * @description
     * LocalStorageから履歴データを読み込み、表示します。
     */
    async loadHistory() {
        this.showLoading();

        // 非同期的にデータを読み込み
        setTimeout(() => {
            const options = {
                limit: this.itemsPerPage,
                offset: (this.currentPage - 1) * this.itemsPerPage
            };

            // フィルター適用
            if (this.filters.type !== 'all') {
                options.type = this.filters.type;
            }

            if (this.filters.dateFrom) {
                options.dateFrom = this.filters.dateFrom;
            }

            if (this.filters.dateTo) {
                options.dateTo = this.filters.dateTo;
            }

            this.currentEntries = historyStorage.getHistory(options);

            // 検索フィルター適用
            if (this.filters.searchText) {
                this.currentEntries = this.currentEntries.filter(entry =>
                    entry.note.toLowerCase().includes(this.filters.searchText)
                );
            }

            this.renderHistoryList();
            this.renderPagination();
            this.renderStatistics();
        }, 100);
    }

    /**
     * 履歴リストを描画
     *
     * @description
     * 読み込んだ履歴データをリスト表示します。
     */
    renderHistoryList() {
        const listContainer = this.container.querySelector('[data-container="list"]');
        const emptyState = this.container.querySelector('[data-state="empty"]');
        const loadingState = this.container.querySelector('[data-state="loading"]');

        loadingState.style.display = 'none';

        if (this.currentEntries.length === 0) {
            listContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        listContainer.style.display = 'block';
        emptyState.style.display = 'none';

        listContainer.innerHTML = this.currentEntries.map(entry => {
            const date = new Date(entry.createdAt);
            const typeLabel = this.getTypeLabel(entry.calculationResult.type);
            const formattedDate = this.formatDate(date);

            return `
                <div class="history-item" data-id="${entry.id}">
                    <div class="history-item-header">
                        <span class="history-item-type ${entry.calculationResult.type}">
                            ${typeLabel}
                        </span>
                        <span class="history-item-date">${formattedDate}</span>
                    </div>
                    <div class="history-item-body">
                        <div class="history-item-amount">
                            ¥${entry.calculationResult.perPerson.toLocaleString()}
                            <div class="history-item-detail">
                                一人あたり
                            </div>
                        </div>
                        <div class="history-item-amount">
                            ¥${entry.calculationResult.total.toLocaleString()}
                            <div class="history-item-detail">
                                総額（${entry.calculationResult.count}人）
                            </div>
                        </div>
                    </div>
                    ${entry.calculationResult.remainder > 0 ? `
                        <div class="history-item-detail">
                            余り: ¥${entry.calculationResult.remainder.toLocaleString()}
                        </div>
                    ` : ''}
                    ${entry.note ? `
                        <div class="history-item-note">
                            📝 ${entry.note}
                        </div>
                    ` : ''}
                    <div class="history-item-actions">
                        <button class="history-item-btn reuse" data-action="reuse" data-id="${entry.id}">
                            再利用
                        </button>
                        <button class="history-item-btn delete" data-action="delete" data-id="${entry.id}">
                            削除
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // イベントを再設定
        this.bindItemEvents();
    }

    /**
     * 履歴アイテムのイベントを設定
     *
     * @description
     * 各履歴アイテムのボタンにイベントを設定します。
     */
    bindItemEvents() {
        const listContainer = this.container.querySelector('[data-container="list"]');

        listContainer.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const id = e.target.dataset.id;

            if (action === 'reuse') {
                e.stopPropagation();
                this.reuseHistory(id);
            } else if (action === 'delete') {
                e.stopPropagation();
                this.deleteHistory(id);
            } else if (e.target.closest('.history-item')) {
                const itemId = e.target.closest('.history-item').dataset.id;
                this.selectHistory(itemId);
            }
        });
    }

    /**
     * 履歴を再利用
     *
     * @description
     * 選択された履歴のデータをフォームに設定します。
     *
     * @param {string} id - 履歴ID
     */
    reuseHistory(id) {
        const entry = historyStorage.getHistoryItem(id);
        if (!entry) return;

        const result = entry.calculationResult;

        // フォームに値を設定
        const priceInput = document.getElementById('price');
        const countInput = document.getElementById('count');

        if (priceInput) priceInput.value = result.total;
        if (countInput) countInput.value = result.count;

        // イベントを発火
        if (this.options.onHistorySelect) {
            this.options.onHistorySelect(entry);
        }

        // 成功フィードバック
        this.showFeedback('計算を再利用しました');

        // 履歴を閉じる
        this.hide();
    }

    /**
     * 履歴を選択
     *
     * @description
     * 履歴アイテムがクリックされたときの処理。
     *
     * @param {string} id - 履歴ID
     */
    selectHistory(id) {
        const entry = historyStorage.getHistoryItem(id);
        if (!entry) return;

        // 選択状態を切り替え
        const item = this.container.querySelector(`[data-id="${id}"]`);
        if (item) {
            item.classList.toggle('selected');
        }
    }

    /**
     * 履歴を削除
     *
     * @description
     * 指定された履歴を削除します。
     *
     * @param {string} id - 履歴ID
     */
    deleteHistory(id) {
        if (!confirm('この履歴を削除してもよろしいですか？')) {
            return;
        }

        const success = historyStorage.deleteHistoryItem(id);
        if (success) {
            this.showFeedback('履歴を削除しました');
            this.loadHistory(); // 再読み込み

            if (this.options.onHistoryDelete) {
                this.options.onHistoryDelete(id);
            }
        } else {
            this.showFeedback('削除に失敗しました', 'error');
        }
    }

    /**
     * 全履歴を削除
     *
     * @description
     * すべての履歴を削除します。
     */
    clearAllHistory() {
        if (!confirm('本当にすべての履歴を削除してもよろしいですか？\nこの操作は元に戻せません。')) {
            return;
        }

        historyStorage.clearHistory();
        this.showFeedback('すべての履歴を削除しました');
        this.loadHistory(); // 再読み込み
    }

    /**
     * ページネーションを描画
     *
     * @description
     * ページネーションボタンを生成します。
     */
    renderPagination() {
        const paginationContainer = this.container.querySelector('[data-container="pagination"]');

        // 総エントリ数を取得
        const totalEntries = historyStorage.getHistory({ limit: 1000 }).length;
        const totalPages = Math.ceil(totalEntries / this.itemsPerPage);

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // 前へボタン
        paginationHTML += `
            <button class="pagination-btn"
                    data-page="${this.currentPage - 1}"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                前へ
            </button>
        `;

        // ページ番号
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}"
                        data-page="${i}">
                    ${i}
                </button>
            `;
        }

        // 次へボタン
        paginationHTML += `
            <button class="pagination-btn"
                    data-page="${this.currentPage + 1}"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                次へ
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;

        // ページネーションイベント
        paginationContainer.addEventListener('click', (e) => {
            if (e.target.dataset.page) {
                const page = parseInt(e.target.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    this.loadHistory();
                }
            }
        });
    }

    /**
     * 統計情報を描画
     *
     * @description
     * 履歴の統計情報を表示します。
     */
    renderStatistics() {
        const statsContainer = this.container.querySelector('[data-container="stats"]');
        const stats = historyStorage.getStatistics();

        statsContainer.innerHTML = `
            合計 ${stats.totalEntries}件 |
            平均額 ¥${stats.averageAmount.toLocaleString()}
        `;
    }

    /**
     * ローディング表示
     *
     * @description
     * ローディングインジケーターを表示します。
     */
    showLoading() {
        const listContainer = this.container.querySelector('[data-container="list"]');
        const emptyState = this.container.querySelector('[data-state="empty"]');
        const loadingState = this.container.querySelector('[data-state="loading"]');

        listContainer.style.display = 'none';
        emptyState.style.display = 'none';
        loadingState.style.display = 'block';
    }

    /**
     * フィードバックを表示
     *
     * @description
     |* 操作結果のフィードバックを表示します。
     *
     * @param {string} message - メッセージ
     * @param {string} [type='success'] - メッセージタイプ
     */
    showFeedback(message, type = 'success') {
        // トースト通知を実装
        const toast = document.createElement('div');
        toast.className = `history-toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            background: ${type === 'success' ? '#4caf50' : '#f44336'};
            color: white;
            font-size: 0.9rem;
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }

    /**
     * 履歴リストを表示
     *
     * @description
     * 履歴リストを表示します。
     */
    show() {
        this.container.style.display = 'block';
        this.loadHistory();
    }

    /**
     * 居歴リストを非表示
     *
     * @description
     * 履歴リストを非表示にします。
     */
    hide() {
        this.container.style.display = 'none';
    }

    /**
     * 計算タイプラベルを取得
     *
     * @description
     * 計算タイプの日本語ラベルを返します。
     *
     * @param {string} type - 計算タイプ
     * @returns {string} 日本語ラベル
     */
    getTypeLabel(type) {
        const labels = {
            equal: '均等割り',
            organizer_more: '幹事多め',
            organizer_less: '幹事少なめ',
            organizer_fixed: '幹事固定'
        };
        return labels[type] || '均等割り';
    }

    /**
     * 日付をフォーマット
     *
     * @description
     * 日付を表示用にフォーマットします。
     *
     * @param {Date} date - 日付オブジェクト
     * @returns {string} フォーマットされた日付文字列
     */
    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return minutes === 0 ? 'たった今' : `${minutes}分前`;
            }
            return `${hours}時間前`;
        } else if (days === 1) {
            return '昨日';
        } else if (days < 7) {
            return `${days}日前`;
        } else {
            return date.toLocaleDateString('ja-JP');
        }
    }

    /**
     * リフレッシュ
     *
     * @description
     * 履歴データを再読み込みします。
     */
    refresh() {
        this.loadHistory();
    }
}

// エクスポート
export { HistoryList };