import urllib.request
import json
import asyncio
import websockets

async def test_gameplay():
    r = urllib.request.urlopen('http://127.0.0.1:9222/json')
    pages = json.loads(r.read())
    page = next(p for p in pages if p.get('type') == 'page')
    
    async with websockets.connect(page['webSocketDebuggerUrl']) as ws:
        await ws.send(json.dumps({'id': 1, 'method': 'Runtime.enable'}))
        
        # Click start button and press W
        await ws.send(json.dumps({
            'id': 2,
            'method': 'Runtime.evaluate',
            'params': {
                'expression': """
                (function() {
                    document.getElementById('start-game-btn')?.click();
                    const g = window.__gameInstance;
                    if (!g) return { error: 'No game' };

                    // Simulate W key press
                    g.input.keys['KeyW'] = true;
                    // Let physics update a couple ticks
                    g.player.update(0.05, g.input, g.cameraController, g.world.colliders, g.world.bouncePads, g.world.speedBoosters);
                    g.player.update(0.05, g.input, g.cameraController, g.world.colliders, g.world.bouncePads, g.world.speedBoosters);
                    
                    return {
                        gameStarted: g.isGameStarted,
                        playerMovedPos: g.player.position,
                        isGrounded: g.player.isGrounded,
                        velocity: g.player.velocity,
                        cakeCount: g.collectibles.collectedCount
                    };
                })()
                """,
                'returnByValue': True
            }
        }))
        
        while True:
            msg = json.loads(await ws.recv())
            if msg.get('id') == 2:
                print("SIMULATION RESULT:")
                print(json.dumps(msg['result']['result']['value'], indent=2))
                break

if __name__ == '__main__':
    asyncio.run(test_gameplay())
