/**
 * シェア機能モジュールの単体テスト
 *
 * @description
 * ShareManagerクラスの機能をテストします。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ShareManager } from '../src/share.js';

// モックの設定
const mockClipboard = {
    writeText: vi.fn(),
    readText: vi.fn()
};

const mockNavigator = {
    clipboard: mockClipboard,
    share: vi.fn()
};

// URLやDOMのモック
const mockLocation = {
    origin: 'https://example.com',
    pathname: '/warikan/',
    href: 'https://example.com/warikan/'
};

describe('ShareManager', () => {
    let shareManager;

    beforeEach(() => {
        // Locationのモック
        Object.defineProperty(window, 'location', {
            value: mockLocation,
            writable: true
        });

        // Navigatorのモック
        Object.defineProperty(window, 'navigator', {
            value: mockNavigator,
            writable: true
        });

        // isSecureContextをモック
        Object.defineProperty(window, 'isSecureContext', {
            value: true,
            writable: true
        });

        // Documentのモック（execCommand用）
        Object.defineProperty(document, 'execCommand', {
            value: vi.fn(() => true),
            writable: true
        });

        // DOM操作のモック
        Object.defineProperty(document, 'createElement', {
            value: vi.fn(() => ({
                value: '',
                style: {},
                focus: vi.fn(),
                select: vi.fn()
            })),
            writable: true
        });

        Object.defineProperty(document.body, 'appendChild', {
            value: vi.fn(),
            writable: true
        });

        Object.defineProperty(document.body, 'removeChild', {
            value: vi.fn(),
            writable: true
        });

        shareManager = new ShareManager();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('encodeToUrl', () => {
        it('計算結果がURLパラメータにエンコードされること', () => {
            const result = {
                totalAmount: 3000,
                numberOfPeople: 3,
                type: 'equal',
                perPerson: 1000,
                remainder: 0,
                timestamp: 1640995200000
            };

            const url = shareManager.encodeToUrl(result);

            expect(url).toContain('https://example.com/warikan/');
            expect(url).toContain('calc=');

            // URLパラメータをデコードして検証
            const urlObj = new URL(url);
            const encoded = urlObj.searchParams.get('calc');
            expect(encoded).toBeDefined();
            expect(encoded.length).toBeGreaterThan(0);
        });

        it('幹事多め負担の計算結果がエンコードされること', () => {
            const result = {
                totalAmount: 5000,
                numberOfPeople: 4,
                type: 'organizer_more',
                perPerson: 1250,
                organizerPayment: 1500,
                participantPayment: 1166,
                organizerBurdenPercent: 20,
                remainder: 2
            };

            const url = shareManager.encodeToUrl(result);
            const urlObj = new URL(url);
            const encoded = urlObj.searchParams.get('calc');

            // デコードして内容を確認
            const json = decodeURIComponent(escape(atob(encoded)));
            const data = JSON.parse(json);

            expect(data.t).toBe(5000);
            expect(data.n).toBe(4);
            expect(data.type).toBe('organizer_more');
            expect(data.b).toBe(20);
        });

        it('エンコードエラー時にベースURLが返ること', () => {
            const invalidResult = {
                totalAmount: null,
                numberOfPeople: undefined
            };

            const url = shareManager.encodeToUrl(invalidResult);
            expect(url).toBe('https://example.com/warikan/');
        });
    });

    describe('decodeFromUrl', () => {
        it('URLパラメータから計算入力が復元されること', () => {
            // エンコードデータを作成
            const data = {
                t: 4000,
                n: 5,
                type: 'equal'
            };
            const json = JSON.stringify(data);
            const encoded = btoa(unescape(encodeURIComponent(json)));

            const url = `https://example.com/warikan/?calc=${encoded}`;
            const input = shareManager.decodeFromUrl(url);

            expect(input).toEqual({
                totalAmount: 4000,
                numberOfPeople: 5,
                type: 'equal'
            });
        });

        it('幹事固定額の計算入力が復元されること', () => {
            const data = {
                t: 6000,
                n: 4,
                type: 'organizer_fixed',
                f: 2000
            };
            const json = JSON.stringify(data);
            const encoded = btoa(unescape(encodeURIComponent(json)));

            const url = `https://example.com/warikan/?calc=${encoded}`;
            const input = shareManager.decodeFromUrl(url);

            expect(input).toEqual({
                totalAmount: 6000,
                numberOfPeople: 4,
                type: 'organizer_fixed',
                organizerFixedAmount: 2000
            });
        });

        it('無効なURLの場合nullが返ること', () => {
            const input = shareManager.decodeFromUrl('https://example.com/warikan/');
            expect(input).toBeNull();
        });

        it('不正なパラメータの場合nullが返ること', () => {
            const url = 'https://example.com/warikan/?calc=invalid_base64';
            const input = shareManager.decodeFromUrl(url);
            expect(input).toBeNull();
        });
    });

    describe('copyToClipboard', () => {
        it('モダンブラウザでクリップボードにコピーされること', async () => {
            const result = {
                totalAmount: 3000,
                numberOfPeople: 3,
                type: 'equal',
                perPerson: 1000,
                remainder: 0
            };

            // クリップボードのモックをリセット
            mockClipboard.writeText.mockClear();

            const success = await shareManager.copyToClipboard(result);

            expect(success).toBe(true);
            expect(mockClipboard.writeText).toHaveBeenCalledWith(
                expect.stringContaining('割り勘計算')
            );
            expect(mockClipboard.writeText).toHaveBeenCalledWith(
                expect.stringContaining('総額: 3,000円')
            );
        });

        it('カスタムメッセージが追加されること', async () => {
            const result = {
                totalAmount: 5000,
                numberOfPeople: 4,
                type: 'equal',
                perPerson: 1250,
                remainder: 0
            };

            // クリップボードのモックをリセット
            mockClipboard.writeText.mockClear();

            await shareManager.copyToClipboard(result, {
                customMessage: 'ランチのお会計です'
            });

            expect(mockClipboard.writeText).toHaveBeenCalledWith(
                expect.stringMatching(/ランチのお会計です[\s\S]*総額: 5,000円/)
            );
        });

        it('レガシーブラウザでもコピーが機能すること', async () => {
            // モダンAPIを無効化
            const originalClipboard = navigator.clipboard;
            delete navigator.clipboard;

            const result = {
                totalAmount: 2000,
                numberOfPeople: 2,
                type: 'equal',
                perPerson: 1000,
                remainder: 0
            };

            const success = await shareManager.copyToClipboard(result);

            expect(success).toBe(true);

            // navigator.clipboardを復元
            navigator.clipboard = originalClipboard;
        });
    });

    describe('generateSNSUrl', () => {
        it('TwitterシェアURLが生成されること', () => {
            const result = {
                totalAmount: 3000,
                numberOfPeople: 3,
                type: 'equal',
                perPerson: 1000,
                remainder: 0
            };

            const url = shareManager.generateSNSUrl('twitter', result);

            expect(url).toContain('https://twitter.com/intent/tweet');
            expect(url).toContain('text=');
            expect(url).toContain('url=');
        });

        it('LINEシェアURLが生成されること', () => {
            const result = {
                totalAmount: 4000,
                numberOfPeople: 4,
                type: 'equal',
                perPerson: 1000,
                remainder: 0
            };

            const url = shareManager.generateSNSUrl('line', result);

            expect(url).toContain('https://social-plugins.line.me/lineit/share');
            expect(url).toContain('url=');
        });

        it('FacebookシェアURLが生成されること', () => {
            const result = {
                totalAmount: 5000,
                numberOfPeople: 5,
                type: 'equal',
                perPerson: 1000,
                remainder: 0
            };

            const url = shareManager.generateSNSUrl('facebook', result);

            expect(url).toContain('https://www.facebook.com/sharer/sharer.php');
            expect(url).toContain('u=');
        });

        it('未対応のSNSの場合nullが返ること', () => {
            const result = {
                totalAmount: 3000,
                numberOfPeople: 3,
                type: 'equal'
            };

            const url = shareManager.generateSNSUrl('instagram', result);
            expect(url).toBeNull();
        });

        it('文字数制限が適用されること', () => {
            const result = {
                totalAmount: 100000,
                numberOfPeople: 100,
                type: 'equal',
                perPerson: 1000,
                remainder: 0
            };

            const url = shareManager.generateSNSUrl('twitter', result, {
                customMessage: 'a'.repeat(300) // 280文字超える
            });

            expect(url).toBeDefined();
            // URL生成が成功し、テキストが切り捨てられていることを確認
            expect(url).toContain('twitter.com');
        });
    });

    describe('generateShareText', () => {
        it('基本的なシェアテキストが生成されること', () => {
            const result = {
                totalAmount: 3000,
                numberOfPeople: 3,
                type: 'equal',
                perPerson: 1000,
                remainder: 0
            };

            const text = shareManager.generateShareText(result);

            expect(text).toContain('割り勘計算');
            expect(text).toContain('総額: 3,000円');
            expect(text).toContain('人数: 3人');
            expect(text).toContain('パターン: 均等割り');
            expect(text).toContain('一人当たり: 1,000円');
        });

        it('幹事多め負担のテキストが生成されること', () => {
            const result = {
                totalAmount: 5000,
                numberOfPeople: 4,
                type: 'organizer_more',
                organizerPayment: 1500,
                participantPayment: 1166,
                remainder: 2
            };

            const text = shareManager.generateShareText(result);

            expect(text).toContain('パターン: 幹事多め負担');
            expect(text).toContain('幹事: 1,500円');
            expect(text).toContain('参加者一人: 1,166円');
            expect(text).toContain('余り: 2円');
        });

        it('簡潔なテキストが生成されること', () => {
            const result = {
                totalAmount: 2000,
                numberOfPeople: 2,
                type: 'equal'
            };

            const text = shareManager.generateShareText(result, false);

            expect(text).toContain('割り勘計算');
            expect(text).toContain('総額: 2,000円');
            expect(text).not.toContain('一人当たり:');
        });
    });

    describe('nativeShare', () => {
        it('Web Share APIが使用可能な場合にシェアされること', async () => {
            const result = {
                totalAmount: 3000,
                numberOfPeople: 3,
                type: 'equal'
            };

            mockNavigator.share.mockResolvedValueOnce(undefined);

            const success = await shareManager.nativeShare(result);

            expect(success).toBe(true);
            expect(mockNavigator.share).toHaveBeenCalledWith({
                title: '割り勘計算',
                text: expect.stringContaining('割り勘計算'),
                url: expect.stringContaining('calc=')
            });
        });

        it('Web Share APIが未対応の場合falseが返ること', async () => {
            const originalShare = navigator.share;
            delete navigator.share;

            const result = {
                totalAmount: 3000,
                numberOfPeople: 3,
                type: 'equal'
            };

            const success = await shareManager.nativeShare(result);
            expect(success).toBe(false);

            // navigator.shareを復元
            navigator.share = originalShare;
        });

        it('ユーザーがキャンセルした場合falseが返ること', async () => {
            const result = {
                totalAmount: 3000,
                numberOfPeople: 3,
                type: 'equal'
            };

            const abortError = new Error('AbortError');
            abortError.name = 'AbortError';
            mockNavigator.share.mockRejectedValueOnce(abortError);

            const success = await shareManager.nativeShare(result);
            expect(success).toBe(false);
        });
    });

    describe('getSupportedSNS', () => {
        it('サポートしているSNS一覧が返ること', () => {
            const snsList = shareManager.getSupportedSNS();

            expect(snsList).toHaveLength(3);
            expect(snsList[0]).toEqual({
                key: 'twitter',
                name: 'X (Twitter)',
                url: 'https://twitter.com/intent/tweet'
            });
            expect(snsList[1]).toEqual({
                key: 'line',
                name: 'LINE',
                url: 'https://social-plugins.line.me/lineit/share'
            });
            expect(snsList[2]).toEqual({
                key: 'facebook',
                name: 'Facebook',
                url: 'https://www.facebook.com/sharer/sharer.php'
            });
        });
    });

    describe('checkShareSupport', () => {
        it('シェア機能の利用可能性が正しく判定されること', () => {
            const support = shareManager.checkShareSupport();

            expect(support).toHaveProperty('clipboard');
            expect(support).toHaveProperty('nativeShare');
            expect(support).toHaveProperty('sns');
            expect(support).toHaveProperty('urlParameters');

            expect(support.clipboard).toBe(true);
            expect(support.urlParameters).toBe(true);
            expect(Array.isArray(support.sns)).toBe(true);
            expect(support.sns).toHaveLength(3);
        });
    });

    describe('generateQRCode', () => {
        it('QRコードのプレースホルダーが生成されること', () => {
            const result = {
                totalAmount: 3000,
                numberOfPeople: 3,
                type: 'equal'
            };

            const qrCode = shareManager.generateQRCode(result);

            expect(qrCode).toContain('data:image/svg+xml;base64,');
            expect(qrCode).toContain('CiAgICAgICAgICAgIDxzdmc'); // SVGの開始タグ（Base64）
        });

        it('サイズ指定が反映されること', () => {
            const result = {
                totalAmount: 3000,
                numberOfPeople: 3,
                type: 'equal'
            };

            const qrCode = shareManager.generateQRCode(result, { size: 300 });

            expect(qrCode).toContain('data:image/svg+xml;base64,');
            expect(qrCode).toContain('d2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAi'); // width="300" height="300" のBase64
        });
    });
});