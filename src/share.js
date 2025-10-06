/**
 * シェア機能モジュール
 *
 * @description
 * 計算結果のシェア機能を提供します。
 * クリップボードコピー、URLパラメータ生成、SNSシェアに対応。
 *
 * @module Share
 * @version 1.0.0
 */

"use strict";

/**
 * シェア機能管理クラス
 *
 * @class
 * @classdesc
 * 計算結果を様々な形式でシェアする機能を管理するクラス。
 */
class ShareManager {
    /**
     * コンストラクタ
     *
     * @description
     * シェア機能を初期化します。
     */
    constructor() {
        /** @type {string} ベースURL */
        this.baseUrl = window.location.origin + window.location.pathname;

        /** @type {Object} サポートしているSNS */
        this.supportedSNS = {
            twitter: {
                name: 'X (Twitter)',
                url: 'https://twitter.com/intent/tweet',
                maxLength: 280
            },
            line: {
                name: 'LINE',
                url: 'https://social-plugins.line.me/lineit/share',
                maxLength: 1000
            },
            facebook: {
                name: 'Facebook',
                url: 'https://www.facebook.com/sharer/sharer.php',
                maxLength: null
            }
        };
    }

    /**
     * 計算結果をURLパラメータとしてエンコード
     *
     * @description
     * 計算結果をBase64エンコードしてURLパラメータに変換します。
     *
     * @param {CalculationResultExtended} result - 計算結果
     * @returns {string} エンコードされたURL
     */
    encodeToUrl(result) {
        try {
            // 入力値のバリデーション
            if (!result || typeof result.totalAmount !== 'number' || typeof result.numberOfPeople !== 'number') {
                throw new Error('Invalid calculation result');
            }

            // 必要なデータを抽出
            const shareData = {
                t: result.totalAmount,
                n: result.numberOfPeople,
                type: result.type || 'equal',
                ts: result.timestamp || Date.now()
            };

            // 幹事負担パターンの追加パラメータ
            if (result.type === 'organizer_more' || result.type === 'organizer_less') {
                shareData.b = result.organizerBurdenPercent || result.organizerReductionPercent;
            } else if (result.type === 'organizer_fixed') {
                shareData.f = result.organizerFixedAmount;
            }

            // JSON文字列に変換してBase64エンコード
            const json = JSON.stringify(shareData);
            const encoded = btoa(unescape(encodeURIComponent(json)));

            // URLを生成
            const url = new URL(this.baseUrl);
            url.searchParams.set('calc', encoded);

            return url.toString();
        } catch (error) {
            console.error('URLエンコードエラー:', error);
            return this.baseUrl;
        }
    }

    /**
     * URLパラメータから計算結果を復元
     *
     * @description
     * URLパラメータから計算結果をデコードします。
     *
     * @param {string} url - デコードするURL（省略時は現在のURL）
     * @returns {CalculationInput|null} 復元された計算入力（失敗時はnull）
     */
    decodeFromUrl(url = window.location.href) {
        try {
            const urlObj = new URL(url);
            const encoded = urlObj.searchParams.get('calc');

            if (!encoded) {
                return null;
            }

            // Base64デコードの前に文字列が有効かチェック
            try {
                // テストデコードを試みる
                atob(encoded);
            } catch (e) {
                console.error('Invalid Base64 string:', e);
                return null;
            }

            // Base64デコード
            const json = decodeURIComponent(escape(atob(encoded)));
            const data = JSON.parse(json);

            // 計算入力形式に変換
            const input = {
                totalAmount: data.t,
                numberOfPeople: data.n,
                type: data.type || 'equal'
            };

            // 幹事負担パターンのパラメータを復元
            if (data.type === 'organizer_more') {
                input.organizerBurdenPercent = data.b;
            } else if (data.type === 'organizer_less') {
                input.organizerReductionPercent = data.b;
            } else if (data.type === 'organizer_fixed') {
                input.organizerFixedAmount = data.f;
            }

            return input;
        } catch (error) {
            console.error('URLデコードエラー:', error);
            return null;
        }
    }

    /**
     * クリップボードにコピー
     *
     * @description
     * 計算結果をテキスト形式でクリップボードにコピーします。
     *
     * @param {CalculationResultExtended} result - 計算結果
     * @param {Object} [options={}] - オプション
     * @param {boolean} [options.includeDetails=true] - 詳細を含めるか
     * @param {string} [options.customMessage=''] - カスタムメッセージ
     * @returns {Promise<boolean>} コピー成功時true
     */
    async copyToClipboard(result, options = {}) {
        const { includeDetails = true, customMessage = '' } = options;

        try {
            // テキストを生成
            let text = this.generateShareText(result, includeDetails);

            // カスタムメッセージを追加
            if (customMessage) {
                text = `${customMessage}\n\n${text}`;
            }

            // クリップボードにコピー
            if (navigator.clipboard && window.isSecureContext) {
                // モダンブラウザの場合
                await navigator.clipboard.writeText(text);
            } else {
                // レガシーブラウザの場合
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                const success = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (!success) {
                    throw new Error('クリップボードへのコピーに失敗しました');
                }
            }

            return true;
        } catch (error) {
            console.error('クリップボードコピーエラー:', error);
            return false;
        }
    }

