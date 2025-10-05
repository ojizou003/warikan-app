/**
 * バリデーション機能のテスト
 * 拡張されたエラーハンドリング機能を検証
 */

// テスト対象のバリデーション関数
function validatePrice(price, priceInputValue) {
  // 空の入力チェック
  if (priceInputValue === '') {
    return {
      isValid: false,
      errorMessage: '金額を入力してください',
      errorCode: 'PRICE_EMPTY'
    };
  }

  // NaNチェック
  if (isNaN(price)) {
    return {
      isValid: false,
      errorMessage: '有効な数字を入力してください',
      errorCode: 'PRICE_NAN'
    };
  }

  // 下限値チェック（1円未満）
  if (price < 1) {
    return {
      isValid: false,
      errorMessage: '金額は1円以上で入力してください',
      errorCode: 'PRICE_TOO_SMALL'
    };
  }

  // 上限値チェック（100億円超過）
  if (price > 10000000000) {
    return {
      isValid: false,
      errorMessage: '金額が大きすぎます。100億円以下で入力してください',
      errorCode: 'PRICE_TOO_LARGE'
    };
  }

  // 整数チェック
  if (!Number.isInteger(price)) {
    return {
      isValid: false,
      errorMessage: '金額は整数で入力してください',
      errorCode: 'PRICE_DECIMAL'
    };
  }

  return {
    isValid: true,
    errorMessage: '',
    errorCode: null
  };
}

function validateCount(count, countInputValue) {
  // 空の入力チェック
  if (countInputValue === '') {
    return {
      isValid: false,
      errorMessage: '人数を入力してください',
      errorCode: 'COUNT_EMPTY'
    };
  }

  // NaNチェック
  if (isNaN(count)) {
    return {
      isValid: false,
      errorMessage: '有効な数字を入力してください',
      errorCode: 'COUNT_NAN'
    };
  }

  // 下限値チェック（1人未満）
  if (count < 1) {
    return {
      isValid: false,
      errorMessage: '人数は1人以上で入力してください',
      errorCode: 'COUNT_TOO_SMALL'
    };
  }

  // 上限値チェック（9999人超過）
  if (count > 9999) {
    return {
      isValid: false,
      errorMessage: '人数が多すぎます。9999人以下で入力してください',
      errorCode: 'COUNT_TOO_LARGE'
    };
  }

  // 整数チェック
  if (!Number.isInteger(count)) {
    return {
      isValid: false,
      errorMessage: '人数は整数で入力してください',
      errorCode: 'COUNT_DECIMAL'
    };
  }

  return {
    isValid: true,
    errorMessage: '',
    errorCode: null
  };
}

