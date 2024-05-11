#!/bin/bash
set -e

aws cloudformation update-stack \
  --stack-name capoeira-songbook-contributor \
  --template-body file://cloudformation.yml \
  --capabilities CAPABILITY_NAMED_IAM

# aws cloudformation wait stack-update-complete \
#   --stack-name capoeira-songbook-contributor

aws cloudformation describe-stack-events \
  --stack-name capoeira-songbook-contributor


# echo "API url:"
# aws cloudformation describe-stacks \
#   --stack-name capoeira-songbook-contributor \
#   --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
#   --output text
