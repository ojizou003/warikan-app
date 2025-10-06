# シェア機能 - 詳細技術仕様書

## 1. 機能概要

計算結果を簡単に共有できる機能です。以下のシェア方法をサポートします：

1. **クリップボードコピー** - 結果をテキスト形式でクリップボードにコピー
2. **URLパラメータ共有** - 計算条件をURLに埋め込んで共有
3. **SNSシェア** - LINE、TwitterなどのSNSに投稿

## 2. クリップボードコピー機能

### 2.1 コピー内容のフォーマット

#### 基本フォーマット
```javascript
// 均等割りの場合
「〇〇会計」
総額: 5,000円
人数: 5人
1人あたり: 1,000円
端数: 0円
合計: 5,000円

// 幹事負担の場合
「飲み会会計」（幹事多め負担）
総額: 10,000円
人数: 4人
幹事: 3,500円
参加者: 2,166円 × 3人 = 6,498円
端数: 2円（参加者が負担）
合計: 10,000円

// 簡潔フォーマット（オプション）
割り勘結果: 5,000円 ÷ 5人 = 1,000円/人
```

#### 実装仕様
```javascript
/**
 * シェア用のテキストを生成
 * @param {CalculationResult} result - 計算結果
 * @param {Object} options - フォーマットオプション
 * @returns {string} フォーマットされたテキスト
 */
class ShareFormatter {
  formatText(result, options = {}) {
    const {
      format = 'detailed',  // 'detailed' | 'simple' | 'minimal'
      includeTitle = true,
      includeBreakdown = true,
      customTitle = ''
    } = options;

    const title = customTitle || '割り勘計算';
    const lines = [];

    // タイトル
    if (includeTitle) {
      lines.push(`「${title}」`);

      if (result.type !== 'equal') {
        lines.push(`（${this.getTypeLabel(result.type)}）`);
      }
      lines.push('');
    }

    // 基本情報
    lines.push(`総額: ${this.formatCurrency(result.totalAmount)}円`);
    lines.push(`人数: ${result.numberOfPeople}人`);
    lines.push('');

    // 支払額詳細
    if (result.type === 'equal') {
      lines.push(`1人あたり: ${this.formatCurrency(result.perPerson)}円`);

      if (result.remainder > 0) {
        lines.push(`端数: ${this.formatCurrency(result.remainder)}円`);
      }
    } else {
      // 幹事負担の場合
      lines.push(`幹事: ${this.formatCurrency(result.organizerPayment)}円`);
      lines.push(`参加者: ${this.formatCurrency(result.participantPayment)}円 × ${result.numberOfPeople - 1}人 = ${this.formatCurrency(result.participantTotal)}円`);

      if (result.remainder > 0) {
        const remainderRecipient = result.remainderRecipient === 'organizer' ? '幹事' : '参加者';
        lines.push(`端数: ${this.formatCurrency(result.remainder)}円（${remainderRecipient}が負担）`);
      }
    }

    // 合計
    lines.push('');
    lines.push(`合計: ${this.formatCurrency(result.totalCheck)}円`);

    // 日時（オプション）
    if (options.includeDate) {
      const now = new Date();
      lines.push('');
      lines.push(`計算日時: ${now.toLocaleString('ja-JP')}`);
    }

    return lines.join('\n');
  }

  formatSimple(result) {
    if (result.type === 'equal') {
      return `割り勘: ${this.formatCurrency(result.totalAmount)}円 ÷ ${result.numberOfPeople}人 = ${this.formatCurrency(result.perPerson)}円/人`;
    } else {
      return `割り勘（${this.getTypeLabel(result.type)}）: 総額${this.formatCurrency(result.totalAmount)}円、幹事${this.formatCurrency(result.organizerPayment)}円、参加者${this.formatCurrency(result.participantPayment)}円/人`;
    }
  }

  formatMinimal(result) {
    return `${this.formatCurrency(result.totalAmount)}円を${result.numberOfPeople}人で割ると${this.formatCurrency(result.perPerson)}円`;
  }

  // HTMLフォーマット（SNSシェア用）
  formatHTML(result) {
    const typeLabel = this.getTypeLabel(result.type);

    return `
      <div class="warikan-result">
        <h3>割り勘計算結果</h3>
        <div class="result-type">${typeLabel}</div>
        <div class="result-details">
          <div class="row">
            <span class="label">総額:</span>
            <span class="value">¥${this.formatNumber(result.totalAmount)}</span>
          </div>
          <div class="row">
            <span class="label">人数:</span>
            <span class="value">${result.numberOfPeople}人</span>
          </div>
          ${result.type === 'equal' ?
            `<div class="row">
              <span class="label">1人あたり:</span>
              <span class="value">¥${this.formatNumber(result.perPerson)}</span>
            </div>` :
            `<div class="row">
              <span class="label">幹事:</span>
              <span class="value">¥${this.formatNumber(result.organizerPayment)}</span>
            </div>
            <div class="row">
              <span class="label">参加者:</span>
              <span class="value">¥${this.formatNumber(result.participantPayment)} × ${result.numberOfPeople - 1}人</span>
            </div>`
          }
        </div>
        <div class="app-info">
          <a href="${window.location.origin}">割り勘アプリで計算</a>
        </div>
      </div>
    `;
  }

  // ユーティリティメソッド
  getTypeLabel(type) {
    const labels = {
      equal: '均等割り',
      organizer_more: '幹事多め',
      organizer_less: '幹事少なめ',
      organizer_fixed: '幹事固定',
      custom: 'カスタム'
    };
    return labels[type] || type;
  }

  formatCurrency(num) {
    return num.toLocaleString('ja-JP');
  }

  formatNumber(num) {
    return num.toLocaleString('ja-JP');
  }
}
```

