/**
 * 基本サンプル — ar-config.js
 * assets/ に GLB・マーカー・targets.mind を配置してから利用してください。
 */
window.ARTRIUM_CONFIG = {
  title: 'ARtrium サンプル',

  marker: {
    image: 'assets/markers/marker.png',
    target: 'assets/targets/targets.mind',
    title: 'サンプル AR のマーカー',
    description:
      'この画像を印刷するか別の画面に表示し、スマートフォンのカメラで映してください。'
  },

  scene: {
    targetIndex: 0,
    assetsTimeout: 120000
  },

  models: [
    {
      id: 'character',
      src: 'assets/models/character.glb',
      rotation: '90 0 0',
      position: '0 0 0',
      scale: '0.3 0.3 0.3',
      animation: { clip: '*', loop: 'repeat' },
      doubleSided: true
    }
  ],

  ui: {
    showMarkerButton: true,
    showPosterMode: true,
    showWireframe: false
  }
};
