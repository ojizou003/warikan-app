/**
 * シェアUIコンポーネント
 *
 * @description
 * シェア機能のユーザーインターフェースを提供します。
 * モーダルダイアログ、ボタン群、フィードバック表示を実装。
 *
 * @module ShareUI
 * @version 1.0.0
 */

import { shareManager } from '../share.js';

/**
 * シェアUIクラス
 *
 * @class
 * @classdesc
 * シェア機能のUIコンポーネントを管理するクラス。
 */
class ShareUI {
    /**
     * コンストラクタ
     *
     * @description
     * シェアUIを初期化します。
     *
     * @param {HTMLElement} container - コンテナ要素
     * @param {Object} [options={}] - オプション
     * @param {boolean} [options.enableAnimation=true] - アニメーション有効化
     * @param {string} [options.theme='default'] - テーマ
     */
    constructor(container, options = {}) {
        /** @type {HTMLElement} コンテナ要素 */
        this.container = container;

        /** @type {Object} オプション */
        this.options = {
            enableAnimation: true,
            theme: 'default',
            ...options
        };

        /** @type {HTMLElement} モーダル要素 */
        this.modal = null;

        /** @type {HTMLElement} オーバーレイ要素 */
        this.overlay = null;

        /** @type {CalculationResultExtended} 現在の計算結果 */
        this.currentResult = null;

        /** @type {boolean} 表示状態 */
        this.isVisible = false;

        // 初期化
        this.init();
    }

    /**
     * 初期化
     *
     * @description
     * UIコンポーネントを初期化します。
     *
     * @returns {void}
     */
    init() {
        this.createModal();
        this.bindEvents();
    }

