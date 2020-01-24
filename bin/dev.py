'''Advanced web-developemnt server

Runs ./bin/make.sh whenever index.html is fetched.
'''
import os
from http.server import SimpleHTTPRequestHandler, test

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *arg, **kw):
        super().__init__(directory='public/', *arg, **kw)

    def do_GET(self):
        if self.path in ['/', '/index.html']:
            os.system('./bin/make.sh')
        super().do_GET()

if __name__ == '__main__':
    test(HandlerClass=Handler, port=8080)
