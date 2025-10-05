// テスト環境のセットアップファイル
// DOM操作を伴うテストのためのグローバル設定

// テスト用のHTMLを準備
document.body.innerHTML = `
  <div id="app">
    <input type="number" id="price" />
    <input type="number" id="count" />
    <div id="result"></div>
  </div>
`;

// Web Audio APIのモック
global.AudioContext = class MockAudioContext {
  constructor() {
    this.destination = {};
  }
  
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }
  
  createGain() {
    return {
      gain: { setValueAtTime: () => {} },
      connect: () => {}
    };
  }
  
  resume() {
    return Promise.resolve();
  }
};