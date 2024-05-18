#!/bin/bash
set -e

install_npm_dependencies () {
  mv node_modules node_modules_bak
  mv ./lambdas/node_modules node_modules
  npm install --omit=dev
  mv node_modules ./lambdas/node_modules
  mv node_modules_bak node_modules
}

echo "Installing non-dev dependencies to be deployed"
install_npm_dependencies

echo "Deploying S3 bucket for storing lambdas during deployment"

aws cloudformation deploy \
  --stack-name capoeira-songbook-contributor-deployment-bucket \
  --template-file lambda-deployment.yml
  # --capabilities CAPABILITY_IAM

DEPLOYMENT_FILE_NAME=lambdas-$(date +%Y-%m-%d-%H:%M:%S).zip

echo "Packaging lambdas in $DEPLOYMENT_FILE_NAME"

(cd lambdas && zip -r "../$DEPLOYMENT_FILE_NAME" *)

DEPLOYMENT_BUCKET=$(
  aws cloudformation describe-stacks \
    --stack-name capoeira-songbook-contributor-deployment-bucket \
    --query "Stacks[0].Outputs[?OutputKey=='DeploymentBucket'].OutputValue" \
    --output text
)

aws s3 cp "./$DEPLOYMENT_FILE_NAME" "s3://$DEPLOYMENT_BUCKET/"

rm "./$DEPLOYMENT_FILE_NAME"

GITHUB_USERNAME=$(<credentials/github_username.txt)
GITHUB_PASSWORD=$(<credentials/github_personal_access_token.txt)

aws cloudformation update-stack \
  --stack-name capoeira-songbook-contributor \
  --parameters "ParameterKey=LambdaS3Key,ParameterValue=$DEPLOYMENT_FILE_NAME" "ParameterKey=GithubUsername,ParameterValue=$GITHUB_USERNAME" "ParameterKey=GithubPassword,ParameterValue=$GITHUB_PASSWORD" \
  --template-body file://cloudformation.yml \
  --capabilities CAPABILITY_NAMED_IAM


# aws cloudformation deploy \
#   --stack-name capoeira-songbook-contributor \
#   --parameter-overrides "LambdaS3Key=$DEPLOYMENT_FILE_NAME" \
#   --template-file cloudformation.yml \
#   --capabilities CAPABILITY_NAMED_IAM


# aws cloudformation wait stack-update-complete \
#   --stack-name capoeira-songbook-contributor

aws cloudformation describe-stack-events \
  --stack-name capoeira-songbook-contributor \
  | head -n 13


# echo "API url:"
# aws cloudformation describe-stacks \
#   --stack-name capoeira-songbook-contributor \
#   --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
#   --output text
