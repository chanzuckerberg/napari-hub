#!/bin/sh

if ! command -v aws 2>&1 /dev/null; then
    echo "aws cli could not be found. Please install aws cli and rerun the script." \
    "Please find documentation here: " \
    "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit
fi

if ! command -v jq 2>&1 /dev/null; then
    echo "jq could not be found. Trying to install jq."

    if command -v brew 2>&1 /dev/null; then
      echo "Installing with brew"
      brew install jq
    elif command -v port 2>&1 /dev/null; then
      echo "Installing with port"
      port install jq
    else
      echo "Unable to install jq, please install jq and rerun the script." \
      "Please find documentation here: https://stedolan.github.io/jq/download/"
    fi
    exit
fi

reset_updated_env_variables() {
  # Resets environment variables
  export AWS_ACCESS_KEY_ID=$current_aws_access_key
  export AWS_SECRET_ACCESS_KEY=$current_aws_secret_key
  export AWS_DEFAULT_REGION=$current_aws_default_region
}

create_if_not_exists() {
  name="$local_dynamo_prefix-$1"
  if echo "$list_tables_resp" | jq -e --arg name "$name" '.TableNames | any(. == $name)' > /dev/null; then
    echo "$name exists"
  else
    echo "$name table not found. Getting source table description with prefix $remote_dynamo_prefix-"

    source_table=$(aws dynamodb describe-table --table-name "$remote_dynamo_prefix-$1" --profile "$AWS_PROFILE" 2>&1)

    if ! (echo "$source_table" | jq -e '. | has("Table")' > /dev/null); then
      echo "Unable to fetch source table $source_table"
      return 1
    fi

    attribute_definitions=$(echo "$source_table" | jq '.Table.AttributeDefinitions')
    key_schema=$(echo "$source_table" | jq '.Table.KeySchema')

    optional_params=()
    gsi=$(echo "$source_table" | jq --argjson provisioning "$default_provisioning" \
      '[.Table | .GlobalSecondaryIndexes[]?
      | {IndexName, KeySchema, Projection, "ProvisionedThroughput": $provisioning}]')

    [ "$gsi" != "[]" ] && optional_params+=(--global-secondary-indexes "$gsi")

    echo "Creating $name.."

    create_table_resp=$(aws dynamodb create-table \
    --table-name "$name" \
    --attribute-definitions "$attribute_definitions" \
    --key-schema "$key_schema" \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
    --table-class STANDARD \
    --endpoint-url "$endpoint_url" \
    "${optional_params[@]}")

    if echo "$create_table_resp" | jq -e 'has("TableDescription") and .TableDescription.TableStatus == "ACTIVE"' > /dev/null; then
      echo "$name table created successfully.
        table arn: $(jq '.TableDescription.TableArn' <<< "$create_table_resp")"
    else
      echo "Unable to create table: $name"
    fi
  fi
}


current_aws_access_key=$AWS_ACCESS_KEY_ID
current_aws_secret_key=$AWS_SECRET_ACCESS_KEY
current_aws_default_region=$AWS_DEFAULT_REGION

export AWS_ACCESS_KEY_ID="fakeMyKeyId"
export AWS_SECRET_ACCESS_KEY="fakeSecretAccessKey"
export AWS_DEFAULT_REGION="us-west-2"

remote_dynamo_prefix="staging"
if [ "$REMOTE_DYNAMO_PREFIX" != "" ]; then
  remote_dynamo_prefix=$REMOTE_DYNAMO_PREFIX
fi
echo "remote_dynamo_prefix=$remote_dynamo_prefix"

local_dynamo_prefix="local"
if [ "$LOCAL_DYNAMO_PREFIX" != "" ]; then
  local_dynamo_prefix=$LOCAL_DYNAMO_PREFIX
fi
echo "local_dynamo_prefix=$local_dynamo_prefix"

local_port=8000
if [ "$LOCAL_DYNAMO_PORT" != "" ]; then
  local_port=$LOCAL_DYNAMO_PORT
fi
echo "local_port=$local_port"

endpoint_url="http://localhost:$local_port"
default_provisioning='{"ReadCapacityUnits": 1, "WriteCapacityUnits": 1}'

# Get list of local tables
list_tables_resp=$(aws dynamodb list-tables --endpoint-url "$endpoint_url" 2>&1)

# Check for connection errors
if [ "$list_tables_resp" = "*Could not connect to the endpoint URL*" ]; then
  echo "Please confirm your local dynamo is running on port: $local_port."
fi

if echo "$list_tables_resp" | jq -e 'has("TableNames")' > /dev/null; then
  echo "Successfully connected to dynamo running on $endpoint_url"
else
  echo "Unable to connect to dynamo on $endpoint_url"
  reset_updated_env_variables
  exit
fi

# Create tables that don't exist from source for table names passed as arguments
for table in "$@"; do
  create_if_not_exists "$table"
done

reset_updated_env_variables
