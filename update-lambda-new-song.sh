#!/bin/bash
set -e

FUNCTION_NAME="capoeira-songbook-contributor-NewSongFunction-OkFJJC63Hn3j"

echo "Packaging lambdas and uploading to S3"
PACKAGE_LAMBDA_OUTPUT=($(./package-and-push-lambdas.sh))
LAMBDA_PACKAGE_FILE_NAME=${PACKAGE_LAMBDA_OUTPUT[-1]}
DEPLOYMENT_BUCKET=${PACKAGE_LAMBDA_OUTPUT[-2]}

echo "Updating lambda"
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --s3-bucket "$DEPLOYMENT_BUCKET" \
  --s3-key "$LAMBDA_PACKAGE_FILE_NAME" \
  | head -n 4