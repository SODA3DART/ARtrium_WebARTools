/**
 * ARtrium WebAR — プロジェクト設定
 *
 * このファイルだけ編集すれば、GLB モデルとマーカー画像で
 * 「飛び出す AR」体験を公開できます。
 *
 * 詳細: README.md / docs/mindar-guide.md
 */
window.ARTRIUM_CONFIG = {
  // ページタイトル
  title: 'My AR Experience',

  // 戻るリンク（不要なら null または削除）
  backLink: null,
  // backLink: { href: '../index.html', label: '← 一覧に戻る' },

  // マーカー設定（MindAR で生成した .mind ファイルが必要）
  marker: {
    // ユーザーに見せるマーカー画像（PNG/JPG）
    image: 'assets/markers/marker.png',
    // MindAR Compiler で生成したターゲットファイル
    target: 'assets/targets/targets.mind',
    title: 'My AR のマーカー',
    description: '下の画像と同じものをカメラで映すと、3Dモデルが表示されます。'
  },

  // シーン設定
  scene: {
    targetIndex: 0, // 複数マーカーを1つの .mind に入れた場合のインデックス
    assetsTimeout: 120000 // 大きな GLB 用（ミリ秒）
  },

  // ライト（省略時はデフォルトの環境光 + 平行光）
  lights: [
    { type: 'ambient', color: '#ffffff', intensity: 0.7 },
    { type: 'directional', color: '#ffffff', intensity: 0.6, position: '0 1 1' }
  ],

  // 表示する GLB モデル（複数可）
  models: [
    {
      id: 'character', // 一意の ID（英数字）
      src: 'assets/models/character.glb',
      rotation: '90 0 0', // 立体モード時の回転 "X Y Z"
      position: '0 0 0',
      scale: '0.3 0.3 0.3',
      animation: { clip: '*', loop: 'repeat' }, // アニメーション GLB の場合
      doubleSided: true, // 両面表示（輪郭線付きモデル向け）
      wireframe: false // true にするとソリッドWF切替ボタンが有効
      // posterMode: { standRotation: '90 0 0', posterRotation: '0 0 0' } // 個別上書き
    }
    // ステージなど追加モデルの例:
    // {
    //   id: 'stage',
    //   src: 'assets/models/stage.glb',
    //   rotation: '90 0 0',
    //   position: '0 0 0',
    //   scale: '0.3 0.3 0.3',
    //   animation: { clip: '*', loop: 'repeat' }
    // }
  ],

  // UI オプション
  ui: {
    showMarkerButton: true,
    showPosterMode: true, // 立体 ↔ ポスター（平面）切替
    showWireframe: true,
    posterMode: {
      standRotation: '90 0 0',
      posterRotation: '0 0 0',
      posterYOffset: -0.45
    }
  },

  // BGM（任意）
  audio: null
  // audio: { src: 'assets/audio/bgm.mp3', playOnTargetFound: true }
};
