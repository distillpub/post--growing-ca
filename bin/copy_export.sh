#!/bin/bash
cp -uv "$(ls -t  ~/Downloads/export*.html | head -1)" article.html
