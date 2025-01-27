
ENV_FILE="../.credentials/cloudflare-env"

rm -f $ENV_FILE

CLOUDFLARE_API_TOKEN=$(<../.credentials/cloudflare_api_token.txt)
API_GATEWAY_DOMAIN_NAME=$(<../.credentials/api_gateway_domain_name.txt)


echo "CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN" >> $ENV_FILE
echo "TF_VAR_API_GATEWAY_DOMAIN_NAME=$API_GATEWAY_DOMAIN_NAME" >> $ENV_FILE