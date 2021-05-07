#!/bin/bash
export AWS_REGION=us-west-2
export AWS_DEFAULT_REGION=us-west-2
export AWS_ACCESS_KEY_ID=nonce
export AWS_SECRET_ACCESS_KEY=nonce

export FRONTEND_URL=http://frontend.naparinet.local:8080
export BACKEND_URL=http://backend.naparinet.local:5000

# NOTE: This script is intended to run INSIDE the dockerized dev environment!
# If you need to run it directly on your laptop for some reason, change
# localstack below to localhost
export LOCALSTACK_URL=http://localstack.naparinet.local:4566

echo -n "waiting for localstack to be ready: "
until $(curl --output /dev/null --silent --head ${LOCALSTACK_URL}); do
    echo -n '.'
    sleep 1
done
echo " done"

echo "Creating s3 bucket secrets"
local_aws="aws --endpoint-url=${LOCALSTACK_URL}"
${local_aws} s3api create-bucket --bucket imaging-test-napari-hub &>/dev/null || true

echo
echo "Dev env is up and running!"
echo "  Frontend: ${FRONTEND_URL}"
echo "  Backend: ${BACKEND_URL}"
