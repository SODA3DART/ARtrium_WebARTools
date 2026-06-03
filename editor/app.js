(function () {
  const state = {
    glb: null,
    marker: null,
    mind: null,
    stage: null,
    audio: null,
    markerObjectUrl: null
  };

  const els = {};
  let sceneEditor = null;
  let uiSyncLock = false;
  let transformInputTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function initElements() {
    els.glb = $('file-glb');
    els.marker = $('file-marker');
    els.mind = $('file-mind');
    els.stage = $('file-stage');
    els.audio = $('file-audio');
    els.dropGlb = $('drop-glb');
    els.dropMarker = $('drop-marker');
    els.dropMind = $('drop-mind');
    els.dropStage = $('drop-stage');
    els.dropAudio = $('drop-audio');
    els.previewMarker = $('preview-marker');
    els.downloadBtn = $('btn-download');
    els.status = $('status-msg');
    els.checklist = $('checklist');
    els.title = $('input-title');
    els.projectName = $('input-project-name');
    els.markerTitle = $('input-marker-title');
    els.markerDesc = $('input-marker-desc');
    els.anim = $('chk-animation');
    els.poster = $('chk-poster');
    els.double = $('chk-double-sided');
    els.wireframe = $('chk-wireframe');
    els.sceneEmpty = $('scene-empty-msg');
    els.transformPanel = $('transform-panel');
    els.transformTitle = $('transform-panel-title');
    els.axisInputs = [
      $('t-pos-x'), $('t-pos-y'), $('t-pos-z'),
      $('t-rot-x'), $('t-rot-y'), $('t-rot-z'),
      $('t-scale-x'), $('t-scale-y'), $('t-scale-z')
    ];
    els.btnChar = $('btn-select-character');
    els.btnStage = $('btn-select-stage');
    els.btnTranslate = $('btn-mode-translate');
    els.btnRotate = $('btn-mode-rotate');
    els.btnScale = $('btn-mode-scale');
    els.btnStand = $('btn-preview-stand');
    els.btnPoster = $('btn-preview-poster');
    els.btnReset = $('btn-reset-transform');
  }

  function waitForSceneEditor(maxMs) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        // get() は init() 後にしか値を返さないので、API の存在だけ待つ
        if (window.ARtriumSceneEditor?.init) {
          return resolve(window.ARtriumSceneEditor);
        }
        if (Date.now() - start > maxMs) {
          return reject(new Error('Scene editor failed to load'));
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  async function applyPendingAssetsToScene() {
    if (!sceneEditor) return;
    try {
      if (state.glb) await sceneEditor.loadModel('character', state.glb);
      if (state.stage) await sceneEditor.loadModel('stage', state.stage);
      if (state.marker) {
        if (state.markerObjectUrl) URL.revokeObjectURL(state.markerObjectUrl);
        state.markerObjectUrl = URL.createObjectURL(state.marker);
        sceneEditor.setMarkerTexture(state.markerObjectUrl);
      }
      updateSceneUI();
    } catch (err) {
      console.error(err);
    }
  }

  async function initSceneEditor() {
    try {
      const api = await waitForSceneEditor(15000);
      sceneEditor = api.init($('scene-viewport'));
      sceneEditor.onTransformChange = syncTransformInputsFromScene;
      bindSceneUI();
      await applyPendingAssetsToScene();
    } catch (err) {
      console.error(err);
      showStatus(
        '3D エディタの初期化に失敗しました。「エディタを起動.bat」経由で開いているか確認し、ページを再読み込みしてください。',
        true
      );
    }
  }

  function bindSceneUI() {
    els.btnChar.addEventListener('click', () => selectModel('character'));
    els.btnStage.addEventListener('click', () => selectModel('stage'));

    els.btnTranslate.addEventListener('click', () => setMode('translate', els.btnTranslate));
    els.btnRotate.addEventListener('click', () => setMode('rotate', els.btnRotate));
    els.btnScale.addEventListener('click', () => setMode('scale', els.btnScale));

    els.btnStand.addEventListener('click', () => setPreview('stand', els.btnStand, els.btnPoster));
    els.btnPoster.addEventListener('click', () => setPreview('poster', els.btnPoster, els.btnStand));

    els.btnReset.addEventListener('click', () => {
      if (!sceneEditor) return;
      sceneEditor.resetModel(sceneEditor.activeModel);
      syncTransformInputsFromScene();
    });

    els.axisInputs.forEach((input) => {
      if (!input) return;
      input.addEventListener('input', scheduleApplyTransformFromInputs);
      input.addEventListener('change', applyTransformFromInputs);
    });
  }

  function scheduleApplyTransformFromInputs() {
    clearTimeout(transformInputTimer);
    transformInputTimer = setTimeout(applyTransformFromInputs, 60);
  }

  function readAxisValues() {
    const num = (el) => parseFloat(el.value);
    const position = [num($('t-pos-x')), num($('t-pos-y')), num($('t-pos-z'))];
    const rotation = [num($('t-rot-x')), num($('t-rot-y')), num($('t-rot-z'))];
    const scale = [num($('t-scale-x')), num($('t-scale-y')), num($('t-scale-z'))];
    const ok = (arr) => arr.length === 3 && arr.every(Number.isFinite);
    if (!ok(position) || !ok(rotation) || !ok(scale)) return null;
    return { position, rotation, scale };
  }

  function writeAxisValues(data) {
    if (!data) return;
    uiSyncLock = true;
    $('t-pos-x').value = data.position[0].toFixed(3);
    $('t-pos-y').value = data.position[1].toFixed(3);
    $('t-pos-z').value = data.position[2].toFixed(3);
    $('t-rot-x').value = data.rotation[0].toFixed(1);
    $('t-rot-y').value = data.rotation[1].toFixed(1);
    $('t-rot-z').value = data.rotation[2].toFixed(1);
    $('t-scale-x').value = data.scale[0].toFixed(3);
    $('t-scale-y').value = data.scale[1].toFixed(3);
    $('t-scale-z').value = data.scale[2].toFixed(3);
    uiSyncLock = false;
  }

  function setMode(mode, btn) {
    if (!sceneEditor) return;
    sceneEditor.setTransformMode(mode);
    [els.btnTranslate, els.btnRotate, els.btnScale].forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function setPreview(mode, activeBtn, otherBtn) {
    if (!sceneEditor) return;
    sceneEditor.setPreviewMode(mode);
    activeBtn.classList.add('active');
    otherBtn.classList.remove('active');
    syncTransformInputsFromScene();
  }

  function selectModel(role) {
    if (!sceneEditor || !sceneEditor.hasModel(role)) return;
    sceneEditor.selectModel(role);
    els.btnChar.classList.toggle('active', role === 'character');
    els.btnStage.classList.toggle('active', role === 'stage');
    syncTransformInputsFromScene();
  }

  function syncTransformInputsFromScene() {
    if (!sceneEditor || uiSyncLock) return;
    const data = sceneEditor.getActiveTransformNumbers();
    if (!data) {
      els.transformPanel.classList.add('disabled');
      els.transformPanel.classList.remove('has-model');
      return;
    }
    els.transformPanel.classList.remove('disabled');
    els.transformPanel.classList.add('has-model');
    els.transformPanel.classList.toggle('read-only', !!data.readOnly);
    els.transformTitle.textContent =
      (data.role === 'character' ? 'キャラクター' : 'ステージ') +
      (data.readOnly ? ' — プレビュー中（立体プレビューで編集）' : ' — トランスフォーム');
    writeAxisValues(data);
  }

  function applyTransformFromInputs() {
    if (!sceneEditor || uiSyncLock) return;
    if (sceneEditor.previewMode === 'poster') return;

    const values = readAxisValues();
    if (!values) return;

    const role = sceneEditor.activeModel;
    const ok = sceneEditor.setTransform(role, values);
    if (!ok) return;

    // スナップショット保存後も入力値は維持（丸めずにユーザー入力を尊重）
  }

  function updateSceneUI() {
    const hasChar = !!state.glb;
    const hasStage = !!state.stage;
    els.sceneEmpty.classList.toggle('hidden', hasChar);
    els.btnChar.disabled = !hasChar;
    els.btnStage.disabled = !hasStage;
    if (sceneEditor) {
      if (hasChar) selectModel('character');
      else if (hasStage) selectModel('stage');
      else els.transformPanel.classList.add('disabled');
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function setFileChip(dropEl, file) {
    let chip = dropEl.querySelector('.file-chip');
    if (!chip) {
      chip = document.createElement('div');
      chip.className = 'file-chip';
      dropEl.appendChild(chip);
    }
    chip.textContent = `${file.name} (${formatSize(file.size)})`;
    dropEl.classList.add('has-file');
  }

  function acceptFile(file, acceptList) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return acceptList.includes(ext);
  }

  function bindDropzone(dropEl, inputEl, key, acceptList, onExtra) {
    dropEl.addEventListener('click', () => inputEl.click());

    dropEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropEl.classList.add('dragover');
    });
    dropEl.addEventListener('dragleave', () => dropEl.classList.remove('dragover'));
    dropEl.addEventListener('drop', (e) => {
      e.preventDefault();
      dropEl.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(key, file, dropEl, acceptList, onExtra);
    });

    inputEl.addEventListener('change', () => {
      const file = inputEl.files[0];
      if (file) handleFile(key, file, dropEl, acceptList, onExtra);
    });
  }

  async function handleFile(key, file, dropEl, acceptList, onExtra) {
    if (acceptList.length && !acceptFile(file, acceptList)) {
      showStatus(`${file.name} は対応していない形式です`, true);
      return;
    }
    state[key] = file;
    setFileChip(dropEl, file);

    try {
      if (key === 'glb') {
        if (!sceneEditor) {
          showStatus('3D エディタを準備中です。数秒後にもう一度 GLB をアップロードしてください。', true);
        } else {
          await sceneEditor.loadModel('character', file);
        }
      }
      if (key === 'stage') {
        if (sceneEditor) await sceneEditor.loadModel('stage', file);
      }
      if (key === 'marker') {
        if (sceneEditor) {
          if (state.markerObjectUrl) URL.revokeObjectURL(state.markerObjectUrl);
          state.markerObjectUrl = URL.createObjectURL(file);
          sceneEditor.setMarkerTexture(state.markerObjectUrl);
        }
      }
      if (onExtra) onExtra(file);
      updateSceneUI();
      updateChecklist();
      showStatus('');
    } catch (err) {
      console.error(err);
      showStatus('3D モデルの読み込みに失敗しました。GLB ファイルを確認してください。', true);
    }
  }

  function updateChecklist() {
    const items = [
      { ok: !!state.marker, label: 'マーカー画像（PNG / JPG）' },
      { ok: !!state.mind, label: 'MindAR ターゲット（.mind）' },
      { ok: !!state.glb, label: '3D モデル（.glb）' }
    ];
    els.checklist.innerHTML =
      '<strong>必須ファイル</strong><ul>' +
      items
        .map(
          (i) =>
            `<li class="${i.ok ? 'done' : 'missing'}">${i.ok ? '✓' : '○'} ${i.label}</li>`
        )
        .join('') +
      '</ul>';
    els.downloadBtn.disabled = !(state.marker && state.mind && state.glb);
  }

  function showStatus(msg, isError) {
    els.status.textContent = msg;
    els.status.className = 'status-msg' + (isError ? ' error' : msg ? ' ok' : '');
  }

  function getOptions() {
    const transforms = sceneEditor
      ? sceneEditor.getTransforms()
      : {
          character: { position: '0 0 0', rotation: '90 0 0', scale: '0.3 0.3 0.3' },
          stage: state.stage
            ? { position: '0 0 0', rotation: '90 0 0', scale: '0.3 0.3 0.3' }
            : null
        };

    return {
      title: els.title.value.trim() || '飛び出す AR',
      projectName: els.projectName.value.trim() || els.title.value.trim() || 'my-ar',
      markerTitle: els.markerTitle.value.trim(),
      markerDescription: els.markerDesc.value.trim(),
      transforms,
      hasAnimation: els.anim.checked,
      showPosterMode: els.poster.checked,
      doubleSided: els.double.checked,
      showWireframe: els.wireframe.checked,
      hasStage: !!state.stage,
      hasAudio: !!state.audio
    };
  }

  async function handleDownload() {
    if (!state.glb || !state.marker || !state.mind) {
      showStatus('必須ファイルをすべてアップロードしてください', true);
      return;
    }

    els.downloadBtn.disabled = true;
    showStatus('ZIP を作成しています…');

    try {
      await ARtriumPackager.loadLibFiles();
      const { blob, folderName } = await ARtriumPackager.buildZip(
        {
          glb: state.glb,
          marker: state.marker,
          mind: state.mind,
          stage: state.stage,
          audio: state.audio
        },
        getOptions()
      );

      saveAs(blob, `${folderName}.zip`);
      showStatus('ダウンロードが開始されました！');
    } catch (err) {
      console.error(err);
      showStatus(
        'ZIP の作成に失敗しました。ローカルサーバー（npx serve .）経由で Editor を開いているか確認してください。',
        true
      );
    } finally {
      updateChecklist();
    }
  }

  async function init() {
    initElements();
    await initSceneEditor();

    bindDropzone(els.dropGlb, els.glb, 'glb', ['glb'], null);
    bindDropzone(els.dropMarker, els.marker, 'marker', ['png', 'jpg', 'jpeg', 'webp'], (file) => {
      const url = URL.createObjectURL(file);
      els.previewMarker.src = url;
      els.previewMarker.classList.add('visible');
    });
    bindDropzone(els.dropMind, els.mind, 'mind', ['mind'], null);
    bindDropzone(els.dropStage, els.stage, 'stage', ['glb'], null);
    bindDropzone(els.dropAudio, els.audio, 'audio', ['mp3', 'wav', 'ogg'], null);

    els.downloadBtn.addEventListener('click', handleDownload);

    updateChecklist();
    updateSceneUI();

    ARtriumPackager.loadLibFiles().catch(() => {
      showStatus(
        'エディタの起動方法: フォルダ内の「エディタを起動.bat」をダブルクリックしてください。（index.html を直接開くと動きません）',
        true
      );
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
