#!/bin/bash
set -e

echo "Deploying S3 bucket for storing lambdas during deployment"
aws cloudformation deploy \
  --stack-name capoeira-songbook-contributor-deployment-bucket \
  --template-file lambda-deployment.yml
  # --capabilities CAPABILITY_IAM

echo "Packaging lambdas and uploading to S3"
PACKAGE_LAMBDA_OUTPUT=($(./package-and-push-lambdas.sh))
LAMBDA_PACKAGE_FILE_NAME=${PACKAGE_LAMBDA_OUTPUT[-1]}

GITHUB_USERNAME=$(<.credentials/github_username.txt)
GITHUB_PASSWORD=$(<.credentials/github_personal_access_token.txt)
PRIVATE_KEY=$(<.credentials/private_key.txt)

echo "Updating cloudformation stack"
aws cloudformation update-stack \
  --stack-name capoeira-songbook-contributor \
  --parameters "ParameterKey=LambdaS3Key,ParameterValue=$LAMBDA_PACKAGE_FILE_NAME" "ParameterKey=GithubUsername,ParameterValue=$GITHUB_USERNAME" "ParameterKey=GithubPassword,ParameterValue=$GITHUB_PASSWORD" "ParameterKey=PrivateKey,ParameterValue=$PRIVATE_KEY" \
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
  | head -n 12


# echo "API url:"
# aws cloudformation describe-stacks \
#   --stack-name capoeira-songbook-contributor \
#   --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
#   --output text
