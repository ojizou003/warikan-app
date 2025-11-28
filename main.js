/**
 * 割り勘計算アプリケーション
 *
 * @description
 * 簡単な割り勘計算を行うWebアプリケーション。
 * 金額と人数を入力すると、一人当たりの金額と余りを計算します。
 *
 * @module WarikanApp
 * @version 1.0.0
 * @author Warikan App Team
 */

"use strict";

// HTMLエスケープユーティリティ関数
/**
 * HTML特殊文字をエスケープしてXSSを防止する
 * @param {string} str - エスケープする文字列
 * @returns {string} エスケープされた文字列
 */
function escapeHTML(str) {
  if (typeof str !== "string") {
    return "";
  }
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/=/g, "&#x3D;")
    .replace(/\//g, "&#x2F;");
}

// DOM要素の取得
/** @type {HTMLInputElement} 金額入力フィールド */
const priceInput = document.getElementById("price");

/** @type {HTMLInputElement} 人数入力フィールド */
const countInput = document.getElementById("count");

/** @type {HTMLButtonElement} 計算実行ボタン */
const calculateButton = document.getElementById("action");

/** @type {HTMLDivElement} 結果表示エリア */
const answerDisplay = document.getElementById("answer");

/** @type {HTMLInputElement} 幹事モードトグル */
const organizerModeToggle = document.getElementById("organizerMode");

/** @type {HTMLInputElement} 幹事支払額入力フィールド */
const organizerPriceInput = document.getElementById("organizerPrice");
/** @type {HTMLInputElement} 参加者モードトグル */
const participantModeToggle = document.getElementById("participantMode");
/** @type {HTMLInputElement} 参加者支払額入力フィールド */
const participantPriceInput = document.getElementById("participantPrice");
/** @type {HTMLDivElement} 参加者入力エリア */
const participantInputArea = document.getElementById("participantInput");

/** @type {HTMLDivElement} 幹事入力エリア */
const organizerInputArea = document.getElementById("organizerInput");

// イベントリスナーの設定
calculateButton.addEventListener("click", calculateSplit);
priceInput.addEventListener("input", handleInputChange);
countInput.addEventListener("input", handleInputChange);
priceInput.addEventListener("keypress", handleEnterKey);
countInput.addEventListener("keypress", handleEnterKey);

// 幹事モード関連のイベントリスナー
organizerModeToggle.addEventListener("change", handleOrganizerModeToggle);
organizerPriceInput.addEventListener("input", handleOrganizerPriceChange);
organizerPriceInput.addEventListener("keypress", handleEnterKey);
organizerPriceInput.addEventListener("paste", enforceHalfWidthNumbersOnPaste);
organizerPriceInput.addEventListener("focus", disableIME);

// 参加者モード関連のイベントリスナー
participantModeToggle.addEventListener("change", handleParticipantModeToggle);
participantPriceInput.addEventListener("input", handleParticipantPriceChange);
participantPriceInput.addEventListener("keypress", handleEnterKey);
participantPriceInput.addEventListener("paste", enforceHalfWidthNumbersOnPaste);
participantPriceInput.addEventListener("focus", disableIME);

// 半角数字入力制御のためのイベントリスナー
priceInput.addEventListener("input", enforceHalfWidthNumbers);
priceInput.addEventListener("paste", enforceHalfWidthNumbersOnPaste);
priceInput.addEventListener("focus", disableIME);
countInput.addEventListener("input", enforceHalfWidthNumbers);
countInput.addEventListener("paste", enforceHalfWidthNumbersOnPaste);
countInput.addEventListener("focus", disableIME);

/**
 * 割り勘計算を実行するメイン関数
 *
 * @description
 * ボタンクリック時のアニメーション効果、入力値の取得、バリデーション、
 * 計算実行、結果表示までの一連の処理を管理します。
 *
 * @returns {void}
 */
