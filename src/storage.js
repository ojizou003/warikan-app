/**
 * LocalStorage管理モジュール
 *
 * @description
 * 割り勘計算の履歴をLocalStorageに保存・管理する機能を提供します。
 * CRUD操作、データマイグレーション、容量管理を実装します。
 *
 * @module Storage
 * @version 1.0.0
 */

"use strict";

/**
 * 履歴ストレージ管理クラス
 *
 * @class
 * @classdesc
 * 計算履歴の保存、取得、削除、管理を行うクラス。
 * LocalStorageの容量管理やデータマイグレーションも実装します。
 */
class HistoryStorage {
    /**
     * コンストラクタ
     *
     * @description
     * ストレージキーと最大保存件数を初期化します。
     */
    constructor() {
        /** @type {string} LocalStorageのキー名 */
        this.storageKey = 'warikan_history';

        /** @type {number} 最大保存件数 */
        this.maxEntries = 50;

        /** @type {string} 現在のデータバージョン */
        this.version = '1.0.0';

        /** @type {number} 最大容量（バイト） */
        this.maxStorageSize = 5 * 1024 * 1024; // 5MB

        // 初期化
        this.initialize();
    }

    /**
     * ストレージの初期化
     *
     * @description
     * LocalStorageの初期化とマイグレーションを行います。
     *
     * @returns {void}
     */
    initialize() {
        if (!this.getStorageData()) {
            // 初期データ構造を作成
            const initialData = {
                version: this.version,
                entries: [],
                settings: {
                    maxEntries: this.maxEntries,
                    autoCleanup: true
                },
                metadata: {
                    createdAt: Date.now(),
                    lastModified: Date.now()
                }
            };
            this.setStorageData(initialData);
        } else {
            // マイグレーション処理
            this.migrate();
        }
    }

    /**
     * 計算結果を保存
     *
     * @description
     * 計算結果を履歴として保存します。
     * 最大件数を超える場合は古いものから削除します。
     *
     * @param {CalculationResultExtended} result - 計算結果オブジェクト
     * @param {string} [note=''] - ユーザーメモ
     * @returns {string} 保存した履歴のID
     */
    saveCalculation(result, note = '') {
        const data = this.getStorageData();

        // 履歴の先頭に追加
        if (!data.entries) {
            data.entries = [];
        }

        // 新しい履歴エントリを作成
        const entry = {
            id: this.generateId(),
            calculationResult: {
                ...result,
                type: result.type || 'equal', // 計算タイプ
                timestamp: result.timestamp || Date.now() // 既存のtimestampを保持
            },
            note: note,
            tags: this.extractTags(result), // タグ抽出（将来拡張用）
            createdAt: Date.now()
        };

        // 履歴の先頭に追加
        data.entries.unshift(entry);

        // 最大件数を超える場合は削除
        if (data.entries.length > this.maxEntries) {
            data.entries = data.entries.slice(0, this.maxEntries);
        }

        // メタデータを更新
        data.metadata.lastModified = Date.now();

        // 保存
        this.setStorageData(data);

        // 容量チェック
        this.checkStorageCapacity();

        return entry.id;
    }

    /**
     * 履歴一覧を取得
     *
     * @description
     * 保存されている履歴一覧を取得します。
     *
     * @param {Object} [options={}] - 取得オプション
     * @param {number} [options.limit=20] - 取得件数
     * @param {number} [options.offset=0] - 取得開始位置
     * @param {string} [options.type] - 計算タイプでフィルタ
     * @param {number} [options.dateFrom] - 日付フィルタ（開始）
     * @param {number} [options.dateTo] - 日付フィルタ（終了）
     * @returns {Array<HistoryEntry>} 履歴エントリの配列
     */
    getHistory(options = {}) {
        const data = this.getStorageData();
        if (!data || !data.entries) {
            return [];
        }

        let entries = [...data.entries];

        // フィルタリング
        if (options.type) {
            entries = entries.filter(entry =>
                entry.calculationResult.type === options.type
            );
        }

        if (options.dateFrom) {
            entries = entries.filter(entry => {
                const entryDate = new Date(entry.createdAt);
                const fromDate = new Date(options.dateFrom);
                return entryDate >= fromDate;
            });
        }

        if (options.dateTo) {
            entries = entries.filter(entry => {
                const entryDate = new Date(entry.createdAt);
                const toDate = new Date(options.dateTo);
                return entryDate <= toDate;
            });
        }

        // ページネーション
        const limit = options.limit || 20;
        const offset = options.offset || 0;

        return entries.slice(offset, offset + limit);
    }

    /**
     * 特定の履歴を取得
     *
     * @description
     * 指定されたIDの履歴エントリを取得します。
     *
     * @param {string} id - 履歴ID
     * @returns {HistoryEntry|null} 履歴エントリ（存在しない場合はnull）
     */
    getHistoryItem(id) {
        const data = this.getStorageData();
        if (!data || !data.entries) {
            return null;
        }

        return data.entries.find(entry => entry.id === id) || null;
    }

