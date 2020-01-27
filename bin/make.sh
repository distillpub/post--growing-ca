#!/bin/bash
# copy the last export.html from downloads
cp -v "$(ls -t  ~/Downloads/export*.html | head -1)" article.html
cat header.html article.html footer.html >public/index.html
echo "Build finished"