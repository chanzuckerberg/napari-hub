#!/bin/sh

if ! command -v aws &> /dev/null; then
    echo "aws cli could not be found. Please install aws cli and rerun the script." \
    "Please find documentation here: " \
    "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit
fi

if ! command -v jq &> /dev/null; then
    echo "jq could not be found. Trying to install jq."

    if command -v brew &> /dev/null; then
      echo "Installing with brew"
      brew install jq
    elif command -v port &> /dev/null; then
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
  export AWS_ACCESS_KEY_ID=$CURRENT_AWS_ACCESS_KEY_ID
  export AWS_SECRET_ACCESS_KEY=$CURRENT_AWS_SECRET_ACCESS_KEY
  export AWS_DEFAULT_REGION=$CURRENT_AWS_DEFAULT_REGION
}

create_if_not_exists() {
  TABLE_NAME="$PREFIX-$1"
  if $(jq --arg table_name $TABLE_NAME '.TableNames | any(. == $table_name)' <<< "$TABLES_LIST_RESPONSE"); then
    echo "$TABLE_NAME exists"
  else
    echo "$TABLE_NAME table not found. Getting source table description with prefix $SOURCE_PREFIX-"

    SOURCE_TABLE=$(aws dynamodb describe-table --table-name "$SOURCE_PREFIX-$1" --profile $AWS_PROFILE 2>&1)

    if ! $(jq 'has("Table")' <<< "$SOURCE_TABLE" &> /dev/null); then
      echo "Unable to fetch source table $SOURCE_TABLE"
      return 1
    fi

    ATTRIBUTE_DEFINITION=$(jq '.Table.AttributeDefinitions' <<< "$SOURCE_TABLE")
    KEY_SCHEMA=$(jq '.Table.KeySchema' <<< "$SOURCE_TABLE")

    echo "Creating $TABLE_NAME.."

    # TODO: Add support for advanced table creation attributes
    TABLE_CREATION=$(aws dynamodb create-table \
    --table-name "$TABLE_NAME" \
    --attribute-definitions "$ATTRIBUTE_DEFINITION" \
    --key-schema "$KEY_SCHEMA" \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
    --table-class STANDARD \
    --endpoint-url "$ENDPOINT_URL" 2>&1)

    if $(jq -e 'has("TableDescription") and .TableDescription.TableStatus == "ACTIVE"' <<< "$TABLE_CREATION"); then
      echo "$TABLE_NAME table created successfully. ARN: $(jq '.TableDescription.TableArn' <<< "$TABLE_CREATION")"
    else
      echo "Unable to create table: $TABLE_NAME"
    fi
  fi
}


CURRENT_AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
CURRENT_AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
CURRENT_AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION

export AWS_ACCESS_KEY_ID=fakeMyKeyId
export AWS_SECRET_ACCESS_KEY=fakeSecretAccessKey
export AWS_DEFAULT_REGION=us-west-2

SOURCE_PREFIX="staging"
if [ "$REMOTE_DYNAMO_PREFIX" != "" ]; then
  SOURCE_PREFIX=$REMOTE_DYNAMO_PREFIX
fi
echo "SOURCE_PREFIX=$SOURCE_PREFIX"

PREFIX="local"
if [ "$LOCAL_DYNAMO_PREFIX" != "" ]; then
  PREFIX=$LOCAL_DYNAMO_PREFIX
fi
echo "PREFIX=$PREFIX"

LOCAL_PORT=8000
if [ "$LOCAL_DYNAMO_PORT" != "" ]; then
  LOCAL_PORT=$LOCAL_DYNAMO_PORT
fi
echo "LOCAL_PORT=$LOCAL_PORT"

ENDPOINT_URL="http://localhost:$LOCAL_PORT"

# Get list of local tables
TABLES_LIST_RESPONSE=$(aws dynamodb list-tables --endpoint-url $ENDPOINT_URL 2>&1)

# Check for connection errors
if [[ $TABLES_LIST_RESPONSE == *"Could not connect to the endpoint URL"* ]]; then
  echo "Please confirm your local dynamo is running on port: $LOCAL_PORT."
fi

if $(jq -e 'has("TableNames")' <<< "$TABLES_LIST_RESPONSE" &> /dev/null); then
  echo "Successfully connected to dynamo running on $ENDPOINT_URL"
else
  echo "Unable to connect to dynamo on $ENDPOINT_URL"
  reset_updated_env_variables
  exit
fi

# Create tables that don't exist from source for table names passed as arguments
tables=("$@")
for table in "${tables[@]}"; do
  create_if_not_exists "$table"
done

reset_updated_env_variables
