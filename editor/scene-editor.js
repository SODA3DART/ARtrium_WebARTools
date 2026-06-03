/**
 * ARtrium Scene Editor — Three.js 3D レイアウトプレビュー
 * A-Frame / MindAR と同じ Y-up・YXZ 回転でトランスフォームを編集
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const DEFAULTS = {
  character: { position: [0, 0, 0], rotation: [90, 0, 0], scale: [0.3, 0.3, 0.3] },
  stage: { position: [0, 0, 0], rotation: [90, 0, 0], scale: [0.3, 0.3, 0.3] }
};

const POSTER = {
  standRotation: [90, 0, 0],
  posterRotation: [0, 0, 0],
  posterYOffset: -0.45
};

function deg(rad) {
  return THREE.MathUtils.radToDeg(rad);
}

function rad(degVal) {
  return THREE.MathUtils.degToRad(degVal);
}

function vec3Str(v) {
  return `${v.x.toFixed(3)} ${v.y.toFixed(3)} ${v.z.toFixed(3)}`;
}

function rotStr(obj) {
  return `${deg(obj.rotation.x).toFixed(1)} ${deg(obj.rotation.y).toFixed(1)} ${deg(obj.rotation.z).toFixed(1)}`;
}

function parseVec3(str, fallback) {
  const parts = String(str || fallback)
    .trim()
    .split(/\s+/)
    .map(Number);
  return new THREE.Vector3(
    Number.isFinite(parts[0]) ? parts[0] : 0,
    Number.isFinite(parts[1]) ? parts[1] : 0,
    Number.isFinite(parts[2]) ? parts[2] : 0
  );
}

function parseRot(str, fallback) {
  const parts = String(str || fallback)
    .trim()
    .split(/\s+/)
    .map(Number);
  return new THREE.Euler(
    rad(Number.isFinite(parts[0]) ? parts[0] : 0),
    rad(Number.isFinite(parts[1]) ? parts[1] : 0),
    rad(Number.isFinite(parts[2]) ? parts[2] : 0),
    'YXZ'
  );
}

class ARtriumSceneEditor {
  constructor(container) {
    this.container = container;
    this.previewMode = 'stand';
    this.activeModel = 'character';
    this.onTransformChange = null;

    this.models = {
      character: { wrapper: null, file: null, defaults: { ...DEFAULTS.character } },
      stage: { wrapper: null, file: null, defaults: { ...DEFAULTS.stage } }
    };

    this._standSnapshots = {};

    this._initScene();
    this._initControls();
    this._initLights();
    this._initMarkerPlane();
    this._animate();
    this._bindResize();
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x12151f);

    const w = this.container.clientWidth || 640;
    const h = this.container.clientHeight || 400;
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
    this.camera.position.set(0, 0.8, 2.2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    this.targetGroup = new THREE.Group();
    this.scene.add(this.targetGroup);

    const grid = new THREE.GridHelper(4, 20, 0x334155, 0x1e293b);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.002;
    this.scene.add(grid);
  }

  _initLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(1, 2, 2);
    this.scene.add(dir);
    const fill = new THREE.DirectionalLight(0x88bbff, 0.35);
    fill.position.set(-2, 0.5, 1);
    this.scene.add(fill);
  }

  _initMarkerPlane() {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    this.markerMesh = new THREE.Mesh(geo, mat);
    this.targetGroup.add(this.markerMesh);

    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x00c6ff, transparent: true, opacity: 0.8 })
    );
    this.markerMesh.add(border);

    const label = this._makeAxisHelper();
    this.targetGroup.add(label);
  }

  _makeAxisHelper() {
    const g = new THREE.Group();
    const len = 0.15;
    const mk = (color, axis) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        axis.clone().multiplyScalar(len)
      ]);
      g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color })));
    };
    mk(0xff5555, new THREE.Vector3(1, 0, 0));
    mk(0x55ff55, new THREE.Vector3(0, 1, 0));
    mk(0x5599ff, new THREE.Vector3(0, 0, 1));
    g.position.set(-0.52, -0.52, 0.01);
    return g;
  }

  _initControls() {
    this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbit.enableDamping = true;
    this.orbit.target.set(0, 0, 0.3);
    this.orbit.update();

    this.transform = new TransformControls(this.camera, this.renderer.domElement);
    this.transform.setSpace('local');
    this.scene.add(this.transform);

    this.transform.addEventListener('dragging-changed', (e) => {
      this.orbit.enabled = !e.value;
    });
    this.transform.addEventListener('objectChange', () => {
      this._emitTransformChange();
    });
  }

  _bindResize() {
    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(this.container);
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _animate() {
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      this.orbit.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  setMarkerTexture(url) {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        this.markerMesh.material.map = tex;
        this.markerMesh.material.needsUpdate = true;
        const aspect = tex.image.width / tex.image.height;
        this.markerMesh.scale.set(aspect, 1, 1);
      },
      undefined,
      () => console.warn('[ARtrium] マーカーテクスチャ読み込み失敗')
    );
  }

  async loadModel(role, file) {
    if (!file) return;
    this.models[role].file = file;

    const url = URL.createObjectURL(file);
    try {
      const gltf = await new GLTFLoader().loadAsync(url);
      this._mountModel(role, gltf.scene);
      if (role === 'character' && this.models.stage.wrapper) {
        this._applyDefaults('character', {
          ...DEFAULTS.character,
          position: [0, 0, 0.5]
        });
      }
      this.selectModel(role);
      this._frameAll();
    } catch (err) {
      console.error('[ARtrium] GLB load error:', err);
      throw err;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  removeModel(role) {
    const entry = this.models[role];
    if (entry.wrapper) {
      this.transform.detach();
      this.targetGroup.remove(entry.wrapper);
      entry.wrapper = null;
    }
    entry.file = null;
    if (this.activeModel === role) {
      const other = role === 'character' ? 'stage' : 'character';
      if (this.models[other].wrapper) this.selectModel(other);
    }
  }

  _mountModel(role, scene) {
    const entry = this.models[role];
    if (entry.wrapper) {
      this.targetGroup.remove(entry.wrapper);
    }

    const wrapper = new THREE.Group();
    wrapper.name = `${role}-wrapper`;
    wrapper.rotation.order = 'YXZ';
    scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });
    wrapper.add(scene);
    this.targetGroup.add(wrapper);
    entry.wrapper = wrapper;

    this._applyDefaults(role, entry.defaults);
  }

  _applyDefaults(role, def) {
    const w = this.models[role].wrapper;
    if (!w) return;
    w.position.fromArray(def.position);
    w.rotation.set(rad(def.rotation[0]), rad(def.rotation[1]), rad(def.rotation[2]), 'YXZ');
    w.scale.fromArray(def.scale);
    this._saveStandSnapshot(role);
  }

  _saveStandSnapshot(role) {
    const w = this.models[role].wrapper;
    if (!w || this.previewMode !== 'stand') return;
    this._standSnapshots[role] = {
      position: w.position.clone(),
      rotation: w.rotation.clone(),
      scale: w.scale.clone()
    };
  }

  selectModel(role) {
    if (!this.models[role].wrapper) return;
    this.activeModel = role;
    this.transform.attach(this.models[role].wrapper);
    this._emitTransformChange();
  }

  setTransformMode(mode) {
    this.transform.setMode(mode);
  }

  setPreviewMode(mode) {
    if (mode === this.previewMode) return;

    if (mode === 'poster') {
      ['character', 'stage'].forEach((role) => {
        const w = this.models[role].wrapper;
        if (!w) return;
        this._standSnapshots[role] = {
          position: w.position.clone(),
          rotation: w.rotation.clone(),
          scale: w.scale.clone()
        };
        const snap = this._standSnapshots[role];
        w.rotation.set(
          rad(POSTER.posterRotation[0]),
          rad(POSTER.posterRotation[1]),
          rad(POSTER.posterRotation[2]),
          'YXZ'
        );
        w.position.set(snap.position.x, snap.position.y + POSTER.posterYOffset, snap.position.z);
      });
      this.transform.detach();
    } else {
      ['character', 'stage'].forEach((role) => {
        const snap = this._standSnapshots[role];
        const w = this.models[role].wrapper;
        if (!w || !snap) return;
        w.position.copy(snap.position);
        w.rotation.copy(snap.rotation);
        w.scale.copy(snap.scale);
      });
      if (this.models[this.activeModel].wrapper) {
        this.transform.attach(this.models[this.activeModel].wrapper);
      }
    }

    this.previewMode = mode;
    this._emitTransformChange();
  }

  applyTransformFromUI(role, field, value) {
    if (this.previewMode === 'poster') return false;
    const w = this.models[role].wrapper;
    if (!w) return false;

    const nums = String(value)
      .trim()
      .split(/[\s,、]+/)
      .map(Number);
    if (nums.length !== 3 || nums.some((n) => !Number.isFinite(n))) return false;

    if (field === 'position') w.position.fromArray(nums);
    if (field === 'rotation') w.rotation.set(rad(nums[0]), rad(nums[1]), rad(nums[2]), 'YXZ');
    if (field === 'scale') {
      const safe = nums.map((n) => Math.max(0.001, n));
      w.scale.fromArray(safe);
    }

    if (this.previewMode === 'stand') this._saveStandSnapshot(role);
    this._emitTransformChange();
    return true;
  }

  setTransform(role, { position, rotation, scale }) {
    if (this.previewMode === 'poster') return false;
    const w = this.models[role].wrapper;
    if (!w) return false;

    if (position && position.length === 3 && position.every(Number.isFinite)) {
      w.position.fromArray(position);
    }
    if (rotation && rotation.length === 3 && rotation.every(Number.isFinite)) {
      w.rotation.set(rad(rotation[0]), rad(rotation[1]), rad(rotation[2]), 'YXZ');
    }
    if (scale && scale.length === 3 && scale.every(Number.isFinite)) {
      w.scale.fromArray(scale.map((n) => Math.max(0.001, n)));
    }

    if (this.previewMode === 'stand') this._saveStandSnapshot(role);
    this._emitTransformChange();
    return true;
  }

  getActiveTransformNumbers() {
    const ui = this.getActiveTransformUI();
    if (!ui) return null;
    const parse = (s) =>
      String(s)
        .trim()
        .split(/[\s,、]+/)
        .map(Number);
    return {
      role: ui.role,
      readOnly: ui.readOnly,
      position: parse(ui.position),
      rotation: parse(ui.rotation),
      scale: parse(ui.scale)
    };
  }

  resetModel(role) {
    const def =
      role === 'character' && this.models.stage.wrapper
        ? { ...DEFAULTS.character, position: [0, 0, 0.5] }
        : { ...DEFAULTS[role] };
    this._applyDefaults(role, def);
    this._emitTransformChange();
  }

  getTransform(role) {
    const w = this.models[role].wrapper;
    if (!w) {
      const def =
        role === 'character' && this.models.stage.file
          ? { ...DEFAULTS.character, position: [0, 0, 0.5] }
          : DEFAULTS[role];
      return {
        position: def.position.join(' '),
        rotation: def.rotation.join(' '),
        scale: def.scale.join(' ')
      };
    }
    const snap = this._standSnapshots[role];
    const src =
      this.previewMode === 'poster' && snap
        ? { position: snap.position, rotation: snap.rotation, scale: snap.scale }
        : w;
    return {
      position: vec3Str(src.position),
      rotation: rotStr({ rotation: src.rotation }),
      scale: vec3Str(src.scale)
    };
  }

  getTransforms() {
    return {
      character: this.getTransform('character'),
      stage: this.models.stage.file ? this.getTransform('stage') : null
    };
  }

  getActiveTransformUI() {
    const role = this.activeModel;
    const w = this.models[role].wrapper;
    if (!w) return null;
    const src =
      this.previewMode === 'poster' && this._standSnapshots[role]
        ? {
            position: this._standSnapshots[role].position,
            rotation: this._standSnapshots[role].rotation,
            scale: this._standSnapshots[role].scale
          }
        : { position: w.position, rotation: w.rotation, scale: w.scale };
    return {
      role,
      readOnly: this.previewMode === 'poster',
      position: vec3Str(src.position),
      rotation: rotStr({ rotation: src.rotation }),
      scale: vec3Str(src.scale)
    };
  }

  hasModel(role) {
    return !!this.models[role].wrapper;
  }

  _frameAll() {
    const box = new THREE.Box3();
    let has = false;
    ['character', 'stage'].forEach((role) => {
      const w = this.models[role].wrapper;
      if (!w) return;
      box.expandByObject(w);
      has = true;
    });
    if (!has) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.5);
    this.orbit.target.copy(center);
    this.camera.position.set(center.x, center.y + maxDim * 0.6, center.z + maxDim * 2);
    this.orbit.update();
  }

  _emitTransformChange() {
    if (typeof this.onTransformChange === 'function') {
      this.onTransformChange(this.getActiveTransformUI());
    }
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this._resizeObserver?.disconnect();
    this.transform.dispose();
    this.renderer.dispose();
  }
}

let instance = null;

export function initSceneEditor(container) {
  if (instance) instance.destroy();
  instance = new ARtriumSceneEditor(container);
  return instance;
}

export function getSceneEditor() {
  return instance;
}

window.ARtriumSceneEditor = {
  init: initSceneEditor,
  get: getSceneEditor,
  ready: true
};
