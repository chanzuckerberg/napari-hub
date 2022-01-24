output plugin_data_table_arn {
  value = aws_dynamodb_table.plugin_data_table.arn
}

output excluded_plugin_table_arn {
  value = aws_dynamodb_table.excluded_plugin_table.arn
}

output category_table_arn {
  value = aws_dynamodb_table.category_table.arn
}
