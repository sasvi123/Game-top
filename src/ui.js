// UI & HUD Manager
import { sound } from './sound.js';
import { CAKE_DATA } from './collectibles.js';

export class UIManager {
  constructor() {
    this.cakeSlots = [];
    this.toastTimer = null;
    this.startTime = Date.now();
    this.jumpsCount = 0;
    this.playerCount = null;

    this.initElements();
    this.initPlayerCount();
  }

  async initPlayerCount() {
    const cached = localStorage.getItem('enuri_player_count');
    if (cached) {
      this.playerCount = cached;
      this.updatePlayerCountDisplays(cached);
    }

    try {
      // CounterAPI provides free persistent counting with CORS enabled
      const isNewSession = !sessionStorage.getItem('enuri_counted_session');
      const action = isNewSession ? 'up' : 'get';
      const url = `https://counterapi.com/api/enuris-birthday-quest/${action}/players`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.value !== undefined) {
          this.playerCount = data.value;
          sessionStorage.setItem('enuri_counted_session', 'true');
          localStorage.setItem('enuri_player_count', data.value);
          this.updatePlayerCountDisplays(data.value);
          return;
        }
      }
    } catch (e) {
      console.log('Player count note (using cached/fallback):', e);
    }

    if (!this.playerCount) {
      const fallback = localStorage.getItem('enuri_player_count') || '1';
      this.playerCount = fallback;
      this.updatePlayerCountDisplays(fallback);
    }
  }

  updatePlayerCountDisplays(count) {
    const formatted = Number(count).toLocaleString();
    const startVal = document.getElementById('start-count-val');
    const hudVal = document.getElementById('hud-count-val');
    const victoryRank = document.getElementById('victory-player-rank');

    if (startVal) startVal.textContent = formatted;
    if (hudVal) hudVal.textContent = formatted;
    if (victoryRank) victoryRank.textContent = `#${formatted}`;
  }

  initElements() {
    // Cake Slot Elements in HUD
    const container = document.getElementById('cake-slots-container');
    if (container) {
      CAKE_DATA.forEach((cake, index) => {
        const slot = document.createElement('div');
        slot.className = 'cake-slot empty';
        slot.id = `slot-${cake.id}`;
        slot.title = `${cake.name} - ${cake.flavor}`;
        slot.innerHTML = `
          <div class="slot-icon" style="background-color: #${cake.color.toString(16).padStart(6, '0')}">🍰</div>
          <div class="slot-check">✓</div>
        `;
        slot.addEventListener('click', () => {
          this.openQuestLog(index);
        });
        container.appendChild(slot);
        this.cakeSlots.push(slot);
      });
    }

    // Quest Log Modal Buttons
    const questBtn = document.getElementById('quest-log-btn');
    const questModal = document.getElementById('quest-modal');
    const questClose = document.getElementById('quest-close-btn');

    if (questBtn && questModal) {
      questBtn.addEventListener('click', () => this.toggleQuestLog());
    }
    if (questClose && questModal) {
      questClose.addEventListener('click', () => this.closeQuestLog());
    }

    // Sound Toggle Button
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const muted = sound.toggleMute();
        audioBtn.textContent = muted ? '🔇 Sound: Off' : '🔊 Sound: On';
        audioBtn.classList.toggle('muted', muted);
      });
    }

    // Respawn Button
    const respawnBtn = document.getElementById('respawn-btn');
    if (respawnBtn) {
      respawnBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('player-respawn'));
      });
    }

    // Victory Modal Free Roam
    const victoryRoamBtn = document.getElementById('victory-roam-btn');
    const victoryModal = document.getElementById('victory-modal');
    if (victoryRoamBtn && victoryModal) {
      victoryRoamBtn.addEventListener('click', () => {
        victoryModal.classList.remove('active');
      });
    }

    // Populate Quest Journal
    this.populateQuestJournal();
  }

  populateQuestJournal() {
    const list = document.getElementById('quest-clues-list');
    if (!list) return;
    list.innerHTML = '';

    CAKE_DATA.forEach((cake, idx) => {
      const item = document.createElement('div');
      item.className = 'quest-clue-item';
      item.id = `quest-item-${cake.id}`;
      item.innerHTML = `
        <div class="clue-badge" style="border-color: #${cake.color.toString(16).padStart(6, '0')}">
          <span>${idx + 1}</span>
        </div>
        <div class="clue-content">
          <div class="clue-title">${cake.name} <span class="clue-status" id="status-${cake.id}">Not Found</span></div>
          <div class="clue-text">"<em>${cake.clue}</em>"</div>
          <div class="clue-lore">${cake.flavor}</div>
        </div>
      `;
      list.appendChild(item);
    });
  }

  updateRadar(closestCakeInfo, playerPosition, cameraForward) {
    const needle = document.getElementById('radar-needle');
    const distanceText = document.getElementById('radar-distance');
    const targetName = document.getElementById('radar-target-name');

    if (!closestCakeInfo) {
      if (needle) needle.style.transform = 'rotate(0deg)';
      if (distanceText) distanceText.textContent = 'All Found!';
      if (targetName) targetName.textContent = 'Visit the Picnic Pavilion!';
      return;
    }

    const { data, position, distance } = closestCakeInfo;

    if (targetName) {
      targetName.textContent = data.name;
    }

    if (distanceText) {
      distanceText.textContent = `${Math.round(distance)}m`;
    }

    if (needle && cameraForward) {
      // Vector from player to cake
      const dx = position.x - playerPosition.x;
      const dz = position.z - playerPosition.z;
      const targetAngle = Math.atan2(dx, dz);

      // Camera forward angle
      const camAngle = Math.atan2(cameraForward.x, cameraForward.z);

      let relAngle = targetAngle - camAngle;
      while (relAngle < -Math.PI) relAngle += Math.PI * 2;
      while (relAngle > Math.PI) relAngle -= Math.PI * 2;

      const deg = (relAngle * 180) / Math.PI;
      needle.style.transform = `rotate(${deg}deg)`;
    }
  }

  onCakeCollected(info) {
    const { id, name, count, total } = info;

    // 1. Update Cake slot in HUD
    const slot = document.getElementById(`slot-${id}`);
    if (slot) {
      slot.classList.remove('empty');
      slot.classList.add('collected');
    }

    // 2. Update Counter
    const counter = document.getElementById('cake-counter-text');
    if (counter) {
      counter.textContent = `${count} / ${total}`;
    }

    // 3. Update Quest Journal entry
    const statusElem = document.getElementById(`status-${id}`);
    const questItem = document.getElementById(`quest-item-${id}`);
    if (statusElem) {
      statusElem.textContent = 'Found!';
      statusElem.className = 'clue-status found';
    }
    if (questItem) {
      questItem.classList.add('completed');
    }

    // 4. Show Toast Banner
    this.showToast(`✨ Found: ${name}! (${count}/${total})`);
  }

  showToast(message) {
    const toast = document.getElementById('toast-banner');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('visible');

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 3500);
  }

  toggleQuestLog() {
    const modal = document.getElementById('quest-modal');
    if (modal) {
      modal.classList.toggle('active');
    }
  }

  openQuestLog(index = null) {
    const modal = document.getElementById('quest-modal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeQuestLog() {
    const modal = document.getElementById('quest-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  showVictory() {
    const modal = document.getElementById('victory-modal');
    const timeElem = document.getElementById('victory-time');
    if (!modal) return;

    sound.playVictory();

    const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const timeStr = `${mins}m ${secs}s`;

    if (timeElem) {
      timeElem.textContent = timeStr;
    }

    const rankElem = document.getElementById('victory-player-rank');
    if (rankElem && this.playerCount) {
      rankElem.textContent = `#${Number(this.playerCount).toLocaleString()}`;
    }

    modal.classList.add('active');
  }

  updateSpeedBoostUI(timeLeft) {
    const boostElem = document.getElementById('speed-boost-indicator');
    if (!boostElem) return;

    if (timeLeft > 0) {
      boostElem.classList.add('active');
      boostElem.querySelector('.boost-bar').style.width = `${(timeLeft / 4.2) * 100}%`;
    } else {
      boostElem.classList.remove('active');
    }
  }
}