function calculateSplit() {
  // ボタンにアニメーション効果
  calculateButton.classList.add("pulse");
  setTimeout(() => calculateButton.classList.remove("pulse"), 500);

  // 入力値の取得
  /** @type {number} 金額 */
  const price = parseInt(priceInput.value);

  /** @type {number} 人数 */
  const count = parseInt(countInput.value);

  // バリデーション
  if (!isValidInput(price, count)) {
    return;
  }

  // 幹事モードのバリデーション
  if (organizerModeToggle.checked && !validateOrganizerPrice()) {
    return;
  }

  // 計算実行
  /** @type {CalculationResult} 計算結果 */
  const result = performCalculation(price, count);

  // 結果表示
  displayResult(result);

  // 結果表示エリアへスクロール
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

/**
 * エラー表示を強化
 *
 * @description
 * エラー発生時に詳細なエラー情報と解決策を表示します。
 *
 * @param {ValidationResult} validation - バリデーション結果
 * @param {string} field - エラーが発生したフィールド（'price' または 'count'）
 * @returns {void}
 */
function displayValidationError(validation, field) {
  answerDisplay.className = "fade-in error";

  // エラーメッセージを構築
  let message = validation.errorMessage;

  // エラーコードに基づいて追加のヒントを表示
  const hints = getErrorHints(validation.errorCode, field);
  if (hints) {
    message += `<div class="error-hint">${hints}</div>`;
  }

  answerDisplay.innerHTML = message;

  // 入力フィールドにエラー視覚効果
  const inputField = field === "price" ? priceInput : countInput;
  inputField.classList.add("error");
  setTimeout(() => {
    inputField.classList.remove("error");
  }, 2000);
}

/**
 * エラーヒントを取得
 *
 * @description
 * エラーコードに基づいてユーザーフレンドリーな解決策を返します。
 *
 * @param {string} errorCode - エラーコード
 * @param {string} field - フィールド名
 * @returns {string|null} エラーヒント
 */
function getErrorHints(errorCode, field) {
  const hints = {
    PRICE_EMPTY: "例: 1000 と入力してください",
    PRICE_NAN: "数字のみを入力してください",
    PRICE_TOO_SMALL: "最小金額は1円です",
    PRICE_TOO_LARGE: "100億円以下の金額を入力してください",
    PRICE_DECIMAL: "小数点は使用できません",
    PRICE_TOO_LONG: "12桁以下の数字を入力してください",
    COUNT_EMPTY: "例: 5 と入力してください",
    COUNT_NAN: "数字のみを入力してください",
    COUNT_TOO_SMALL: "最少人数は1人です",
    COUNT_TOO_LARGE: "9999人以下の人数を入力してください",
    COUNT_DECIMAL: "人数は整数で入力してください",
    COUNT_TOO_LONG: "4桁以下の数字を入力してください",
  };

  return hints[errorCode] || null;
}

/**
 * 入力変更時の処理
 *
 * @description
 * 両方の入力フィールドが空の場合、表示を初期状態にリセットします。
 *
 * @returns {void}
 */
function handleInputChange() {
  // 結果表示を初期化
  if (priceInput.value === "" && countInput.value === "") {
    resetDisplay();
  }
}

/**
 * 幹事モードトグルの処理
 *
 * @description
 * 幹事モードのオン／オフを切り替えます。
 *
 * @param {Event} event - チェンジイベント
 * @returns {void}
 */
function handleOrganizerModeToggle(event) {
  const isEnabled = event.target.checked;

  // 参加者モードとの排他制御
  if (isEnabled) {
    participantModeToggle.checked = false;
    participantInputArea.style.display = "none";
    participantPriceInput.value = "";

    organizerInputArea.style.display = "block";
    organizerPriceInput.focus();
  } else {
    organizerInputArea.style.display = "none";
    organizerPriceInput.value = "";
  }

  // 結果表示をリセット
  resetDisplay();
}

/**
 * 幹事支払額入力変更時の処理
 *
 * @description
 * 幹事支払額が入力された場合、表示を初期状態にリセットします。
 *
 * @returns {void}
 */
function handleOrganizerPriceChange() {
  if (
    organizerPriceInput.value === "" &&
    priceInput.value === "" &&
    countInput.value === ""
  ) {
    resetDisplay();
  }
}

/**
 * 参加者モードトグルの処理
 *
 * @description
 * 参加者モードのオン／オフを切り替えます。
 *
 * @param {Event} event - チェンジイベント
 * @returns {void}
 */
function handleParticipantModeToggle(event) {
  const isEnabled = event.target.checked;

  // 幹事モードとの排他制御
  if (isEnabled) {
    organizerModeToggle.checked = false;
    organizerInputArea.style.display = "none";
    organizerPriceInput.value = "";

    participantInputArea.style.display = "block";
    participantPriceInput.focus();
  } else {
    participantInputArea.style.display = "none";
    participantPriceInput.value = "";
  }

  // 結果表示をリセット
  resetDisplay();
}

/**
 * 参加者支払額入力変更時の処理
 *
 * @description
 * 参加者支払額が入力された場合、表示を初期状態にリセットします。
 *
 * @returns {void}
 */
function handleParticipantPriceChange() {
  if (
    participantPriceInput.value === "" &&
    priceInput.value === "" &&
    countInput.value === ""
  ) {
    resetDisplay();
  }
}

/**
 * Enterキー押下時の処理
 *
 * @description
 * Enterキーが押された場合、計算を実行します。
 *
 * @param {KeyboardEvent} event - キーボードイベント
 * @returns {void}
 */
function handleEnterKey(event) {
  if (event.key === "Enter") {
    calculateSplit();
  }
}

/**
 * 表示を初期状態にリセット
 *
 * @description
 * 結果表示エリアを初期状態に戻します。
 *
 * @returns {void}
 */
function resetDisplay() {
  answerDisplay.textContent = "金額と人数を入力してください";
  answerDisplay.className = "";
  answerDisplay.style.color = "#666";
}

/**
 * 入力値のバリデーション
 *
 * @description
 * 金額と人数の入力値を詳細に検証します。
 * 境界値チェック、文字数制限、実用範囲の検証を行います。
 *
 * @param {number} price - 金額
 * @param {number} count - 人数
 * @returns {boolean} バリデーション結果（true: 有効, false: 無効）
 */
function isValidInput(price, count) {
  answerDisplay.className = "fade-in";

  // 金額のバリデーション
  const priceValidation = validatePrice(price);
  if (!priceValidation.isValid) {
    answerDisplay.textContent = priceValidation.errorMessage;
    answerDisplay.classList.add("error");
    return false;
  }

  // 人数のバリデーション
  const countValidation = validateCount(count);
  if (!countValidation.isValid) {
    answerDisplay.textContent = countValidation.errorMessage;
    answerDisplay.classList.add("error");
    return false;
  }

  return true;
}

/**
 * 金額の詳細バリデーション
 *
 * @description
 * 金額の入力値を詳細に検証します。
 * 上限・下限、実用性、文字数などのチェックを行います。
 *
 * @param {number} price - 検証する金額
 * @returns {ValidationResult} 検証結果
 */
function validatePrice(price) {
  // 空の入力チェック
  if (priceInput.value === "") {
    return {
      isValid: false,
      errorMessage: "金額を入力してください",
      errorCode: "PRICE_EMPTY",
    };
  }

  // NaNチェック
  if (isNaN(price)) {
    return {
      isValid: false,
      errorMessage: "有効な数字を入力してください",
      errorCode: "PRICE_NAN",
    };
  }

  // 下限値チェック（1円未満）
  if (price < 1) {
    return {
      isValid: false,
      errorMessage: "金額は1円以上で入力してください",
      errorCode: "PRICE_TOO_SMALL",
    };
  }

  // 上限値チェック（100億円超過）
  if (price > 10000000000) {
    return {
      isValid: false,
      errorMessage: "金額が大きすぎます。100億円以下で入力してください",
      errorCode: "PRICE_TOO_LARGE",
    };
  }

  // 実用性チェック（1円未満の端数がある場合）
  if (!Number.isInteger(price)) {
    return {
      isValid: false,
      errorMessage: "金額は整数で入力してください",
      errorCode: "PRICE_DECIMAL",
    };
  }

  // 文字数チェック（入力が長すぎる場合）
  if (priceInput.value.length > 12) {
    return {
      isValid: false,
      errorMessage: "金額の桁数が多すぎます。12桁以下で入力してください",
      errorCode: "PRICE_TOO_LONG",
    };
  }

  // XSS防止：危険な文字列パターンをチェック
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /&lt;/i,
    /&gt;/i,
    /&amp;/i,
    /&quot;/i,
    /&#039;/i,
    /&#x2F;/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(priceInput.value)) {
      return {
        isValid: false,
        errorMessage: "無効な文字が含まれています",
        errorCode: "PRICE_INVALID_CHARS",
      };
    }
  }

  return {
    isValid: true,
    errorMessage: "",
    errorCode: null,
  };
}

