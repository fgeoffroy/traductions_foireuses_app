#!/usr/bin/env sh

# abort on errors
set -e

# build
#npm run build
#ionic build --prod

# navigate into the build output directory
cd www

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy angular'

# if you are deploying to https://<USERNAME>.github.io
git push -f git@github.com:fgeoffroy/fgeoffroy.github.io.git master

# if you are deploying to https://<USERNAME>.github.io/<REPO>
# git push -f git@github.com:fgeoffroy/franglais.git master:gh-pages

cd -
