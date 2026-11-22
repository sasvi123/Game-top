import urllib.request
import json
import asyncio
import websockets

async def test_button():
    r = urllib.request.urlopen('http://127.0.0.1:9222/json')
    pages = json.loads(r.read())
    page = next(p for p in pages if p.get('type') == 'page')
    
    async with websockets.connect(page['webSocketDebuggerUrl']) as ws:
        await ws.send(json.dumps({'id': 1, 'method': 'Runtime.enable'}))
        
        # Click button
        await ws.send(json.dumps({
            'id': 2,
            'method': 'Runtime.evaluate',
            'params': {
                'expression': """
                (function() {
                    document.getElementById('start-game-btn')?.click();
                    const overlay = document.getElementById('start-overlay');
                    return {
                        overlayDisplay: overlay.style.display,
                        computedDisplay: window.getComputedStyle(overlay).display,
                        overlayClasses: overlay.className,
                        gameStarted: window.__gameInstance?.isGameStarted,
                        playerPos: window.__gameInstance?.player?.position
                    };
                })()
                """,
                'returnByValue': True
            }
        }))
        
        while True:
            msg = json.loads(await ws.recv())
            if msg.get('id') == 2:
                print("BUTTON CLICK RESULT:")
                print(json.dumps(msg['result']['result']['value'], indent=2))
                break

if __name__ == '__main__':
    asyncio.run(test_button())
