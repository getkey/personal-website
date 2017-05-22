#!/bin/sh

PATH=$(pwd)/node_modules/.bin/:$PATH
for file in $(git diff --cached --name-only --diff-filter=d | grep '\.js$'); do
	git show :"$file" | eslint --stdin --stdin-filename "$file"
done
