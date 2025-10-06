# 履歴機能 - 詳細技術仕様書

## 1. 機能概要

ユーザーが過去の割り勘計算結果を保存・閲覧・管理できる機能です。計算結果はローカルストレージに保存され、いつでも閲覧や再利用が可能です。

## 2. データ設計

### 2.1 データモデル

```javascript
// 単一の履歴エントリ
interface HistoryEntry {
  // 必須フィールド
  id: string;                    // UUIDまたはtimestamp-based ID
  timestamp: number;             // Unix timestamp (ms)
  date: string;                  // YYYY-MM-DD
  time: string;                  // HH:MM

  // 計算データ
  totalAmount: number;           // 総額（円）
  numberOfPeople: number;        // 人数
  calculationType: CalculationType;  // 計算タイプ
  perPerson: number;             // 1人あたりの金額
  remainder: number;             // 端数

  // 条件付きフィールド
  organizerBurden?: number;      // 幹事負担額（計算タイプによる）
  organizerPayment?: number;     // 幹事の支払額
  participantPayment?: number;   // 参加者の支払額

  // 任意フィールド
  note?: string;                 // ユーザーメモ
  tags?: string[];               // タグ（将来拡張用）
  location?: string;             // 場所（将来拡張用）
}

enum CalculationType {
  EQUAL = "equal",           // 均等割り
  ORGANIZER_MORE = "organizer_more",    // 幹事多め負担
  ORGANIZER_LESS = "organizer_less",    // 幹事少なめ負担
  ORGANIZER_FIXED = "organizer_fixed",  // 幹事固定負担
  CUSTOM = "custom"          // カスタム割り勘
}

// 履歴データ全体の構造
interface HistoryData {
  version: string;              // データ構造のバージョン
  entries: HistoryEntry[];      // 履歴エントリの配列
  settings: {                  // 履歴設定
    maxEntries: number;         // 最大保存件数
    autoCleanup: boolean;       // 自動クリーニング有無
    sortBy: SortType;           // ソート順
  };
  metadata: {
    createdAt: number;          // 最初の作成日時
    lastModified: number;       // 最終更新日時
    totalEntries: number;       // 総エントリ数
  };
}
```

### 2.2 LocalStorageキー設計

```javascript
const STORAGE_KEYS = {
  HISTORY: 'warikan_history',
  SETTINGS: 'warikan_settings',
  BACKUP: 'warikan_backup_YYYYMMDD',
  TEMP: 'warikan_temp'
};
```

## 3. 実装仕様

### 3.1 Storageモジュール (`src/storage.js`)

