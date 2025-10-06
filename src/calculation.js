/**
 * 計算エンジンモジュール
 *
 * @description
 * 割り勘計算の各種パターンを実装する計算エンジン。
 * 均等割り、幹事多め負担、幹事少なめ負担、幹事固定額パターンに対応。
 *
 * @module Calculation
 * @version 1.0.0
 */

"use strict";

/**
 * 計算タイプ定義
 * @readonly
 * @enum {string}
 */
const CalculationType = {
    EQUAL: 'equal',
    ORGANIZER_MORE: 'organizer_more',
    ORGANIZER_LESS: 'organizer_less',
    ORGANIZER_FIXED: 'organizer_fixed'
};

/**
 * 計算エンジンクラス
 *
 * @class
 * @classdesc
 * 各種割り勘計算パターンを実装するクラス。
 */
class CalculationEngine {
    /**
     * コンストラクタ
     *
     * @description
     * 計算エンジンを初期化します。
     */
    constructor() {
        // 計算タイプ定義
        this.types = CalculationType;
    }

    /**
     * 計算を実行
     *
     * @description
     * 指定されたタイプに応じた計算を実行します。
     *
     * @param {CalculationInput} input - 計算入力
     * @returns {CalculationResultExtended} 計算結果
     */
    calculate(input) {
        // 入力バリデーション
        if (!this.validateInput(input)) {
            throw new Error('Invalid input for calculation');
        }

        // タイプ別計算
        switch (input.type) {
            case CalculationType.EQUAL:
                return this.calculateEqual(input.totalAmount, input.numberOfPeople);

            case CalculationType.ORGANIZER_MORE:
                return this.calculateOrganizerMore(
                    input.totalAmount,
                    input.numberOfPeople,
                    input.organizerBurden
                );

            case CalculationType.ORGANIZER_LESS:
                return this.calculateOrganizerLess(
                    input.totalAmount,
                    input.numberOfPeople,
                    input.organizerBurden
                );

            case CalculationType.ORGANIZER_FIXED:
                return this.calculateOrganizerFixed(
                    input.totalAmount,
                    input.numberOfPeople,
                    input.organizerFixed
                );

            default:
                throw new Error(`Unknown calculation type: ${input.type}`);
        }
    }

    /**
     * 均等割り計算
     *
     * @description
     * 総額を人数で均等に割り勘します。
     *
     * @param {number} totalAmount - 総額
     * @param {number} numberOfPeople - 人数
     * @returns {CalculationResultExtended} 計算結果
     */
    calculateEqual(totalAmount, numberOfPeople) {
        const perPerson = Math.floor(totalAmount / numberOfPeople);
        const remainder = totalAmount % numberOfPeople;

        return {
            type: CalculationType.EQUAL,
            totalAmount: totalAmount,
            numberOfPeople: numberOfPeople,
            perPerson: perPerson,
            remainder: remainder,
            organizerPayment: perPerson,
            participantPayment: perPerson,
            timestamp: Date.now()
        };
    }

    /**
     * 幹事多め負担計算
     *
     * @description
     * 幹事が指定された割合（%）多く負担します。
     *
     * @param {number} totalAmount - 総額
     * @param {number} numberOfPeople - 人数
     * @param {number} organizerBurdenPercent - 幹事の追加負担割合（%）
     * @returns {CalculationResultExtended} 計算結果
     */
    calculateOrganizerMore(totalAmount, numberOfPeople, organizerBurdenPercent) {
        // 幹事の負担率を計算（基本 = 1 + 追加負担率）
        const organizerRate = 1 + (organizerBurdenPercent / 100);

        // 参加者の負担率（合計が人数になるように調整）
        const participantRate = (numberOfPeople - organizerRate) / (numberOfPeople - 1);

        // 負担額を計算
        let organizerPayment = Math.floor(totalAmount * (organizerRate / numberOfPeople));
        let participantPayment;

        // 調整して端数処理
        if (participantRate > 0) {
            participantPayment = Math.floor(totalAmount * (participantRate / numberOfPeople));
        } else {
            // 負担率がマイナスの場合は均等に戻す
            return this.calculateEqual(totalAmount, numberOfPeople);
        }

        // 合計が一致するように調整
        const totalCalculated = organizerPayment + (participantPayment * (numberOfPeople - 1));
        let remainder = totalAmount - totalCalculated;

        // 端数調整
        if (remainder > 0) {
            // 余りがあれば幹事が負担
            organizerPayment += remainder;
            remainder = 0;
        } else if (remainder < 0) {
            // 不足があれば参加者で調整
            participantPayment += Math.abs(remainder);
            remainder = 0;
        }

        return {
            type: CalculationType.ORGANIZER_MORE,
            totalAmount: totalAmount,
            numberOfPeople: numberOfPeople,
            perPerson: participantPayment,
            remainder: remainder,
            organizerPayment: organizerPayment,
            participantPayment: participantPayment,
            organizerBurdenPercent: organizerBurdenPercent,
            timestamp: Date.now()
        };
    }

