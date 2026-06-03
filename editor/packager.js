/**
 * ARtrium Editor — ZIP パッケージ生成
 */
const ARtriumPackager = (function () {
  const LIB_FILES = [
    'artrium-ar-components.js',
    'artrium-ar-runtime.js',
    'artrium-ar-ui.css'
  ];

  let libCache = null;
  let ngrokBatCache = null;
  let publishGuideCache = null;

  async function loadLibFiles() {
    if (libCache) return libCache;
    libCache = {};
    for (const name of LIB_FILES) {
      const res = await fetch(`../lib/${name}`);
      if (!res.ok) throw new Error(`ライブラリ ${name} の読み込みに失敗しました`);
      libCache[name] = await res.text();
    }
    return libCache;
  }

  async function loadNgrokBat() {
    if (ngrokBatCache) return ngrokBatCache;
    const res = await fetch('../template/ARをスマホで試す（ngrok）.bat');
    if (!res.ok) throw new Error('ngrok 用 bat ファイルの読み込みに失敗しました');
    ngrokBatCache = await res.text();
    return ngrokBatCache;
  }

  async function loadPublishGuide() {
    if (publishGuideCache) return publishGuideCache;
    const res = await fetch('../template/公開のしかた.txt');
    if (!res.ok) return '';
    publishGuideCache = await res.text();
    return publishGuideCache;
  }

  function sanitizeFilename(name) {
    return String(name || 'my-ar')
      .replace(/[^\w\u3000-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40) || 'my-ar';
  }

  function markerExt(file) {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return ext === 'jpeg' ? 'jpg' : ext;
    return 'png';
  }

  function buildIndexHtml() {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#000000">
  <title>ARtrium WebAR</title>
  <script src="https://aframe.io/releases/1.5.0/aframe.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"><\/script>
  <script src="https://cdn.jsdelivr.net/gh/donmccurdy/aframe-extras@v7.0.0/dist/aframe-extras.min.js"><\/script>
  <link rel="stylesheet" href="lib/artrium-ar-ui.css">
  <script src="lib/artrium-ar-components.js"><\/script>
  <script src="ar-config.js"><\/script>
  <script src="lib/artrium-ar-runtime.js"><\/script>
</head>
<body>
  <div id="artrium-scene-root"></div>
</body>
</html>
`;
  }

  function buildArConfig(options) {
    const {
      title,
      markerTitle,
      markerDescription,
      transforms,
      hasAnimation,
      doubleSided,
      showPosterMode,
      showWireframe,
      hasStage,
      hasAudio,
      markerFilename
    } = options;

    const charT = transforms?.character || {
      position: '0 0 0',
      rotation: '90 0 0',
      scale: '0.3 0.3 0.3'
    };
    const stageT = transforms?.stage || {
      position: '0 0 0',
      rotation: '90 0 0',
      scale: '0.3 0.3 0.3'
    };

    const models = [];

    if (hasStage) {
      models.push({
        id: 'stage',
        src: 'assets/models/stage.glb',
        rotation: stageT.rotation,
        position: stageT.position,
        scale: stageT.scale,
        ...(hasAnimation ? { animation: { clip: '*', loop: 'repeat' } } : {})
      });
    }

    models.push({
      id: 'character',
      src: 'assets/models/character.glb',
      rotation: charT.rotation,
      position: charT.position,
      scale: charT.scale,
      ...(hasAnimation ? { animation: { clip: '*', loop: 'repeat' } } : {}),
      ...(doubleSided ? { doubleSided: true } : {}),
      ...(showWireframe ? { wireframe: true } : {})
    });

    const config = {
      title: title || '飛び出す AR',
      marker: {
        image: `assets/markers/${markerFilename}`,
        target: 'assets/targets/targets.mind',
        title: markerTitle || title || 'AR マーカー',
        description:
          markerDescription ||
          '下の画像と同じものをカメラで映すと、3Dモデルが表示されます。'
      },
      scene: { targetIndex: 0, assetsTimeout: 120000 },
      models,
      ui: {
        showMarkerButton: true,
        showPosterMode: showPosterMode !== false,
        showWireframe: showWireframe === true,
        posterMode: {
          standRotation: '90 0 0',
          posterRotation: '0 0 0',
          posterYOffset: -0.45
        }
      },
      audio: hasAudio
        ? { src: options.audioPath || 'assets/audio/bgm.mp3', playOnTargetFound: true }
        : null
    };

    return `window.ARTRIUM_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
  }

  function buildReadme(options) {
    const { title } = options;
    return `${title || '飛び出す AR'} — 使い方
================================

このフォルダは ARtrium WebAR Editor で作成された
「飛び出す AR」プロジェクトです。

■ 体験方法（スマートフォン）

1. このフォルダ一式を Web サーバーにアップロードする
   （または GitHub Pages などで公開する）
2. スマートフォンのブラウザで index.html を開く
3. カメラの許可を「許可」する
4. マーカー画像（assets/markers/ 内）をカメラで映す
5. 3D モデルが表示されます！

■ スマホですぐ試す（おすすめ・Windows）

1. ZIP を解凍したフォルダを開く
2. 「ARをスマホで試す（ngrok）.bat」をダブルクリック
   ※ 初回は ARtrium Editor 付属の「初回セットアップ（ngrok）.bat」が必要
3. 画面に表示された URL をスマホのブラウザに入力
4. カメラを許可して、マーカー画像を映す

■ インターネットに公開する（GitHub Pages）

くわしくは同梱の「公開のしかた.txt」を参照。
概要:
1. GitHub アカウントを作成（無料）
2. 新しいリポジトリを作成
3. このフォルダの中身をすべてアップロード
4. Settings → Pages → Source を main に設定
5. 表示された URL（https://ユーザー名.github.io/リポジトリ名/）でアクセス

■ ローカルで試す場合（PC + スマホ・同一 Wi-Fi）

1. このフォルダで「npx serve .」を実行
2. PC の IP アドレス（例: 192.168.1.10:3000）をスマホで開く

■ フォルダ構成

index.html                        … AR 体験ページ
ARをスマホで試す（ngrok）.bat     … スマホで試す（Windows）
ar-config.js                      … 設定ファイル（上級者向け）
assets/models/  … 3D モデル（GLB）
assets/markers/ … マーカー画像
assets/targets/ … MindAR ターゲット（.mind）

■ うまく表示されないとき

・明るい場所でマーカーを映してください
・マーカー画像がぼやけていないか確認してください
・スマホのブラウザでカメラが許可されているか確認してください
・HTTPS または localhost で開いているか確認してください

---
Created with ARtrium WebAR Editor
https://github.com/your-org/ARtrium_WebARTools
`;
  }

  /**
   * @param {object} files - { glb, marker, mind, stage?, audio? }
   * @param {object} options - UI settings
   */
  async function buildZip(files, options) {
    const libs = await loadLibFiles();
    const zip = new JSZip();
    const folderName = sanitizeFilename(options.projectName || options.title);

    const markerFilename = `marker.${markerExt(files.marker)}`;
    options.markerFilename = markerFilename;

    let audioFilename = null;
    if (files.audio) {
      const ext = (files.audio.name.split('.').pop() || 'mp3').toLowerCase();
      audioFilename = `bgm.${ext}`;
      options.audioPath = `assets/audio/${audioFilename}`;
    }

    zip.file('index.html', buildIndexHtml());
    zip.file('ar-config.js', buildArConfig(options));
    zip.file('README.txt', buildReadme(options));

    const libFolder = zip.folder('lib');
    for (const [name, content] of Object.entries(libs)) {
      libFolder.file(name, content);
    }

    zip.folder('assets/models').file('character.glb', files.glb);
    if (files.stage) {
      zip.folder('assets/models').file('stage.glb', files.stage);
    }
    zip.folder('assets/markers').file(markerFilename, files.marker);
    zip.folder('assets/targets').file('targets.mind', files.mind);
    if (files.audio) {
      zip.folder('assets/audio').file(audioFilename, files.audio);
    }

    const ngrokBat = await loadNgrokBat();
    zip.file('ARをスマホで試す（ngrok）.bat', ngrokBat);

    const publishGuide = await loadPublishGuide();
    if (publishGuide) zip.file('公開のしかた.txt', publishGuide);

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    return { blob, folderName: `${folderName}-webar` };
  }

  return {
    loadLibFiles,
    buildZip,
    sanitizeFilename
  };
})();
