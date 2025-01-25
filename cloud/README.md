# How to deploy
This cloud folder contains the code and infrastructure of the backend part of the cotributor.

To deploy this you'll need to:
1. Set up the AWS cli, node and npm and podman.
2. Run an `npm install` and bring over the existsing terraform state from another machine
3. Fill the `.credentials` folder with the credentials needed for AWS, github and coudflare
4. Follow the readme inside the `terraform` folder (this might involve running the `terraform/deploy-terraform.sh` file with a placeholder api-domain name)
5. Run the `./deploy.sh` command which will deploy 2 different stacks and will pack the lambas to deploy
6. Run the `./pull-cloudformation-outputs.sh` file which will get the outputs of the deployment and will put them in the `.credentials` folder
7. Run the `terraform/deploy-terraform.sh` file to deploy the Cloudflare resources needed