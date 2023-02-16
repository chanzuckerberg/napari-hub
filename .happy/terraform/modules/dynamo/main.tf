module dynamodb {
  source   = "terraform-aws-modules/dynamodb-table/aws"
  version = "3.3.2"

  name = var.table_name
  hash_key = var.hash_key
  range_key = var.range_key
  attributes = var.attributes
  table_class = var.table_class

  point_in_time_recovery_enabled = var.tags.env == "prod" ? true : false

  autoscaling_enabled = var.autoscaling_enabled
  create_table = var.create_table
  tags = var.tags
}
