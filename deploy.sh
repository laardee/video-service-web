#!/usr/bin/env bash

export PUBLIC_URL="."

npm run build

git add .
#
#BUCKET="s3://$1"
#
#aws s3 rm $BUCKET --recursive
#aws s3 cp ./build $BUCKET --recursive