/**
 * 人数の詳細バリデーション
 *
 * @description
 * 人数の入力値を詳細に検証します。
 * 上限・下限、実用性、文字数などのチェックを行います。
 *
 * @param {number} count - 検証する人数
 * @returns {ValidationResult} 検証結果
 */
function validateCount(count) {
  // 空の入力チェック
  if (countInput.value === "") {
    return {
      isValid: false,
      errorMessage: "人数を入力してください",
      errorCode: "COUNT_EMPTY",
    };
  }

  // NaNチェック
  if (isNaN(count)) {
    return {
      isValid: false,
      errorMessage: "有効な数字を入力してください",
      errorCode: "COUNT_NAN",
    };
  }

  // 下限値チェック（1人未満）
  if (count < 1) {
    return {
      isValid: false,
      errorMessage: "人数は1人以上で入力してください",
      errorCode: "COUNT_TOO_SMALL",
    };
  }

  // 上限値チェック（9999人超過）
  if (count > 9999) {
    return {
      isValid: false,
      errorMessage: "人数が多すぎます。9999人以下で入力してください",
      errorCode: "COUNT_TOO_LARGE",
    };
  }

  // 整数チェック（小数点が含まれる場合）
  if (!Number.isInteger(count)) {
    return {
      isValid: false,
      errorMessage: "人数は整数で入力してください",
      errorCode: "COUNT_DECIMAL",
    };
  }

  // 文字数チェック（入力が長すぎる場合）
  if (countInput.value.length > 4) {
    return {
      isValid: false,
      errorMessage: "人数の桁数が多すぎます。4桁以下で入力してください",
      errorCode: "COUNT_TOO_LONG",
    };
  }

  // XSS防止：危険な文字列パターンをチェック
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /&lt;/i,
    /&gt;/i,
    /&amp;/i,
    /&quot;/i,
    /&#039;/i,
    /&#x2F;/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(countInput.value)) {
      return {
        isValid: false,
        errorMessage: "無効な文字が含まれています",
        errorCode: "COUNT_INVALID_CHARS",
      };
    }
  }

  return {
    isValid: true,
    errorMessage: "",
    errorCode: null,
  };
}

