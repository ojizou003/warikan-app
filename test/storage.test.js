/**
 * LocalStorageモジュールの単体テスト
 *
 * @description
 * HistoryStorageクラスの機能をテストします。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HistoryStorage } from '../src/storage.js';

// LocalStorageのモック
const localStorageMock = (() => {
    let store = {};

    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index) => Object.keys(store)[index] || null)
    };
})();

// モックを設定
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('HistoryStorage', () => {
    let storage;

    beforeEach(() => {
        // 各テスト前にLocalStorageをクリア
        localStorageMock.clear();
        vi.clearAllMocks();
        storage = new HistoryStorage();
    });

    afterEach(() => {
        // 各テスト後にLocalStorageをクリア
        localStorageMock.clear();
    });

    describe('初期化', () => {
        it('新しいストレージが正しく初期化されること', () => {
            const data = storage.getStorageData();
            expect(data).toBeDefined();
            expect(data.version).toBe('1.0.0');
            expect(data.entries).toEqual([]);
            expect(data.settings.maxEntries).toBe(50);
        });

        it('既存データが存在する場合、マイグレーションが実行されること', () => {
            // 古い形式のデータを設定
            const oldData = [
                {
                    perPerson: 1000,
                    remainder: 0,
                    total: 3000,
                    count: 3,
                    timestamp: Date.now()
                }
            ];
            localStorageMock.setItem(storage.storageKey, JSON.stringify(oldData));

            const newStorage = new HistoryStorage();
            const data = newStorage.getStorageData();

            expect(data.entries).toHaveLength(1);
            expect(data.entries[0].calculationResult.type).toBe('equal');
            expect(data.entries[0].id).toBeDefined();
            expect(data.metadata.migrated).toBe(true);
        });
    });

    describe('saveCalculation', () => {
        it('計算結果が正しく保存されること', () => {
            const result = {
                perPerson: 1000,
                remainder: 0,
                total: 3000,
                count: 3,
                type: 'equal'
            };

            const id = storage.saveCalculation(result, 'テストメモ');

            expect(id).toBeDefined();
            expect(typeof id).toBe('string');

            const data = storage.getStorageData();
            expect(data.entries).toHaveLength(1);
            expect(data.entries[0].calculationResult).toEqual(result);
            expect(data.entries[0].note).toBe('テストメモ');
            expect(data.entries[0].tags).toContain('small_group');
        });

        it('最大件数を超える場合、古いエントリが削除されること', () => {
            // 最大件数を少なく設定
            storage.maxEntries = 3;

            // 4件のデータを保存
            for (let i = 0; i < 4; i++) {
                storage.saveCalculation({
                    perPerson: 1000,
                    remainder: 0,
                    total: 3000,
                    count: 3
                });
            }

            const data = storage.getStorageData();
            expect(data.entries).toHaveLength(3);
        });

        it('メタデータが正しく更新されること', () => {
            const result = {
                perPerson: 1000,
                remainder: 0,
                total: 3000,
                count: 3
            };

            const beforeModified = storage.getStorageData().metadata.lastModified;
            storage.saveCalculation(result);
            const afterModified = storage.getStorageData().metadata.lastModified;

            expect(afterModified).toBeGreaterThan(beforeModified);
        });
    });

    describe('getHistory', () => {
        beforeEach(() => {
            // テストデータを追加
            const testData = [
                {
                    perPerson: 1000,
                    remainder: 0,
                    total: 3000,
                    count: 3,
                    type: 'equal',
                    timestamp: Date.now() - 86400000 // 1日前
                },
                {
                    perPerson: 1500,
                    remainder: 100,
                    total: 4600,
                    count: 3,
                    type: 'organizer_more',
                    timestamp: Date.now() - 3600000 // 1時間前
                },
                {
                    perPerson: 2000,
                    remainder: 0,
                    total: 8000,
                    count: 4,
                    type: 'organizer_fixed',
                    timestamp: Date.now() // 現在
                }
            ];

            testData.forEach(data => {
                storage.saveCalculation(data);
            });
        });

        it('全履歴が取得できること', () => {
            const history = storage.getHistory();
            expect(history).toHaveLength(3);
            expect(history[0].calculationResult.total).toBe(8000); // 新しい順
        });

        it('タイプでフィルタリングできること', () => {
            const equalHistory = storage.getHistory({ type: 'equal' });
            expect(equalHistory).toHaveLength(1);
            expect(equalHistory[0].calculationResult.type).toBe('equal');
        });

        it('ページネーションが機能すること', () => {
            const pagedHistory = storage.getHistory({ limit: 2, offset: 0 });
            expect(pagedHistory).toHaveLength(2);

            const secondPage = storage.getHistory({ limit: 2, offset: 2 });
            expect(secondPage).toHaveLength(1);
        });

        it('日付範囲でフィルタリングできること', () => {
            const now = Date.now();
            const todayHistory = storage.getHistory({
                dateFrom: now - 7200000 // 2時間前から
            });

            expect(todayHistory).toHaveLength(2); // 1時間前と現在
        });
    });

    describe('getHistoryItem', () => {
        it('指定されたIDの履歴が取得できること', () => {
            const result = {
                perPerson: 1000,
                remainder: 0,
                total: 3000,
                count: 3,
                type: 'equal',
                timestamp: Date.now()
            };

            const id = storage.saveCalculation(result);
            const item = storage.getHistoryItem(id);

            expect(item).toBeDefined();
            expect(item.calculationResult).toEqual(result);
            expect(item.id).toBe(id);
        });

        it('存在しないIDの場合nullが返ること', () => {
            const item = storage.getHistoryItem('non-existent-id');
            expect(item).toBeNull();
        });
    });

    describe('deleteHistoryItem', () => {
        it('指定された履歴が削除できること', () => {
            const result = {
                perPerson: 1000,
                remainder: 0,
                total: 3000,
                count: 3
            };

            const id = storage.saveCalculation(result);
            expect(storage.getHistory()).toHaveLength(1);

            const deleted = storage.deleteHistoryItem(id);
            expect(deleted).toBe(true);
            expect(storage.getHistory()).toHaveLength(0);
        });

        it('存在しないIDの場合falseが返ること', () => {
            const deleted = storage.deleteHistoryItem('non-existent-id');
            expect(deleted).toBe(false);
        });
    });

    describe('clearHistory', () => {
        it('全履歴が削除されること', () => {
            storage.saveCalculation({
                perPerson: 1000,
                remainder: 0,
                total: 3000,
                count: 3
            });

            storage.saveCalculation({
                perPerson: 1500,
                remainder: 100,
                total: 4600,
                count: 3
            });

            expect(storage.getHistory()).toHaveLength(2);

            storage.clearHistory();
            expect(storage.getHistory()).toHaveLength(0);
        });
    });

    describe('exportHistory', () => {
        it('履歴がJSON形式でエクスポートされること', () => {
            storage.saveCalculation({
                perPerson: 1000,
                remainder: 0,
                total: 3000,
                count: 3
            });

            const exported = storage.exportHistory();
            const parsed = JSON.parse(exported);

            expect(parsed.version).toBe('1.0.0');
            expect(parsed.entries).toHaveLength(1);
            expect(parsed.exportedAt).toBeDefined();
        });
    });

    describe('importHistory', () => {
        it('JSONデータが正常にインポートされること', () => {
            const importData = {
                version: '1.0.0',
                entries: [
                    {
                        id: 'test-id',
                        calculationResult: {
                            perPerson: 2000,
                            remainder: 0,
                            total: 6000,
                            count: 3,
                            type: 'equal'
                        },
                        note: 'インポートテスト',
                        tags: [],
                        createdAt: Date.now()
                    }
                ]
            };

            const success = storage.importHistory(JSON.stringify(importData));
            expect(success).toBe(true);

            const history = storage.getHistory();
            expect(history).toHaveLength(1);
            expect(history[0].note).toBe('インポートテスト');
        });

        it('無効なJSONの場合falseが返ること', () => {
            const success = storage.importHistory('invalid json');
            expect(success).toBe(false);
        });

        it('マージオプションが機能すること', () => {
            // 既存データ
            storage.saveCalculation({
                perPerson: 1000,
                remainder: 0,
                total: 3000,
                count: 3
            });

            const importData = {
                version: '1.0.0',
                entries: [
                    {
                        id: 'new-id',
                        calculationResult: {
                            perPerson: 2000,
                            remainder: 0,
                            total: 6000,
                            count: 3,
                            type: 'equal'
                        },
                        note: '新規データ',
                        tags: [],
                        createdAt: Date.now()
                    }
                ]
            };

            storage.importHistory(JSON.stringify(importData), { merge: true });
            const history = storage.getHistory();
            expect(history).toHaveLength(2);
        });
    });

    describe('getStatistics', () => {
        it('統計情報が正しく計算されること', () => {
            storage.saveCalculation({
                perPerson: 1000,
                remainder: 0,
                total: 3000,
                count: 3
            });

            storage.saveCalculation({
                perPerson: 1500,
                remainder: 0,
                total: 4500,
                count: 3
            });

            storage.saveCalculation({
                perPerson: 500,
                remainder: 0,
                total: 500,
                count: 1
            });

            const stats = storage.getStatistics();

            expect(stats.totalEntries).toBe(3);
            expect(stats.totalAmount).toBe(8000);
            expect(stats.averageAmount).toBe(2667);
            expect(stats.mostCommonType).toBe('equal');
        });

        it('空の履歴の場合デフォルト値が返ること', () => {
            const stats = storage.getStatistics();

            expect(stats.totalEntries).toBe(0);
            expect(stats.totalAmount).toBe(0);
            expect(stats.averageAmount).toBe(0);
            expect(stats.mostCommonType).toBe('equal');
            expect(stats.typeBreakdown).toEqual({});
            expect(stats.oldestEntry).toBeNull();
            expect(stats.newestEntry).toBeNull();
        });
    });

    describe('generateId', () => {
        it('一意のIDが生成されること', () => {
            const id1 = storage.generateId();
            const id2 = storage.generateId();

            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^history_\d+_[a-z0-9]+$/);
        });
    });

    describe('extractTags', () => {
        it('金額に基づくタグが抽出されること', () => {
            const highAmountResult = {
                perPerson: 5000,
                remainder: 0,
                total: 50000,
                count: 10
            };

            const lowAmountResult = {
                perPerson: 100,
                remainder: 0,
                total: 300,
                count: 3
            };

            const tags1 = storage.extractTags(highAmountResult);
            const tags2 = storage.extractTags(lowAmountResult);

            expect(tags1).toContain('high_amount');
            expect(tags1).toContain('large_group');
            expect(tags2).toContain('low_amount');
            expect(tags2).toContain('small_group');
        });

        it('余りがある場合タグが追加されること', () => {
            const resultWithRemainder = {
                perPerson: 1000,
                remainder: 50,
                total: 3050,
                count: 3
            };

            const tags = storage.extractTags(resultWithRemainder);
            expect(tags).toContain('has_remainder');
        });
    });

    describe('容量管理', () => {
        it('QuotaExceededError時に自動クリーンアップが実行されること', () => {
            // QuotaExceededErrorをシミュレート
            const originalSetItem = localStorageMock.setItem;
            let callCount = 0;

            localStorageMock.setItem = vi.fn((key, value) => {
                callCount++;
                if (callCount === 1) {
                    const error = new Error('Storage quota exceeded');
                    error.name = 'QuotaExceededError';
                    throw error;
                }
                originalSetItem(key, value);
            });

            // 多くのデータを保存
            for (let i = 0; i < 100; i++) {
                storage.saveCalculation({
                    perPerson: 1000,
                    remainder: 0,
                    total: 3000,
                    count: 3
                });
            }

            expect(localStorageMock.setItem).toHaveBeenCalled();
            expect(callCount).toBeGreaterThan(1);
        });
    });

    describe('エラーハンドリング', () => {
        it('LocalStorageアクセスエラー時に適切に処理されること', () => {
            // LocalStorageを無効化
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: vi.fn(() => {
                        throw new Error('Storage disabled');
                    }),
                    setItem: vi.fn(() => {
                        throw new Error('Storage disabled');
                    })
                }
            });

            const errorStorage = new HistoryStorage();
            const data = errorStorage.getStorageData();
            expect(data).toBeNull();

            const success = errorStorage.saveCalculation({
                perPerson: 1000,
                remainder: 0,
                total: 3000,
                count: 3
            });
            expect(success).toBe(false);
        });
    });
});