### 2.2 クリップボード操作実装

```javascript
/**
 * クリップボード操作を管理
 */
class ClipboardManager {
  constructor() {
    this.isSupported = this.checkSupport();
  }

  checkSupport() {
    return !!(navigator.clipboard && navigator.clipboard.writeText);
  }

  async copyText(text) {
    try {
      if (this.isSupported) {
        // モダンブラウザ
        await navigator.clipboard.writeText(text);
        return { success: true, method: 'clipboard-api' };
      } else {
        // レガシーブラウザ向けのフォールバック
        return this.fallbackCopy(text);
      }
    } catch (error) {
      console.error('クリップボードコピー失敗:', error);
      return this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    try {
      // 一時的なtextareaを作成
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);

      // 選択してコピー
      textarea.select();
      textarea.setSelectionRange(0, 99999); // モバイル対応

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (successful) {
        return { success: true, method: 'exec-command' };
      } else {
        throw new Error('execCommand failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        method: 'exec-command'
      };
    }
  }

  async copyWithFeedback(text, button) {
    const originalText = button.textContent;

    // コピー中の表示
    button.textContent = 'コピー中...';
    button.disabled = true;

    try {
      const result = await this.copyText(text);

      if (result.success) {
        button.textContent = 'コピーしました!';
        button.classList.add('success');

        // 2秒後に元に戻す
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('success');
          button.disabled = false;
        }, 2000);

        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      button.textContent = 'コピー失敗';
      button.classList.add('error');

      // 2秒後に元に戻す
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('error');
        button.disabled = false;
      }, 2000);

      // 手動コピーを促す
      this.showManualCopyDialog(text);

      return false;
    }
  }

  showManualCopyDialog(text) {
    // ダイアログ表示
    const modal = document.createElement('div');
    modal.className = 'copy-modal';
    modal.innerHTML = `
      <div class="copy-modal-content">
        <h3>コピーに失敗しました</h3>
        <p>以下のテキストを手動でコピーしてください：</p>
        <textarea readonly>${text}</textarea>
        <button class="btn-close">閉じる</button>
      </div>
    `;

    document.body.appendChild(modal);

    // テキストを選択
    const textarea = modal.querySelector('textarea');
    textarea.select();
    textarea.setSelectionRange(0, 99999);

    // 閉じるボタン
    modal.querySelector('.btn-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // 背景クリックで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
}
```

## 3. URLパラメータ共有

### 3.1 URLエンコード設計

#### URL構造
```javascript
// 基本構造
https://example.com/warikan/?{parameters}

// パラメータ一覧
- amount: 総額（必須）
- people: 人数（必須）
- type: 計算タイプ（オプション、デフォルト: equal）
- burden: 幹事負担額（オプション）
- note: 備考（オプション、URLエンコード）
- ts: タイムスタンプ（オプション）

// 例
https://example.com/warikan/?amount=5000&people=5&type=organizer_more&burden=1000&note=%E9%99%B2%E3%81%BF%E4%BC%9A
```

