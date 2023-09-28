output table_arn {
  description = "ARN of the DynamoDB table"
  value       = module.dynamodb.dynamodb_table_arn
}

output stream_arn {
  description = "ARN of the DynamoDB table Stream"
  value = module.dynamodb.dynamodb_table_stream_arn
}

output stream_label {
  description = "Label of the DynamoDB table Stream"
  value = module.dynamodb.dynamodb_table_stream_label
}
