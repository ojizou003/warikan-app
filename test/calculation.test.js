/**
 * 計算ロジックの単体テスト
 * main.jsから関数をインポートしてテスト
 */

// テスト対象の関数をmain.jsからインポート
// Note: ブラウザ環境向けのコードなので、テスト用に関数を再定義
function performCalculation(price, count, organizerPrice = null, participantPrice = null, isOrganizerMode = false, isParticipantMode = false) {
  // 入力値の検証
  if (!isValidInput(price, count)) {
    return null;
  }

  if (isOrganizerMode && organizerPrice !== null) {
    // 幹事モード
    if (!validateOrganizerPrice(organizerPrice, price, count)) {
      return null;
    }

    const remainingAmount = price - organizerPrice;
    const perPerson = Math.floor(remainingAmount / (count - 1));
    const remainder = remainingAmount % (count - 1);

    return {
      perPerson: perPerson,
      remainder: remainder,
      total: price,
      count: count,
      organizerPrice: organizerPrice,
      isOrganizerMode: true
    };
  } else if (isParticipantMode && participantPrice !== null) {
    // 参加者モード
    if (!validateParticipantPrice(participantPrice, price, count)) {
      return null;
    }

    const totalParticipantPayment = participantPrice * (count - 1);
    const organizerPayment = price - totalParticipantPayment;
    const remainder = price - participantPrice * count;

    return {
      perPerson: participantPrice,
      remainder: remainder,
      total: price,
      count: count,
      participantPrice: participantPrice,
      organizerPrice: organizerPayment,
      isParticipantMode: true
    };
  } else {
    // 通常モード
    const perPerson = Math.floor(price / count);
    const remainder = price % count;

    return {
      perPerson: perPerson,
      remainder: remainder,
      total: price,
      count: count
    };
  }
}

// バリデーション関数
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

// 幹事金額のバリデーション関数
function validateOrganizerPrice(organizerPrice, totalAmount, count) {
  if (isNaN(organizerPrice) || organizerPrice < 0) {
    return false;
  }

  const remainingAmount = totalAmount - organizerPrice;
  const minPerPerson = Math.floor(remainingAmount / (count - 1));

  return minPerPerson >= 0;
}

