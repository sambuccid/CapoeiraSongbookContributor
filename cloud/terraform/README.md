In this folder we have all the configuration needed for cloudflare.

In case of the need to reproduce this, there are a few operations that can't be automated and that needs to be done manually.

### Manual Operations
- The creation of a cloudflare domain needs to be done manually
  - If a new domain is created, we'll need to update the `zone_id` `account_id` and `domain` variables defined in the terraform config
- The creation of a new Cloudflare Origin Certificate also needs to be done manually
  - This certificate needs to be created for the subdomain that will redirect to API Gateway, it's used to encript traffic between cloudflare and API Domain, the connection between the 2 will not work without a certificate
  - Once this is created, the value and the key of the certificate needs to be imported in AWS ACM
  - The ARN of the certificate imported inside AWS ACM should then be written in the credentials folder to be used by cloudformation

