import * as THREE from 'three';
import { sound } from './sound.js';

export const CAKE_DATA = [
  {
    id: 'strawberry',
    name: 'Ruby Strawberry Shortcake',
    flavor: 'Sweet summer strawberries with whipped vanilla cream.',
    color: 0xff4b72,
    creamColor: 0xfff8f0,
    spongeColor: 0xffe4b5,
    beaconColor: 0xff4b72,
    position: new THREE.Vector3(12.5, 0.6, -11.0),
    clue: 'Perched in the scenic flower meadow overlooking the azure sea.'
  },
  {
    id: 'chocolate',
    name: 'Midnight Chocolate Fudge',
    flavor: 'Decadent dark cocoa with silky caramel fudge swirls.',
    color: 0x4a2c11,
    creamColor: 0x8b5a2b,
    spongeColor: 0x3d2314,
    beaconColor: 0xd48834,
    position: new THREE.Vector3(-14.2, 0.4, 9.8),
    clue: 'Hidden deep inside the shaded rocky cove behind ancient stones.'
  },
  {
    id: 'matcha',
    name: 'Zen Matcha Mountain Roll',
    flavor: 'Finely ground green tea with gentle sweet red-bean cream.',
    color: 0x5e8b41,
    creamColor: 0xe8f5d0,
    spongeColor: 0x7da453,
    beaconColor: 0x52b788,
    position: new THREE.Vector3(14.8, 5.8, 12.2),
    clue: 'High on the elevated forest plateau—use a bouncy mushroom to spring up!'
  },
  {
    id: 'rainbow',
    name: 'Starlight Rainbow Tier',
    flavor: 'Sparkling sugar crystals with magical citrus layers.',
    color: 0xff6b8b,
    creamColor: 0xfff0f5,
    spongeColor: 0x68d8d6,
    beaconColor: 0xff66cc,
    position: new THREE.Vector3(-0.5, 1.8, -17.5),
    clue: 'Gleaming proudly on the edge of the northern cliffs towards the horizon.'
  },
  {
    id: 'blueberry',
    name: 'Glacier Blueberry Cheesecake',
    flavor: 'Graham cracker crust with wild mountain blueberry compote.',
    color: 0x4b3f72,
    creamColor: 0xe0c3fc,
    spongeColor: 0xd4a373,
    beaconColor: 0x7209b7,
    position: new THREE.Vector3(-16.0, 0.2, -14.0),
    clue: 'Resting on a floating stepping stone just beyond the western coast.'
  },
  {
    id: 'golden',
    name: 'Golden Royal Crown Cake',
    flavor: 'Gilded honey sponge infused with caramelized golden nectar.',
    color: 0xf9c846,
    creamColor: 0xfffbe0,
    spongeColor: 0xf39c12,
    beaconColor: 0xffd700,
    position: new THREE.Vector3(0.0, 0.8, 16.5),
    clue: 'Guarded atop the ancient sundial pedestal on the southern meadow.'
  }
];

export class CollectiblesManager {
  constructor(scene) {
    this.scene = scene;
    this.cakes = [];
    this.collectedCount = 0;
    this.totalCount = CAKE_DATA.length;
    this.onCollectedCallback = null;
    this.allCollectedCallback = null;
    this.activeSparkleBursts = [];

    this.createCakeMeshes();
  }

  createCakeMeshes() {
    CAKE_DATA.forEach((data, index) => {
      const group = new THREE.Group();
      group.position.copy(data.position);
      group.userData = {
        id: data.id,
        index: index,
        name: data.name,
        flavor: data.flavor,
        clue: data.clue,
        baseY: data.position.y,
        collected: false
      };

      // 1. Triangular Cake Slice Geometry
      const cakeSlice = this.buildCakeSliceModel(data);
      cakeSlice.scale.set(1.4, 1.4, 1.4);
      group.add(cakeSlice);
      group.userData.mesh = cakeSlice;

      // 2. Beacon of Light (shoots up into the sky so players can locate it)
      const beacon = this.buildBeacon(data.beaconColor);
      group.add(beacon);
      group.userData.beacon = beacon;

      // 3. Floating Sparkle Particles around the cake
      const sparkles = this.buildSparkles(data.beaconColor);
      group.add(sparkles);
      group.userData.sparkles = sparkles;

      // 4. Floating mini star on top
      const star = this.buildStar(data.beaconColor);
      star.position.y = 1.35;
      group.add(star);
      group.userData.star = star;

      this.scene.add(group);
      this.cakes.push(group);
    });
  }

