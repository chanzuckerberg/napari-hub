output table_arn {
  description = "ARN of the DynamoDB table"
  value       = module.dynamodb.dynamodb_table_arn
}
