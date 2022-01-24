resource "aws_dynamodb_table" "plugin_data_table" {
  name           = "${var.custom_stack_name}-plugin-data"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "name"
  range_key      = "version"

  attribute {
    name = "name"
    type = "S"
  }

  attribute {
    name = "version"
    type = "S"
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "excluded_plugin_table" {
  name           = "${var.custom_stack_name}-excluded-plugin"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "name"

  attribute {
    name = "name"
    type = "S"
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "category_table" {
  name           = "${var.custom_stack_name}-category"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "name"
  range_key      = "version"

  attribute {
    name = "name"
    type = "S"
  }

  attribute {
    name = "version"
    type = "S"
  }

  tags = var.tags
}