#### 実装仕様
```javascript
/**
 * URLパラメータの生成と解析
 */
class URLShareManager {
  constructor() {
    this.baseUrl = window.location.origin + window.location.pathname;
  }

  /**
   * 計算結果から共有URLを生成
   */
  generateShareURL(result, options = {}) {
    const params = new URLSearchParams();

    // 基本パラメータ
    params.set('amount', result.totalAmount.toString());
    params.set('people', result.numberOfPeople.toString());

    // 計算タイプ
    if (result.type && result.type !== 'equal') {
      params.set('type', result.type);
    }

    // 幹事負担パラメータ
    switch (result.type) {
      case 'organizer_more':
        if (result.organizerBurden > 0) {
          params.set('burden', result.organizerBurden.toString());
        }
        break;

      case 'organizer_less':
        if (result.organizerBurden < 0) {
          params.set('burden', Math.abs(result.organizerBurden).toString());
        }
        break;

      case 'organizer_fixed':
        if (result.organizerPayment > 0) {
          params.set('burden', result.organizerPayment.toString());
        }
        break;
    }

    // 備考
    if (options.note) {
      params.set('note', encodeURIComponent(options.note));
    }

    // タイムスタンプ（追跡用）
    if (options.includeTimestamp) {
      params.set('ts', Date.now().toString());
    }

    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * URLから計算条件を復元
   */
  parseURL(url = window.location.href) {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      // 必須パラメータのチェック
      const amount = parseInt(params.get('amount')) || 0;
      const people = parseInt(params.get('people')) || 0;

      if (amount <= 0 || people < 2) {
        throw new Error('無効なURLパラメータです');
      }

      const result = {
        totalAmount: amount,
        numberOfPeople: people,
        type: params.get('type') || 'equal',
        valid: true
      };

      // 幹事負担パラメータ
      const burden = parseInt(params.get('burden')) || 0;
      if (burden > 0) {
        switch (result.type) {
          case 'organizer_more':
            result.organizerBurden = burden;
            break;

          case 'organizer_less':
            result.organizerBurden = -burden;
            break;

          case 'organizer_fixed':
            result.organizerFixed = burden;
            break;
        }
      }

      // 備考
      const note = params.get('note');
      if (note) {
        result.note = decodeURIComponent(note);
      }

      // タイムスタンプ
      const timestamp = params.get('ts');
      if (timestamp) {
        result.timestamp = parseInt(timestamp);
        result.date = new Date(result.timestamp).toLocaleString('ja-JP');
      }

      return result;

    } catch (error) {
      console.error('URL解析エラー:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * URLから自動で計算を実行
   */
  async loadFromURL() {
    const params = this.parseURL();

    if (!params.valid) {
      return false;
    }

    try {
      // フォームに値を設定
      document.getElementById('price').value = params.totalAmount;
      document.getElementById('count').value = params.numberOfPeople;

      // 計算タイプの設定
      if (params.type !== 'equal') {
        const typeInput = document.querySelector(`input[name="calculationType"][value="${params.type}"]`);
        if (typeInput) {
          typeInput.checked = true;
          typeInput.dispatchEvent(new Event('change'));
        }

        // 幹事負担額の設定
        if (params.organizerBurden !== undefined) {
          const burdenInput = document.getElementById('organizerBurden');
          if (burdenInput) {
            burdenInput.value = Math.abs(params.organizerBurden);
            burdenInput.dispatchEvent(new Event('input'));
          }
        } else if (params.organizerFixed !== undefined) {
          const fixedInput = document.getElementById('organizerFixed');
          if (fixedInput) {
            fixedInput.value = params.organizerFixed;
            fixedInput.dispatchEvent(new Event('input'));
          }
        }
      }

      // 自動計算実行
      const calculateBtn = document.getElementById('calculateBtn');
      if (calculateBtn) {
        calculateBtn.click();
      }

      // URLパラメータをクリア（オプション）
      if (this.shouldClearURLAfterLoad()) {
        this.clearURLParams();
      }

      return true;

    } catch (error) {
      console.error('URLからの読み込みエラー:', error);
      return false;
    }
  }

  /**
   * URLパラメータをクリア
   */
  clearURLParams() {
    const cleanURL = this.baseUrl;
    window.history.replaceState({}, '', cleanURL);
  }

  /**
   * 現在の計算状態をURLに保存
   */
  saveToURL(result) {
    const shareURL = this.generateShareURL(result, {
      includeTimestamp: true
    });
    window.history.replaceState({}, '', shareURL);
  }

  shouldClearURLAfterLoad() {
    // ユーザー設定や環境変数で制御可能
    return localStorage.getItem('clear_url_after_load') !== 'false';
  }

  /**
   * 短縮URL生成（将来的な拡張用）
   */
  async generateShortURL(longURL) {
    // 短縮URLサービスのAPI呼び出し
    // 例: bitly, tinyurl, または自前サービス
    try {
      // const response = await fetch('https://api.shorten.url/v1/shorten', {
      //   method: 'POST',
      //   body: JSON.stringify({ url: longURL })
      // });
      // const data = await response.json();
      // return data.shortUrl;

      return longURL; // 未実装の場合は元のURLを返す
    } catch (error) {
      console.error('短縮URL生成エラー:', error);
      return longURL;
    }
  }
}
```

