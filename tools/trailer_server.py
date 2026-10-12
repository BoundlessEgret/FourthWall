#!/usr/bin/env python3
"""預告片輸出用的小伺服器：
   python3 tools/trailer_server.py <輸出資料夾> [port]
   然後用瀏覽器開 http://localhost:<port>/trailer.html?render&fps=30
   完成後用 ffmpeg 合成（見 tools/make_trailer.sh）。"""
import http.server, os, sys, urllib.parse, functools, base64

OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else 'trailer_out')
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8766
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)

class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def do_POST(self):
        u = urllib.parse.urlparse(self.path); q = urllib.parse.parse_qs(u.query)
        data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        if u.path == '/frame':
            if 'b64' in q: data = base64.b64decode(data)
            open(os.path.join(OUT, 'frames', '%05d.jpg' % int(q['i'][0])), 'wb').write(data)
        elif u.path == '/snap':
            open(os.path.join(OUT, q['name'][0] + '.jpg'), 'wb').write(data)
        elif u.path == '/audio':
            open(os.path.join(OUT, 'audio.wav'), 'wb').write(data)
        elif u.path == '/done':
            open(os.path.join(OUT, 'DONE'), 'w').write('ok')
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')

http.server.ThreadingHTTPServer(('', PORT), functools.partial(H, directory=ROOT)).serve_forever()
