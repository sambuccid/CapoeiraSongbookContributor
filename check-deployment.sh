#!/bin/bash
set -e

aws cloudformation describe-stack-events \
  --stack-name capoeira-songbook-contributor \
  | head -n 12