## 4. SNSシェア機能

### 4.1 SNS別シェア実装

```javascript
/**
 * SNSシェアを管理
 */
class SNSShareManager {
  constructor() {
    this.shareURLs = {
      twitter: 'https://twitter.com/intent/tweet',
      line: 'https://social-plugins.line.me/lineit/share',
      facebook: 'https://www.facebook.com/sharer/sharer.php',
      hatena: 'https://b.hatena.ne.jp/append'
    };
  }

  /**
   * Twitterでシェア
   */
  shareToTwitter(result, options = {}) {
    const text = this.generateShareText(result, {
      maxLength: 140,
      hashtags: options.hashtags || ['割り勘', 'warikan'],
      includeURL: true
    });

    const url = new URL(this.shareURLs.twitter);
    url.searchParams.set('text', text);

    this.openShareWindow(url.toString());
  }

  /**
   * LINEでシェア
   */
  shareToLINE(result) {
    const text = this.generateShareText(result, {
      format: 'simple'
    });

    const url = new URL(this.shareURLs.line);
    url.searchParams.set('url', window.location.href);
    url.searchParams.set('text', text);

    this.openShareWindow(url.toString());
  }

  /**
   * Facebookでシェア
   */
  shareToFacebook() {
    const url = new URL(this.shareURLs.facebook);
    url.searchParams.set('u', window.location.href);

    this.openShareWindow(url.toString());
  }

  /**
   * はてなブックマーク
   */
  shareToHatena(result) {
    const url = new URL(this.shareURLs.hatena);
    url.searchParams.set('url', window.location.href);
    url.searchParams.set('title', '割り勘計算結果');

    this.openShareWindow(url.toString());
  }

  /**
   * シェア用テキスト生成
   */
  generateShareText(result, options = {}) {
    const {
      maxLength = 280,
      hashtags = [],
      includeURL = false,
      format = 'default'
    } = options;

    let text = '';

    switch (format) {
      case 'simple':
        text = `割り勘：${result.totalAmount}円を${result.numberOfPeople}人で${result.perPerson}円ずつ`;
        break;

      case 'detailed':
        text = `割り勘計算結果：\n総額${result.totalAmount}円÷${result.numberOfPeople}人=${result.perPerson}円/人`;
        if (result.type !== 'equal') {
          text += `\n（${this.getTypeLabel(result.type)}）`;
        }
        break;

      default:
        text = `${result.totalAmount}円の割り勘を${result.numberOfPeople}人で行いました`;
        if (result.type !== 'equal') {
          text += `（${this.getTypeLabel(result.type)}）`;
        }
        text += `\n1人あたり${result.perPerson}円`;
    }

    // ハッシュタグ追加
    if (hashtags.length > 0) {
      text += `\n#${hashtags.join(' #')}`;
    }

    // URL追加
    if (includeURL) {
      const url = window.location.href;
      const remainingLength = maxLength - text.length - 1;

      if (url.length <= remainingLength) {
        text += `\n${url}`;
      } else {
        text += `\n${this.generateShortURL(url)}`;
      }
    }

    // 長さチェック
    if (text.length > maxLength) {
      text = text.substring(0, maxLength - 3) + '...';
    }

    return text;
  }

  /**
   * シェアウィンドウを開く
   */
  openShareWindow(url) {
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      url,
      'share_window',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  }

  /**
   * シェアボタンのUI生成
   */
  generateShareButtons(result, container) {
    const buttonsHTML = `
      <div class="share-buttons">
        <button class="share-btn twitter" data-platform="twitter" title="Twitterでシェア">
          <i class="icon-twitter"></i>
          <span>Twitter</span>
        </button>
        <button class="share-btn line" data-platform="line" title="LINEで送信">
          <i class="icon-line"></i>
          <span>LINE</span>
        </button>
        <button class="share-btn facebook" data-platform="facebook" title="Facebookでシェア">
          <i class="icon-facebook"></i>
          <span>Facebook</span>
        </button>
        <button class="share-btn hatena" data-platform="hatena" title="はてなブックマーク">
          <i class="icon-hatena"></i>
          <span>はてな</span>
        </button>
        <button class="share-btn copy" data-platform="copy" title="URLをコピー">
          <i class="icon-link"></i>
          <span>URLコピー</span>
        </button>
      </div>
    `;

    container.innerHTML = buttonsHTML;
    this.bindShareEvents(result, container);
  }

  /**
   * シェアボタンのイベントバインド
   */
  bindShareEvents(result, container) {
    const buttons = container.querySelectorAll('.share-btn');

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const platform = button.dataset.platform;

        switch (platform) {
          case 'twitter':
            this.shareToTwitter(result);
            break;

          case 'line':
            this.shareToLINE(result);
            break;

          case 'facebook':
            this.shareToFacebook();
            break;

          case 'hatena':
            this.shareToHatena(result);
            break;

          case 'copy':
            this.copyShareURL(result);
            break;
        }

        // シェア解析（オプション）
        this.trackShare(platform);
      });
    });
  }

  /**
   * URLコピー
   */
  async copyShareURL(result) {
    const urlManager = new URLShareManager();
    const shareURL = urlManager.generateShareURL(result, {
      includeTimestamp: true
    });

    const clipboard = new ClipboardManager();
    await clipboard.copyWithFeedback(shareURL, event.target);
  }

  /**
   * シェア計測
   */
  trackShare(platform) {
    // Google Analyticsなどの計測
    if (typeof gtag !== 'undefined') {
      gtag('event', 'share', {
        method: platform,
        content_type: 'calculation_result'
      });
    }

    // カスタムイベント
    window.dispatchEvent(new CustomEvent('warikan:share', {
      detail: { platform }
    }));
  }

  getTypeLabel(type) {
    const labels = {
      equal: '均等割り',
      organizer_more: '幹事多め',
      organizer_less: '幹事少なめ',
      organizer_fixed: '幹事固定',
      custom: 'カスタム'
    };
    return labels[type] || type;
  }
}
```

## 5. UIコンポーネント実装

### 5.1 シェア機能UI

```html
<!-- 結果表示エリアにシェア機能を追加 -->
<div class="result-container">
  <!-- 既存の結果表示 -->
  <div id="answer">...</div>

  <!-- シェア機能 -->
  <div class="share-section" id="shareSection" style="display: none;">
    <div class="share-header">
      <h3>結果をシェア</h3>
      <button class="btn-toggle-share" id="toggleShare">
        <i class="icon-chevron-up"></i>
      </button>
    </div>

    <div class="share-content" id="shareContent">
      <!-- コピー機能 -->
      <div class="share-group">
        <h4>テキストをコピー</h4>
        <div class="copy-options">
          <button class="btn-copy btn-copy-detailed" data-format="detailed">
            詳細コピー
          </button>
          <button class="btn-copy btn-copy-simple" data-format="simple">
            簡潔コピー
          </button>
        </div>
      </div>

      <!-- SNSシェア -->
      <div class="share-group">
        <h4>SNSでシェア</h4>
        <div class="sns-buttons" id="snsButtons">
          <!-- 動的に生成 -->
        </div>
      </div>

      <!-- URL共有 -->
      <div class="share-group">
        <h4>URLを共有</h4>
        <div class="url-share">
          <input type="text" id="shareURL" readonly class="share-url-input">
          <button class="btn-copy-url" id="copyURL">
            <i class="icon-copy"></i>
          </button>
        </div>
        <div class="url-options">
          <button class="btn-shorten-url" id="shortenURL">
            短縮URLを生成
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 5.2 JavaScript実装

