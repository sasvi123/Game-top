// Input Manager: Keyboard, Mouse Look, and Touch Controls
export class InputManager {
  constructor(domElement) {
    this.domElement = domElement || document.body;
    this.keys = {};
    
    // Movement intent
    this.moveVector = { x: 0, z: 0 };
    this.jumpPressed = false;
    this.sprintPressed = false;
    this.questPressed = false;
    this.resetPressed = false;

    // Mouse / Camera rotation deltas
    this.mouseDelta = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.pointerLock = false;
    this.zoomDelta = 0;

    // Touch controls state
    this.touchActive = false;
    this.touchJoystickOrigin = { x: 0, y: 0 };
    this.touchJoystickPos = { x: 0, y: 0 };

    this.initListeners();
  }

  initListeners() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'KeyQ') {
        this.questPressed = true;
      }
      if (e.code === 'KeyR') {
        this.resetPressed = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse Look (Drag or Right Click)
    window.addEventListener('mousedown', (e) => {
      // Don't drag if clicking UI buttons or modals
      if (e.target.closest('.ui-interactive')) return;
      this.isMouseDown = true;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown || document.pointerLockElement) {
        this.mouseDelta.x += e.movementX || 0;
        this.mouseDelta.y += e.movementY || 0;
      }
    });

    // Zoom via wheel
    window.addEventListener('wheel', (e) => {
      if (e.target.closest('.ui-interactive')) return;
      this.zoomDelta += Math.sign(e.deltaY) * 0.5;
    }, { passive: true });

    // Touch Joystick Handling
    const joystickArea = document.getElementById('touch-joystick-area');
    const joystickKnob = document.getElementById('touch-joystick-knob');
    const jumpBtn = document.getElementById('touch-jump-btn');
    const sprintBtn = document.getElementById('touch-sprint-btn');

    if (joystickArea && joystickKnob) {
      let touchId = null;

      const handleTouchStart = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (touchId === null) {
            touchId = t.identifier;
            const rect = joystickArea.getBoundingClientRect();
            this.touchJoystickOrigin = {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            };
            this.updateJoystick(t.clientX, t.clientY, joystickKnob);
          }
        }
      };

      const handleTouchMove = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touchId) {
            this.updateJoystick(t.clientX, t.clientY, joystickKnob);
          }
        }
      };

      const handleTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touchId) {
            touchId = null;
            this.moveVector.x = 0;
            this.moveVector.z = 0;
            joystickKnob.style.transform = `translate(-50%, -50%)`;
          }
        }
      };

      joystickArea.addEventListener('touchstart', handleTouchStart, { passive: false });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
    }

    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.jumpPressed = true;
      });
      jumpBtn.addEventListener('touchend', () => {
        this.jumpPressed = false;
      });
    }

    if (sprintBtn) {
      sprintBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.sprintPressed = !this.sprintPressed;
        sprintBtn.classList.toggle('active', this.sprintPressed);
      });
    }
  }

  updateJoystick(touchX, touchY, knobElem) {
    const maxRadius = 45;
    const dx = touchX - this.touchJoystickOrigin.x;
    const dy = touchY - this.touchJoystickOrigin.y;
    const dist = Math.hypot(dx, dy);

    let clampedX = dx;
    let clampedY = dy;
    if (dist > maxRadius) {
      clampedX = (dx / dist) * maxRadius;
      clampedY = (dy / dist) * maxRadius;
    }

    knobElem.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;

    this.moveVector.x = clampedX / maxRadius;
    this.moveVector.z = clampedY / maxRadius;
  }

  update() {
    // Process keyboard movement
    let kx = 0;
    let kz = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) kz -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) kz += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) kx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) kx += 1;

    // Combine keyboard and touch
    if (kx !== 0 || kz !== 0) {
      const len = Math.hypot(kx, kz);
      this.moveVector.x = kx / len;
      this.moveVector.z = kz / len;
    } else if (Math.hypot(this.moveVector.x, this.moveVector.z) < 0.05) {
      this.moveVector.x = 0;
      this.moveVector.z = 0;
    }

    this.jumpPressed = this.jumpPressed || Boolean(this.keys['Space']);
    this.sprintPressed = this.sprintPressed || Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
  }

  consumeMouseDelta() {
    const d = { ...this.mouseDelta };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return d;
  }

  consumeZoomDelta() {
    const z = this.zoomDelta;
    this.zoomDelta = 0;
    return z;
  }

  consumeJump() {
    const j = this.jumpPressed;
    if (!this.keys['Space']) {
      this.jumpPressed = false;
    }
    return j;
  }

  consumeQuest() {
    const q = this.questPressed;
    this.questPressed = false;
    return q;
  }

  consumeReset() {
    const r = this.resetPressed;
    this.resetPressed = false;
    return r;
  }
}