/**
 * 幹事支払額のバリデーション
 *
 * @description
 * 幹事が支払う金額の入力値を検証します。
 *
 * @returns {boolean} バリデーション結果（true: 有効, false: 無効）
 */
function validateOrganizerPrice() {
  const organizerPrice = parseInt(organizerPriceInput.value);

  // 空の入力チェック
  if (organizerPriceInput.value === "") {
    answerDisplay.textContent = "幹事の支払額を入力してください";
    answerDisplay.className = "fade-in error";
    organizerPriceInput.classList.add("error");
    setTimeout(() => {
      organizerPriceInput.classList.remove("error");
    }, 2000);
    return false;
  }

  // NaNチェック
  if (isNaN(organizerPrice)) {
    answerDisplay.textContent = "有効な数字を入力してください";
    answerDisplay.className = "fade-in error";
    organizerPriceInput.classList.add("error");
    setTimeout(() => {
      organizerPriceInput.classList.remove("error");
    }, 2000);
    return false;
  }

  // 下限値チェック
  if (organizerPrice < 0) {
    answerDisplay.textContent = "幹事の支払額は0円以上で入力してください";
    answerDisplay.className = "fade-in error";
    organizerPriceInput.classList.add("error");
    setTimeout(() => {
      organizerPriceInput.classList.remove("error");
    }, 2000);
    return false;
  }

  // 総額超過チェック
  const totalPrice = parseInt(priceInput.value);
  if (organizerPrice > totalPrice) {
    answerDisplay.textContent = "幹事の支払額は総額を超えることはできません";
    answerDisplay.className = "fade-in error";
    organizerPriceInput.classList.add("error");
    setTimeout(() => {
      organizerPriceInput.classList.remove("error");
    }, 2000);
    return false;
  }

  // XSS防止：危険な文字列パターンをチェック
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /&lt;/i,
    /&gt;/i,
    /&amp;/i,
    /&quot;/i,
    /&#039;/i,
    /&#x2F;/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(organizerPriceInput.value)) {
      answerDisplay.textContent = "無効な文字が含まれています";
      answerDisplay.className = "fade-in error";
      organizerPriceInput.classList.add("error");
      setTimeout(() => {
        organizerPriceInput.classList.remove("error");
      }, 2000);
      return false;
    }
  }

  return true;
}

