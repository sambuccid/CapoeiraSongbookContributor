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

variable "API_GATEWAY_DOMAIN_NAME" {
  type = string
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
  content   = var.API_GATEWAY_DOMAIN_NAME
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
    always_use_https = "on"
  }
}

resource "cloudflare_ruleset" "cache_rules" {
  zone_id     = var.zone_id
  name        = "Cache settings"
  description = "Set cache settings for incoming requests"
  kind        = "zone"
  phase       = "http_request_cache_settings"

  rules {
    ref         = "cache_settings"
    description = "Cache settings for all requests"
    expression  = true
    action      = "set_cache_settings"
    action_parameters {
      cache = false
    }
  }
}
