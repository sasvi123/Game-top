# 🎂 Enuri's Birthday Quest: The Lost Cake Mystery

A delightful, cozy 3D island exploration & adventure game built with **Three.js** around the **`Small-Meadow-Island.glb`** 3D model!

---

## 🎮 How to Play Right Now

The local web server is live! Simply open your browser and navigate to:

👉 **[http://localhost:8000/](http://localhost:8000/)**

Click **"▶ START ADVENTURE"** to begin!

To run it anytime in the future from the terminal:
```bash
python server.py
# OR
npm start
```

---

## 📖 The Story & Adventure

The annual Enuri's Birthday Quest celebration was about to commence, but a sudden gust of enchanted wind scattered all **6 legendary cake slices** across the island's hilltops, forest heights, hidden rocky alcoves, and floating stepping stones!

As **Pip the Adventurer**, explore the island, leap across floating stone steps, bounce high on giant spring mushrooms, follow the cake radar compass, gather all 6 slices, and return them to the **Picnic Pavilion** to assemble the magnificent **Grand Island Celebration Cake**!

---

## 🕹️ Controls

| Action | Keyboard / Mouse | Touch / Mobile |
| :--- | :--- | :--- |
| **Move** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or Arrow Keys | Virtual Left Joystick |
| **Jump** | <kbd>Space</kbd> | On-screen **JUMP** Button |
| **Sprint** | <kbd>Shift</kbd> (Hold) | On-screen **⚡ Run** Button |
| **Camera Orbit** | Click & Drag Mouse | Drag across screen |
| **Camera Zoom** | Mouse Wheel Scroll | Pinch gesture |
| **Quest Journal** | <kbd>Q</kbd> Key | Click **📜 Quest Log** Button |
| **Respawn** | <kbd>R</kbd> Key | Click **🏕️ Respawn** Button |

---

## 🍰 The 6 Legendary Cake Slices to Discover

1. 🍓 **Ruby Strawberry Shortcake**
   - *Clue*: "Perched in the scenic flower meadow overlooking the azure sea."
   - *Location*: Meadow garden plateau.
2. 🍫 **Midnight Chocolate Fudge**
   - *Clue*: "Hidden deep inside the shaded rocky cove behind ancient stones."
   - *Location*: Rocky cove nook.
3. 🍵 **Zen Matcha Mountain Roll**
   - *Clue*: "High on the elevated forest plateau—use a bouncy mushroom to spring up!"
   - *Location*: Forest heights reached via Bouncy Mushroom.
4. 🌈 **Starlight Rainbow Tier**
   - *Clue*: "Gleaming proudly on the edge of the northern cliffs towards the horizon."
   - *Location*: Northern cliff edge.
5. 🫐 **Glacier Blueberry Cheesecake**
   - *Clue*: "Resting on a floating stepping stone just beyond the western coast."
   - *Location*: Stepping stones parkour over the water.
6. 👑 **Golden Royal Crown Cake**
   - *Clue*: "Guarded atop the ancient sundial pedestal on the southern meadow."
   - *Location*: Southern sun pedestal.

---

## ✨ Features & Mechanics

- **Custom 3D Island**: Renders `Small-Meadow-Island.glb` directly with real-time soft shadows, PBR texturing, and realistic ground raycast collision detection.
- **Stylized 3D Character (Pip)**: Complete adventurer rig with explorer hat, feather, backpack, and procedural animations (walk, run, jump, land, idle bobbing).
- **Interactive Bouncy Mushrooms**: 3 giant spotted mushrooms with squish-and-stretch cartoon spring animations that launch the player high into the air!
- **Speed Boost Flower Rings**: Swirling golden rings that grant +60% turbo speed with wind effects.
- **Cake Radar & Compass**: Rotating compass dial pointing toward the nearest undiscovered cake slice with real-time distance in meters.
- **Grand Picnic Pavilion Finale**: When all 6 slices are gathered, bring them to the picnic table in the center to trigger the Grand Cake Assembly with lit candles, confetti explosions, and victory fireworks!
- **Procedural Sound Engine**: Zero external audio files required! Synthesizes acoustic background music, footsteps on grass, jump whooshes, spring boings, pickup chimes, and victory fanfare using the Web Audio API.
- **Offline & Standalone**: All libraries (Three.js, GLTFLoader, OrbitControls) and assets are bundled locally in the project.