/**
 * 参加者支払額のバリデーション
 *
 * @description
 * 参加者が支払う金額の入力値を検証します。
 *
 * @returns {boolean} バリデーション結果（true: 有効, false: 無効）
 */
function validateParticipantPrice() {
  const participantPrice = parseInt(participantPriceInput.value);
  const totalPrice = parseInt(priceInput.value);
  const totalCount = parseInt(countInput.value);

  // 空の入力チェック
  if (participantPriceInput.value === "") {
    answerDisplay.textContent = "参加者の支払額を入力してください";
    answerDisplay.className = "fade-in error";
    participantPriceInput.classList.add("error");
    setTimeout(() => {
      participantPriceInput.classList.remove("error");
    }, 2000);
    return false;
  }

  // NaNチェック
  if (isNaN(participantPrice)) {
    answerDisplay.textContent = "有効な数字を入力してください";
    answerDisplay.className = "fade-in error";
    participantPriceInput.classList.add("error");
    setTimeout(() => {
      participantPriceInput.classList.remove("error");
    }, 2000);
    return false;
  }

  // 下限値チェック
  if (participantPrice < 0) {
    answerDisplay.textContent = "参加者の支払額は0円以上で入力してください";
    answerDisplay.className = "fade-in error";
    participantPriceInput.classList.add("error");
    setTimeout(() => {
      participantPriceInput.classList.remove("error");
    }, 2000);
    return false;
  }

  // 上限値チェック（総額／人数の床関数）
  const maxPrice = Math.floor(totalPrice / totalCount);
  if (participantPrice > maxPrice) {
    answerDisplay.textContent = `参加者の支払額は一人あたり${maxPrice.toLocaleString()}円以下で入力してください`;
    answerDisplay.className = "fade-in error";
    participantPriceInput.classList.add("error");
    setTimeout(() => {
      participantPriceInput.classList.remove("error");
    }, 2000);
    return false;
  }

  // 総額超過チェック（参加者全員の支払額合計）
  const totalParticipantPayment = participantPrice * (totalCount - 1);
  if (totalParticipantPayment >= totalPrice) {
    answerDisplay.textContent = "参加者の支払額の合計が総額を超えています";
    answerDisplay.className = "fade-in error";
    participantPriceInput.classList.add("error");
    setTimeout(() => {
      participantPriceInput.classList.remove("error");
    }, 2000);
    return false;
  }

  // XSS防止：危険な文字列パターンをチェック
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /&lt;/i,
    /&gt;/i,
    /&amp;/i,
    /&quot;/i,
    /&#039;/i,
    /&#x2F;/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(participantPriceInput.value)) {
      answerDisplay.textContent = "無効な文字が含まれています";
      answerDisplay.className = "fade-in error";
      participantPriceInput.classList.add("error");
      setTimeout(() => {
        participantPriceInput.classList.remove("error");
      }, 2000);
      return false;
    }
  }

  return true;
}

