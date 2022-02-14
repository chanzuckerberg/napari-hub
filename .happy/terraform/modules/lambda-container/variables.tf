variable function_name {
  type        = string
  description = "Please provide the function name"
}

variable timeout {
  type        = number
  description = "Execution timeout for the lambda."
  default     = null
}

variable environment {
  type        = map(string)
  description = "Map of environment variables."
  default     = {}
}

variable kms_key_arn {
  type        = string
  description = "KMS key used to encrypt environment variables."
  default     = null
}

variable log_retention_in_days {
  type    = number
  default = null
}

variable function_description {
  type        = string
  description = "Description for lambda function."
  default     = ""
}

variable lambda_role_path {
  type        = string
  description = "The path to the IAM role for lambda."
  default     = null
}

variable at_edge {
  type        = bool
  description = "Is this lambda going to be used with a Cloufront distribution? If you set this, you will not have control over log retention, and you cannot include environment variables."
  default     = false
}

variable reserved_concurrent_executions {
  type        = number
  description = "Set reserved_concurrent_executions for this function. See [docs](https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html)."
  default     = -1 // aws default
}

variable provisioned_lambda {
  type        = number
  description = "Set provisioned_concurrent_executions for this function. See [docs](https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html)."
  default     = -1 // aws default
}

variable vpc_config {
  type = object({
    subnet_ids         = list(string),
    security_group_ids = list(string)
  })

  description = "The lambda's vpc configuration"
  default     = null
}

variable memory_size {
  type        = number
  description = "Amount of memory to allocate to the lambda"
  default     = 128
}

variable allowed_triggers {
  description = "Map of allowed triggers to create Lambda permissions"
  type        = map(any)
  default     = {}
}

variable tags {
  type    = map(string)
  default = {}
}

variable image {
  type = string
}

variable cmd {
  type = list(string)
}

variable description {
  type    = string
  default = ""
}