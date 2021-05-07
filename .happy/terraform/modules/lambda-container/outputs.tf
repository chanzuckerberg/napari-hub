# Lambda Function
output function_arn {
  description = "The ARN of the Lambda Function"
  value       = module.lambda.lambda_function_arn
}

output function_invoke_arn {
  description = "The Invoke ARN of the Lambda Function"
  value       = module.lambda.lambda_function_invoke_arn
}

output function_name {
  description = "The name of the Lambda Function"
  value       = module.lambda.lambda_function_name
}

output function_qualified_arn {
  description = "The ARN identifying your Lambda Function Version"
  value       = module.lambda.lambda_function_qualified_arn
}

output function_version {
  description = "Latest published version of Lambda Function"
  value       = module.lambda.lambda_function_version
}

output function_last_modified {
  description = "The date Lambda Function resource was last modified"
  value       = module.lambda.lambda_function_last_modified
}

output function_kms_key_arn {
  description = "The ARN for the KMS encryption key of Lambda Function"
  value       = module.lambda.lambda_function_kms_key_arn
}

# IAM Role
output role_arn {
  description = "The ARN of the IAM role created for the Lambda Function"
  value       = module.lambda.lambda_role_arn
}

output role_name {
  description = "The name of the IAM role created for the Lambda Function"
  value       = module.lambda.lambda_role_name
}

# CloudWatch Log Group
output cloudwatch_log_group_arn {
  description = "The ARN of the Cloudwatch Log Group"
  value       = module.lambda.lambda_cloudwatch_log_group_arn
}

output cloudwatch_log_group_name {
  description = "The name of the Cloudwatch Log Group"
  value       = module.lambda.lambda_cloudwatch_log_group_name
}
