#!/bin/bash
set -e

BUCKET=$1

echo "Emptying bucket"
aws s3 rm "s3://$BUCKET" --recursive
