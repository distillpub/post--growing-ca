#!/bin/bash
# copy the last export.html from downloads
#cp -v "$(ls -t  ~/Downloads/export*.html | head -1)" article.html
src="$(ls -t  ~/Downloads/export*.html | head -1)"
if [ "$src" -nt article.html ]; then
  cp -vf "$src" article.html
fi
cat header.html article.html footer.html >public/index.html
echo "Build finished"