  buildCakeSliceModel(data) {
    const cakeGroup = new THREE.Group();

    // Create cake wedge using CylinderGeometry with arc
    const radius = 0.55;
    const height = 0.42;
    const segments = 12;
    const thetaStart = 0;
    const thetaLength = Math.PI * 0.35; // ~63 degree wedge

    // Base sponge cake
    const spongeGeo = new THREE.CylinderGeometry(radius, radius, height * 0.5, segments, 1, false, thetaStart, thetaLength);
    const spongeMat = new THREE.MeshStandardMaterial({
      color: data.spongeColor,
      roughness: 0.85,
      metalness: 0.05
    });
    const spongeMesh = new THREE.Mesh(spongeGeo, spongeMat);
    spongeMesh.position.y = height * 0.25;
    spongeMesh.castShadow = true;
    cakeGroup.add(spongeMesh);

    // Cream filling layer
    const creamGeo = new THREE.CylinderGeometry(radius * 1.01, radius * 1.01, height * 0.18, segments, 1, false, thetaStart, thetaLength);
    const creamMat = new THREE.MeshStandardMaterial({
      color: data.creamColor,
      roughness: 0.35,
      metalness: 0.1
    });
    const creamMesh = new THREE.Mesh(creamGeo, creamMat);
    creamMesh.position.y = height * 0.55;
    cakeGroup.add(creamMesh);

    // Top flavored frosting layer
    const topGeo = new THREE.CylinderGeometry(radius, radius, height * 0.32, segments, 1, false, thetaStart, thetaLength);
    const topMat = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.45,
      metalness: 0.15
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = height * 0.8;
    topMesh.castShadow = true;
    cakeGroup.add(topMesh);

    // Delicious Topping based on flavor
    if (data.id === 'strawberry') {
      // 3D Red Strawberry
      const berryGeo = new THREE.ConeGeometry(0.12, 0.22, 8);
      const berryMat = new THREE.MeshStandardMaterial({ color: 0xee1133, roughness: 0.3 });
      const berry = new THREE.Mesh(berryGeo, berryMat);
      berry.rotation.x = Math.PI;
      berry.position.set(radius * 0.5, height + 0.1, radius * 0.25);
      cakeGroup.add(berry);

      // Tiny green leaf
      const leafGeo = new THREE.SphereGeometry(0.06, 6, 4);
      leafGeo.scale(1.5, 0.2, 1.0);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x33aa22 });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(radius * 0.5, height + 0.21, radius * 0.25);
      cakeGroup.add(leaf);
    } else if (data.id === 'golden') {
      // Golden Crown
      const crownGeo = new THREE.CylinderGeometry(0.14, 0.1, 0.15, 6);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(radius * 0.5, height + 0.12, radius * 0.25);
      cakeGroup.add(crown);
    } else if (data.id === 'chocolate') {
      // Chocolate shavings / curls
      for (let i = 0; i < 3; i++) {
        const curlGeo = new THREE.TorusGeometry(0.06, 0.02, 6, 8, Math.PI * 1.5);
        const curlMat = new THREE.MeshStandardMaterial({ color: 0x221105, roughness: 0.3 });
        const curl = new THREE.Mesh(curlGeo, curlMat);
        curl.position.set(radius * 0.4 + i * 0.08, height + 0.05, radius * 0.2 + (i % 2) * 0.08);
        curl.rotation.x = Math.random() * Math.PI;
        cakeGroup.add(curl);
      }
    } else {
      // Sweet sugar gem / berry
      const gemGeo = new THREE.DodecahedronGeometry(0.09);
      const gemMat = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.2, metalness: 0.4 });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set(radius * 0.5, height + 0.08, radius * 0.25);
      cakeGroup.add(gem);
    }

    return cakeGroup;
  }

  buildBeacon(color) {
    const height = 45;
    const geometry = new THREE.CylinderGeometry(0.12, 0.65, height, 16, 1, true);
    geometry.translate(0, height / 2, 0);

    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Mesh(geometry, material);
  }

  buildSparkles(color) {
    const count = 18;
    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const mat = new THREE.MeshBasicMaterial({ color: color, wireframe: false });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / count) * Math.PI * 2;
      const dist = 0.6 + Math.random() * 0.4;
      mesh.position.set(
        Math.cos(angle) * dist,
        Math.random() * 1.5,
        Math.sin(angle) * dist
      );
      mesh.userData = {
        speed: 1.0 + Math.random() * 1.5,
        radius: dist,
        angle: angle,
        yStart: mesh.position.y
      };
      group.add(mesh);
    }
    return group;
  }

  buildStar(color) {
    const starGeo = new THREE.OctahedronGeometry(0.18, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: color,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });
    return new THREE.Mesh(starGeo, starMat);
  }

  update(delta, playerPosition) {
    const time = performance.now() * 0.001;

    // Animate cakes
    this.cakes.forEach((cake) => {
      if (cake.userData.collected) return;

      // Bobbing & Rotation
      cake.position.y = cake.userData.baseY + Math.sin(time * 2.5 + cake.userData.index) * 0.2;
      if (cake.userData.mesh) {
        cake.userData.mesh.rotation.y += delta * 1.6;
      }
      if (cake.userData.star) {
        cake.userData.star.rotation.y -= delta * 2.2;
        cake.userData.star.rotation.z += delta * 1.2;
      }

      // Sparkles orbit
      if (cake.userData.sparkles) {
        cake.userData.sparkles.children.forEach(spark => {
          spark.userData.angle += delta * spark.userData.speed;
          spark.position.x = Math.cos(spark.userData.angle) * spark.userData.radius;
          spark.position.z = Math.sin(spark.userData.angle) * spark.userData.radius;
          spark.position.y = (spark.position.y + delta * 0.4) % 1.6;
          spark.rotation.x += delta * 2;
          spark.rotation.y += delta * 2;
        });
      }

      // Proximity check with player
      if (playerPosition) {
        const dx = playerPosition.x - cake.position.x;
        const dy = playerPosition.y - cake.position.y;
        const dz = playerPosition.z - cake.position.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        // Pickup threshold: 2.1 meters
        if (distSq < 4.41) {
          this.collectCake(cake);
        }
      }
    });

    // Update active sparkle bursts
    for (let i = this.activeSparkleBursts.length - 1; i >= 0; i--) {
      const burst = this.activeSparkleBursts[i];
      burst.age += delta;
      if (burst.age > burst.maxAge) {
        this.scene.remove(burst.group);
        this.activeSparkleBursts.splice(i, 1);
      } else {
        const progress = burst.age / burst.maxAge;
        burst.particles.forEach(p => {
          p.mesh.position.addScaledVector(p.velocity, delta);
          p.velocity.y -= delta * 8; // gravity
          p.mesh.scale.setScalar(Math.max(0.01, 1 - progress));
        });
      }
    }
  }

  collectCake(cake) {
    if (cake.userData.collected) return;
    cake.userData.collected = true;
    this.collectedCount++;

    // Audio chime
    sound.playPickupCake(cake.userData.index);

    // Particle Burst explosion
    this.createBurstEffect(cake.position, cake.userData.index);

    // Hide cake mesh and beacon smoothly
    if (cake.userData.mesh) cake.userData.mesh.visible = false;
    if (cake.userData.beacon) cake.userData.beacon.visible = false;
    if (cake.userData.sparkles) cake.userData.sparkles.visible = false;
    if (cake.userData.star) cake.userData.star.visible = false;

    // Trigger UI updates
    if (this.onCollectedCallback) {
      this.onCollectedCallback({
        id: cake.userData.id,
        index: cake.userData.index,
        name: cake.userData.name,
        flavor: cake.userData.flavor,
        count: this.collectedCount,
        total: this.totalCount
      });
    }

    if (this.collectedCount >= this.totalCount) {
      if (this.allCollectedCallback) {
        this.allCollectedCallback();
      }
    }
  }

  createBurstEffect(position, index) {
    const burstGroup = new THREE.Group();
    burstGroup.position.copy(position);
    const particles = [];
    const color = CAKE_DATA[index].beaconColor;
    const pGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const pMat = new THREE.MeshBasicMaterial({ color: color });

    for (let i = 0; i < 28; i++) {
      const pMesh = new THREE.Mesh(pGeo, pMat);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2.5 + Math.random() * 4.5;
      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 3.0,
        Math.sin(phi) * Math.sin(theta) * speed
      );
      burstGroup.add(pMesh);
      particles.push({ mesh: pMesh, velocity: velocity });
    }

    this.scene.add(burstGroup);
    this.activeSparkleBursts.push({
      group: burstGroup,
      particles: particles,
      age: 0,
      maxAge: 1.2
    });
  }

  getClosestCake(playerPosition) {
    let closest = null;
    let minDistSq = Infinity;

    this.cakes.forEach((cake) => {
      if (cake.userData.collected) return;
      const distSq = playerPosition.distanceToSquared(cake.position);
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = {
          data: cake.userData,
          position: cake.position,
          distance: Math.sqrt(distSq)
        };
      }
    });

    return closest;
  }
}
