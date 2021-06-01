locals {
  name = "${var.custom_stack_name}-${var.app_name}"
}

module lambda {
  source  = "terraform-aws-modules/lambda/aws"
  version = "2.0.0"

  function_name          = local.name
  description            = var.description
  tags                   = var.tags
  create_package         = false
  image_uri              = var.image
  package_type           = "Image"
  timeout                = var.timeout
  image_config_command   = var.cmd
  environment_variables  = var.environment
  vpc_subnet_ids         = var.vpc_config == null ? null : var.vpc_config.subnet_ids
  vpc_security_group_ids = var.vpc_config == null ? null : var.vpc_config.security_group_ids

  memory_size                       = var.memory_size
  kms_key_arn                       = var.kms_key_arn
  role_name                         = local.name
  role_path                         = var.lambda_role_path
  lambda_at_edge                    = var.at_edge
  cloudwatch_logs_retention_in_days = var.log_retention_in_days
  attach_network_policy             = true
  reserved_concurrent_executions    = var.reserved_concurrent_executions
  allowed_triggers                  = var.allowed_triggers
}
