import urllib.request
import json
import asyncio
import websockets

async def check():
    try:
        r = urllib.request.urlopen('http://127.0.0.1:9222/json')
        pages = json.loads(r.read())
        page = next((p for p in pages if p.get('type') == 'page'), None)
        if not page:
            print("No page found!")
            return
        ws_url = page['webSocketDebuggerUrl']
        print("Connecting to DevTools:", ws_url)

        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({'id': 1, 'method': 'Runtime.enable'}))
            await ws.send(json.dumps({'id': 2, 'method': 'Log.enable'}))
            await ws.send(json.dumps({'id': 3, 'method': 'Console.enable'}))

            # Query page state
            await ws.send(json.dumps({
                'id': 4,
                'method': 'Runtime.evaluate',
                'params': {
                    'expression': """
                    ({
                        hasStartBtn: !!document.getElementById('start-game-btn'),
                        hasOverlay: !!document.getElementById('start-overlay'),
                        overlayClass: document.getElementById('start-overlay')?.className,
                        overlayDisplay: window.getComputedStyle(document.getElementById('start-overlay')).display,
                        gameInstance: !!window.__gameInstance,
                        gameStarted: window.__gameInstance?.isGameStarted
                    })
                    """,
                    'returnByValue': True
                }
            }))

            # Click start button
            await ws.send(json.dumps({
                'id': 5,
                'method': 'Runtime.evaluate',
                'params': {
                    'expression': """
                    (function() {
                        const btn = document.getElementById('start-game-btn');
                        if (btn) btn.click();
                        const overlay = document.getElementById('start-overlay');
                        return {
                            overlayClassAfter: overlay?.className,
                            overlayDisplayAfter: window.getComputedStyle(overlay).display,
                            gameStartedAfter: window.__gameInstance?.isGameStarted
                        };
                    })()
                    """,
                    'returnByValue': True
                }
            }))

            for _ in range(20):
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=0.2)
                    data = json.loads(msg)
                    if data.get('id') in (4, 5):
                        print("Eval Result:", data.get('id'), data.get('result', {}).get('result', {}).get('value'))
                    elif data.get('method') in ('Runtime.consoleAPICalled', 'Runtime.exceptionThrown', 'Log.entryAdded'):
                        print("LOG EVENT:", data.get('method'), json.dumps(data.get('params'), indent=2))
                except asyncio.TimeoutError:
                    pass
    except Exception as e:
        print("Exception:", e)

if __name__ == '__main__':
    asyncio.run(check())
