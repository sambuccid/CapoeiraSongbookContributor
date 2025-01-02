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

resource "cloudflare_record" "api" {
  zone_id = var.zone_id
  name    = "api"
  value   = "d-alyavf0di6.execute-api.eu-west-2.amazonaws.com"
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_ruleset" "rate_limiting" {
  zone_id     = var.zone_id
  name        = "Rate limiting for my zone"
  description = ""
  kind        = "zone"
  phase       = "http_ratelimit"

  rules {
    ref         = "rate_limit_api_requests_ip"
    description = "Rate limit API requests by IP"
    expression  = "(http.request.uri.path wildcard \"*\")"
    action      = "block"
    ratelimit {
      characteristics = ["cf.colo.id", "ip.src"]
      period = 10
      requests_per_period = 1
      mitigation_timeout = 10
    }
  }
}

resource "cloudflare_zone_settings_override" "encript-backend-traffic" {
  zone_id = var.zone_id

  settings {
    ssl = "strict"
  }
}


// TODO check if is working on phones

// TODO need to re-apply all the steps done manually in AWS to cloudformation and update values here
//    and probably before we need to undo the ones done manually
//    Look at todo inside cloudformation.yml

// TODO change functional tests to point to new endpoint
//     Or at least add new test using new endpoint

// TODO move all terraform state to new PC
