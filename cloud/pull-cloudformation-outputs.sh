API_URL=$(aws cloudformation describe-stacks \
   --stack-name capoeira-songbook-contributor \
   --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
   --output text
)

echo $API_URL > '.credentials/api_url.txt'

API_GATEWAY_DOMAIN_NAME=$(aws cloudformation describe-stacks \
   --stack-name capoeira-songbook-contributor \
   --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayDomainName'].OutputValue" \
   --output text
)

echo $API_GATEWAY_DOMAIN_NAME > '.credentials/api_gateway_domain_name.txt'