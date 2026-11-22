import * as THREE from 'three';
import { sound } from './sound.js';

export class Player {
  constructor(scene) {
    this.scene = scene;

    // Movement & Physics parameters
    this.walkSpeed = 6.2;
    this.sprintSpeed = 9.8;
    this.boostMultiplier = 1.6;
    this.jumpForce = 11.2;
    this.bounceForce = 21.5;
    this.gravity = -26.0;

    // Spawn safely on the meadow clearing in front of the pavilion
    this.position = new THREE.Vector3(0, 1.2, 4.0);
    this.spawnPoint = new THREE.Vector3(0, 1.2, 4.0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.isGrounded = false;
    this.coyoteTimer = 0;
    this.speedBoostTimer = 0;
    this.stepDistanceCounter = 0;

    // Mesh container
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Procedural Rig parts
    this.parts = {};
    this.buildCharacterModel();

    // Raycaster for ground detection
    this.raycaster = new THREE.Raycaster();
    this.downVector = new THREE.Vector3(0, -1, 0);

    // Pastel sparkle/crumb particles
    this.dustParticles = [];
    this.createDustPool();

    // Animation cycle
    this.animCycle = 0;
  }

  buildCharacterModel() {
    const p = this.parts;

    p.root = new THREE.Group();
    this.mesh.add(p.root);

    // Materials: light skin tone, casual jersey & denim
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfba, roughness: 0.55 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x241c1a, roughness: 0.65 });
    const jerseyMat = new THREE.MeshStandardMaterial({ color: 0xfff5e4, roughness: 0.7 });   // Cream casual jersey
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x5c6b73, roughness: 0.6 });   // Jersey accent stripe
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x8bb4de, roughness: 0.75 });   // Light blue denim jeans
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x3b2c2a, roughness: 0.6 });

    // 1. Torso (Casual Jersey)
    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.29, 0.65, 12);
    p.body = new THREE.Mesh(bodyGeo, jerseyMat);
    p.body.position.y = 0.75;
    p.body.castShadow = true;
    p.root.add(p.body);

    // Jersey Collar & Chest Detail
    const collarGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 16);
    const collar = new THREE.Mesh(collarGeo, stripeMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.32;
    p.body.add(collar);

    const chestStripeGeo = new THREE.CylinderGeometry(0.324, 0.312, 0.14, 12, 1, false, -Math.PI * 0.32, Math.PI * 0.64);
    const chestStripe = new THREE.Mesh(chestStripeGeo, stripeMat);
    chestStripe.position.y = 0.08;
    p.body.add(chestStripe);

    // 2. Head & Wavy Hair (No Hat)
    p.headPivot = new THREE.Group();
    p.headPivot.position.y = 0.42;
    p.body.add(p.headPivot);

    const headGeo = new THREE.SphereGeometry(0.31, 16, 14);
    p.head = new THREE.Mesh(headGeo, skinMat);
    p.head.position.y = 0.28;
    p.head.castShadow = true;
    p.headPivot.add(p.head);

    // Wavy Shoulder-Length Hair
    const hairCapGeo = new THREE.SphereGeometry(0.335, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.62);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.rotation.x = -0.2;
    hairCap.position.set(0, 0.02, -0.02);
    p.head.add(hairCap);

    // Side & Back Wavy Hair Locks
    const lockPositions = [
      [-0.27, -0.08, -0.05, 0.13],
      [0.27, -0.08, -0.05, 0.13],
      [-0.24, -0.24, -0.1, 0.14],
      [0.24, -0.24, -0.1, 0.14],
      [-0.14, -0.26, -0.24, 0.15],
      [0.14, -0.26, -0.24, 0.15],
      [0.0, -0.26, -0.27, 0.16],
      [-0.22, 0.14, 0.14, 0.11], // Front bangs wave left
      [0.22, 0.14, 0.14, 0.11]   // Front bangs wave right
    ];

    lockPositions.forEach(([lx, ly, lz, radius]) => {
      const lock = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 10), hairMat);
      lock.position.set(lx, ly, lz);
      lock.castShadow = true;
      p.head.add(lock);
    });

    // Big Expressive Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2b1d19 });
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeGeo = new THREE.SphereGeometry(0.05, 10, 10);
    const shineGeo = new THREE.SphereGeometry(0.018, 6, 6);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.11, 0.04, 0.275);
    const leftShine = new THREE.Mesh(shineGeo, shineMat);
    leftShine.position.set(-0.095, 0.055, 0.315);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.11, 0.04, 0.275);
    const rightShine = new THREE.Mesh(shineGeo, shineMat);
    rightShine.position.set(0.125, 0.055, 0.315);

    p.head.add(leftEye, leftShine, rightEye, rightShine);

    // Rosy Cheeks
    const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff8fa3 });
    const cheekGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.scale.set(1.2, 0.8, 0.5);
    leftCheek.position.set(-0.18, -0.04, 0.25);

    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.scale.set(1.2, 0.8, 0.5);
    rightCheek.position.set(0.18, -0.04, 0.25);
    p.head.add(leftCheek, rightCheek);

    // Cute Smile
    const smileGeo = new THREE.TorusGeometry(0.055, 0.012, 6, 12, Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x8a3b3b });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.05, 0.295);
    p.head.add(smile);

    // 3. Arms (Short Jersey Sleeves + Bare Forearms + Hands)
    const sleeveGeo = new THREE.CylinderGeometry(0.09, 0.085, 0.16, 10);
    sleeveGeo.translate(0, -0.06, 0);
    const forearmGeo = new THREE.CylinderGeometry(0.075, 0.068, 0.24, 10);
    forearmGeo.translate(0, -0.24, 0);
    const handGeo = new THREE.SphereGeometry(0.07, 10, 10);

    // Left Arm (Swings naturally)
    p.leftArm = new THREE.Group();
    p.leftArm.position.set(-0.38, 0.22, 0);
    const lSleeve = new THREE.Mesh(sleeveGeo, jerseyMat);
    lSleeve.castShadow = true;
    const lForearm = new THREE.Mesh(forearmGeo, skinMat);
    lForearm.castShadow = true;
    const lHand = new THREE.Mesh(handGeo, skinMat);
    lHand.position.y = -0.38;
    p.leftArm.add(lSleeve, lForearm, lHand);
    p.body.add(p.leftArm);

    // Right Arm (Holds the Rainbow Cake Slice)
    p.rightArm = new THREE.Group();
    p.rightArm.position.set(0.38, 0.22, 0);
    const rSleeve = new THREE.Mesh(sleeveGeo, jerseyMat);
    rSleeve.castShadow = true;
    const rForearm = new THREE.Mesh(forearmGeo, skinMat);
    rForearm.castShadow = true;
    const rHand = new THREE.Mesh(handGeo, skinMat);
    rHand.position.y = -0.38;
    p.rightArm.add(rSleeve, rForearm, rHand);
    p.body.add(p.rightArm);

    // 4. Rainbow Cake Slice on Plate (Held in Right Hand)
    p.cakeProp = this.createRainbowCakeProp();
    p.cakeProp.position.set(-0.12, -0.38, 0.22);
    p.rightArm.add(p.cakeProp);

    // 5. Legs (Light Blue Denim Jeans + Dark Shoes)
    const legGeo = new THREE.CylinderGeometry(0.115, 0.11, 0.46, 10);
    legGeo.translate(0, -0.2, 0);

    p.leftLeg = new THREE.Group();
    p.leftLeg.position.set(-0.16, 0.45, 0);
    const lLegMesh = new THREE.Mesh(legGeo, pantsMat);
    lLegMesh.castShadow = true;
    p.leftLeg.add(lLegMesh);

    const shoeGeo = new THREE.BoxGeometry(0.18, 0.12, 0.24);
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
    lShoe.position.set(0, -0.41, 0.04);
    lShoe.castShadow = true;
    p.leftLeg.add(lShoe);
    p.root.add(p.leftLeg);

    p.rightLeg = new THREE.Group();
    p.rightLeg.position.set(0.16, 0.45, 0);
    const rLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rLegMesh.castShadow = true;
    p.rightLeg.add(rLegMesh);

    const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rShoe.position.set(0, -0.41, 0.04);
    rShoe.castShadow = true;
    p.rightLeg.add(rShoe);
    p.root.add(p.rightLeg);

    // Shadow blob
    const shadowGeo = new THREE.CircleGeometry(0.48, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.02;
    this.mesh.add(this.shadow);
  }

  createRainbowCakeProp() {
    const cakeGroup = new THREE.Group();

    // White Plate
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.025, 16), plateMat);
    cakeGroup.add(plate);

    // Rainbow Sponge Layers (Wedge Slice)
    const rainbowColors = [0xb388eb, 0x8093f1, 0x72efdd, 0xffe66d, 0xffad69, 0xff758f];
    const layerHeight = 0.032;
    const wedgeAngle = Math.PI / 3.2;

    rainbowColors.forEach((hex, idx) => {
      const layerGeo = new THREE.CylinderGeometry(0.19, 0.19, layerHeight, 8, 1, false, -wedgeAngle / 2, wedgeAngle);
      const layerMat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6 });
      const layerMesh = new THREE.Mesh(layerGeo, layerMat);
      layerMesh.position.set(0, 0.025 + idx * layerHeight, -0.06);
      cakeGroup.add(layerMesh);
    });

    // Top White Frosting Layer
    const topY = 0.025 + rainbowColors.length * layerHeight;
    const frostingGeo = new THREE.CylinderGeometry(0.195, 0.195, 0.025, 8, 1, false, -wedgeAngle / 2, wedgeAngle);
    const frostingMat = new THREE.MeshStandardMaterial({ color: 0xfff5f8, roughness: 0.3 });
    const frosting = new THREE.Mesh(frostingGeo, frostingMat);
    frosting.position.set(0, topY, -0.06);
    cakeGroup.add(frosting);

    // Cherry on Top
    const cherryMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.2 });
    const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), cherryMat);
    cherry.position.set(0, topY + 0.035, 0.04);
    cakeGroup.add(cherry);

    return cakeGroup;
  }

  createDustPool() {
    const geo = new THREE.SphereGeometry(0.08, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffd6e0,
      transparent: true,
      opacity: 0.7
    });

    for (let i = 0; i < 15; i++) {
      const p = new THREE.Mesh(geo, mat.clone());
      p.visible = false;
      this.scene.add(p);
      this.dustParticles.push({
        mesh: p,
        alive: false,
        life: 0,
        maxLife: 0.4,
        vel: new THREE.Vector3()
      });
    }
  }

  spawnDust(pos) {
    const p = this.dustParticles.find(d => !d.alive);
    if (!p) return;
    p.alive = true;
    p.life = 0;
    p.mesh.visible = true;
    p.mesh.position.copy(pos);
    p.mesh.position.y += 0.05;
    p.mesh.scale.setScalar(0.6 + Math.random() * 0.4);
    p.vel.set(
      (Math.random() - 0.5) * 0.8,
      0.3 + Math.random() * 0.5,
      (Math.random() - 0.5) * 0.8
    );
  }

  update(delta, input, cameraManager, colliders, bouncePads, speedBoosters) {
    if (delta > 0.1) delta = 0.1;

    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= delta;
    }

    let currentSpeed = input.sprintPressed ? this.sprintSpeed : this.walkSpeed;
    if (this.speedBoostTimer > 0) {
      currentSpeed *= this.boostMultiplier;
    }

    const moveInput = input.moveVector;
    const isMoving = Math.hypot(moveInput.x, moveInput.z) > 0.1;

    let targetVelocityX = 0;
    let targetVelocityZ = 0;

    if (isMoving) {
      const camForward = cameraManager.getForwardVector();
      const camRight = cameraManager.getRightVector();

      const moveDir = new THREE.Vector3()
        .addScaledVector(camRight, moveInput.x)
        .addScaledVector(camForward, -moveInput.z)
        .normalize();

      targetVelocityX = moveDir.x * currentSpeed;
      targetVelocityZ = moveDir.z * currentSpeed;

      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      const curAngle = this.parts.root.rotation.y;
      let diff = targetAngle - curAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.parts.root.rotation.y += diff * Math.min(1.0, delta * 14);
    }

    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelocityX, Math.min(1.0, delta * 12));
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelocityZ, Math.min(1.0, delta * 12));

    if (this.isGrounded) {
      this.coyoteTimer = 0.14;
    } else {
      this.coyoteTimer -= delta;
    }

    if (input.consumeJump() && this.coyoteTimer > 0) {
      this.velocity.y = this.jumpForce;
      this.coyoteTimer = 0;
      this.isGrounded = false;
      sound.playJump();
      this.spawnDust(this.position);
    }

    this.velocity.y += this.gravity * delta;

    const nextPos = this.position.clone().addScaledVector(this.velocity, delta);

    this.handleCollisions(nextPos, colliders);
    this.checkBouncePads(bouncePads);
    this.checkSpeedBoosters(speedBoosters);
    this.animate(delta, isMoving, currentSpeed);

    // Fall into water threshold (ocean surface is at -4.5)
    if (this.position.y < -5.0) {
      this.respawn();
    }

    this.updateDust(delta);
  }

  handleCollisions(nextPos, colliders) {
    const rayOrigin = new THREE.Vector3(nextPos.x, nextPos.y + 1.2, nextPos.z);
    this.raycaster.set(rayOrigin, this.downVector);
    this.raycaster.far = 4.0;

    let groundY = -999;

    if (colliders && colliders.length > 0) {
      const hits = this.raycaster.intersectObjects(colliders, true);
      if (hits.length > 0) {
        for (let hit of hits) {
          if (hit.point.y <= rayOrigin.y + 0.1) {
            groundY = hit.point.y;
            break;
          }
        }
      }
    }

    const playerFootOffset = 0.05;
    const isAboveGround = nextPos.y >= groundY + playerFootOffset;

    if (groundY > -500 && !isAboveGround) {
      if (!this.isGrounded && this.velocity.y < -4.0) {
        sound.playLand();
        this.spawnDust(nextPos);
      }
      nextPos.y = groundY + playerFootOffset;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    this.position.copy(nextPos);
    this.mesh.position.copy(this.position);

    if (groundY > -500) {
      const heightAbove = this.position.y - groundY;
      this.shadow.position.y = -heightAbove + 0.02;
      this.shadow.material.opacity = Math.max(0.05, 0.45 - heightAbove * 0.1);
      const scale = Math.max(0.5, 1.0 - heightAbove * 0.08);
      this.shadow.scale.set(scale, scale, scale);
    }
  }

  checkBouncePads(bouncePads) {
    if (!bouncePads || bouncePads.length === 0) return;
    bouncePads.forEach(pad => {
      const dx = this.position.x - pad.position.x;
      const dz = this.position.z - pad.position.z;
      const dist = Math.hypot(dx, dz);
      const dy = this.position.y - pad.position.y;

      if (dist < 1.4 && dy >= -0.2 && dy <= 1.5) {
        this.velocity.y = this.bounceForce;
        this.isGrounded = false;
        this.coyoteTimer = 0;
        sound.playBounce();
        this.spawnDust(this.position);
        pad.triggerBounceAnimation();
      }
    });
  }

  checkSpeedBoosters(speedBoosters) {
    if (!speedBoosters || speedBoosters.length === 0) return;
    speedBoosters.forEach(booster => {
      const dist = this.position.distanceTo(booster.position);
      if (dist < 2.0 && this.speedBoostTimer <= 0.2) {
        this.speedBoostTimer = 4.2;
        sound.playSpeedBoost();
        booster.triggerEffect();
      }
    });
  }

  animate(delta, isMoving, currentSpeed) {
    const p = this.parts;

    if (this.isGrounded && isMoving) {
      const speedFactor = currentSpeed / this.walkSpeed;
      this.animCycle += delta * 12.0 * speedFactor;

      const swing = Math.sin(this.animCycle) * 0.65;
      p.leftLeg.rotation.x = swing;
      p.rightLeg.rotation.x = -swing;

      // Left arm swings, right arm stays raised to balance the cake plate
      p.leftArm.rotation.x = -swing * 0.85;
      p.rightArm.rotation.x = -0.85 + Math.sin(this.animCycle * 2) * 0.06;
      p.cakeProp.rotation.x = 0.85;

      p.body.position.y = 0.75 + Math.abs(Math.sin(this.animCycle)) * 0.08;
      p.headPivot.rotation.z = Math.sin(this.animCycle * 0.5) * 0.08;

      this.stepDistanceCounter += delta * currentSpeed;
      if (this.stepDistanceCounter > 2.0) {
        sound.playStep();
        this.spawnDust(this.position);
        this.stepDistanceCounter = 0;
      }
    } else if (!this.isGrounded) {
      p.leftArm.rotation.x = THREE.MathUtils.lerp(p.leftArm.rotation.x, -2.4, delta * 12);
      p.rightArm.rotation.x = THREE.MathUtils.lerp(p.rightArm.rotation.x, -1.1, delta * 12);
      p.cakeProp.rotation.x = THREE.MathUtils.lerp(p.cakeProp.rotation.x, 1.1, delta * 12);
      p.leftLeg.rotation.x = THREE.MathUtils.lerp(p.leftLeg.rotation.x, 0.4, delta * 10);
      p.rightLeg.rotation.x = THREE.MathUtils.lerp(p.rightLeg.rotation.x, -0.3, delta * 10);
      p.body.position.y = THREE.MathUtils.lerp(p.body.position.y, 0.8, delta * 10);
    } else {
      this.animCycle += delta * 2.5;
      const bob = Math.sin(this.animCycle) * 0.03;
      p.body.position.y = 0.75 + bob;
      p.headPivot.rotation.y = Math.sin(this.animCycle * 0.5) * 0.1;
      p.headPivot.rotation.x = Math.sin(this.animCycle * 0.7) * 0.04;
      p.leftLeg.rotation.x = THREE.MathUtils.lerp(p.leftLeg.rotation.x, 0, delta * 10);
      p.rightLeg.rotation.x = THREE.MathUtils.lerp(p.rightLeg.rotation.x, 0, delta * 10);
      p.leftArm.rotation.x = THREE.MathUtils.lerp(p.leftArm.rotation.x, 0, delta * 10);
      p.rightArm.rotation.x = THREE.MathUtils.lerp(p.rightArm.rotation.x, -0.75, delta * 10);
      p.cakeProp.rotation.x = THREE.MathUtils.lerp(p.cakeProp.rotation.x, 0.75, delta * 10);
    }
  }

  updateDust(delta) {
    this.dustParticles.forEach(d => {
      if (!d.alive) return;
      d.life += delta;
      if (d.life > d.maxLife) {
        d.alive = false;
        d.mesh.visible = false;
      } else {
        d.mesh.position.addScaledVector(d.vel, delta);
        const progress = d.life / d.maxLife;
        d.mesh.material.opacity = (1 - progress) * 0.5;
        d.mesh.scale.setScalar(0.4 + progress * 0.6);
      }
    });
  }

  respawn() {
    this.position.copy(this.spawnPoint);
    this.velocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);
    this.isGrounded = true;
    sound.playRespawn();
  }
}