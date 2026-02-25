#!/bin/bash

# This is a simple script to pull down the specified version of editoria11y from github

GIT_REF="3.0.x-dev"

mkdir -p tmp/
cd tmp/
git clone git@github.com:itmaybejj/editoria11y.git .
git checkout $GIT_REF
rm -rf ../assets/ed11y
mv dist ../assets/ed11y
mv src/js/version.js ../assets/ed11y/version.js
cd ../
rm -rf tmp
