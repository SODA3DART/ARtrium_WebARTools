/**
 * ARtrium WebAR Tools — ランタイム
 * ar-config.js の設定に基づいてシーンと UI を構築する
 */
(function () {
  const DEFAULT_POSTER = {
    standRotation: '90 0 0',
    posterRotation: '0 0 0',
    posterYOffset: -0.45
  };

  function vec3(str, fallback) {
    return String(str || fallback || '0 0 0');
  }

  function getPositionString(el) {
    const pos = el.getAttribute('position');
    if (!pos) return '0 0 0';
    if (typeof pos === 'string') return pos;
    return `${pos.x || 0} ${pos.y || 0} ${pos.z || 0}`;
  }

  function parsePositionString(str) {
    const parts = String(str || '0 0 0')
      .trim()
      .split(/\s+/)
      .map(Number);
    return [
      Number.isFinite(parts[0]) ? parts[0] : 0,
      Number.isFinite(parts[1]) ? parts[1] : 0,
      Number.isFinite(parts[2]) ? parts[2] : 0
    ];
  }

  function buildAssetItems(models, audio) {
    let html = '';
    (models || []).forEach((m) => {
      html += `<a-asset-item id="${m.id}" src="${m.src}"></a-asset-item>\n`;
    });
    if (audio && audio.src) {
      html += `<audio id="artrium-bgm" src="${audio.src}" preload="auto"></audio>\n`;
    }
    return html;
  }

  function buildLights(lights) {
    const defaults = [
      { type: 'ambient', color: '#ffffff', intensity: 0.7 },
      { type: 'directional', color: '#ffffff', intensity: 0.6, position: '0 1 1' }
    ];
    return (lights && lights.length ? lights : defaults)
      .map((light) => {
        const pos = light.position ? ` position="${light.position}"` : '';
        return `<a-light type="${light.type}" color="${light.color || '#ffffff'}" intensity="${light.intensity ?? 1}"${pos}></a-light>`;
      })
      .join('\n');
  }

  function buildModelEntity(model) {
    const attrs = [
      `id="${model.id}-entity"`,
      'class="ar-model"',
      `gltf-model="#${model.id}"`,
      `rotation="${vec3(model.rotation, '90 0 0')}"`,
      `position="${vec3(model.position)}"`,
      `scale="${vec3(model.scale, '0.3 0.3 0.3')}"`
    ];

    if (model.visible === false) attrs.push('visible="false"');
    if (model.animation) {
      const clip = model.animation.clip ?? '*';
      const loop = model.animation.loop ?? 'repeat';
      attrs.push(`animation-mixer="clip: ${clip}; loop: ${loop};"`);
    }
    if (model.doubleSided) attrs.push('double-sided');
    if (model.wireframe) {
      attrs.push('solid-wireframe="enabled: false"');
    }

    return `<a-entity ${attrs.join(' ')}></a-entity>`;
  }

  function buildScene(config) {
    const scene = config.scene || {};
    const targetIndex = scene.targetIndex ?? 0;
    const timeout = scene.assetsTimeout ?? 120000;
    const models = config.models || [];

    const container = document.getElementById('artrium-scene-root');
    if (!container) {
      console.error('[ARtrium] #artrium-scene-root が見つかりません');
      return;
    }

    container.innerHTML = `
<a-scene
  mindar-image="imageTargetSrc: ${config.marker.target};"
  color-space="sRGB"
  renderer="colorManagement: true, physicallyCorrectLights"
  vr-mode-ui="enabled: false"
  device-orientation-permission-ui="enabled: false">
  ${buildLights(config.lights)}
  <a-assets timeout="${timeout}">
    ${buildAssetItems(models, config.audio)}
  </a-assets>
  <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
  <a-entity mindar-image-target="targetIndex: ${targetIndex}" id="artrium-target">
    ${models.map(buildModelEntity).join('\n    ')}
  </a-entity>
</a-scene>`;
  }

  function buildMarkerUI(config) {
    const ui = config.ui || {};
    if (ui.showMarkerButton === false) return;

    const marker = config.marker || {};
    document.body.insertAdjacentHTML(
      'beforeend',
      `
<button type="button" id="artrium-marker-btn" class="artrium-ui-btn" aria-expanded="false" aria-controls="artrium-marker-overlay">マーカーを表示</button>
<div id="artrium-marker-overlay" class="artrium-marker-overlay" role="dialog" aria-modal="true" aria-labelledby="artrium-marker-title" hidden>
  <div class="artrium-marker-panel">
    <h2 id="artrium-marker-title">${marker.title || config.title || 'AR マーカー'}</h2>
    <p>${marker.description || '下の画像と同じものをカメラで映すと、3Dモデルが表示されます。'}</p>
    <img src="${marker.image}" alt="${marker.title || 'AR 用マーカー画像'}" />
    <div class="artrium-marker-actions">
      <button type="button" class="artrium-marker-close" id="artrium-marker-close">閉じる</button>
    </div>
  </div>
</div>`
    );

    const btn = document.getElementById('artrium-marker-btn');
    const overlay = document.getElementById('artrium-marker-overlay');
    const closeBtn = document.getElementById('artrium-marker-close');

    function openOverlay() {
      overlay.hidden = false;
      overlay.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
    function closeOverlay() {
      overlay.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      overlay.hidden = true;
    }

    btn.addEventListener('click', openOverlay);
    closeBtn.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeOverlay();
    });
  }

  function buildBackLink(config) {
    if (!config.backLink) return;
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<a href="${config.backLink.href}" class="artrium-back-link">${config.backLink.label || '← 戻る'}</a>`
    );
  }

  function initPosterMode(config) {
    const ui = config.ui || {};
    if (ui.showPosterMode === false) return;

    const poster = { ...DEFAULT_POSTER, ...(ui.posterMode || {}) };
    const models = config.models || [];

    document.body.insertAdjacentHTML(
      'beforeend',
      `<button type="button" id="artrium-mode-btn" class="artrium-ui-btn" aria-pressed="false">ポスターモード</button>`
    );

    const modeBtn = document.getElementById('artrium-mode-btn');
    const arModels = () => document.querySelectorAll('.ar-model');
    let displayMode = 'stand';

    function getRotations(el) {
      const modelId = el.id.replace('-entity', '');
      const modelCfg = models.find((m) => m.id === modelId);
      return {
        stand: modelCfg?.posterMode?.standRotation || modelCfg?.rotation || poster.standRotation,
        poster: modelCfg?.posterMode?.posterRotation || poster.posterRotation
      };
    }

    function applyDisplayMode() {
      arModels().forEach((el) => {
        const rots = getRotations(el);
        el.setAttribute('rotation', displayMode === 'stand' ? rots.stand : rots.poster);
        const parts = parsePositionString(el.dataset.standPosition);
        const yOffset = displayMode === 'poster' ? poster.posterYOffset : 0;
        el.setAttribute('position', `${parts[0]} ${parts[1] + yOffset} ${parts[2]}`);
      });
      const isPoster = displayMode === 'poster';
      modeBtn.textContent = isPoster ? '立体モード' : 'ポスターモード';
      modeBtn.setAttribute('aria-pressed', isPoster ? 'true' : 'false');
    }

    setTimeout(() => {
      arModels().forEach((el) => {
        el.dataset.standPosition = getPositionString(el);
      });
      applyDisplayMode();
    }, 100);

    modeBtn.addEventListener('click', () => {
      displayMode = displayMode === 'stand' ? 'poster' : 'stand';
      applyDisplayMode();
    });
  }

  function initWireframe(config) {
    const wireframeModel = (config.models || []).find((m) => m.wireframe);
    const ui = config.ui || {};
    if (!wireframeModel || ui.showWireframe === false) return;

    document.body.insertAdjacentHTML(
      'beforeend',
      `<button type="button" id="artrium-view-btn" class="artrium-ui-btn" aria-pressed="false">ソリッドWF</button>`
    );

    const viewBtn = document.getElementById('artrium-view-btn');
    let enabled = false;

    viewBtn.addEventListener('click', () => {
      enabled = !enabled;
      const el = document.getElementById(`${wireframeModel.id}-entity`);
      if (!el) return;
      el.setAttribute('solid-wireframe', { enabled });
      const comp = el.components['solid-wireframe'];
      if (comp) comp.applyMode();
      viewBtn.textContent = enabled ? '通常表示' : 'ソリッドWF';
      viewBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    });
  }

  function initAudio(config) {
    const audioCfg = config.audio;
    if (!audioCfg || !audioCfg.src || audioCfg.playOnTargetFound === false) return;

    document.querySelector('#artrium-target')?.addEventListener('targetFound', () => {
      const audio = document.getElementById('artrium-bgm');
      if (audio) audio.play().catch(() => {});
    });
    document.querySelector('#artrium-target')?.addEventListener('targetLost', () => {
      const audio = document.getElementById('artrium-bgm');
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  function initModelErrorLogging(config) {
    (config.models || []).forEach((m) => {
      document.getElementById(`${m.id}-entity`)?.addEventListener('model-error', (e) => {
        console.error(`[ARtrium] モデル "${m.id}" の読み込みに失敗:`, e.detail);
      });
    });
  }

  window.ARtrium = {
    init: function (config) {
      if (!config || !config.marker?.target) {
        console.error('[ARtrium] ar-config.js に marker.target (.mind ファイル) を設定してください');
        return;
      }
      if (!config.models || config.models.length === 0) {
        console.error('[ARtrium] ar-config.js に models を1つ以上設定してください');
        return;
      }

      document.title = config.title || 'ARtrium WebAR';

      buildBackLink(config);
      buildMarkerUI(config);
      buildScene(config);

      initPosterMode(config);
      initWireframe(config);

      setTimeout(() => {
        initAudio(config);
        initModelErrorLogging(config);
      }, 200);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (window.ARTRIUM_CONFIG) {
      window.ARtrium.init(window.ARTRIUM_CONFIG);
    }
  });
})();