    /**
     * SNSシェアURLを生成
     *
     * @description
     * 指定されたSNSのシェアURLを生成します。
     *
     * @param {string} sns - SNS名（twitter, line, facebook）
     * @param {CalculationResultExtended} result - 計算結果
     * @param {Object} [options={}] - オプション
     * @param {string} [options.customMessage=''] - カスタムメッセージ
     * @returns {string|null} シェアURL（失敗時はnull）
     */
    generateSNSUrl(sns, result, options = {}) {
        const { customMessage = '' } = options;
        const snsInfo = this.supportedSNS[sns];

        if (!snsInfo) {
            console.error(`未対応のSNS: ${sns}`);
            return null;
        }

        try {
            // シェアテキストを生成
            let text = this.generateShareText(result, false); // SNSでは簡潔に
            if (customMessage) {
                text = `${customMessage} ${text}`;
            }

            // 文字数制限をチェック
            if (snsInfo.maxLength && text.length > snsInfo.maxLength) {
                text = text.substring(0, snsInfo.maxLength - 3) + '...';
            }

            // URLを生成
            const shareUrl = this.encodeToUrl(result);
            const params = new URLSearchParams();

            switch (sns) {
                case 'twitter':
                    params.set('text', text);
                    params.set('url', shareUrl);
                    return `${snsInfo.url}?${params.toString()}`;

                case 'line':
                    params.set('url', shareUrl);
                    return `${snsInfo.url}?${params.toString()}`;

                case 'facebook':
                    params.set('u', shareUrl);
                    params.set('quote', text);
                    return `${snsInfo.url}?${params.toString()}`;

                default:
                    return null;
            }
        } catch (error) {
            console.error('SNS URL生成エラー:', error);
            return null;
        }
    }

    /**
     * シェア用テキストを生成
     *
     * @description
     * 計算結果の人間が読めるテキストを生成します。
     *
     * @param {CalculationResultExtended} result - 計算結果
     * @param {boolean} [includeDetails=true] - 詳細を含めるか
     * @returns {string} 生成されたテキスト
     */
    generateShareText(result, includeDetails = true) {
        const typeLabels = {
            equal: '均等割り',
            organizer_more: '幹事多め負担',
            organizer_less: '幹事少なめ負担',
            organizer_fixed: '幹事固定額'
        };

        let text = `【割り勘計算】\n`;
        text += `総額: ${result.totalAmount.toLocaleString()}円\n`;
        text += `人数: ${result.numberOfPeople}人\n`;
        text += `パターン: ${typeLabels[result.type] || '均等割り'}\n`;

        if (includeDetails) {
            text += `\n`;

            if (result.type === 'equal') {
                text += `一人当たり: ${result.perPerson.toLocaleString()}円`;
                if (result.remainder > 0) {
                    text += `\n余り: ${result.remainder}円`;
                }
            } else {
                text += `幹事: ${result.organizerPayment.toLocaleString()}円\n`;
                text += `参加者一人: ${result.participantPayment.toLocaleString()}円`;
                if (result.remainder > 0) {
                    text += `\n余り: ${result.remainder}円`;
                }
            }
        }

        text += `\n\n計算アプリで詳細を見る`;

        return text;
    }

    /**
     * ネイティブシェア機能を使用
     *
     * @description
     * Web Share APIを使用してネイティブのシェアダイアログを表示します。
     *
     * @param {CalculationResultExtended} result - 計算結果
     * @param {Object} [options={}] - オプション
     * @param {string} [options.title='割り勘計算'] - シェアタイトル
     * @param {string} [options.text=''] - シェアテキスト
     * @returns {Promise<boolean>} シェア成功時true
     */
    async nativeShare(result, options = {}) {
        const { title = '割り勘計算', text = '' } = options;

        try {
            // Web Share APIが利用可能かチェック
            if (!navigator.share) {
                return false;
            }

            const shareData = {
                title: title,
                text: text || this.generateShareText(result, false),
                url: this.encodeToUrl(result)
            };

            await navigator.share(shareData);
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('ネイティブシェアエラー:', error);
            }
            return false;
        }
    }

    /**
     * QRコードを生成
     *
     * @description
     * シェアURLのQRコードを生成します。（将来拡張用）
     *
     * @param {CalculationResultExtended} result - 計算結果
     * @param {Object} [options={}] - オプション
     * @param {number} [options.size=200] - QRコードサイズ
     * @returns {string|null} QRコードのData URL（失敗時はnull）
     */
    generateQRCode(result, options = {}) {
        const { size = 200 } = options;

        // 注: 実際のQRコード生成には外部ライブラリが必要
        // ここではプレースホルダーとしてData URLを返す
        console.warn('QRコード生成機能は未実装です。外部ライブラリの導入が必要です。');

        const url = this.encodeToUrl(result);

        // 将来実装時のプレースホルダー
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <rect width="${size}" height="${size}" fill="white"/>
                <text x="${size/2}" y="${size/2}" text-anchor="middle" font-size="12" fill="black">
                    QR Code
                </text>
                <text x="${size/2}" y="${size/2 + 20}" text-anchor="middle" font-size="8" fill="black">
                    ${url.substring(0, 30)}...
                </text>
            </svg>
        `)}`;
    }

    /**
     * 利用可能なSNSの一覧を取得
     *
     * @description
     * サポートしているSNSの一覧を返します。
     *
     * @returns {Array<{key: string, name: string, url: string}>} SNS一覧
     */
    getSupportedSNS() {
        return Object.entries(this.supportedSNS).map(([key, info]) => ({
            key,
            name: info.name,
            url: info.url
        }));
    }

    /**
     * シェア機能が利用可能かチェック
     *
     * @description
     * 現在の環境でシェア機能が利用可能か判定します。
     *
     * @returns {Object} 利用可能性の情報
     */
    checkShareSupport() {
        return {
            clipboard: !!(navigator.clipboard && window.isSecureContext) || !!document.execCommand,
            nativeShare: !!navigator.share,
            sns: this.getSupportedSNS(),
            urlParameters: true
        };
    }
}

// グローバルインスタンスを作成
const shareManager = new ShareManager();

// エクスポート
export { ShareManager, shareManager };