```javascript
/**
 * LocalStorage操作を管理するモジュール
 */
class HistoryStorage {
  constructor() {
    this.version = '1.0.0';
    this.maxEntries = 50;
    this.storageKey = STORAGE_KEYS.HISTORY;
  }

  /**
   * 計算結果を履歴に保存
   * @param {CalculationResult} result - 計算結果
   * @param {Object} options - 保存オプション
   * @returns {Promise<HistoryEntry>} 保存した履歴エントリ
   */
  async saveCalculation(result, options = {}) {
    const entry = this.createHistoryEntry(result, options);
    const data = this.loadHistoryData();

    // 重複チェック
    const isDuplicate = this.checkDuplicate(entry, data.entries);
    if (isDuplicate && !options.forceSave) {
      throw new Error('同じ計算結果が既に存在します');
    }

    // エントリを先頭に追加
    data.entries.unshift(entry);

    // 最大件数を維持
    if (data.entries.length > this.maxEntries) {
      data.entries = data.entries.slice(0, this.maxEntries);
    }

    // メタデータ更新
    data.metadata.lastModified = Date.now();
    data.metadata.totalEntries = data.entries.length;

    // 保存
    this.saveToStorage(data);

    return entry;
  }

  /**
   * 履歴エントリを作成
   */
  createHistoryEntry(result, options) {
    const now = new Date();
    const id = options.id || this.generateId();

    return {
      id,
      timestamp: now.getTime(),
      date: this.formatDate(now),
      time: this.formatTime(now),
      totalAmount: result.total,
      numberOfPeople: result.count,
      calculationType: result.type || CalculationType.EQUAL,
      perPerson: result.perPerson,
      remainder: result.remainder,
      organizerBurden: result.organizerBurden,
      organizerPayment: result.organizerPayment,
      participantPayment: result.participantPayment,
      note: options.note || '',
      tags: options.tags || [],
      location: options.location || ''
    };
  }

  /**
   * 履歴データを取得
   * @param {Object} options - 取得オプション
   * @returns {HistoryEntry[]} 履歴エントリの配列
   */
  getHistory(options = {}) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      filter = {}
    } = options;

    const data = this.loadHistoryData();
    let entries = [...data.entries];

    // フィルタリング
    if (filter.dateFrom) {
      entries = entries.filter(e => e.date >= filter.dateFrom);
    }
    if (filter.dateTo) {
      entries = entries.filter(e => e.date <= filter.dateTo);
    }
    if (filter.minAmount) {
      entries = entries.filter(e => e.totalAmount >= filter.minAmount);
    }
    if (filter.maxAmount) {
      entries = entries.filter(e => e.totalAmount <= filter.maxAmount);
    }
    if (filter.calculationType) {
      entries = entries.filter(e => e.calculationType === filter.calculationType);
    }
    if (filter.search) {
      const query = filter.search.toLowerCase();
      entries = entries.filter(e =>
        e.note?.toLowerCase().includes(query) ||
        e.location?.toLowerCase().includes(query) ||
        e.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // ソート
    entries.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'timestamp' || sortBy === 'totalAmount') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }

      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });

    // ページネーション
    return {
      entries: entries.slice(offset, offset + limit),
      total: entries.length,
      hasMore: offset + limit < entries.length
    };
  }

  /**
   * 特定の履歴エントリを削除
   * @param {string} id - 削除するエントリのID
   * @returns {boolean} 削除成功フラグ
   */
  deleteHistoryItem(id) {
    const data = this.loadHistoryData();
    const originalLength = data.entries.length;

    data.entries = data.entries.filter(entry => entry.id !== id);

    if (data.entries.length < originalLength) {
      data.metadata.lastModified = Date.now();
      data.metadata.totalEntries = data.entries.length;
      this.saveToStorage(data);
      return true;
    }

    return false;
  }

  /**
   * 履歴データのエクスポート
   * @param {Object} options - エクスポートオプション
   * @returns {string} JSON形式の履歴データ
   */
  exportHistory(options = {}) {
    const {
      format = 'json',
      includeMetadata = true,
      dateFrom,
      dateTo
    } = options;

    const data = this.loadHistoryData();
    let entries = data.entries;

    // 日付範囲フィルタ
    if (dateFrom || dateTo) {
      entries = entries.filter(e => {
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        return true;
      });
    }

    const exportData = {
      version: this.version,
      exportedAt: new Date().toISOString(),
      entries
    };

    if (includeMetadata) {
      exportData.metadata = data.metadata;
      exportData.settings = data.settings;
    }

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(entries);
    }
  }

  /**
   * 履歴データのインポート
   * @param {string} data - インポートするデータ
   * @param {Object} options - インポートオプション
   * @returns {Promise<Object>} インポート結果
   */
  async importHistory(data, options = {}) {
    try {
      const {
        merge = true,        // マージするか上書きするか
        skipDuplicates = true, // 重複をスキップするか
        validateOnly = false // 検証のみか
      } = options;

      const importData = JSON.parse(data);

      // データ検証
      const validation = this.validateImportData(importData);
      if (!validation.isValid) {
        throw new Error(`データ検証エラー: ${validation.errors.join(', ')}`);
      }

      if (validateOnly) {
        return {
          valid: true,
          entriesToImport: importData.entries.length,
          duplicates: 0
        };
      }

      // 既存データの取得
      const currentData = this.loadHistoryData();
      let entriesToImport = [...importData.entries];
      let duplicatesSkipped = 0;

      // 重複チェック
      if (skipDuplicates && merge) {
        const existingIds = new Set(currentData.entries.map(e => e.id));
        const uniqueEntries = [];

        for (const entry of entriesToImport) {
          if (existingIds.has(entry.id)) {
            duplicatesSkipped++;
          } else {
            uniqueEntries.push(entry);
          }
        }

        entriesToImport = uniqueEntries;
      }

      // マージまたは上書き
      if (merge) {
        currentData.entries = [
          ...entriesToImport,
          ...currentData.entries
        ].slice(0, this.maxEntries);
      } else {
        currentData.entries = entriesToImport.slice(0, this.maxEntries);
      }

      // メタデータ更新
      currentData.metadata.lastModified = Date.now();
      currentData.metadata.totalEntries = currentData.entries.length;

      this.saveToStorage(currentData);

      return {
        success: true,
        entriesImported: entriesToImport.length,
        duplicatesSkipped,
        totalEntries: currentData.entries.length
      };

    } catch (error) {
      throw new Error(`インポート失敗: ${error.message}`);
    }
  }

  // ユーティリティメソッド
  generateId() {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  formatTime(date) {
    return date.toTimeString().slice(0, 5);
  }

  loadHistoryData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return this.createEmptyHistoryData();
      }

      const data = JSON.parse(stored);

      // バージョンマイグレーション
      if (data.version !== this.version) {
        return this.migrateData(data);
      }

      return data;
    } catch (error) {
      console.error('履歴データの読み込みエラー:', error);
      return this.createEmptyHistoryData();
    }
  }

  saveToStorage(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // 容量不足時の処理
        this.handleStorageQuotaExceeded();
        throw new Error('保存容量が不足しています。古い履歴を削除してください。');
      }
      throw error;
    }
  }

  createEmptyHistoryData() {
    return {
      version: this.version,
      entries: [],
      settings: {
        maxEntries: 50,
        autoCleanup: true,
        sortBy: 'timestamp'
      },
      metadata: {
        createdAt: Date.now(),
        lastModified: Date.now(),
        totalEntries: 0
      }
    };
  }

  handleStorageQuotaExceeded() {
    // 古いエントリを削除して容量を確保
    const data = this.loadHistoryData();
    data.entries = data.entries.slice(0, Math.floor(this.maxEntries / 2));
    this.saveToStorage(data);
  }

  checkDuplicate(newEntry, existingEntries) {
    return existingEntries.some(entry =>
      entry.totalAmount === newEntry.totalAmount &&
      entry.numberOfPeople === newEntry.numberOfPeople &&
      entry.calculationType === newEntry.calculationType &&
      entry.date === newEntry.date
    );
  }

  convertToCSV(entries) {
    const headers = [
      '日付', '時刻', '総額', '人数', '計算タイプ',
      '1人あたり', '端数', '幹事負担', '備考'
    ];

    const rows = entries.map(e => [
      e.date,
      e.time,
      e.totalAmount,
      e.numberOfPeople,
      this.getCalculationTypeLabel(e.calculationType),
      e.perPerson,
      e.remainder,
      e.organizerBurden || '',
      e.note || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  getCalculationTypeLabel(type) {
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

### 3.2 UIコンポーネント設計

#### 3.2.1 履歴リストコンポーネント (`src/components/HistoryList.js`)

```javascript
/**
 * 履歴リストを表示するコンポーネント
 */
