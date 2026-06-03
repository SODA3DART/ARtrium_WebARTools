/**
 * ARtrium WebAR Tools — A-Frame カスタムコンポーネント
 * MindAR + A-Frame で GLB モデルを表示する際の共通処理
 */
(function () {
  if (typeof AFRAME === 'undefined') {
    console.error('[ARtrium] A-Frame が読み込まれていません');
    return;
  }

  AFRAME.registerComponent('double-sided', {
    init: function () {
      this.el.addEventListener('model-loaded', () => {
        const obj = this.el.getObject3D('mesh') || this.el.object3D;
        if (!obj) return;

        obj.traverse((node) => {
          if (!node.isMesh || !node.material) return;

          const materials = Array.isArray(node.material) ? node.material : [node.material];
          const nodeName = node.name.toLowerCase();

          materials.forEach((mat) => {
            if (!mat) return;
            const matName = mat.name ? mat.name.toLowerCase() : '';
            const needsAlpha = mat.transparent || mat.alphaTest > 0 || !!mat.alphaMap;

            if (nodeName.includes('outline') || matName.includes('outline')) {
              mat.side = THREE.FrontSide;
              return;
            }

            mat.side = THREE.DoubleSide;
            if (!needsAlpha) {
              mat.transparent = false;
              mat.depthWrite = true;
            }
          });
        });

        this.el.emit('model-ready');
      });
    }
  });

  AFRAME.registerComponent('solid-wireframe', {
    schema: {
      enabled: { type: 'boolean', default: false },
      color: { type: 'color', default: '#111111' },
      thresholdAngle: { type: 'number', default: 15 }
    },
    init: function () {
      this.overlays = [];
      this.skinnedTargets = [];
      this.onModelReady = () => {
        requestAnimationFrame(() => this.applyMode());
      };
      this.el.addEventListener('model-ready', this.onModelReady);
      this.el.addEventListener('model-loaded', this.onModelReady);
    },
    isOutlineMesh: function (node) {
      const nodeName = node.name.toLowerCase();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      return materials.some((mat) => {
        if (!mat || !mat.name) return false;
        return nodeName.includes('outline') || mat.name.toLowerCase().includes('outline');
      });
    },
    removeOverlays: function () {
      this.overlays.forEach((entry) => {
        entry.parent.remove(entry.line);
        entry.line.geometry.dispose();
        entry.line.material.dispose();
      });
      this.overlays = [];
      this.skinnedTargets = [];
    },
    rebuildOverlays: function () {
      this.removeOverlays();
      if (!this.data.enabled) return;

      const root = this.el.getObject3D('mesh') || this.el.object3D;
      if (!root) return;

      root.traverse((node) => {
        if (!node.isMesh || !node.geometry || this.isOutlineMesh(node)) return;

        const line = this.createOverlayLine(node);
        node.add(line);
        const entry = { parent: node, line: line };
        this.overlays.push(entry);
        if (node.isSkinnedMesh) this.skinnedTargets.push(entry);
      });
    },
    createOverlayLine: function (mesh) {
      const edges = new THREE.EdgesGeometry(mesh.geometry, this.data.thresholdAngle);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: this.data.color,
          depthTest: false,
          depthWrite: false,
          transparent: true,
          opacity: 1
        })
      );
      line.name = 'solid-wireframe-overlay';
      line.renderOrder = 999;
      line.frustumCulled = false;
      return line;
    },
    applyMode: function () {
      this.rebuildOverlays();
    },
    update: function (oldData) {
      if (
        oldData.enabled !== this.data.enabled ||
        oldData.color !== this.data.color ||
        oldData.thresholdAngle !== this.data.thresholdAngle
      ) {
        this.applyMode();
      }
    },
    remove: function () {
      this.removeOverlays();
      this.el.removeEventListener('model-ready', this.onModelReady);
      this.el.removeEventListener('model-loaded', this.onModelReady);
    }
  });
})();
