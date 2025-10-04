"use strict";

// DOM要素の取得
const priceInput = document.getElementById('price');
const countInput = document.getElementById('count');
const calculateButton = document.getElementById('action');
const answerDisplay = document.getElementById('answer');

// イベントリスナーの設定
calculateButton.addEventListener('click', calculateSplit);
priceInput.addEventListener('input', handleInputChange);
countInput.addEventListener('input', handleInputChange);
priceInput.addEventListener('keypress', handleEnterKey);
countInput.addEventListener('keypress', handleEnterKey);

// 半角数字入力制御のためのイベントリスナー
priceInput.addEventListener('input', enforceHalfWidthNumbers);
priceInput.addEventListener('paste', enforceHalfWidthNumbersOnPaste);
priceInput.addEventListener('focus', disableIME);
countInput.addEventListener('input', enforceHalfWidthNumbers);
countInput.addEventListener('paste', enforceHalfWidthNumbersOnPaste);
countInput.addEventListener('focus', disableIME);

// 計算機能
function calculateSplit() {
    // ボタンにアニメーション効果
    calculateButton.classList.add('pulse');
    setTimeout(() => calculateButton.classList.remove('pulse'), 500);

    // 入力値の取得
    const price = parseInt(priceInput.value);
    const count = parseInt(countInput.value);

    // バリデーション
    if (!isValidInput(price, count)) {
        return;
    }

    // 計算実行
    const result = performCalculation(price, count);

    // 結果表示
    displayResult(result);
}

// 入力変更時の処理
function handleInputChange() {
    // 結果表示を初期化
    if (priceInput.value === '' && countInput.value === '') {
        resetDisplay();
    }
}

// Enterキーで計算実行
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        calculateSplit();
    }
}

// 表示をリセット
function resetDisplay() {
    answerDisplay.textContent = '金額と人数を入力してください';
    answerDisplay.className = '';
    answerDisplay.style.color = '#666';
}

// バリデーション機能
function isValidInput(price, count) {
    answerDisplay.className = 'fade-in';

    if (isNaN(price) || price <= 0) {
        if (priceInput.value === '') {
            answerDisplay.textContent = '金額を入力してください';
        } else {
            answerDisplay.textContent = '有効な金額を入力してください';
        }
        answerDisplay.classList.add('error');
        return false;
    }

    if (isNaN(count) || count <= 0) {
        if (countInput.value === '') {
            answerDisplay.textContent = '人数を入力してください';
        } else {
            answerDisplay.textContent = '有効な人数を入力してください';
        }
        answerDisplay.classList.add('error');
        return false;
    }

    return true;
}

// 計算実行機能
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

// 結果表示機能
function displayResult(result) {
    answerDisplay.className = 'fade-in success';

    if (result.remainder === 0) {
        // 割り切れる場合
        answerDisplay.innerHTML = `
            <div class="result-amount">一人 ${result.perPerson.toLocaleString()}円</div>
            <div class="result-detail">ぴったり割り切れました！ 🎉</div>
        `;
    } else {
        // 余りがある場合
        answerDisplay.innerHTML = `
            <div class="result-amount">一人 ${result.perPerson.toLocaleString()}円</div>
            <div class="result-detail">余りは ${result.remainder.toLocaleString()}円です</div>
        `;
    }

    // 音声フィードバック（任意）
    playSuccessSound();
}

// 成功音を再生（Web Audio API）
function playSuccessSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 523.25; // C5
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Audio APIが使えない場合は無視
        console.log('Audio API not available');
    }
}

// 全角数字を半角数字に変換する関数
function convertFullWidthToHalfWidth(str) {
    return str.replace(/[０-９]/g, function(char) {
        return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });
}

// 半角数字入力を強制する関数
function enforceHalfWidthNumbers(event) {
    const input = event.target;
    const originalValue = input.value;

    // 全角数字を半角に変換
    let convertedValue = convertFullWidthToHalfWidth(originalValue);

    // 数字以外の文字を削除
    convertedValue = convertedValue.replace(/[^0-9]/g, '');

    // 値が変更された場合のみ更新
    if (originalValue !== convertedValue) {
        // カーソル位置を維持するために一時的に保存
        const cursorPosition = input.selectionStart;

        input.value = convertedValue;

        // カーソル位置を復元
        input.setSelectionRange(cursorPosition, cursorPosition);
    }
}

// ペースト時の半角数字制御
function enforceHalfWidthNumbersOnPaste(event) {
    event.preventDefault();

    // クリップボードからテキストを取得
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');

    // 全角数字を半角に変換し、数字以外を削除
    let filteredText = convertFullWidthToHalfWidth(pastedText);
    filteredText = filteredText.replace(/[^0-9]/g, '');

    // 現在のカーソル位置にテキストを挿入
    const input = event.target;
    const currentValue = input.value;
    const cursorPosition = input.selectionStart;
    const newValue = currentValue.slice(0, cursorPosition) + filteredText + currentValue.slice(input.selectionEnd);

    // 新しい値を設定
    input.value = newValue;

    // カーソル位置を更新
    const newCursorPosition = cursorPosition + filteredText.length;
    input.setSelectionRange(newCursorPosition, newCursorPosition);
}

// IMEを無効化する関数
function disableIME(event) {
    const input = event.target;

    // 日本語IMEを無効化（主要ブラウザ対応）
    try {
        input.style.imeMode = 'disabled';
    } catch (e) {
        // ime-modeがサポートされていない場合は無視
    }

    // 入力モードを強制的に半角に設定
    setTimeout(() => {
        if (input.value && !/^[0-9]+$/.test(input.value)) {
            // 不正な文字が含まれている場合はクリア
            input.value = '';
        }
    }, 0);
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    priceInput.focus();

    // フォームにフォーカス時の視覚効果
    [priceInput, countInput].forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('fade-in');
        });
    });

    // タッチデバイス向けの最適化
    if ('ontouchstart' in window) {
        // タッチデバイスの場合はフォーカスを自動的にセットしない
        // （キーボードが自動的に表示されるのを防ぐため）

        // 入力フィールドのタッチフィードバック
        [priceInput, countInput].forEach(input => {
            input.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        });

        // ボタンのタッチフィードバック強化
        calculateButton.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });

        calculateButton.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    }
});