```javascript
/**
 * シェア機能のUI制御
 */
class ShareUI {
  constructor() {
    this.isVisible = false;
    this.currentResult = null;
    this.clipboard = new ClipboardManager();
    this.urlManager = new URLShareManager();
    this.snsManager = new SNSShareManager();
    this.formatter = new ShareFormatter();

    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // シェアセクションの開閉
    const toggleBtn = document.getElementById('toggleShare');
    toggleBtn?.addEventListener('click', () => {
      this.toggleShareSection();
    });

    // コピー機能
    const copyButtons = document.querySelectorAll('.btn-copy');
    copyButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const format = e.target.dataset.format || 'detailed';
        this.copyResult(format);
      });
    });

    // URLコピー
    const copyURLBtn = document.getElementById('copyURL');
    copyURLBtn?.addEventListener('click', () => {
      this.copyShareURL();
    });

    // 短縮URL
    const shortenBtn = document.getElementById('shortenURL');
    shortenBtn?.addEventListener('click', () => {
      this.generateShortURL();
    });
  }

  /**
   * 計算結果を設定してシェア機能を表示
   */
  setResult(result) {
    this.currentResult = result;

    if (result) {
      this.showShareSection();
      this.updateShareContent();
    } else {
      this.hideShareSection();
    }
  }

  /**
   * シェアセクションを表示
   */
  showShareSection() {
    const shareSection = document.getElementById('shareSection');
    if (shareSection) {
      shareSection.style.display = 'block';
      this.isVisible = true;

      // アニメーション
      setTimeout(() => {
        shareSection.classList.add('show');
      }, 10);
    }
  }

  /**
   * シェアセクションを非表示
   */
  hideShareSection() {
    const shareSection = document.getElementById('shareSection');
    if (shareSection) {
      shareSection.classList.remove('show');

      setTimeout(() => {
        shareSection.style.display = 'none';
        this.isVisible = false;
      }, 300);
    }
  }

  /**
   * シェアセクションの開閉
   */
  toggleShareSection() {
    if (this.isVisible) {
      this.hideShareSection();
    } else {
      this.showShareSection();
    }
  }

  /**
   * シェアコンテンツを更新
   */
  updateShareContent() {
    if (!this.currentResult) return;

    // SNSボタンを生成
    const snsContainer = document.getElementById('snsButtons');
    if (snsContainer) {
      this.snsManager.generateShareButtons(this.currentResult, snsContainer);
    }

    // 共有URLを生成
    const shareURL = this.urlManager.generateShareURL(this.currentResult);
    const urlInput = document.getElementById('shareURL');
    if (urlInput) {
      urlInput.value = shareURL;
    }

    // URLを保存
    this.urlManager.saveToURL(this.currentResult);
  }

  /**
   * 結果をコピー
   */
  async copyResult(format) {
    if (!this.currentResult) return;

    const options = { format };

    // フォーマットに応じたテキスト生成
    const text = this.formatter.formatText(this.currentResult, options);

    // コピー実行
    const button = document.querySelector(`.btn-copy-${format}`);
    await this.clipboard.copyWithFeedback(text, button);

    // コピーイベント発火
    window.dispatchEvent(new CustomEvent('warikan:copy', {
      detail: { format, text }
    }));
  }

  /**
   * 共有URLをコピー
   */
  async copyShareURL() {
    if (!this.currentResult) return;

    const shareURL = this.urlManager.generateShareURL(this.currentResult);
    const button = document.getElementById('copyURL');

    await this.clipboard.copyWithFeedback(shareURL, button);
  }

  /**
   * 短縮URLを生成
   */
  async generateShortURL() {
    if (!this.currentResult) return;

    const button = document.getElementById('shortenURL');
    const originalText = button.textContent;

    try {
      button.textContent = '生成中...';
      button.disabled = true;

      const longURL = this.urlManager.generateShareURL(this.currentResult);
      const shortURL = await this.urlManager.generateShortURL(longURL);

      // URL入力欄を更新
      const urlInput = document.getElementById('shareURL');
      if (urlInput) {
        urlInput.value = shortURL;
      }

      // 成功表示
      button.textContent = '生成完了';
      button.classList.add('success');

      // 自動でコピー
      await this.clipboard.copyText(shortURL);

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('success');
        button.disabled = false;
      }, 2000);

    } catch (error) {
      button.textContent = '生成失敗';
      button.classList.add('error');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('error');
        button.disabled = false;
      }, 2000);

      console.error('短縮URL生成エラー:', error);
    }
  }

  /**
   * カスタムシェアテキスト
   */
  showCustomShareDialog() {
    if (!this.currentResult) return;

    const modal = document.createElement('div');
    modal.className = 'custom-share-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>カスタムメッセージでシェア</h3>
        <textarea id="customShareText" rows="4">${this.formatter.formatText(this.currentResult)}</textarea>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="cancelCustom">キャンセル</button>
          <button class="btn btn-primary" id="copyCustom">コピー</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // イベントバインド
    const cancelBtn = modal.querySelector('#cancelCustom');
    const copyBtn = modal.querySelector('#copyCustom');
    const textarea = modal.querySelector('#customShareText');

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    copyBtn.addEventListener('click', async () => {
      await this.clipboard.copyText(textarea.value);
      document.body.removeChild(modal);
    });

    // 自動選択
    textarea.select();
  }
}

// グローバル初期化
let shareUI;

document.addEventListener('DOMContentLoaded', () => {
  shareUI = new ShareUI();

  // 計算完了時のイベントリスナー
  window.addEventListener('warikan:calculated', (e) => {
    shareUI.setResult(e.detail.result);
  });

  // URLからの読み込み
  const urlManager = new URLShareManager();
  urlManager.loadFromURL();
});
```