// 参加者金額のバリデーション関数
function validateParticipantPrice(participantPrice, totalAmount, count) {
  if (isNaN(participantPrice) || participantPrice < 0) {
    return false;
  }

  const maxParticipantPrice = Math.floor(totalAmount / count);
  return participantPrice <= maxParticipantPrice;
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

  describe('参加者金額バリデーションのテスト', () => {
    test('有効な参加者金額', () => {
      expect(validateParticipantPrice(300, 1000, 3)).toBe(true); // 300 ≤ floor(1000/3) = 333
    });

    test('上限値ぎりぎりの参加者金額', () => {
      expect(validateParticipantPrice(333, 1000, 3)).toBe(true); // 333 = floor(1000/3)
    });

    test('無効な参加者金額：上限超過', () => {
      expect(validateParticipantPrice(334, 1000, 3)).toBe(false); // 334 > floor(1000/3) = 333
    });

    test('有効な参加者金額：0', () => {
      expect(validateParticipantPrice(0, 1000, 3)).toBe(true); // 0円は有効
    });

    test('無効な参加者金額：負の値', () => {
      expect(validateParticipantPrice(-100, 1000, 3)).toBe(false);
    });

    test('無効な参加者金額：NaN', () => {
      expect(validateParticipantPrice(NaN, 1000, 3)).toBe(false);
    });

    test('境界値：1円', () => {
      expect(validateParticipantPrice(1, 100, 100)).toBe(true); // 1 ≤ floor(100/100) = 1
    });

    test('境界値：総額と人数が同じ', () => {
      expect(validateParticipantPrice(1, 1000, 1000)).toBe(true); // 1 ≤ floor(1000/1000) = 1
    });
  });

  describe('幹事金額バリデーションのテスト', () => {
    test('有効な幹事金額', () => {
      expect(validateOrganizerPrice(400, 1000, 3)).toBe(true); // 残り600を2人で割れる
    });

    test('幹事が全額支払う', () => {
      expect(validateOrganizerPrice(1000, 1000, 3)).toBe(true); // 残り0円は有効
    });

    test('幹事が0円支払う', () => {
      expect(validateOrganizerPrice(0, 1000, 3)).toBe(true); // 0円は有効
    });

    test('無効な幹事金額：総額超過', () => {
      expect(validateOrganizerPrice(1001, 1000, 3)).toBe(false); // 1000円超過は無効
    });

    test('無効な幹事金額：負の値', () => {
      expect(validateOrganizerPrice(-100, 1000, 3)).toBe(false);
    });

    test('無効な幹事金額：NaN', () => {
      expect(validateOrganizerPrice(NaN, 1000, 3)).toBe(false);
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

  describe('参加者モードのテスト', () => {
    test('基本的な参加者モード計算', () => {
      const result = performCalculation(1000, 3, null, 300, false, true);

      expect(result).toEqual({
        perPerson: 300,
        remainder: 100,
        total: 1000,
        count: 3,
        participantPrice: 300,
        organizerPrice: 400,
        isParticipantMode: true
      });
    });

    test('参加者モード：割り切れる場合', () => {
      const result = performCalculation(1000, 4, null, 250, false, true);

      expect(result.participantPrice).toBe(250);
      expect(result.organizerPrice).toBe(250); // 1000 - 250*3 = 250
      expect(result.remainder).toBe(0); // 1000 - 250*4 = 0
      expect(result.isParticipantMode).toBe(true);
    });

    test('参加者モード：上限値の検証', () => {
      // 1000円を3人で割る場合、参加者の上限はfloor(1000/3) = 333円
      const result = performCalculation(1000, 3, null, 333, false, true);

      expect(result.participantPrice).toBe(333);
      expect(result.organizerPrice).toBe(334); // 1000 - 333*2 = 334
      expect(result.remainder).toBe(1); // 1000 - 333*3 = 1
    });

    test('参加者モード：参加者が0円支払う', () => {
      const result = performCalculation(1000, 3, null, 0, false, true);

      expect(result.participantPrice).toBe(0);
      expect(result.organizerPrice).toBe(1000);
      expect(result.remainder).toBe(1000);
      expect(result.isParticipantMode).toBe(true);
    });

    test('参加者モード：全員同じ金額を支払う', () => {
      // 999円を3人で割る場合、全員333円ずつ
      const result = performCalculation(999, 3, null, 333, false, true);

      expect(result.participantPrice).toBe(333);
      expect(result.organizerPrice).toBe(333);
      expect(result.remainder).toBe(0);
    });

    test('参加者モード：人数が多い場合', () => {
      const result = performCalculation(10000, 10, null, 900, false, true);

      expect(result.participantPrice).toBe(900);
      expect(result.organizerPrice).toBe(1900); // 10000 - 900*9 = 1900
      expect(result.remainder).toBe(1000); // 10000 - 900*10 = 1000
    });

    test('参加者モード：バリデーション失敗（上限超過）', () => {
      const result = performCalculation(1000, 3, null, 334, false, true); // 上限333円を超過

      expect(result).toBeNull();
    });

    test('参加者モード：バリデーション失敗（負の値）', () => {
      const result = performCalculation(1000, 3, null, -100, false, true);

      expect(result).toBeNull();
    });

    test('参加者モード：バリデーション失敗（NaN）', () => {
      const result = performCalculation(1000, 3, null, NaN, false, true);

      expect(result).toBeNull();
    });
  });

  describe('幹事モードのテスト', () => {
    test('基本的な幹事モード計算', () => {
      const result = performCalculation(1000, 3, 400, null, true, false);

      expect(result).toEqual({
        perPerson: 300,
        remainder: 0,
        total: 1000,
        count: 3,
        organizerPrice: 400,
        isOrganizerMode: true
      });
    });

    test('幹事モード：割り切れない場合', () => {
      const result = performCalculation(1000, 3, 350, null, true, false);

      expect(result.organizerPrice).toBe(350);
      expect(result.perPerson).toBe(325); // (1000-350)÷2 = 325
      expect(result.remainder).toBe(0); // 650÷2 = 325 余り0
    });

    test('幹事モード：残りが出る場合', () => {
      const result = performCalculation(1001, 3, 350, null, true, false);

      expect(result.organizerPrice).toBe(350);
      expect(result.perPerson).toBe(325); // (1001-350)÷2 = 325
      expect(result.remainder).toBe(1); // 651÷2 = 325 余り1
    });
  });

  describe('モードの排他性テスト', () => {
    test('両方のモードがfalseの場合は通常モード', () => {
      const result = performCalculation(1000, 3, 400, 300, false, false);

      expect(result.isOrganizerMode).toBeUndefined();
      expect(result.isParticipantMode).toBeUndefined();
      expect(result.perPerson).toBe(333);
      expect(result.remainder).toBe(1);
    });

    test('幹事モードと参加者モードが両方trueの場合は幹事モード優先', () => {
      // これは通常発生しないはずだが、保険のテスト
      const result = performCalculation(1000, 3, 400, 300, true, true);

      expect(result.isOrganizerMode).toBe(true);
      expect(result.isParticipantMode).toBeUndefined();
    });
  });
});