class HistoryList {
  constructor(container, storage) {
    this.container = container;
    this.storage = storage;
    this.currentPage = 0;
    this.pageSize = 10;
    this.currentFilter = {};
    this.isLoading = false;

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.loadHistory();
  }

  render() {
    this.container.innerHTML = `
      <div class="history-container">
        <div class="history-header">
          <h2>計算履歴</h2>
          <div class="history-controls">
            <button class="btn btn-secondary" id="filterBtn">
              <i class="icon-filter"></i> フィルター
            </button>
            <button class="btn btn-secondary" id="exportBtn">
              <i class="icon-download"></i> エクスポート
            </button>
            <button class="btn btn-danger" id="clearAllBtn">
              <i class="icon-trash"></i> 全削除
            </button>
          </div>
        </div>

        <div class="history-filter" id="historyFilter" style="display: none;">
          <div class="filter-row">
            <input type="date" id="filterDateFrom" placeholder="開始日">
            <input type="date" id="filterDateTo" placeholder="終了日">
          </div>
          <div class="filter-row">
            <input type="number" id="filterMinAmount" placeholder="最小金額">
            <input type="number" id="filterMaxAmount" placeholder="最大金額">
          </div>
          <div class="filter-row">
            <select id="filterType">
              <option value="">すべてのタイプ</option>
              <option value="equal">均等割り</option>
              <option value="organizer_more">幹事多め</option>
              <option value="organizer_less">幹事少なめ</option>
              <option value="organizer_fixed">幹事固定</option>
            </select>
            <input type="text" id="filterSearch" placeholder="検索...">
          </div>
          <div class="filter-actions">
            <button class="btn btn-primary" id="applyFilter">適用</button>
            <button class="btn btn-secondary" id="clearFilter">クリア</button>
          </div>
        </div>

        <div class="history-list" id="historyList">
          <div class="loading-spinner"></div>
        </div>

        <div class="history-pagination" id="historyPagination">
        </div>

        <div class="history-empty" id="historyEmpty" style="display: none;">
          <div class="empty-icon">📝</div>
          <p>計算履歴がありません</p>
          <p class="empty-hint">計算を行うとここに履歴が表示されます</p>
        </div>
      </div>
    `;
  }