    /**
     * 履歴を削除
     *
     * @description
     * 指定されたIDの履歴を削除します。
     *
     * @param {string} id - 削除する履歴のID
     * @returns {boolean} 削除成功時true、存在しない場合false
     */
    deleteHistoryItem(id) {
        const data = this.getStorageData();
        if (!data || !data.entries) {
            return false;
        }

        const originalLength = data.entries.length;
        data.entries = data.entries.filter(entry => entry.id !== id);

        if (data.entries.length < originalLength) {
            // 削除成功
            data.metadata.lastModified = Date.now();
            this.setStorageData(data);
            return true;
        }

        return false;
    }

    /**
     * 全履歴を削除
     *
     * @description
     * すべての履歴を削除します。
     *
     * @returns {void}
     */
    clearHistory() {
        const data = this.getStorageData();
        if (data) {
            data.entries = [];
            data.metadata.lastModified = Date.now();
            this.setStorageData(data);
        }
    }

    /**
     * 履歴データをエクスポート
     *
     * @description
     * 履歴データをJSON形式でエクスポートします。
     *
     * @returns {string} JSON形式の履歴データ
     */
    exportHistory() {
        const data = this.getStorageData();
        const exportData = {
            ...data,
            exportedAt: Date.now(),
            version: this.version
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 履歴データをインポート
     *
     * @description
     * JSON形式の履歴データをインポートします。
     * 既存データとのマージも可能です。
     *
     * @param {string} jsonData - インポートするJSONデータ
     * @param {Object} [options={}] - インポートオプション
     * @param {boolean} [options.merge=true] - 既存データとマージするか
     * @returns {boolean} インポート成功時true
     */
    importHistory(jsonData, options = {}) {
        try {
            const importData = JSON.parse(jsonData);

            // データ形式のバリデーション
            if (!importData.entries || !Array.isArray(importData.entries)) {
                throw new Error('Invalid data format');
            }

            const data = this.getStorageData();
            const merge = options.merge !== false;

            if (merge && data && data.entries) {
                // マージ処理
                const existingIds = new Set(data.entries.map(e => e.id));
                const newEntries = importData.entries.filter(e => !existingIds.has(e.id));

                data.entries = [...newEntries, ...data.entries];

                // 最大件数を超える場合は調整
                if (data.entries.length > this.maxEntries) {
                    data.entries = data.entries.slice(0, this.maxEntries);
                }
            } else {
                // 完全に置き換え
                data.entries = importData.entries;
            }

            data.metadata.lastModified = Date.now();
            data.metadata.importedAt = Date.now();

            this.setStorageData(data);
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    /**
     * ストレージデータを取得
     *
     * @description
     * LocalStorageからデータを取得します。
     *
     * @returns {Object|null} ストレージデータ（存在しない場合はnull）
     */
    getStorageData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to get storage data:', error);
            // エラー時は初期データ構造を返す
            return {
                version: this.version,
                entries: [],
                settings: {
                    maxEntries: this.maxEntries,
                    autoCleanup: true
                },
                metadata: {
                    createdAt: Date.now(),
                    lastModified: Date.now()
                }
            };
        }
    }

    /**
     * ストレージデータを保存
     *
     * @description
     * LocalStorageにデータを保存します。
     *
     * @param {Object} data - 保存するデータ
     * @returns {boolean} 保存成功時true
     */
    setStorageData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to set storage data:', error);

            // 容量不足の場合は自動クリーンアップ
            if (error.name === 'QuotaExceededError') {
                this.cleanupOldData();
                // 再試行
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(data));
                    return true;
                } catch (retryError) {
                    console.error('Retry failed:', retryError);
                }
            }