## 6. CSSスタイル

```css
/* シェア機能専用スタイル */
.share-section {
  margin-top: 30px;
  padding: 20px;
  background: var(--color-gray-light);
  border-radius: var(--radius-lg);
  opacity: 0;
  transform: translateY(-10px);
  transition: all var(--transition-fast);
}

.share-section.show {
  opacity: 1;
  transform: translateY(0);
}

.share-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.share-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-darker);
}

.btn-toggle-share {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-gray-dark);
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.btn-toggle-share:hover {
  transform: scale(1.1);
}

.share-section.show .btn-toggle-share {
  transform: rotate(180deg);
}

.share-group {
  margin-bottom: 25px;
}

.share-group:last-child {
  margin-bottom: 0;
}

.share-group h4 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-dark);
  margin-bottom: 10px;
}

/* コピー機能 */
.copy-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-copy {
  padding: 10px 20px;
  background: var(--color-white);
  border: 2px solid var(--color-gray-medium);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-copy:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-2px);
}

.btn-copy.success {
  background: var(--color-success);
  color: var(--color-white);
  border-color: var(--color-success);
}

.btn-copy.error {
  background: var(--color-error);
  color: var(--color-white);
  border-color: var(--color-error);
}

/* SNSボタン */
.sns-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-white);
}

.share-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-light);
}

.share-btn.twitter {
  background: #1DA1F2;
}

.share-btn.line {
  background: #00C300;
}

.share-btn.facebook {
  background: #1877F2;
}

.share-btn.hatena {
  background: #00A4DE;
}

.share-btn.copy {
  background: var(--color-gray-dark);
}

.share-btn i {
  font-size: var(--font-size-md);
}

/* URL共有 */
.url-share {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.share-url-input {
  flex: 1;
  padding: 10px;
  border: 2px solid var(--color-gray-medium);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-white);
}

.btn-copy-url {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-copy-url:hover {
  background: var(--color-primary-dark);
}

.url-options {
  display: flex;
  gap: 10px;
}

.btn-shorten-url {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-shorten-url:hover {
  background: var(--color-gray-light);
}

.btn-shorten-url.success {
  background: var(--color-success);
  color: var(--color-white);
  border-color: var(--color-success);
}

/* モーダル */
.copy-modal,
.custom-share-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.copy-modal-content,
.modal-content {
  background: var(--color-white);
  padding: 30px;
  border-radius: var(--radius-xl);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.copy-modal h3,
.modal-content h3 {
  margin-bottom: 20px;
  font-size: var(--font-size-lg);
  color: var(--color-gray-darker);
}

.copy-modal textarea {
  width: 100%;
  min-height: 150px;
  padding: 15px;
  border: 2px solid var(--color-gray-medium);
  border-radius: var(--radius-md);
  font-family: monospace;
  font-size: var(--font-size-sm);
  resize: vertical;
}

.copy-modal .btn-close,
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .copy-options {
    flex-direction: column;
  }

  .btn-copy {
    width: 100%;
    text-align: center;
  }

  .sns-buttons {
    flex-direction: column;
  }

  .share-btn {
    width: 100%;
    justify-content: center;
  }

  .url-share {
    flex-direction: column;
  }

  .btn-copy-url {
    width: 100%;
  }

  .copy-modal-content,
  .modal-content {
    margin: 20px;
    padding: 20px;
  }
}
```