  async loadHistory() {
    this.setLoading(true);

    try {
      const options = {
        limit: this.pageSize,
        offset: this.currentPage * this.pageSize,
        filter: this.currentFilter
      };

      const result = this.storage.getHistory(options);
      this.renderHistoryList(result.entries);
      this.renderPagination(result.total, result.hasMore);

      // 空状態チェック
      if (result.entries.length === 0 && this.currentPage === 0) {
        this.showEmptyState();
      } else {
        this.hideEmptyState();
      }

    } catch (error) {
      console.error('履歴の読み込みエラー:', error);
      this.showError('履歴の読み込みに失敗しました');
    } finally {
      this.setLoading(false);
    }
  }

  renderHistoryList(entries) {
    const listContainer = this.container.querySelector('#historyList');

    if (entries.length === 0) {
      listContainer.innerHTML = '<div class="no-results">該当する履歴がありません</div>';
      return;
    }

    listContainer.innerHTML = entries.map(entry => `
      <div class="history-item" data-id="${entry.id}">
        <div class="history-item-main">
          <div class="history-item-date">
            <div class="date">${entry.date}</div>
            <div class="time">${entry.time}</div>
          </div>

          <div class="history-item-amount">
            <div class="total-amount">¥${this.formatNumber(entry.totalAmount)}</div>
            <div class="detail">
              ${entry.numberOfPeople}人 × ¥${this.formatNumber(entry.perPerson)}
              ${entry.remainder > 0 ? ` + 端数¥${entry.remainder}` : ''}
            </div>
          </div>

          <div class="history-item-type">
            <span class="type-badge ${entry.calculationType}">
              ${this.getTypeLabel(entry.calculationType)}
            </span>
            ${entry.organizerBurden ?
              `<div class="organizer-info">
                幹事: ¥${this.formatNumber(entry.organizerPayment)}
              </div>` : ''
            }
          </div>
        </div>

        ${entry.note ?
          `<div class="history-item-note">
            <i class="icon-note"></i> ${this.escapeHtml(entry.note)}
          </div>` : ''
        }

        <div class="history-item-actions">
          <button class="btn-icon btn-reuse" title="再利用">
            <i class="icon-refresh"></i>
          </button>
          <button class="btn-icon btn-copy" title="コピー">
            <i class="icon-copy"></i>
          </button>
          <button class="btn-icon btn-edit" title="編集">
            <i class="icon-edit"></i>
          </button>
          <button class="btn-icon btn-delete" title="削除">
            <i class="icon-trash"></i>
          </button>
        </div>
      </div>
    `).join('');

    // アイテムごとのイベントをバインド
    this.bindItemEvents();
  }

