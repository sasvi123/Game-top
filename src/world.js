import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.bouncePads = [];
    this.speedBoosters = [];

    // Table & Final Cake Altar elements
    this.picnicTable = null;
    this.cakePlatter = null;
    this.platterSlices = [];
    this.grandCakeGroup = null;
    this.candles = [];

    // Water & Clouds
    this.waterMesh = null;
    this.clouds = [];
    this.dandelionPoints = null;

    // Fireworks
    this.fireworks = [];

    this.init();
  }

  async init() {
    this.createStylizedSkyAndLighting();
    this.createOcean();
    this.createClouds();
    this.createDandelionParticles();
    this.createSafetyGround();
    this.createPicnicPavilion();
    this.createSteppingStones();
    this.createBounceMushrooms();
    this.createSpeedBoosters();
    await this.loadIslandModel();
  }

  createStylizedSkyAndLighting() {
    // Hemispheric Ambient light (sky blue from above, warm meadow grass bounce from below)
    const hemiLight = new THREE.HemisphereLight(0xddf0ff, 0x6ca352, 0.75);
    this.scene.add(hemiLight);

    // Warm Sun Directional Light with soft shadows
    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    sunLight.position.set(28, 45, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    const d = 32;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Gentle sun sphere
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(3.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfffae0 })
    );
    sunMesh.position.copy(sunLight.position).multiplyScalar(2.0);
    this.scene.add(sunMesh);

    // Sky gradient background
    this.scene.background = new THREE.Color(0x9bd8ff);
    this.scene.fog = new THREE.FogExp2(0xb5e5ff, 0.008);
  }

  // Safety terrain collision backing so character never falls through seams
  createSafetyGround() {
    const safetyGeo = new THREE.CylinderGeometry(23.5, 16.0, 0.3, 32);
    const safetyMat = new THREE.MeshBasicMaterial({ visible: false });
    const safetyMesh = new THREE.Mesh(safetyGeo, safetyMat);
    safetyMesh.position.y = -0.15;
    this.scene.add(safetyMesh);
    this.colliders.push(safetyMesh);
  }

  async loadIslandModel() {
    const loader = new GLTFLoader();
    const tryUrls = [
      './public/assets/Small-Meadow-Island.glb',
      './assets/Small-Meadow-Island.glb',
      '/public/assets/Small-Meadow-Island.glb'
    ];

    for (const url of tryUrls) {
      try {
        const gltf = await new Promise((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });

        const island = gltf.scene;
        island.scale.set(5.5, 5.5, 5.5);
        island.position.set(0, 0, 0);

        island.updateMatrixWorld(true);

        island.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.geometry) {
              child.geometry.computeBoundingBox();
              child.geometry.computeBoundingSphere();
            }

            if (child.material) {
              child.material.roughness = Math.min(0.85, child.material.roughness || 0.7);
            }

            this.colliders.push(child);
          }
        });

        this.scene.add(island);
        console.log('✅ Enuri\'s Birthday Quest GLB loaded successfully from:', url);
        return island;
      } catch (err) {
        console.warn(`Failed loading GLB from ${url}, trying next fallback...`, err);
      }
    }

    console.warn('Using stylized meadow fallback terrain');
    this.createFallbackTerrain();
    return null;
  }

  createFallbackTerrain() {
    const islandGeo = new THREE.CylinderGeometry(24, 6, 8, 32);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.8 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -3.8;
    island.receiveShadow = true;
    island.castShadow = true;
    this.scene.add(island);
    this.colliders.push(island);
  }

  createOcean() {
    const waterGeo = new THREE.PlaneGeometry(240, 240, 64, 64);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x22a6b3,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
      flatShading: true
    });

    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.y = -4.5;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    const pos = waterGeo.attributes.position;
    this.waterBaseY = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      this.waterBaseY[i] = pos.getY(i);
    }
  }

  createClouds() {
    const cloudGeo = new THREE.DodecahedronGeometry(2.2, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      flatShading: true
    });

    for (let i = 0; i < 14; i++) {
      const cloudGroup = new THREE.Group();
      const puffs = 4 + Math.floor(Math.random() * 4);
      for (let p = 0; p < puffs; p++) {
        const puff = new THREE.Mesh(cloudGeo, cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 5.0,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 3.5
        );
        const s = 0.8 + Math.random() * 0.8;
        puff.scale.set(s, s * 0.7, s);
        cloudGroup.add(puff);
      }

      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 45;
      cloudGroup.position.set(
        Math.cos(angle) * dist,
        18 + Math.random() * 12,
        Math.sin(angle) * dist
      );
      cloudGroup.userData = { speed: 0.8 + Math.random() * 1.2 };
      this.scene.add(cloudGroup);
      this.clouds.push(cloudGroup);
    }
  }

  createDandelionParticles() {
    const count = 120;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 44;
      positions[i * 3 + 1] = 0.5 + Math.random() * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 44;
      velocities.push({
        x: 0.3 + Math.random() * 0.5,
        y: (Math.random() - 0.5) * 0.2,
        z: 0.2 + Math.random() * 0.4
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfffaea,
      size: 0.25,
      transparent: true,
      opacity: 0.8
    });

    this.dandelionPoints = new THREE.Points(geo, mat);
    this.dandelionPoints.userData = { velocities };
    this.scene.add(this.dandelionPoints);
  }

  createPicnicPavilion() {
    const pavilion = new THREE.Group();
    pavilion.position.set(0, 0.05, 0);

    // Stone Patio Base
    const patioGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.2, 16);
    const patioMat = new THREE.MeshStandardMaterial({ color: 0xccd5ae, roughness: 0.8 });
    const patio = new THREE.Mesh(patioGeo, patioMat);
    patio.receiveShadow = true;
    pavilion.add(patio);
    this.colliders.push(patio);

    // Wooden Picnic Table
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0xff4d6d, roughness: 0.5 });

    // Table Top
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.4), woodMat);
    tableTop.position.y = 0.85;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    pavilion.add(tableTop);
    this.colliders.push(tableTop);

    // Table Cloth Runner
    const runner = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.13, 1.0), clothMat);
    runner.position.y = 0.86;
    pavilion.add(runner);

    // Table Legs
    for (let x of [-0.9, 0.9]) {
      for (let z of [-0.5, 0.5]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), woodMat);
        leg.position.set(x, 0.42, z);
        leg.castShadow = true;
        pavilion.add(leg);
      }
    }

    // Two Wooden Benches
    for (let z of [-0.95, 0.95]) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.45), woodMat);
      bench.position.set(0, 0.45, z);
      bench.castShadow = true;
      pavilion.add(bench);
      this.colliders.push(bench);

      for (let x of [-0.8, 0.8]) {
        const bLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8), woodMat);
        bLeg.position.set(x, 0.22, z);
        bLeg.castShadow = true;
        pavilion.add(bLeg);
      }
    }

    // Party Bunting / Lantern Posts
    for (let [px, pz] of [[-2.6, -2.2], [2.6, -2.2], [-2.6, 2.2], [2.6, 2.2]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4, 8), woodMat);
      post.position.set(px, 1.7, pz);
      post.castShadow = true;
      pavilion.add(post);

      const lantern = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.22),
        new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffaa00, emissiveIntensity: 0.6 })
      );
      lantern.position.set(px, 3.4, pz);
      pavilion.add(lantern);
    }

    // Golden Tiered Cake Stand
    const standMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 0.08, 24), standMat);
    standBase.position.y = 0.95;
    standBase.castShadow = true;
    pavilion.add(standBase);
    this.cakePlatter = standBase;

    this.buildPlatterSlots(standBase);

    // Group for the assembled Grand Celebration Cake
    this.grandCakeGroup = new THREE.Group();
    this.grandCakeGroup.position.set(0, 1.0, 0);
    this.grandCakeGroup.visible = false;
    pavilion.add(this.grandCakeGroup);
    this.buildGrandCelebrationCake();

    this.scene.add(pavilion);
    this.picnicTable = pavilion;
  }

  buildPlatterSlots(stand) {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const slotGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.02, 8, 1, false, angle, Math.PI / 3);
      const slotMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.25,
        wireframe: true
      });
      const slot = new THREE.Mesh(slotGeo, slotMat);
      slot.position.y = 0.05;
      stand.add(slot);
      this.platterSlices.push({ mesh: slot, filled: false });
    }
  }

  buildGrandCelebrationCake() {
    const cakeGroup = this.grandCakeGroup;

    // Bottom Tier
    const tier1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.58, 0.35, 24),
      new THREE.MeshStandardMaterial({ color: 0xffe0b2, roughness: 0.5 })
    );
    tier1.position.y = 0.18;
    tier1.castShadow = true;
    cakeGroup.add(tier1);

    // Tier 1 Frosting Drip
    const drip1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: 0xff4081, roughness: 0.3 })
    );
    drip1.position.y = 0.34;
    cakeGroup.add(drip1);

    // Middle Tier
    const tier2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.28, 24),
      new THREE.MeshStandardMaterial({ color: 0x90caf9, roughness: 0.5 })
    );
    tier2.position.y = 0.48;
    tier2.castShadow = true;
    cakeGroup.add(tier2);

    // Top Tier
    const tier3 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.22, 24),
      new THREE.MeshStandardMaterial({ color: 0xa5d6a7, roughness: 0.5 })
    );
    tier3.position.y = 0.72;
    tier3.castShadow = true;
    cakeGroup.add(tier3);

    // 6 Birthday Candles with glowing flames
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const cx = Math.cos(angle) * 0.16;
      const cz = Math.sin(angle) * 0.16;

      const candle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      candle.position.set(cx, 0.9, cz);
      cakeGroup.add(candle);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.08, 6),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
      );
      flame.position.set(cx, 1.04, cz);
      cakeGroup.add(flame);
      this.candles.push(flame);
    }
  }

  fillCakeSliceOnPlatter(index) {
    if (index >= 0 && index < this.platterSlices.length) {
      const slot = this.platterSlices[index];
      slot.filled = true;
      slot.mesh.material.opacity = 0.85;
      slot.mesh.material.wireframe = false;
      slot.mesh.material.color.setHex(0xffaa44);
    }
  }

  triggerGrandCakeAssembly() {
    this.grandCakeGroup.visible = true;
    this.platterSlices.forEach(s => s.mesh.visible = false);
    this.launchFireworks();
  }

  createSteppingStones() {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    const positions = [
      new THREE.Vector3(-10.5, 0.2, -10.0),
      new THREE.Vector3(-12.2, 0.1, -11.5),
      new THREE.Vector3(-14.0, 0.0, -12.8),
      new THREE.Vector3(-16.0, 0.1, -14.0)
    ];

    positions.forEach((pos, idx) => {
      const radius = idx === 3 ? 1.6 : 0.85;
      const geo = new THREE.CylinderGeometry(radius, radius * 1.15, 0.5, 12);
      const stone = new THREE.Mesh(geo, stoneMat);
      stone.position.copy(pos);
      stone.receiveShadow = true;
      stone.castShadow = true;
      this.scene.add(stone);
      this.colliders.push(stone);

      const mossGeo = new THREE.CylinderGeometry(radius * 0.95, radius * 0.95, 0.05, 12);
      const mossMat = new THREE.MeshStandardMaterial({ color: 0x558b2f, roughness: 0.8 });
      const moss = new THREE.Mesh(mossGeo, mossMat);
      moss.position.set(pos.x, pos.y + 0.26, pos.z);
      this.scene.add(moss);
    });
  }

  createBounceMushrooms() {
    const padConfigs = [
      { pos: new THREE.Vector3(12.0, 0.2, 8.5), capColor: 0xe63946, stemColor: 0xf1faee },
      { pos: new THREE.Vector3(-8.5, 0.2, 11.5), capColor: 0x9b5de5, stemColor: 0xf1faee },
      { pos: new THREE.Vector3(3.5, 0.2, -14.0), capColor: 0x00bbf9, stemColor: 0xf1faee }
    ];

    padConfigs.forEach(cfg => {
      const padGroup = new THREE.Group();
      padGroup.position.copy(cfg.pos);

      const stemGeo = new THREE.CylinderGeometry(0.35, 0.55, 1.0, 10);
      const stemMat = new THREE.MeshStandardMaterial({ color: cfg.stemColor, roughness: 0.7 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.5;
      stem.castShadow = true;
      padGroup.add(stem);

      const capGeo = new THREE.SphereGeometry(1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const capMat = new THREE.MeshStandardMaterial({
        color: cfg.capColor,
        roughness: 0.35,
        metalness: 0.1
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.9;
      cap.castShadow = true;
      padGroup.add(cap);

      for (let i = 0; i < 6; i++) {
        const dotGeo = new THREE.CircleGeometry(0.18, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        const a = (i / 6) * Math.PI * 2;
        dot.position.set(Math.cos(a) * 0.75, 1.45, Math.sin(a) * 0.75);
        dot.rotation.x = -Math.PI / 3;
        dot.rotation.y = a;
        padGroup.add(dot);
      }

      padGroup.userData = {
        cap: cap,
        squishTime: 0
      };

      padGroup.triggerBounceAnimation = () => {
        padGroup.userData.squishTime = 0.5;
      };

      this.scene.add(padGroup);
      this.bouncePads.push(padGroup);
      this.colliders.push(stem);
    });
  }

  createSpeedBoosters() {
    const positions = [
      new THREE.Vector3(-4.0, 0.4, 5.0),
      new THREE.Vector3(7.5, 0.4, -4.5),
      new THREE.Vector3(-6.5, 0.4, -6.0)
    ];

    positions.forEach(pos => {
      const ringGroup = new THREE.Group();
      ringGroup.position.copy(pos);

      const ringGeo = new THREE.TorusGeometry(0.9, 0.08, 8, 24);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xffd166,
        emissive: 0xff9900,
        emissiveIntensity: 0.8,
        roughness: 0.2
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ringGroup.add(ring);

      const particlesGeo = new THREE.OctahedronGeometry(0.08);
      const particlesMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const innerP = new THREE.Mesh(particlesGeo, particlesMat);
      ringGroup.add(innerP);

      ringGroup.userData = { ring, innerP, pulse: 0 };
      ringGroup.triggerEffect = () => {
        ringGroup.userData.pulse = 1.0;
      };

      this.scene.add(ringGroup);
      this.speedBoosters.push(ringGroup);
    });
  }

  launchFireworks() {
    const colors = [0xff0055, 0x00ffcc, 0xffcc00, 0x9900ff, 0x00aaff, 0xff6600];
    for (let f = 0; f < 8; f++) {
      setTimeout(() => {
        const origin = new THREE.Vector3(
          (Math.random() - 0.5) * 16,
          12 + Math.random() * 8,
          (Math.random() - 0.5) * 16
        );
        const group = new THREE.Group();
        group.position.copy(origin);
        const color = colors[Math.floor(Math.random() * colors.length)];
        const pGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        const pMat = new THREE.MeshBasicMaterial({ color: color });
        const particles = [];

        for (let i = 0; i < 40; i++) {
          const mesh = new THREE.Mesh(pGeo, pMat);
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const speed = 4.0 + Math.random() * 6.0;
          const vel = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.cos(phi) * speed,
            Math.sin(phi) * Math.sin(theta) * speed
          );
          group.add(mesh);
          particles.push({ mesh, vel });
        }

        this.scene.add(group);
        this.fireworks.push({ group, particles, age: 0, maxAge: 2.0 });
      }, f * 400);
    }
  }

  update(delta) {
    const time = performance.now() * 0.001;

    // 1. Water waves animation
    if (this.waterMesh && this.waterBaseY) {
      const pos = this.waterMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getZ(i);
        const wave = Math.sin(u * 0.15 + time * 1.8) * Math.cos(v * 0.15 + time * 1.5) * 0.25;
        pos.setY(i, this.waterBaseY[i] + wave);
      }
      pos.needsUpdate = true;
    }

    // 2. Slow drifting clouds
    this.clouds.forEach(cloud => {
      cloud.position.x += cloud.userData.speed * delta;
      if (cloud.position.x > 80) cloud.position.x = -80;
    });

    // 3. Dandelion pollen particles
    if (this.dandelionPoints) {
      const pos = this.dandelionPoints.geometry.attributes.position;
      const vels = this.dandelionPoints.userData.velocities;
      for (let i = 0; i < vels.length; i++) {
        let x = pos.getX(i) + vels[i].x * delta;
        let y = pos.getY(i) + Math.sin(time * 2 + i) * 0.005;
        let z = pos.getZ(i) + vels[i].z * delta;

        if (x > 25) x = -25;
        if (z > 25) z = -25;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // 4. Bounce Pad squish animation
    this.bouncePads.forEach(pad => {
      if (pad.userData.squishTime > 0) {
        pad.userData.squishTime -= delta;
        const s = Math.sin((0.5 - pad.userData.squishTime) * Math.PI * 4);
        pad.userData.cap.scale.set(1 + s * 0.25, 1 - s * 0.35, 1 + s * 0.25);
      } else {
        pad.userData.cap.scale.set(1, 1, 1);
      }
    });

    // 5. Speed Booster rings rotation
    this.speedBoosters.forEach(booster => {
      booster.userData.ring.rotation.z += delta * 2.0;
      booster.userData.innerP.rotation.x += delta * 3.0;
      booster.userData.innerP.rotation.y += delta * 3.0;

      if (booster.userData.pulse > 0) {
        booster.userData.pulse -= delta * 2;
        const scale = 1 + booster.userData.pulse * 0.8;
        booster.userData.ring.scale.set(scale, scale, scale);
      } else {
        booster.userData.ring.scale.set(1, 1, 1);
      }
    });

    // 6. Candle flame flicker
    if (this.candles.length > 0) {
      this.candles.forEach((flame, idx) => {
        const flick = 0.85 + Math.sin(time * 15 + idx * 2) * 0.25;
        flame.scale.set(flick, flick * 1.1, flick);
      });
    }

    // 7. Active Fireworks update
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i];
      fw.age += delta;
      if (fw.age > fw.maxAge) {
        this.scene.remove(fw.group);
        this.fireworks.splice(i, 1);
      } else {
        const progress = fw.age / fw.maxAge;
        fw.particles.forEach(p => {
          p.mesh.position.addScaledVector(p.vel, delta);
          p.vel.y -= delta * 7;
          p.mesh.scale.setScalar(Math.max(0.01, 1 - progress));
        });
      }
    }
  }
}