/**
 * 計算実行
 *
 * @description
 * 割り勘計算を実行し、一人当たりの金額と余りを計算します。
 *
 * @param {number} price - 総金額
 * @param {number} count - 人数
 * @returns {CalculationResult} 計算結果オブジェクト
 */
function performCalculation(price, count) {
  // 幹事モードがオンの場合
  if (organizerModeToggle.checked) {
    const organizerPrice = parseInt(organizerPriceInput.value);

    // 幹事以外の参加者人数
    const participantCount = count - 1;

    // 参加者が1人以下の場合はエラー
    if (participantCount <= 0) {
      answerDisplay.textContent = "幹事モードでは2人以上必要です";
      answerDisplay.className = "fade-in error";
      return null;
    }

    // 参加者で割る金額
    const remainingAmount = price - organizerPrice;
    const perPerson = Math.floor(remainingAmount / participantCount);
    const remainder = remainingAmount % participantCount;

    return {
      perPerson: perPerson,
      remainder: remainder,
      total: price,
      count: count,
      organizerPrice: organizerPrice,
      participantCount: participantCount,
      isOrganizerMode: true,
    };
  }

  // 参加者モードがオンの場合
  if (participantModeToggle.checked) {
    const participantPrice = parseInt(participantPriceInput.value);
    const participantCount = count - 1;

    // 参加者が1人以下の場合はエラー
    if (participantCount <= 0) {
      answerDisplay.textContent = "参加者モードでは2人以上必要です";
      answerDisplay.className = "fade-in error";
      return null;
    }

    // 幹事の支払額を計算
    const totalParticipantPayment = participantPrice * participantCount;
    const organizerPrice = price - totalParticipantPayment;

    return {
      perPerson: participantPrice,
      remainder: price - participantPrice * count, // 実際の余りを計算
      total: price,
      count: count,
      organizerPrice: organizerPrice,
      participantCount: participantCount,
      isParticipantMode: true,
      participantPrice: participantPrice,
    };
  }

  // 通常の割り勘計算
  const perPerson = Math.floor(price / count);
  const remainder = price % count;

  return {
    perPerson: perPerson,
    remainder: remainder,
    total: price,
    count: count,
    isOrganizerMode: false,
    isParticipantMode: false,
  };
}

/**
 * 計算結果の表示
 *
 * @description
 * 計算結果を画面に表示します。
 * 割り切れる場合と余りがある場合で表示を切り替えます。
 *
 * @param {CalculationResult} result - 計算結果オブジェクト
 * @returns {void}
 */
