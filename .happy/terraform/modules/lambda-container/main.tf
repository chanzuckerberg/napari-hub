module lambda {
  source  = "terraform-aws-modules/lambda/aws"
  version = "3.3.1"
  publish = var.provisioned_lambda == -1 ? false : true

  function_name          = var.function_name
  description            = var.description
  tags                   = var.tags
  create_package         = false
  image_uri              = "${var.image_repo}@${data.aws_ecr_image.image.image_digest}"
  package_type           = "Image"
  timeout                = var.timeout
  image_config_command   = var.cmd
  environment_variables  = var.environment
  vpc_subnet_ids         = var.vpc_config == null ? null : var.vpc_config.subnet_ids
  vpc_security_group_ids = var.vpc_config == null ? null : var.vpc_config.security_group_ids

  memory_size                       = var.memory_size
  ephemeral_storage_size            = var.ephemeral_storage_size
  maximum_retry_attempts            = var.maximum_retry_attempts
  kms_key_arn                       = var.kms_key_arn
  role_name                         = var.function_name
  role_path                         = var.lambda_role_path
  lambda_at_edge                    = var.at_edge
  cloudwatch_logs_retention_in_days = var.log_retention_in_days
  attach_network_policy             = true
  reserved_concurrent_executions    = var.reserved_concurrent_executions
  allowed_triggers                  = var.allowed_triggers
}

resource "aws_lambda_provisioned_concurrency_config" "provisioned" {
  count = var.provisioned_lambda > 0 ? 1 : 0
  function_name                     = module.lambda.lambda_function_name
  provisioned_concurrent_executions = var.provisioned_lambda
  qualifier                         = module.lambda.lambda_function_version

  lifecycle {
    create_before_destroy = true
  }
}

data "aws_ecr_image" "image" {
  repository_name = split("/", var.image_repo)[1]
  image_tag       = var.image_tag
}

# worked around unfixed issue https://github.com/terraform-aws-modules/terraform-aws-lambda/issues/263
resource "aws_lambda_function_event_invoke_config" "this" {
  count = var.create_async_event_config ? 1 : 0

  function_name = var.function_name

}
