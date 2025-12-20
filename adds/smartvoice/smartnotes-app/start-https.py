#!/usr/bin/env python3
import http.server
import ssl
import socketserver
import os

# Create simple self-signed certificate
def create_self_signed_cert():
    if not os.path.exists('server.pem'):
        os.system('openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes -subj "/C=PL/ST=Poland/L=Warsaw/O=SmartNotes/CN=localhost"')

# Create certificate
create_self_signed_cert()

PORT = 8443
Handler = http.server.SimpleHTTPRequestHandler

# Change to dist directory
os.chdir('dist')

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"HTTPS Server running at:")
    print(f"https://localhost:{PORT}")
    print(f"https://192.168.1.17:{PORT}")
    
    # Create SSL context
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain('../server.pem')
    
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    httpd.serve_forever()