  bindEvents() {
    // フィルター関連
    this.container.querySelector('#filterBtn').addEventListener('click', () => {
      this.toggleFilter();
    });

    this.container.querySelector('#applyFilter').addEventListener('click', () => {
      this.applyFilter();
    });

    this.container.querySelector('#clearFilter').addEventListener('click', () => {
      this.clearFilter();
    });

    // エクスポート
    this.container.querySelector('#exportBtn').addEventListener('click', () => {
      this.exportHistory();
    });

    // 全削除
    this.container.querySelector('#clearAllBtn').addEventListener('click', () => {
      this.clearAllHistory();
    });
  }

  bindItemEvents() {
    const items = this.container.querySelectorAll('.history-item');

    items.forEach(item => {
      const id = item.dataset.id;

      // 再利用ボタン
      item.querySelector('.btn-reuse').addEventListener('click', (e) => {
        e.stopPropagation();
        this.reuseEntry(id);
      });

      // コピーボタン
      item.querySelector('.btn-copy').addEventListener('click', (e) => {
        e.stopPropagation();
        this.copyEntry(id);
      });

      // 編集ボタン
      item.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        this.editEntry(id);
      });

      // 削除ボタン
      item.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteEntry(id);
      });

      // アイテムクリック
      item.addEventListener('click', () => {
        this.showEntryDetail(id);
      });
    });
  }

  async reuseEntry(id) {
    const entry = this.storage.getHistoryEntry(id);
    if (!entry) return;

    // メイン画面に値を設定
    document.getElementById('price').value = entry.totalAmount;
    document.getElementById('count').value = entry.numberOfPeople;

    // 計算タイプの設定
    if (entry.calculationType !== 'equal') {
      // 該当する計算タイプを選択
      // 実装は計算タイプUIの仕様に依存
    }

    // 履歴画面を閉じてメイン画面に遷移
    this.hide();

    // 自動計算実行
    document.getElementById('calculateBtn').click();
  }

  async copyEntry(id) {
    const entry = this.storage.getHistoryEntry(id);
    if (!entry) return;

    const text = this.formatEntryForCopy(entry);

    try {
      await navigator.clipboard.writeText(text);
      this.showToast('コピーしました');
    } catch (error) {
      this.showToast('コピーに失敗しました', 'error');
    }
  }

  async deleteEntry(id) {
    if (!confirm('この履歴を削除してもよろしいですか？')) {
      return;
    }

    try {
      const success = this.storage.deleteHistoryItem(id);
      if (success) {
        this.showToast('削除しました');
        this.loadHistory(); // 再読み込み
      } else {
        this.showToast('削除に失敗しました', 'error');
      }
    } catch (error) {
      this.showToast('削除に失敗しました', 'error');
    }
  }

  formatEntryForCopy(entry) {
    const lines = [
      `【${this.getTypeLabel(entry.calculationType)}】`,
      `日時: ${entry.date} ${entry.time}`,
      `総額: ¥${this.formatNumber(entry.totalAmount)}`,
      `人数: ${entry.numberOfPeople}人`,
      `1人あたり: ¥${this.formatNumber(entry.perPerson)}`
    ];

    if (entry.remainder > 0) {
      lines.push(`端数: ¥${entry.remainder}`);
    }

    if (entry.organizerPayment) {
      lines.push(`幹事: ¥${this.formatNumber(entry.organizerPayment)}`);
      lines.push(`参加者: ¥${this.formatNumber(entry.participantPayment)} × ${entry.numberOfPeople - 1}人`);
    }

    if (entry.note) {
      lines.push(``, `備考: ${entry.note}`);
    }

    return lines.join('\n');
  }

  // ユーティリティメソッド
  formatNumber(num) {
    return num.toLocaleString('ja-JP');
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

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setLoading(isLoading) {
    this.isLoading = isLoading;
    const spinner = this.container.querySelector('.loading-spinner');
    if (spinner) {
      spinner.style.display = isLoading ? 'block' : 'none';
    }
  }

  showEmptyState() {
    this.container.querySelector('#historyEmpty').style.display = 'block';
    this.container.querySelector('#historyList').style.display = 'none';
  }

  hideEmptyState() {
    this.container.querySelector('#historyEmpty').style.display = 'none';
    this.container.querySelector('#historyList').style.display = 'block';
  }

  showToast(message, type = 'success') {
    // トースト通知実装
  }

  showError(message) {
    // エラー表示実装
  }

  show() {
    this.container.style.display = 'block';
  }

  hide() {
    this.container.style.display = 'none';
  }
}
```

### 3.3 CSSスタイル (`assets/css/history.css`)

```css
/* 履歴機能専用スタイル */
.history-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--color-gray-medium);
}

