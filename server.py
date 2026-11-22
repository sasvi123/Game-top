#!/usr/bin/env python3
"""
Lightweight development server for Enuri's Birthday Quest Cake Adventure.
Properly serves .glb models, ES modules (.js), CSS, and HTML.
"""
import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class GameRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and caching headers for smooth asset loading
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.glb'):
            return 'model/gltf-binary'
        if path.endswith('.gltf'):
            return 'model/gltf+json'
        if path.endswith('.js') or path.endswith('.mjs'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        if path.endswith('.html'):
            return 'text/html'
        return super().guess_type(path)

def run():
    port = PORT
    for attempt in range(5):
        try:
            with socketserver.TCPServer(("", port), GameRequestHandler) as httpd:
                print(f"==================================================")
                print(f"  🎂 Enuri's Birthday Quest")
                print(f"  Server running at: http://localhost:{port}/")
                print(f"  Press Ctrl+C to stop the server.")
                print(f"==================================================")
                sys.stdout.flush()
                try:
                    httpd.serve_forever()
                except KeyboardInterrupt:
                    print("\nShutting down server.")
                    break
            break
        except OSError as e:
            if "Address already in use" in str(e) or e.errno == 98 or e.errno == 10048:
                port += 1
            else:
                raise e

if __name__ == '__main__':
    run()