function displayResult(result) {
  // 計算エラーの場合
  if (!result) {
    return;
  }

  answerDisplay.className = "fade-in success";

  // 既存の内容をクリア
  answerDisplay.innerHTML = "";

  if (result.isOrganizerMode) {
    // 幹事モードの場合
    const organizerDiv = document.createElement("div");
    organizerDiv.className = "result-amount";
    organizerDiv.textContent = `幹事: ${result.organizerPrice.toLocaleString()}円`;

    const participantDiv = document.createElement("div");
    participantDiv.className = "result-amount";
    participantDiv.textContent = `参加者: 一人 ${result.perPerson.toLocaleString()}円`;

    const detailDiv = document.createElement("div");
    detailDiv.className = "result-detail";
    detailDiv.textContent =
      result.remainder === 0
        ? "ぴったり割り切れました！ 🎉"
        : `余りは ${result.remainder.toLocaleString()}円です`;

    answerDisplay.appendChild(organizerDiv);
    answerDisplay.appendChild(participantDiv);
    answerDisplay.appendChild(detailDiv);
  } else if (result.isParticipantMode) {
    // 参加者モードの場合
    const participantDiv = document.createElement("div");
    participantDiv.className = "result-amount";
    participantDiv.textContent = `参加者: 一人 ${result.participantPrice.toLocaleString()}円`;

    const organizerDiv = document.createElement("div");
    organizerDiv.className = "result-amount";
    organizerDiv.textContent = `幹事: ${result.organizerPrice.toLocaleString()}円`;

    const detailDiv = document.createElement("div");
    detailDiv.className = "result-detail";
    detailDiv.textContent =
      result.remainder === 0
        ? "ぴったり割り切れました！ 🎉"
        : `差額は ${result.remainder.toLocaleString()}円です`;

    answerDisplay.appendChild(participantDiv);
    answerDisplay.appendChild(organizerDiv);
    answerDisplay.appendChild(detailDiv);
  } else {
    // 通常の割り勘の場合
    const amountDiv = document.createElement("div");
    amountDiv.className = "result-amount";
    amountDiv.textContent = `一人 ${result.perPerson.toLocaleString()}円`;

    const detailDiv = document.createElement("div");
    detailDiv.className = "result-detail";
    detailDiv.textContent =
      result.remainder === 0
        ? "ぴったり割り切れました！ 🎉"
        : `余りは ${result.remainder.toLocaleString()}円です`;

    answerDisplay.appendChild(amountDiv);
    answerDisplay.appendChild(detailDiv);
  }

  // 音声フィードバック（任意）
  playSuccessSound();
}

/**
 * 成功音を再生
 *
 * @description
 * Web Audio APIを使用して計算完了時の成功音を再生します。
 * Audio APIが使用できない場合はサイレントに失敗します。
 *
 * @returns {void}
 */
function playSuccessSound() {
  try {
    /** @type {AudioContext} Web Audio APIコンテキスト */
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    /** @type {OscillatorNode} 音源 */
    const oscillator = audioContext.createOscillator();

    /** @type {GainNode} 音量制御 */
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 523.25; // C5
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.1
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // Audio APIが使えない場合は無視
    console.log("Audio API not available");
  }
}

/**
 * 全角数字を半角数字に変換
 *
 * @description
 * Unicode文字コードの差分を使用して全角数字を半角数字に変換します。
 *
 * @param {string} str - 変換対象の文字列
 * @returns {string} 変換後の文字列
 */
function convertFullWidthToHalfWidth(str) {
  return str.replace(/[０-９]/g, function (char) {
    return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
  });
}

/**
 * 半角数字入力を強制
 *
 * @description
 * 入力フィールドの値をリアルタイムでフィルタリングし、
 * 全角数字を半角に変換し、数字以外の文字を削除します。
 *
 * @param {InputEvent} event - イン力イベント
 * @returns {void}
 */
function enforceHalfWidthNumbers(event) {
  const input = event.target;
  const originalValue = input.value;

  // 全角数字を半角に変換
  let convertedValue = convertFullWidthToHalfWidth(originalValue);

  // 数字以外の文字を削除
  convertedValue = convertedValue.replace(/[^0-9]/g, "");

  // 値が変更された場合のみ更新
  if (originalValue !== convertedValue) {
    // カーソル位置を維持するために一時的に保存
    const cursorPosition = input.selectionStart;

    input.value = convertedValue;

    // カーソル位置を復元
    input.setSelectionRange(cursorPosition, cursorPosition);
  }
}

