from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit
import mimetypes
import os


SITE = Path(__file__).parent


class IndependentHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        request = urlsplit(self.path)

        # Reproduce the local-image behavior of Next's optimizer without a
        # server-side Next.js process. The browser can decode the source file.
        if request.path == "/_next/image":
            source = parse_qs(request.query).get("url", [""])[0]
            candidate = (SITE / unquote(source).lstrip("/")).resolve()
            if candidate.is_file() and SITE in candidate.parents:
                payload = candidate.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", mimetypes.guess_type(candidate.name)[0] or "application/octet-stream")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
                return

        route = request.path
        html_file = None
        if route in ("/", "/index.html"):
            html_file = SITE / "index.html"
        elif route.rstrip("/") in ("/about", "/work", "/en", "/es"):
            html_file = SITE / route.strip("/") / "index.html"

        if html_file and html_file.is_file() and "_rsc" not in parse_qs(request.query):
            html = html_file.read_text(encoding="utf-8")
            html = html.replace("</head>", '<script src="/offline-guard.js"></script></head>', 1)
            payload = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        super().do_GET()


if __name__ == "__main__":
    os.chdir(SITE)
    ThreadingHTTPServer(("127.0.0.1", 4173), IndependentHandler).serve_forever()
