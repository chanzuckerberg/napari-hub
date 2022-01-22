resource "aws_dynamodb_table" "plugin-data-table" {
  name           = "${local.custom_stack_name}-plugin-data"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "name"

  attribute {
    name = "name"
    type = "S"
  }

  attribute {
    name = "version"
    type = "S"
  }

  attribute {
    name = "visibility"
    type = "S"
  }
  
  attribute {
    name = "summary"
    type = "S"
  }

  attribute {
    name = "description"
    type = "S"
  }

  attribute {
    name = "description_text"
    type = "S"
  }

  attribute {
    name = "description_content_type"
    type = "S"
  }

  attribute {
    name = "authors"
    type = "S"
  }

  attribute {
    name = "license"
    type = "S"
  }

  attribute {
    name = "python_version"
    type = "S"
  }

  attribute {
    name = "operating_system"
    type = "S"
  }

  attribute {
    name = "release_date"
    type = "S"
  }

  attribute {
    name = "first_released"
    type = "S"
  }

  attribute {
    name = "development_status"
    type = "S"
  }

  attribute {
    name = "requirements"
    type = "S"
  }

  attribute {
    name = "project_site"
    type = "S"
  }

  attribute {
    name = "documentation"
    type = "S"
  }

  attribute {
    name = "support"
    type = "S"
  }

  attribute {
    name = "report_issues"
    type = "S"
  }

  attribute {
    name = "twitter"
    type = "S"
  }

  attribute {
    name = "code_repository"
    type = "S"
  }

  attribute {
    name = "citations"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  attribute {
    name = "category_hierarchy"
    type = "S"
  }

  global_secondary_index {
    name               = "PluginIndex"
    hash_key           = "name"
    range_key          = "version"
    projection_type    = "ALL"
  }

  tags = var.tags
}