    /**
     * 幹事少なめ負担計算
     *
     * @description
     * 幹事が指定された割合（%）少なく負担します。
     *
     * @param {number} totalAmount - 総額
     * @param {number} numberOfPeople - 人数
     * @param {number} organizerReductionPercent - 幹事の負担軽減割合（%）
     * @returns {CalculationResultExtended} 計算結果
     */
    calculateOrganizerLess(totalAmount, numberOfPeople, organizerReductionPercent) {
        // 幹事の負担率を計算（基本 = 1 - 軽減率）
        const organizerRate = 1 - (organizerReductionPercent / 100);

        // 参加者の負担率を計算
        const participantRate = (numberOfPeople - organizerRate) / (numberOfPeople - 1);

        // 負担額を計算
        let organizerPayment = Math.floor(totalAmount * (organizerRate / numberOfPeople));
        let participantPayment;

        if (organizerRate > 0 && participantRate > 0) {
            participantPayment = Math.floor(totalAmount * (participantRate / numberOfPeople));
        } else {
            // 負担率が0以下の場合は均等に戻す
            return this.calculateEqual(totalAmount, numberOfPeople);
        }

        // 合計が一致するように調整
        const totalCalculated = organizerPayment + (participantPayment * (numberOfPeople - 1));
        let remainder = totalAmount - totalCalculated;

        // 端数調整
        if (remainder > 0) {
            // 余りがあれば参加者で分配
            const additionalPerPerson = Math.floor(remainder / (numberOfPeople - 1));
            participantPayment += additionalPerPerson;
            remainder = remainder - (additionalPerPerson * (numberOfPeople - 1));
        } else if (remainder < 0) {
            // 不足があれば幹事が負担
            organizerPayment += Math.abs(remainder);
            remainder = 0;
        }

        return {
            type: CalculationType.ORGANIZER_LESS,
            totalAmount: totalAmount,
            numberOfPeople: numberOfPeople,
            perPerson: participantPayment,
            remainder: remainder,
            organizerPayment: organizerPayment,
            participantPayment: participantPayment,
            organizerReductionPercent: organizerReductionPercent,
            timestamp: Date.now()
        };
    }

    /**
     * 幹事固定額計算
     *
     * @description
     * 幹事が指定された固定額を負担し、残りを参加者で均等に割ります。
     *
     * @param {number} totalAmount - 総額
     * @param {number} numberOfPeople - 人数
     * @param {number} organizerFixedAmount - 幹事の固定負担額
     * @returns {CalculationResultExtended} 計算結果
     */
    calculateOrganizerFixed(totalAmount, numberOfPeople, organizerFixedAmount) {
        // 固定額のバリデーション
        if (organizerFixedAmount >= totalAmount) {
            // 固定額が総額以上の場合は均等に戻す
            return this.calculateEqual(totalAmount, numberOfPeople);
        }

        if (organizerFixedAmount < 0) {
            // 負の値は許可しない
            return this.calculateEqual(totalAmount, numberOfPeople);
        }

        // 参加者の負担額を計算
        const remainingAmount = totalAmount - organizerFixedAmount;
        const participantCount = numberOfPeople - 1;

        if (participantCount <= 0) {
            return this.calculateEqual(totalAmount, numberOfPeople);
        }

        const participantPayment = Math.floor(remainingAmount / participantCount);
        const remainder = remainingAmount % participantCount;

        return {
            type: CalculationType.ORGANIZER_FIXED,
            totalAmount: totalAmount,
            numberOfPeople: numberOfPeople,
            perPerson: participantPayment,
            remainder: remainder,
            organizerPayment: organizerFixedAmount,
            participantPayment: participantPayment,
            organizerFixedAmount: organizerFixedAmount,
            timestamp: Date.now()
        };
    }

