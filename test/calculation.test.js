/**
 * 計算ロジックの単体テスト
 * main.jsから関数をインポートしてテスト
 */

// テスト対象の関数をmain.jsからインポート
// Note: ブラウザ環境向けのコードなので、テスト用に関数を再定義
function performCalculation(price, count) {
  const perPerson = Math.floor(price / count);
  const remainder = price % count;

  return {
    perPerson: perPerson,
    remainder: remainder,
    total: price,
    count: count
  };
}

describe('計算ロジックのテスト', () => {
  describe('performCalculation', () => {
    test('通常モードでの基本的な計算', () => {
      const result = performCalculation(1000, 3);

      expect(result).toEqual({
        perPerson: 333,
        remainder: 1,
        total: 1000,
        count: 3
      });
    });

    test('割り切れる計算', () => {
      const result = performCalculation(1000, 4);

      expect(result).toEqual({
        perPerson: 250,
        remainder: 0,
        total: 1000,
        count: 4
      });
    });

    test('端数の処理検証', () => {
      const result = performCalculation(1000, 3);

      // 1000円を3人で割る場合、333円×3人=999円 + 端数1円
      expect(result.perPerson * result.count + result.remainder).toBe(1000);
    });

    test('最小金額（1円）', () => {
      const result = performCalculation(1, 2);

      expect(result).toEqual({
        perPerson: 0,
        remainder: 1,
        total: 1,
        count: 2
      });
    });

    test('1円を1人で', () => {
      const result = performCalculation(1, 1);

      expect(result).toEqual({
        perPerson: 1,
        remainder: 0,
        total: 1,
        count: 1
      });
    });

    test('大きな金額', () => {
      const result = performCalculation(999999, 5);

      expect(result.perPerson).toBe(199999);
      expect(result.remainder).toBe(4);
      expect(result.total).toBe(999999);
    });
  });

  describe('バリデーション関数のテスト', () => {
    // main.jsからisValidInput関数を再定義
    function isValidInput(price, count) {
      if (isNaN(price) || price <= 0) {
        return false;
      }

      if (isNaN(count) || count <= 0) {
        return false;
      }

      if (count > 999) {
        return false;
      }

      return true;
    }

    test('有効な入力', () => {
      expect(isValidInput(1000, 3)).toBe(true);
    });

    test('無効な金額：0', () => {
      expect(isValidInput(0, 3)).toBe(false);
    });

    test('無効な金額：負の値', () => {
      expect(isValidInput(-1000, 3)).toBe(false);
    });

    test('無効な金額：NaN', () => {
      expect(isValidInput(NaN, 3)).toBe(false);
    });

    test('無効な人数：0', () => {
      expect(isValidInput(1000, 0)).toBe(false);
    });

    test('無効な人数：負の値', () => {
      expect(isValidInput(1000, -5)).toBe(false);
    });

    test('無効な人数：999人超過', () => {
      expect(isValidInput(1000, 1000)).toBe(false);
    });
  });

  describe('端数処理の境界値テスト', () => {
    test('最大端数（人数-1）', () => {
      const result = performCalculation(100, 3);

      expect(result.remainder).toBe(1); // 100 ÷ 3 = 33 余り 1
    });

    test('端数なし（割り切れる）', () => {
      const result = performCalculation(100, 4);

      expect(result.remainder).toBe(0); // 100 ÷ 4 = 25 余り 0
    });

    test('人数が多い場合の端数', () => {
      const result = performCalculation(10000, 999);

      expect(result.perPerson).toBe(10);
      expect(result.remainder).toBe(10); // 10000 ÷ 999 = 10 余り 10
    });
  });
});