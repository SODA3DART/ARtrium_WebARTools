# MindAR 使い方ガイド

ARtrium WebAR Tools は [MindAR](https://github.com/hiukim/mind-ar-js) の **Image Tracking（画像マーカー AR）** を使用しています。マーカー画像をカメラで認識すると、その上に 3D モデル（GLB）が重なって表示されます。

## 全体の流れ

```
1. マーカー画像を用意（PNG/JPG）
2. MindAR Compiler で .mind ファイルを生成
3. GLB モデルを用意
4. ar-config.js にパスを設定
5. HTTPS サーバーで公開 → スマホで体験
```

## 1. マーカー画像の作り方

MindAR が認識しやすい画像の条件:

| 条件 | 説明 |
|------|------|
| コントラスト | 明暗・色の差がはっきりしている |
| 非対称性 | 上下左右が同じ模様だと認識精度が下がる |
| 解像度 | 長辺 512px 以上を推奨（1024px 程度が安定） |
| 単色背景 | 余白が多すぎると特徴点が不足する |

**向いている例:** イラスト、ロゴ、ポスター、ランドマーク写真  
**向いていない例:** 真っ白な紙、単色、完全に左右対称の模様のみ

> Soda3DART「飛び出す AR キャラクター」では、ランドマークやキャラクターポスターをマーカーに使っています。

## 2. MindAR Compiler で .mind を生成

### 方法 A: オンライン Compiler（最も簡単）

1. [MindAR Image Targets Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile) を開く
2. マーカー画像をアップロード（複数枚可 → 1つの `.mind` にまとまる）
3. **Compile** をクリック
4. ダウンロードした `.mind` を `assets/targets/` に配置

複数画像を1つの `.mind` に入れた場合、`ar-config.js` の `scene.targetIndex` でどの画像かを指定します（0 始まり）。

### 方法 B: CLI（Node.js）

```bash
npm install -g mind-ar

# 単一画像
mind-ar image-compiler marker.png -o targets.mind

# 複数画像
mind-ar image-compiler marker1.png marker2.png -o targets.mind
```

### 方法 C: ローカル HTML Compiler

MindAR リポジトリの `examples/image-tracking/compile.html` をローカルサーバーで開いても同様の操作ができます。

## 3. A-Frame との連携（内部構造）

ARtrium は以下の構成で MindAR を使っています。カスタマイズする場合の参考にしてください。

```html
<script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>

<a-scene mindar-image="imageTargetSrc: assets/targets/targets.mind;">
  <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

  <a-entity mindar-image-target="targetIndex: 0">
    <a-entity gltf-model="url(assets/models/character.glb)"
              rotation="90 0 0"
              scale="0.3 0.3 0.3"
              animation-mixer="clip: *; loop: repeat;">
    </a-entity>
  </a-entity>
</a-scene>
```

### 主要属性

| 属性 | 説明 |
|------|------|
| `mindar-image="imageTargetSrc: ..."` | `.mind` ファイルのパス |
| `mindar-image-target="targetIndex: N"` | 複数ターゲット時のインデックス |
| `gltf-model` | GLB/GLTF モデルのパス |
| `animation-mixer` | GLB 内アニメーション再生（aframe-extras 必要） |

### イベント

```javascript
const target = document.querySelector('[mindar-image-target]');

target.addEventListener('targetFound', () => {
  console.log('マーカーを検出');
});

target.addEventListener('targetLost', () => {
  console.log('マーカーを喪失');
});
```

ARtrium では BGM 再生などにこのイベントを利用しています（`audio.playOnTargetFound`）。

## 4. ar-config.js への反映

Compiler で得たファイルを配置し、設定を更新します。

```javascript
window.ARTRIUM_CONFIG = {
  marker: {
    image: 'assets/markers/marker.png',  // ユーザー向け表示用
    target: 'assets/targets/targets.mind' // Compiler 出力
  },
  scene: {
    targetIndex: 0  // 2枚目のマーカーなら 1
  },
  models: [
    {
      id: 'character',
      src: 'assets/models/character.glb',
      rotation: '90 0 0',
      scale: '0.3 0.3 0.3'
    }
  ]
};
```

## 5. ローカルテストと公開

### ローカルサーバー

カメラ API の都合で `file://` では動きません。必ず HTTP サーバーを使ってください。

```bash
# 例: serve
npx serve .

# 例: Python
python -m http.server 8080
```

スマートフォンからアクセスする場合:

- 同一 Wi-Fi 内の PC IP を使う（例: `http://192.168.1.10:3000/...`）
- または [ngrok](https://ngrok.com/) 等で HTTPS トンネルを張る

### GitHub Pages で公開

1. リポジトリを GitHub に push
2. Settings → Pages → Source を `main` ブランチに設定
3. `https://<user>.github.io/<repo>/examples/basic/` でアクセス

GitHub Pages は HTTPS なのでスマホのカメラが使えます。

## 6. トラブルシューティング

| 症状 | 対処 |
|------|------|
| カメラが起動しない | HTTPS または localhost か確認。ブラウザのカメラ許可を確認 |
| モデルが表示されない | ブラウザの開発者ツール（Console）で GLB 読み込みエラーを確認 |
| マーカーが認識されない | 照明を明るく、マーカー画像を画面/印刷で鮮明に。`.mind` が正しい画像から生成されているか確認 |
| モデルが巨大/微小 | `scale` を調整（例: `0.1 0.1 0.1` 〜 `1 1 1`） |
| モデルが横向き | `rotation` を調整（立体 AR では `90 0 0` が一般的） |
| 大きな GLB でタイムアウト | `scene.assetsTimeout` を増やす（例: `180000`） |

## 参考リンク

- [MindAR 公式ドキュメント](https://hiukim.github.io/mind-ar-js-doc/)
- [MindAR GitHub](https://github.com/hiukim/mind-ar-js)
- [A-Frame 公式](https://aframe.io/docs/)
- [aframe-extras（animation-mixer）](https://github.com/c-frame/aframe-extras)