    /**
     * 入力バリデーション
     *
     * @description
     * 計算入力の妥当性を検証します。
     *
     * @param {CalculationInput} input - 計算入力
     * @returns {boolean} バリデーション結果
     */
    validateInput(input) {
        // 基本項目のチェック
        if (!input || typeof input !== 'object') {
            return false;
        }

        if (typeof input.totalAmount !== 'number' ||
            typeof input.numberOfPeople !== 'number' ||
            typeof input.type !== 'string') {
            return false;
        }

        // 値の範囲チェック
        if (input.totalAmount < 1 || input.totalAmount > 10000000000) {
            return false;
        }

        if (input.numberOfPeople < 1 || input.numberOfPeople > 9999) {
            return false;
        }

        // タイプ別の追加チェック
        switch (input.type) {
            case CalculationType.ORGANIZER_MORE:
                if (typeof input.organizerBurden !== 'number' ||
                    input.organizerBurden < 1 ||
                    input.organizerBurden > 100) {
                    return false;
                }
                break;

            case CalculationType.ORGANIZER_LESS:
                if (typeof input.organizerBurden !== 'number' ||
                    input.organizerBurden < 1 ||
                    input.organizerBurden > 99) {
                    return false;
                }
                break;

            case CalculationType.ORGANIZER_FIXED:
                if (typeof input.organizerFixed !== 'number' ||
                    input.organizerFixed < 0) {
                    return false;
                }
                break;
        }

        return true;
    }

    /**
     * 利用可能な計算タイプを取得
     *
     * @description
     * サポートされている計算タイプの一覧を返します。
     *
     * @returns {Array<{type: string, label: string, description: string}>} 計算タイプ一覧
     */
    getAvailableTypes() {
        return [
            {
                type: CalculationType.EQUAL,
                label: '均等割り',
                description: '全員で均等に割り勘します'
            },
            {
                type: CalculationType.ORGANIZER_MORE,
                label: '幹事多め',
                description: '幹事が指定した割合だけ多く負担します'
            },
            {
                type: CalculationType.ORGANIZER_LESS,
                label: '幹事少なめ',
                description: '幹事が指定した割合だけ少なく負担します'
            },
            {
                type: CalculationType.ORGANIZER_FIXED,
                label: '幹事固定',
                description: '幹事が固定額を負担し、残りを均等に割ります'
            }
        ];
    }

    /**
     * 計算結果の要約を取得
     *
     * @description
     * 計算結果の人間が読める要約を生成します。
     *
     * @param {CalculationResultExtended} result - 計算結果
     * @returns {string} 要約テキスト
     */
    getSummary(result) {
        switch (result.type) {
            case CalculationType.EQUAL:
                return `一人 ${result.perPerson.toLocaleString()}円`;

            case CalculationType.ORGANIZER_MORE:
                return `幹事: ${result.organizerPayment.toLocaleString()}円、参加者: 一人 ${result.participantPayment.toLocaleString()}円`;

            case CalculationType.ORGANIZER_LESS:
                return `幹事: ${result.organizerPayment.toLocaleString()}円、参加者: 一人 ${result.participantPayment.toLocaleString()}円`;

            case CalculationType.ORGANIZER_FIXED:
                return `幹事: ${result.organizerPayment.toLocaleString()}円、参加者: 一人 ${result.participantPayment.toLocaleString()}円`;

            default:
                return `一人 ${result.perPerson.toLocaleString()}円`;
        }
    }

    /**
     * 端数の処理方法を取得
     *
     * @description
     * 各計算タイプでの端数処理方法を説明します。
     *
     * @param {string} type - 計算タイプ
     * @returns {string} 端数処理の説明
     */
    getRemainderHandling(type) {
        switch (type) {
            case CalculationType.EQUAL:
                return '余りは表示され、調整は行いません';

            case CalculationType.ORGANIZER_MORE:
                return '余りは幹事が負担します';

            case CalculationType.ORGANIZER_LESS:
                return '余りは参加者間で分配されます';

            case CalculationType.ORGANIZER_FIXED:
                return '参加者間の割り勘で生じた余りは表示されます';

            default:
                return '特別な端数処理はありません';
        }
    }
}

/**
 * 計算入力の型定義
 * @typedef {Object} CalculationInput
 * @property {number} totalAmount - 総額（1〜100億）
 * @property {number} numberOfPeople - 人数（1〜9999）
 * @property {string} type - 計算タイプ
 * @property {number} [organizerBurden] - 幹事負担（%）
 * @property {number} [organizerFixed] - 幹事固定額
 */

// グローバルインスタンスを作成
const calculationEngine = new CalculationEngine();

// エクスポート
export {
    CalculationEngine,
    CalculationType,
    calculationEngine
};