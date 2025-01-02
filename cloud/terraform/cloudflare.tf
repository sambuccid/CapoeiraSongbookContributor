terraform {
  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
      version = "~> 4"
    }
  }
}

provider "cloudflare" {
  # token pulled from $CLOUDFLARE_API_TOKEN
}

variable "zone_id" {
  default = "8d6c9ac777a597c964fe1974076c7505"
}

variable "account_id" {
  default = "5c2c4554e47b559e7320583e616108f2"
}

variable "domain" {
  default = "capoeriasongbookcontributor.cc"
}

//resource "cloudflare_record" "root" {
//  zone_id = var.zone_id
//  name    = "@"
//  value   = "142.250.179.174"
//  type    = "A"
//  proxied = true
//}

resource "cloudflare_record" "www" {
  zone_id = var.zone_id
  name    = "www"
  value   = "142.250.179.174"
  type    = "A"
  proxied = true
}


// TODO check if capoeriasongbookcontributor.cc is reachable

// TODO Add WAF -> Rate Limiting rule (don't need to create any other resource in theory)

// TODO Test if rate limiting is working

// TODO add redirection rule "Cloudflare rules -> Redirection rules -> Signle redirection"

// TODO test new endpoint is working correctly

// TODO have been following this:
// https://developers.cloudflare.com/terraform/tutorial/initialize-terraform/
// But not sure if we need something different than this