.history-controls {
  display: flex;
  gap: 10px;
}

.history-filter {
  background: var(--color-gray-light);
  padding: 20px;
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.filter-row input,
.filter-row select {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.history-list {
  min-height: 400px;
}

.history-item {
  background: var(--color-white);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-md);
  padding: 15px;
  margin-bottom: 15px;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.history-item:hover {
  box-shadow: var(--shadow-light);
  transform: translateY(-2px);
}

.history-item-main {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  gap: 20px;
  align-items: center;
}

.history-item-date {
  text-align: center;
}

.history-item-date .date {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-darker);
}

.history-item-date .time {
  font-size: var(--font-size-sm);
  color: var(--color-gray-dark);
  margin-top: 2px;
}

.history-item-amount .total-amount {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.history-item-amount .detail {
  font-size: var(--font-size-sm);
  color: var(--color-gray-dark);
  margin-top: 5px;
}

.type-badge {
  display: inline-block;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.type-badge.equal {
  background: var(--color-gray-light);
  color: var(--color-gray-dark);
}

.type-badge.organizer_more {
  background: #fef3c7;
  color: #92400e;
}

.type-badge.organizer_less {
  background: #dbeafe;
  color: #1e40af;
}

.type-badge.organizer_fixed {
  background: #e9d5ff;
  color: #6b21a8;
}

.type-badge.custom {
  background: #fee2e2;
  color: #991b1b;
}

.organizer-info {
  font-size: var(--font-size-xs);
  color: var(--color-gray-dark);
  margin-top: 5px;
}

.history-item-note {
  margin-top: 10px;
  padding: 10px;
  background: var(--color-gray-light);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-gray-dark);
}

.history-item-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.history-item:hover .history-item-actions {
  opacity: 1;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-gray-dark);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: var(--color-gray-light);
  color: var(--color-primary);
}

.btn-icon.btn-delete:hover {
  background: #fee2e2;
  color: var(--color-error);
}

.history-pagination {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 30px;
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-gray-medium);
  background: var(--color-white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.history-empty {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.history-empty p {
  color: var(--color-gray-dark);
  margin-bottom: 10px;
}

.empty-hint {
  font-size: var(--font-size-sm);
  color: var(--color-gray);
}

.loading-spinner {
  display: none;
  width: 40px;
  height: 40px;
  margin: 100px auto;
  border: 4px solid var(--color-gray-light);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .history-controls {
    justify-content: center;
  }

  .filter-row {
    flex-direction: column;
    gap: 10px;
  }

  .history-item-main {
    grid-template-columns: 80px 1fr;
    gap: 15px;
  }

  .history-item-actions {
    opacity: 1;
    grid-column: 1 / -1;
    justify-content: center;
    padding-top: 10px;
    border-top: 1px solid var(--color-gray-light);
  }

  .btn-icon {
    width: 40px;
    height: 40px;
  }
}
```

## 4. テスト仕様

### 4.1 単体テスト

```javascript
// test/storage.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HistoryStorage } from '../src/storage.js';

describe('HistoryStorage', () => {
  let storage;

  beforeEach(() => {
    storage = new HistoryStorage();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveCalculation', () => {
    it('計算結果を正しく保存できること', async () => {
      const result = {
        total: 5000,
        count: 5,
        perPerson: 1000,
        remainder: 0,
        type: 'equal'
      };

      const entry = await storage.saveCalculation(result);

      expect(entry.id).toBeDefined();
      expect(entry.totalAmount).toBe(5000);
      expect(entry.numberOfPeople).toBe(5);
      expect(entry.calculationType).toBe('equal');
    });

    it('重複した計算結果は保存しないこと', async () => {
      const result = {
        total: 5000,
        count: 5,
        perPerson: 1000,
        remainder: 0,
        type: 'equal'
      };

      await storage.saveCalculation(result);

      await expect(storage.saveCalculation(result))
        .rejects.toThrow('同じ計算結果が既に存在します');
    });
  });

  describe('getHistory', () => {
    it('履歴を降順で取得できること', async () => {
      // テストデータ作成
      for (let i = 0; i < 5; i++) {
        await storage.saveCalculation({
          total: 1000 * (i + 1),
          count: 2,
          perPerson: 500 * (i + 1),
          remainder: 0,
          type: 'equal'
        });
      }

      const history = storage.getHistory({ limit: 3 });

      expect(history.entries).toHaveLength(3);
      expect(history.entries[0].totalAmount).toBe(5000);
      expect(history.entries[1].totalAmount).toBe(4000);
      expect(history.entries[2].totalAmount).toBe(3000);
    });

    it('フィルター機能が正しく動作すること', async () => {
      // 異なる日付のテストデータ
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await storage.saveCalculation({
        total: 5000,
        count: 5,
        perPerson: 1000,
        remainder: 0,
        type: 'equal'
      }, { date: today });

      await storage.saveCalculation({
        total: 3000,
        count: 3,
        perPerson: 1000,
        remainder: 0,
        type: 'equal'
      }, { date: yesterday });

      const filtered = storage.getHistory({
        filter: {
          dateFrom: storage.formatDate(today)
        }
      });

      expect(filtered.entries).toHaveLength(1);
      expect(filtered.entries[0].totalAmount).toBe(5000);
    });
  });
});
```

## 5. 実装手順

1. **LocalStorageモジュール実装**（2日）
   - 基本的なCRUD機能
   - データモデル定義
   - 単体テスト作成

2. **UIコンポーネント実装**（3日）
   - 履歴リスト表示
   - フィルター機能
   - ページネーション

3. **インタラクション実装**（2日）
   - 再利用機能
   - コピー機能
   - 削除機能

4. **エクスポート/インポート機能**（2日）
   - JSON/CSVエクスポート
   - データインポート
   - バリデーション

5. **スタイリングとレスポンシブ対応**（1日）
   - CSS実装
   - モバイル最適化

6. **テストとデバッグ**（2日）
   - 統合テスト
   - E2Eテスト
   - バグ修正

---

## 6. 注意事項

1. **プライバシー配慮**
   - すべてのデータはローカルにのみ保存
   - サーバーへの送信はしない
   - 明示的な削除機能を提供

2. **パフォーマンス**
   - 大量の履歴データでのパフォーマンス低下を防ぐ
   - 仮想スクロールの検討（将来的な拡張）
   - 適切なインデックス作成

3. **互換性**
   - 古いバージョンのデータマイグレーション
   - ブラウザのLocalStorage対応チェック
   - フォールバックの提供

4. **エラーハンドリング**
   - Storage利用不可時の処理
   - データ破損時のリカバリー
   - ユーザーフレンドリーなエラーメッセージ