/**
 * ペースト時の半角数字制御
 *
 * @description
 * ペーストされたテキストをフィルタリングし、数字のみを入力フィールドに挿入します。
 *
 * @param {ClipboardEvent} event - クリップボードイベント
 * @returns {void}
 */
function enforceHalfWidthNumbersOnPaste(event) {
  event.preventDefault();

  // クリップボードからテキストを取得
  const pastedText = (event.clipboardData || window.clipboardData).getData(
    "text"
  );

  // 全角数字を半角に変換し、数字以外を削除
  let filteredText = convertFullWidthToHalfWidth(pastedText);
  filteredText = filteredText.replace(/[^0-9]/g, "");

  // 現在のカーソル位置にテキストを挿入
  const input = event.target;
  const currentValue = input.value;
  const cursorPosition = input.selectionStart;
  const newValue =
    currentValue.slice(0, cursorPosition) +
    filteredText +
    currentValue.slice(input.selectionEnd);

  // 新しい値を設定
  input.value = newValue;

  // カーソル位置を更新
  const newCursorPosition = cursorPosition + filteredText.length;
  input.setSelectionRange(newCursorPosition, newCursorPosition);
}

/**
 * IMEを無効化
 *
 * @description
 * 日本語入力モードを無効化し、半角数字入力を強制します。
 *
 * @param {FocusEvent} event - フォーカスイベント
 * @returns {void}
 */
function disableIME(event) {
  const input = event.target;

  // 日本語IMEを無効化（主要ブラウザ対応）
  try {
    input.style.imeMode = "disabled";
  } catch (e) {
    // ime-modeがサポートされていない場合は無視
  }

  // 入力モードを強制的に半角に設定
  setTimeout(() => {
    if (input.value && !/^[0-9]+$/.test(input.value)) {
      // 不正な文字が含まれている場合はクリア
      input.value = "";
    }
  }, 0);
}

/**
 * ページ読み込み時の初期化処理
 *
 * @description
 * DOM読み込み完了後、フォーカス設定、イベントリスナー登録、
 * タッチデバイス向けの最適化を行います。
 *
 * @listens DOMContentLoaded
 * @returns {void}
 */
document.addEventListener("DOMContentLoaded", function () {
  // 金額入力フィールドにフォーカス
  priceInput.focus();

  // フォームにフォーカス時の視覚効果
  [priceInput, countInput].forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.classList.add("fade-in");
    });
  });

  // トグルのイベントリスナーを設定
  organizerModeToggle.addEventListener("change", handleOrganizerModeToggle);
  participantModeToggle.addEventListener("change", handleParticipantModeToggle);

  // タッチデバイス向けの最適化
  if ("ontouchstart" in window) {
    // タッチデバイスの場合はフォーカスを自動的にセットしない
    // （キーボードが自動的に表示されるのを防ぐため）

    // 入力フィールドのタッチフィードバック
    [priceInput, countInput].forEach((input) => {
      input.addEventListener("touchstart", function () {
        this.style.transform = "scale(0.98)";
        setTimeout(() => {
          this.style.transform = "";
        }, 150);
      });
    });

    // ボタンのタッチフィードバック強化
    calculateButton.addEventListener("touchstart", function () {
      this.style.transform = "scale(0.95)";
    });

    calculateButton.addEventListener("touchend", function () {
      setTimeout(() => {
        this.style.transform = "";
      }, 150);
    });
  }
});

/**
 * バリデーション結果の型定義
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - 検証結果（true: 有効, false: 無効）
 * @property {string} errorMessage - エラーメッセージ
 * @property {string|null} errorCode - エラーコード
 */

/**
 * 計算結果の型定義
 * @typedef {Object} CalculationResult
 * @property {number} perPerson - 一人当たりの金額
 * @property {number} remainder - 余り
 * @property {number} total - 総金額
 * @property {number} count - 人数
 */
