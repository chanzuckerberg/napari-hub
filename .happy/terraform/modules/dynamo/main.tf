module dynamodb {
  source      = "terraform-aws-modules/dynamodb-table/aws"
  version     = "1.3.0"

  name        = var.table_name

  hash_key    = var.hash_key
  range_key   = var.range_key
  attributes  = var.attributes

  table_class = var.table_class

  global_secondary_indexes = var.global_secondary_indexes

  point_in_time_recovery_enabled = var.tags.env == "prod" ? true : false

  autoscaling_enabled = var.autoscaling_enabled
  create_table = var.create_table

  ttl_enabled = var.ttl_enabled
  ttl_attribute_name  = var.ttl_attribute_name

  tags = var.tags
}
