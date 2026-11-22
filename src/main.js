import * as THREE from 'three';
import { sound } from './sound.js';
import { InputManager } from './input.js';
import { ThirdPersonCamera } from './camera.js';
import { Player } from './player.js';
import { WorldManager } from './world.js';
import { CollectiblesManager } from './collectibles.js';
import { UIManager } from './ui.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    this.input = null;
    this.cameraController = null;
    this.player = null;
    this.world = null;
    this.collectibles = null;
    this.ui = null;

    this.lastTime = performance.now();
    this.isGameStarted = false;
    this.victoryTriggered = false;

    window.__gameInstance = this;
    this.init();
  }

  async init() {
    try {
      // 1. Three.js Core Setup
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      // 2. Subsystems
      this.input = new InputManager(this.canvas);
      this.ui = new UIManager();
      this.world = new WorldManager(this.scene);
      this.player = new Player(this.scene);
      this.collectibles = new CollectiblesManager(this.scene);

      // 3. Camera Controller
      this.cameraController = new ThirdPersonCamera(this.camera, this.player.mesh);

      // 4. Connect Callbacks
      this.collectibles.onCollectedCallback = (info) => {
        this.ui.onCakeCollected(info);
        this.world.fillCakeSliceOnPlatter(info.index);
      };

      this.collectibles.allCollectedCallback = () => {
        this.ui.showToast('🎉 All 6 cake slices found! Return to the Picnic Table to and give them to enuri!');
      };

      window.addEventListener('player-respawn', () => {
        this.player.respawn();
      });

      window.addEventListener('resize', () => this.onResize());

      // 5. Start Game handler
      const startOverlay = document.getElementById('start-overlay');
      const startBtn = document.getElementById('start-game-btn');

      this.startGame = () => {
        this.isGameStarted = true;
        try {
          sound.init();
          sound.resume();
          sound.startBGM();
        } catch (e) {
          console.warn('Audio initialization note:', e);
        }
        if (startOverlay) {
          startOverlay.style.display = 'none';
          startOverlay.classList.add('hidden');
        }
        this.lastTime = performance.now();
      };

      window.__startGame = this.startGame;

      if (startBtn) {
        startBtn.addEventListener('click', this.startGame);
      }
      window.addEventListener('keydown', (e) => {
        if (!this.isGameStarted && (e.code === 'Enter' || e.code === 'Space')) {
          this.startGame();
        }
      });

      // 6. Run Animation Loop
      this.animate();
      console.log('🎮 Game initialized successfully!');
    } catch (err) {
      console.error('Fatal initialization error in Game:', err);
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    let delta = (now - this.lastTime) * 0.001;
    this.lastTime = now;
    if (delta > 0.1) delta = 0.1;

    // Check quest key toggle
    if (this.input.consumeQuest()) {
      this.ui.toggleQuestLog();
    }
    if (this.input.consumeReset()) {
      this.player.respawn();
    }

    if (this.isGameStarted) {
      this.input.update();

      // Camera mouse input
      this.cameraController.handleInput(this.input);

      // Update Player Physics & Collisions
      this.player.update(
        delta,
        this.input,
        this.cameraController,
        this.world.colliders,
        this.world.bouncePads,
        this.world.speedBoosters
      );

      // Update Camera follow
      this.cameraController.update(delta);

      // Update World animations
      this.world.update(delta);

      // Update Collectibles
      this.collectibles.update(delta, this.player.position);

      // Update UI Radar & Speed Boost Indicator
      const closestCake = this.collectibles.getClosestCake(this.player.position);
      const camForward = this.cameraController.getForwardVector();
      this.ui.updateRadar(closestCake, this.player.position, camForward);
      this.ui.updateSpeedBoostUI(this.player.speedBoostTimer);

      // Check Victory Condition: All 6 collected + visit picnic table
      if (
        this.collectibles.collectedCount >= this.collectibles.totalCount &&
        !this.victoryTriggered
      ) {
        const distToTable = this.player.position.distanceTo(new THREE.Vector3(0, 0.4, 0));
        if (distToTable < 3.8) {
          this.victoryTriggered = true;
          this.world.triggerGrandCakeAssembly();
          this.ui.showVictory();
        }
      }
    } else {
      // Gentle idle spin for start screen background
      this.cameraController.theta += delta * 0.2;
      this.cameraController.update(delta);
      this.world.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Start game when DOM is ready
function boot() {
  if (!window.__gameInstance) {
    new Game();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
