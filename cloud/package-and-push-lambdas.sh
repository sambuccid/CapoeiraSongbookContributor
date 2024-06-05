#!/bin/bash
set -e

PACKAGE_FILE_NAME=lambdas-$(date +%Y-%m-%d-%H:%M:%S).zip

install_npm_dependencies () {
  mv node_modules node_modules_bak
  mv ./lambdas/node_modules node_modules
  npm install --omit=dev
  mv node_modules ./lambdas/node_modules
  mv node_modules_bak node_modules
}

package_in_zip_file() {
  (cd lambdas && zip -r "../$PACKAGE_FILE_NAME" *)
}

get_deployment_bucket() {
  local bucket=$(
    aws cloudformation describe-stacks \
      --stack-name capoeira-songbook-contributor-deployment-bucket \
      --query "Stacks[0].Outputs[?OutputKey=='DeploymentBucket'].OutputValue" \
      --output text
  )
  echo "$bucket"
}


echo "Installing non-dev dependencies to be deployed"
install_npm_dependencies
cp ./package.json ./lambdas/package.json

echo "Packaging lambdas in $PACKAGE_FILE_NAME"
package_in_zip_file

DEPLOYMENT_BUCKET=$(get_deployment_bucket)

echo "Cleaning bucket before upload"
./empty-s3-bucket.sh "$DEPLOYMENT_BUCKET"

echo "Uploading to S3"
aws s3 cp "./$PACKAGE_FILE_NAME" "s3://$DEPLOYMENT_BUCKET/"

echo "Removing local lambda package"
rm "./$PACKAGE_FILE_NAME"
rm ./lambdas/package.json


echo "$DEPLOYMENT_BUCKET" # Similar to return value
echo "$PACKAGE_FILE_NAME" # Similar to return value