            return false;
        }
    }

    /**
     * 一意のIDを生成
     *
     * @description
     * タイムスタンプとランダム値を使用して一意のIDを生成します。
     *
     * @returns {string} 生成されたID
     */
    generateId() {
        return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * タグを抽出
     *
     * @description
     * 計算結果から特徴的なタグを抽出します（将来拡張用）。
     *
     * @param {CalculationResultExtended} result - 計算結果
     * @returns {Array<string>} タグ配列
     */
    extractTags(result) {
        const tags = [];

        // 金額に基づくタグ
        if (result.total >= 10000) {
            tags.push('high_amount');
        } else if (result.total <= 1000) {
            tags.push('low_amount');
        }

        // 人数に基づくタグ
        if (result.count >= 10) {
            tags.push('large_group');
        } else if (result.count <= 3) {
            tags.push('small_group');
        }

        // 余りがある場合
        if (result.remainder > 0) {
            tags.push('has_remainder');
        }

        return tags;
    }

    /**
     * データマイグレーション
     *
     * @description
     * 旧バージョンのデータを新しい形式にマイグレーションします。
     *
     * @returns {void}
     */
    migrate() {
        const data = this.getStorageData();
        if (!data) return;

        // バージョン比較
        if (data.version !== this.version) {
            // マイグレーション処理
            if (!data.entries) {
                // 古い形式（単純な配列）からのマイグレーション
                if (Array.isArray(data)) {
                    const newData = {
                        version: this.version,
                        entries: data.map((item, index) => ({
                            id: `migrated_${index}`,
                            calculationResult: {
                                ...item,
                                type: 'equal',
                                timestamp: item.timestamp || Date.now()
                            },
                            note: '',
                            tags: [],
                            createdAt: item.timestamp || Date.now()
                        })),
                        settings: {
                            maxEntries: this.maxEntries,
                            autoCleanup: true
                        },
                        metadata: {
                            createdAt: Date.now(),
                            lastModified: Date.now(),
                            migrated: true
                        }
                    };
                    this.setStorageData(newData);
                }
            }

            // バージョンを更新
            data.version = this.version;
            this.setStorageData(data);
        }
    }

    /**
     * 容量をチェック
     *
     * @description
     * LocalStorageの使用容量をチェックし、警告を表示します。
     *
     * @returns {void}
     */
    checkStorageCapacity() {
        try {
            const data = localStorage.getItem(this.storageKey);
            const size = new Blob([data]).size;
            const usagePercent = (size / this.maxStorageSize) * 100;

            if (usagePercent > 80) {
                console.warn(`Storage usage is high: ${usagePercent.toFixed(2)}%`);
                this.cleanupOldData();
            }
        } catch (error) {
            console.error('Failed to check storage capacity:', error);
        }
    }

    /**
     * 古いデータをクリーンアップ
     *
     * @description
     * 古い履歴データを自動的に削除して容量を確保します。
     *
     * @returns {void}
     */
    cleanupOldData() {
        const data = this.getStorageData();
        if (!data || !data.entries) return;

        // 保存件数の半分を削除
        const targetLength = Math.floor(this.maxEntries / 2);
        if (data.entries.length > targetLength) {
            data.entries = data.entries.slice(0, targetLength);
            data.metadata.lastModified = Date.now();
            data.metadata.cleanup = true;
            this.setStorageData(data);
            console.log('Cleaned up old history entries');
        }
    }

    /**
     * 統計情報を取得
     *
     * @description
     * 履歴データの統計情報を返します。
     *
     * @returns {Object} 統計情報
     */
    getStatistics() {
        const data = this.getStorageData();
        if (!data || !data.entries || data.entries.length === 0) {
            return {
                totalEntries: 0,
                totalAmount: 0,
                averageAmount: 0,
                mostCommonType: 'equal',
                typeBreakdown: {},
                oldestEntry: null,
                newestEntry: null
            };
        }

        const entries = data.entries;
        const totalAmount = entries.reduce((sum, entry) =>
            sum + (entry.calculationResult.total || 0), 0
        );

        // 計算タイプの集計
        const typeCount = {};
        entries.forEach(entry => {
            const type = entry.calculationResult.type || 'equal';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        const mostCommonType = Object.keys(typeCount).length > 0
            ? Object.keys(typeCount).reduce((a, b) =>
                typeCount[a] > typeCount[b] ? a : b
            )
            : 'equal';

        return {
            totalEntries: entries.length,
            totalAmount: totalAmount,
            averageAmount: entries.length > 0 ? Math.round(totalAmount / entries.length) : 0,
            mostCommonType: mostCommonType,
            typeBreakdown: typeCount,
            oldestEntry: entries[entries.length - 1]?.createdAt || null,
            newestEntry: entries[0]?.createdAt || null
        };
    }
}

/**
 * 拡張計算結果の型定義
 * @typedef {Object} CalculationResultExtended
 * @property {number} perPerson - 一人当たりの金額
 * @property {number} remainder - 余り
 * @property {number} total - 総金額
 * @property {number} count - 人数
 * @property {string} [type='equal'] - 計算タイプ
 * @property {number} [organizerPayment] - 幹事の支払額
 * @property {number} [participantPayment] - 参加者の支払額
 * @property {number} timestamp - 計算日時
 */

/**
 * 履歴エントリの型定義
 * @typedef {Object} HistoryEntry
 * @property {string} id - 一意識別子
 * @property {CalculationResultExtended} calculationResult - 計算結果
 * @property {string} note - ユーザーメモ
 * @property {Array<string>} tags - タグ
 * @property {number} createdAt - 作成日時
 */

// グローバルインスタンスを作成
const historyStorage = new HistoryStorage();

// エクスポート
export { HistoryStorage, historyStorage };