    /**
     * モーダルを作成
     *
     * @description
     * シェア用モーダルダイアログを作成します。
     *
     * @returns {void}
     */
    createModal() {
        // オーバーレイ
        this.overlay = document.createElement('div');
        this.overlay.className = 'share-modal-overlay';
        this.overlay.setAttribute('data-element', 'overlay');
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // モーダル
        this.modal = document.createElement('div');
        this.modal.className = 'share-modal';
        this.modal.setAttribute('data-element', 'modal');
        this.modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 480px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            transform: translateY(20px) scale(0.95);
            transition: transform 0.3s ease, opacity 0.3s ease;
            opacity: 0;
        `;

        // モーダルコンテンツ
        this.modal.innerHTML = `
            <div class="share-modal-header" data-element="header">
                <h2 style="margin: 0; font-size: 1.4rem; color: #333;">計算結果をシェア</h2>
                <button class="share-modal-close" data-element="close" style="
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px;
                    color: #666;
                ">×</button>
            </div>

            <div class="share-modal-content" data-element="content">
                <div class="share-preview" data-element="preview" style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 20px;
                ">
                    <div class="share-preview-text" data-element="preview-text"></div>
                </div>

                <div class="share-actions" data-element="actions">
                    <h3 style="margin: 0 0 12px 0; font-size: 1.1rem; color: #333;">シェア方法</h3>

                    <div class="share-buttons" data-element="share-buttons" style="
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                        margin-bottom: 20px;
                    ">
                        <button class="share-button share-button-clipboard" data-action="clipboard" style="
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <span style="font-size: 20px;">📋</span>
                            <span>クリップボード</span>
                        </button>

                        <button class="share-button share-button-native" data-action="native" style="
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <span style="font-size: 20px;">📱</span>
                            <span>共有</span>
                        </button>

                        <button class="share-button share-button-twitter" data-action="twitter" style="
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <span style="font-size: 20px;">𝕏</span>
                            <span>X (Twitter)</span>
                        </button>

                        <button class="share-button share-button-line" data-action="line" style="
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <span style="font-size: 20px;">💬</span>
                            <span>LINE</span>
                        </button>

                        <button class="share-button share-button-facebook" data-action="facebook" style="
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <span style="font-size: 20px;">📘</span>
                            <span>Facebook</span>
                        </button>

                        <button class="share-button share-button-url" data-action="url" style="
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <span style="font-size: 20px;">🔗</span>
                            <span>URLコピー</span>
                        </button>
                    </div>

                    <div class="share-custom-message" data-element="custom-message" style="
                        margin-bottom: 20px;
                    ">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                            追加メッセージ（任意）
                        </label>
                        <textarea class="share-message-input" data-element="message-input" style="
                            width: 100%;
                            min-height: 60px;
                            padding: 8px;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            resize: vertical;
                            font-family: inherit;
                        " placeholder="例: ランチのお会計です"></textarea>
                    </div>

                    <div class="share-url" data-element="url-section" style="
                        display: none;
                        background: #f0f0f0;
                        padding: 12px;
                        border-radius: 6px;
                        font-family: monospace;
                        font-size: 0.9rem;
                        word-break: break-all;
                        margin-bottom: 12px;
                    "></div>
                </div>
            </div>
        `;

        // コンテナに追加
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);

        // CSSを追加
        this.addStyles();
    }

    /**
     * スタイルを追加
     *
     * @description
     * コンポーネントのCSSスタイルを追加します。
     *
     * @returns {void}
     */
    addStyles() {
        const styleId = 'share-ui-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .share-modal-overlay.show {
                    display: flex;
                }

                .share-modal-overlay.show .share-modal {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }

                .share-modal-overlay.visible .share-modal {
                    opacity: 1;
                }

                .share-button:hover {
                    border-color: #667eea;
                    background: #f8f9ff;
                    transform: translateY(-2px);
                }

                .share-button:active {
                    transform: translateY(0);
                }

                .share-button.success {
                    border-color: #27ae60;
                    background: #d5f4e6;
                }

                .share-button.error {
                    border-color: #e74c3c;
                    background: #fadbd8;
                }

                .share-preview {
                    border: 1px solid #e0e0e0;
                }

                .share-preview-text {
                    white-space: pre-line;
                    line-height: 1.5;
                    color: #333;
                }

                @media (max-width: 480px) {
                    .share-modal {
                        width: 95%;
                        padding: 20px;
                    }

                    .share-buttons {
                        grid-template-columns: 1fr;
                    }
                }

                .share-feedback {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #27ae60;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    transform: translateX(400px);
                    transition: transform 0.3s ease;
                    z-index: 2000;
                }

                .share-feedback.show {
                    transform: translateX(0);
                }

                .share-feedback.error {
                    background: #e74c3c;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * イベントをバインド
     *
     * @description
     * イベントハンドラを設定します。
     *
     * @returns {void}
     */
    bindEvents() {
        // オーバーレイクリックで閉じる
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // 閉じるボタン
        const closeButton = this.modal.querySelector('[data-element="close"]');
        closeButton.addEventListener('click', () => {
            this.hide();
        });

        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // シェアボタン
        const shareButtons = this.modal.querySelectorAll('[data-action]');
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleShareAction(action);
            });
        });
    }

    /**
     * シェアダイアログを表示
     *
     * @description
     * 計算結果のシェアダイアログを表示します。
     *
     * @param {CalculationResultExtended} result - 計算結果
     * @param {Object} [options={}] - オプション
     * @returns {void}
     */
    show(result, options = {}) {
        this.currentResult = result;

        // プレビューを更新
        this.updatePreview(result);

        // URLを生成
        const shareUrl = shareManager.encodeToUrl(result);
        this.updateUrlSection(shareUrl);

        // 表示状態を更新
        this.isVisible = true;
        this.overlay.style.display = 'flex';

        // アニメーション
        if (this.options.enableAnimation) {
            requestAnimationFrame(() => {
                this.overlay.classList.add('show');
                this.overlay.style.opacity = '1';
            });
        } else {
            this.overlay.classList.add('show');
            this.overlay.style.opacity = '1';
        }

        // フォーカス
        const firstButton = this.modal.querySelector('[data-action]');
        if (firstButton) {
            firstButton.focus();
        }
    }

    /**
     * シェアダイアログを非表示
     *
     * @description
     * シェアダイアログを閉じます。
     *
     * @returns {void}
     */
    hide() {
        this.isVisible = false;

        // アニメーション
        if (this.options.enableAnimation) {
            this.overlay.style.opacity = '0';
            this.overlay.classList.remove('show');

            setTimeout(() => {
                if (this.overlay.style.display === 'flex') {
                    this.overlay.style.display = 'none';
                }
            }, 300);
        } else {
            this.overlay.classList.remove('show');
            this.overlay.style.display = 'none';
        }
    }

    /**
     * プレビューを更新
     *
     * @description
     * 計算結果のプレビューを更新します。
     *
     * @param {CalculationResultExtended} result - 計算結果
     * @returns {void}
     */
    updatePreview(result) {
        const previewText = this.modal.querySelector('[data-element="preview-text"]');
        const shareText = shareManager.generateShareText(result);

        previewText.textContent = shareText;
    }

    /**
     * URLセクションを更新
     *
     * @description
     * シェアURLセクションを更新します。
     *
     * @param {string} url - シェアURL
     * @returns {void}
     */
    updateUrlSection(url) {
        const urlSection = this.modal.querySelector('[data-element="url-section"]');
        urlSection.textContent = url;
        urlSection.dataset.url = url;
    }

    /**
     * シェアアクションを処理
     *
     * @description
     * 各シェアボタンのアクションを処理します。
     *
     * @param {string} action - アクション種別
     * @returns {Promise<void>}
     */
    async handleShareAction(action) {
        if (!this.currentResult) return;

        const button = this.modal.querySelector(`[data-action="${action}"]`);
        const originalContent = button.innerHTML;

        try {
            // ローディング表示
            button.innerHTML = '<span style="font-size: 20px;">⏳</span><span>処理中...</span>';
            button.disabled = true;

            // カスタムメッセージを取得
            const messageInput = this.modal.querySelector('[data-element="message-input"]');
            const customMessage = messageInput.value.trim();

            let success = false;
            let message = '';

            switch (action) {
                case 'clipboard':
                    success = await shareManager.copyToClipboard(this.currentResult, {
                        customMessage
                    });
                    message = success ? 'クリップボードにコピーしました' : 'コピーに失敗しました';
                    break;

                case 'native':
                    success = await shareManager.nativeShare(this.currentResult, {
                        text: customMessage
                    });
                    if (success) {
                        this.hide();
                        return;
                    }
                    message = '共有に失敗しました';
                    break;

                case 'twitter':
                case 'line':
                case 'facebook':
                    const snsUrl = shareManager.generateSNSUrl(action, this.currentResult, {
                        customMessage
                    });
                    if (snsUrl) {
                        window.open(snsUrl, '_blank', 'width=600,height=400');
                        success = true;
                    }
                    break;

                case 'url':
                    const url = shareManager.encodeToUrl(this.currentResult);
                    success = await this.copyToClipboard(url);
                    message = success ? 'URLをコピーしました' : 'URLのコピーに失敗しました';

                    // URLセクションを表示
                    const urlSection = this.modal.querySelector('[data-element="url-section"]');
                    urlSection.style.display = 'block';
                    break;
            }

            // フィードバック表示
            if (success) {
                button.classList.add('success');
                if (!message) message = 'シェアしました';
                this.showFeedback(message, false);
            } else {
                button.classList.add('error');
                if (!message) message = 'シェアに失敗しました';
                this.showFeedback(message, true);
            }

            // ボタンを復元
            setTimeout(() => {
                button.innerHTML = originalContent;
                button.disabled = false;
                button.classList.remove('success', 'error');
            }, 2000);

        } catch (error) {
            console.error('シェアアクションエラー:', error);
            button.innerHTML = originalContent;
            button.disabled = false;
            button.classList.add('error');
            this.showFeedback('エラーが発生しました', true);
        }
    }

    /**
     * クリップボードにコピー
     *
     * @description
     * テキストをクリップボードにコピーします。
     *
     * @param {string} text - コピーするテキスト
     * @returns {Promise<boolean>} 成功時true
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            return true;
        } catch (error) {
            console.error('クリップボードエラー:', error);
            return false;
        }
    }

    /**
     * フィードバックを表示
     *
     * @description
     * 操作結果のフィードバックを表示します。
     *
     * @param {string} message - メッセージ
     * @param {boolean} isError - エラーかどうか
     * @returns {void}
     */
    showFeedback(message, isError = false) {
        // 既存のフィードバックを削除
        const existingFeedback = document.querySelector('.share-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // 新しいフィードバックを作成
        const feedback = document.createElement('div');
        feedback.className = `share-feedback ${isError ? 'error' : ''}`;
        feedback.textContent = message;

        document.body.appendChild(feedback);

        // 表示アニメーション
        requestAnimationFrame(() => {
            feedback.classList.add('show');
        });

        // 自動で非表示
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * 破棄
     *
     * @description
     * コンポーネントを破棄します。
     *
     * @returns {void}
     */
    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }

        // スタイルを削除
        const style = document.getElementById('share-ui-styles');
        if (style) {
            style.remove();
        }
    }
}

// エクスポート
export { ShareUI };