'''Advanced web-development server

Runs ./bin/make.sh whenever index.html is fetched.
'''
import os
import six
if six.PY3:
    from http.server import SimpleHTTPRequestHandler, test
else:
    from SimpleHTTPServer import SimpleHTTPRequestHandler, test

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in ['/', '/index.html']:
            os.system('cd .. && bin/make.sh')
        if six.PY3:
            super().do_GET()
        else:
            SimpleHTTPRequestHandler.do_GET(self)

if __name__ == '__main__':
    os.chdir('public')
    test(HandlerClass=Handler)