## 7. テスト仕様

### 7.1 単体テスト

```javascript
// test/share-feature.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShareFormatter } from '../src/share.js';
import { ClipboardManager } from '../src/clipboard.js';
import { URLShareManager } from '../src/url-share.js';

describe('ShareFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new ShareFormatter();
  });

  it('均等割りの結果を正しくフォーマット', () => {
    const result = {
      totalAmount: 5000,
      numberOfPeople: 5,
      perPerson: 1000,
      remainder: 0,
      type: 'equal',
      totalCheck: 5000
    };

    const text = formatter.formatText(result);

    expect(text).toContain('「割り勘計算」');
    expect(text).toContain('総額: 5,000円');
    expect(text).toContain('人数: 5人');
    expect(text).toContain('1人あたり: 1,000円');
  });

  it('幹事負担の結果を正しくフォーマット', () => {
    const result = {
      totalAmount: 10000,
      numberOfPeople: 4,
      type: 'organizer_more',
      organizerPayment: 3500,
      participantPayment: 2166,
      participantTotal: 6498,
      organizerBurden: 1000,
      remainder: 2,
      remainderRecipient: 'participants',
      totalCheck: 10000
    };

    const text = formatter.formatText(result);

    expect(text).toContain('（幹事多め）');
    expect(text).toContain('幹事: 3,500円');
    expect(text).toContain('参加者: 2,166円 × 3人 = 6,498円');
  });

  it('簡潔フォーマット', () => {
    const result = {
      totalAmount: 5000,
      numberOfPeople: 5,
      perPerson: 1000,
      type: 'equal'
    };

    const text = formatter.formatSimple(result);

    expect(text).toBe('割り勘: 5,000円 ÷ 5人 = 1,000円/人');
  });
});

describe('URLShareManager', () => {
  let urlManager;

  beforeEach(() => {
    urlManager = new URLShareManager();
  });

  it('基本URLを生成', () => {
    const result = {
      totalAmount: 5000,
      numberOfPeople: 5,
      type: 'equal'
    };

    const url = urlManager.generateShareURL(result);

    expect(url).toContain('amount=5000');
    expect(url).toContain('people=5');
    expect(url).not.toContain('type=equal');
  });

  it('幹事負担を含むURLを生成', () => {
    const result = {
      totalAmount: 10000,
      numberOfPeople: 4,
      type: 'organizer_more',
      organizerBurden: 1000
    };

    const url = urlManager.generateShareURL(result);

    expect(url).toContain('amount=10000');
    expect(url).toContain('people=4');
    expect(url).toContain('type=organizer_more');
    expect(url).toContain('burden=1000');
  });

  it('URLから計算条件を復元', () => {
    const url = 'https://example.com/warikan/?amount=5000&people=5&type=organizer_more&burden=1000';

    const params = urlManager.parseURL(url);

    expect(params.totalAmount).toBe(5000);
    expect(params.numberOfPeople).toBe(5);
    expect(params.type).toBe('organizer_more');
    expect(params.organizerBurden).toBe(1000);
  });

  it('無効なURLを処理', () => {
    const url = 'https://example.com/warikan/?amount=0&people=1';

    const params = urlManager.parseURL(url);

    expect(params.valid).toBe(false);
    expect(params.error).toBe('無効なURLパラメータです');
  });
});
```

## 8. 実装手順

1. **テキストコピー機能**（2日）
   - ShareFormatter実装
   - ClipboardManager実装
   - コピーUI実装

2. **URL共有機能**（2日）
   - URLShareManager実装
   - URL生成・解析機能
   - 自動読み込み機能

3. **SNSシェア機能**（2日）
   - SNSShareManager実装
   - 各SNSのシェアURL生成
   - シェアボタンUI

4. **UI統合**（1日）
   - シェアセクションUI
   - イベント統合
   - アニメーション効果

5. **テストとデバッグ**（1日）
   - 単体テスト
   - 統合テスト
   - クロスブラウザテスト

---

## 9. 注意事項

1. **ブラウザ互換性**
   - Clipboard APIのフォールバック実装
   - モバイルブラウザのポップアップブロック対策
   - 古いブラウザの対応

2. **セキュリティ**
   - URLパラメータのバリデーション
   - XSS対策（テキストのエスケープ）
   - 長すぎるURLの制限

3. **プライバシー**
   - 個人情報をURLに含めない
   - タイムスタンプの利用は任意
   - シェア機能のオプトアウト

4. **ユーザビリティ**
   - コピー成功のフィードバック
   - エラー時の代替手段
   - シンプルなデフォルト設定