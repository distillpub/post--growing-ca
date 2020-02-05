'''Advanced web-development server'''

from __future__ import print_function

import os, glob
import six
if six.PY3:
    from http.server import SimpleHTTPRequestHandler, test
else:
    from SimpleHTTPServer import SimpleHTTPRequestHandler, test

def write_file(fname, fout):
    for s in open(fname):
        if s.startswith('%% '):
            fn = '../'+s.split()[1]
            write_file(fn, fout)
        else:
            fout.write(s)

def build():
    os.system('''
    src="$(ls -t  ~/Downloads/export*.html | head -1)"
    if [ "$src" -nt ../article.html ]; then
        cp -vf "$src" ../article.html
    fi
    ''')
    with open('index.html', 'w') as fout:
      write_file('../main.html', fout)
    print('build finished')


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in ['/', '/index.html']:
            build()
        if six.PY3:
            super().do_GET()
        else:
            SimpleHTTPRequestHandler.do_GET(self)

if __name__ == '__main__':
    os.chdir('public')
    build()
    test(HandlerClass=Handler)