describe('バリデーション機能の拡張テスト', () => {
  describe('validatePriceの詳細テスト', () => {
    test('空の入力', () => {
      const result = validatePrice(NaN, '');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('PRICE_EMPTY');
      expect(result.errorMessage).toBe('金額を入力してください');
    });

    test('NaNの入力', () => {
      const result = validatePrice(NaN, 'abc');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('PRICE_NAN');
    });

    test('0円の入力', () => {
      const result = validatePrice(0, '0');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('PRICE_TOO_SMALL');
      expect(result.errorMessage).toBe('金額は1円以上で入力してください');
    });

    test('負の金額', () => {
      const result = validatePrice(-1000, '-1000');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('PRICE_TOO_SMALL');
    });

    test('小数点を含む金額', () => {
      const result = validatePrice(1000.5, '1000.5');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('PRICE_DECIMAL');
      expect(result.errorMessage).toBe('金額は整数で入力してください');
    });

    test('上限値超過（100億円超過）', () => {
      const result = validatePrice(20000000000, '20000000000');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('PRICE_TOO_LARGE');
      expect(result.errorMessage).toBe('金額が大きすぎます。100億円以下で入力してください');
    });

    test('境界値テスト：100億円', () => {
      const result = validatePrice(10000000000, '10000000000');
      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBe(null);
    });

    test('有効な金額', () => {
      const result = validatePrice(1000, '1000');
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBe('');
    });
  });

  describe('validateCountの詳細テスト', () => {
    test('空の入力', () => {
      const result = validateCount(NaN, '');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('COUNT_EMPTY');
      expect(result.errorMessage).toBe('人数を入力してください');
    });

    test('NaNの入力', () => {
      const result = validateCount(NaN, 'abc');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('COUNT_NAN');
    });

    test('0人の入力', () => {
      const result = validateCount(0, '0');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('COUNT_TOO_SMALL');
      expect(result.errorMessage).toBe('人数は1人以上で入力してください');
    });

    test('負の人数', () => {
      const result = validateCount(-5, '-5');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('COUNT_TOO_SMALL');
    });

    test('小数点を含む人数', () => {
      const result = validateCount(2.5, '2.5');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('COUNT_DECIMAL');
      expect(result.errorMessage).toBe('人数は整数で入力してください');
    });

    test('上限値超過（9999人超過）', () => {
      const result = validateCount(10000, '10000');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('COUNT_TOO_LARGE');
      expect(result.errorMessage).toBe('人数が多すぎます。9999人以下で入力してください');
    });

    test('境界値テスト：9999人', () => {
      const result = validateCount(9999, '9999');
      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBe(null);
    });

    test('有効な人数', () => {
      const result = validateCount(5, '5');
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBe('');
    });
  });

  describe('エラーコードの一貫性テスト', () => {
    test('期待されるエラーコードがすべて存在すること', () => {
      const expectedPriceErrorCodes = [
        'PRICE_EMPTY',
        'PRICE_NAN',
        'PRICE_TOO_SMALL',
        'PRICE_TOO_LARGE',
        'PRICE_DECIMAL'
      ];

      const expectedCountErrorCodes = [
        'COUNT_EMPTY',
        'COUNT_NAN',
        'COUNT_TOO_SMALL',
        'COUNT_TOO_LARGE',
        'COUNT_DECIMAL'
      ];

      const testCases = [
        { validate: validatePrice, expectedCodes: expectedPriceErrorCodes },
        { validate: validateCount, expectedCodes: expectedCountErrorCodes }
      ];

      testCases.forEach(({ validate, expectedCodes }) => {
        const foundCodes = new Set();

        expectedCodes.forEach(code => {
          // 各エラーコードをトリガーする特定のテストケース
          let testValue, testInput;
          switch (code) {
            case 'PRICE_EMPTY':
            case 'COUNT_EMPTY':
              testValue = NaN;
              testInput = '';
              break;
            case 'PRICE_NAN':
            case 'COUNT_NAN':
              testValue = NaN;
              testInput = 'invalid';
              break;
            case 'PRICE_TOO_SMALL':
            case 'COUNT_TOO_SMALL':
              testValue = 0;
              testInput = '0';
              break;
            case 'PRICE_TOO_LARGE':
              testValue = 20000000000;
              testInput = '20000000000';
              break;
            case 'COUNT_TOO_LARGE':
              testValue = 10000;
              testInput = '10000';
              break;
            case 'PRICE_DECIMAL':
            case 'COUNT_DECIMAL':
              testValue = 1.5;
              testInput = '1.5';
              break;
          }

          const result = validate(testValue, testInput);
          if (!result.isValid) {
            foundCodes.add(result.errorCode);
          }
        });

        expect(foundCodes.size).toBe(expectedCodes.length);
        expectedCodes.forEach(code => {
          expect(foundCodes.has(code)).toBe(true);
        });
      });
    });
  });

  describe('実用性のテスト', () => {
    test('大きな金額の処理', () => {
      const result = validatePrice(9999999999, '9999999999');
      expect(result.isValid).toBe(true);
    });

    test('最大人数の処理', () => {
      const result = validateCount(9999, '9999');
      expect(result.isValid).toBe(true);
    });

    test('最小値の境界', () => {
      const priceResult = validatePrice(1, '1');
      expect(priceResult.isValid).toBe(true);

      const countResult = validateCount(1, '1');
      expect(countResult.isValid).toBe(true);
    });
  });
});