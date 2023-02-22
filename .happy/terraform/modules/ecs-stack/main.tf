# This deploys a Napari Hub stack.
#

data aws_secretsmanager_secret_version config {
  secret_id = var.happy_config_secret
}

locals {
  secret = jsondecode(data.aws_secretsmanager_secret_version.config.secret_string)
  alb_key = "public_albs"

  custom_stack_name     = var.stack_name
  image_tag             = var.image_tag
  priority              = var.priority
  wait_for_steady_state = var.wait_for_steady_state

  frontend_cmd = []
  backend_cmd  = []
  plugins_cmd  = []
  data_workflows_cmd = []

  security_groups     = local.secret["security_groups"]
  zone                = local.secret["zone_id"]
  cluster             = local.secret["cluster_arn"]
  frontend_image_repo = local.secret["ecrs"]["frontend"]["url"]
  backend_image_repo  = local.secret["ecrs"]["backend"]["url"]
  plugins_image_repo  = local.secret["ecrs"]["plugins"]["url"]
  data_workflows_image_repo  = local.secret["ecrs"]["data-workflows"]["url"]
  external_dns        = local.secret["external_zone_name"]
  internal_dns        = local.secret["internal_zone_name"]
  rest_api_id         = local.secret["api_gateway"]["rest_api_id"]
  execution_arn       = local.secret["api_gateway"]["execution_arn"]
  deployment_id       = local.secret["api_gateway"]["deployment_id"]
  cloud_env           = local.secret["cloud_env"]

  data_bucket_arn       = local.secret["s3_buckets"]["data"]["arn"]
  data_bucket_name      = local.secret["s3_buckets"]["data"]["name"]
  frontend_ecs_role_arn = local.secret["service_roles"]["frontend_ecs_role"]

  frontend_listener_arn = try(local.secret[local.alb_key]["frontend"]["listener_arn"], "")
  frontend_alb_zone     = try(local.secret[local.alb_key]["frontend"]["zone_id"], "")
  frontend_alb_dns      = try(local.secret[local.alb_key]["frontend"]["dns_name"], "")

  slack_url = try(local.secret["slack"]["url"], "")
  zulip_credentials = try(local.secret["zulip"]["credentials"], "")
  github_client_id = try(local.secret["github"]["client_id"], "")
  github_client_secret = try(local.secret["github"]["client_secret"], "")
  github_app_id = try(local.secret["github"]["app_id"], "")
  github_app_key = try(local.secret["github"]["app_key"], "")
  github_app_secret = try(local.secret["github"]["app_secret"], "")
  datadog_api_key = try(local.secret["datadog"]["api_key"], "")
  snowflake_user = try(local.secret["snowflake"]["user"], "")
  snowflake_password = try(local.secret["snowflake"]["password"], "")
  split_io_server_key = try(local.secret["split.io"]["server_key"], "")

  frontend_url = var.frontend_url != "" ? var.frontend_url: try(join("", ["https://", module.frontend_dns.dns_prefix, ".", local.external_dns]), var.frontend_url)
  backend_function_name = "${local.custom_stack_name}-backend"
  plugins_function_name = "${local.custom_stack_name}-plugins"
  data_workflows_function_name = "${local.custom_stack_name}-data-workflows"

  plugin_update_schedule = var.env == "prod" ? "rate(5 minutes)" : var.env == "staging" ? "rate(1 hour)" : "rate(1 day)"
}

module frontend_dns {
  source                = "../dns"
  custom_stack_name     = local.custom_stack_name
  app_name              = "frontend"
  alb_dns               = local.frontend_alb_dns
  canonical_hosted_zone = local.frontend_alb_zone
  zone                  = local.external_dns
}

module frontend_service {
  source            = "../service"
  custom_stack_name = local.custom_stack_name
  app_name          = "napari-hub-frontend"
  vpc               = local.cloud_env.vpc_id
  image_repo         = local.frontend_image_repo
  image_tag          = local.image_tag
  cluster           = local.cluster
  desired_count     = var.frontend_instance_count
  listener          = local.frontend_listener_arn
  subnets           = local.cloud_env.private_subnets
  security_groups   = local.security_groups
  task_role_arn     = local.frontend_ecs_role_arn
  service_port      = 8080
  env               = var.env
  host_match        = var.frontend_url != "" ? "": join(".", [module.frontend_dns.dns_prefix, local.external_dns])
  priority          = local.priority
  api_url           = module.api_gateway_proxy_stage.invoke_url
  github_client_id  = local.github_client_id
  github_client_secret = local.github_client_secret
  split_io_server_key = local.split_io_server_key
  frontend_url      = local.frontend_url
  tags              = var.tags

  wait_for_steady_state = local.wait_for_steady_state
}

resource "random_uuid" "api_key" {
}

module install_dynamodb_table {
  source              = "../dynamo"
  table_name          = "${local.custom_stack_name}-install-activity"
  hash_key            = "plugin_name"
  range_key           = "type_timestamp"
  attributes          = [
                          {
                            name = "plugin_name"
                            type = "S"
                          },
                          {
                            name = "type_timestamp"
                            type = "S"
                          }
                        ]
  autoscaling_enabled = var.env == "dev" ? false : true
  create_table        = true
  tags                = var.tags
}

module backend_lambda {
  source             = "../lambda-container"
  function_name      = local.backend_function_name
  image_repo         = local.backend_image_repo
  image_tag          = local.image_tag
  cmd                = local.backend_cmd
  tags               = var.tags
  provisioned_lambda = var.env == "prod" ? 1 : -1

  vpc_config = {
    subnet_ids         = local.cloud_env.private_subnets
    security_group_ids = local.security_groups
  }

  environment = {
    "BUCKET" = local.data_bucket_name
    "BUCKET_PATH" = var.env == "dev" ? local.custom_stack_name : ""
    "GOOGLE_APPLICATION_CREDENTIALS" = "./credentials.json"
    "SLACK_URL" = local.slack_url
    "ZULIP_CREDENTIALS" = local.zulip_credentials
    "GITHUB_CLIENT_ID" = local.github_client_id
    "GITHUB_CLIENT_SECRET" = local.github_client_secret
    "GITHUBAPP_ID" = local.github_app_id
    "GITHUBAPP_KEY" = local.github_app_key
    "GITHUBAPP_SECRET" = local.github_app_secret
    "DD_API_KEY" = local.datadog_api_key
    "DD_ENV" = var.env
    "DD_SERVICE" = local.custom_stack_name
    "API_URL" = var.env == "dev" ? module.api_gateway_proxy_stage.invoke_url : ""
    "PLUGINS_LAMBDA_NAME" = local.plugins_function_name
    "SNOWFLAKE_USER" = local.snowflake_user
    "SNOWFLAKE_PASSWORD" = local.snowflake_password
    "API_KEY" = random_uuid.api_key.result
  }

  log_retention_in_days = 14
  timeout               = 300
  memory_size           = 256
}

module plugins_lambda {
  source             = "../lambda-container"
  function_name      = local.plugins_function_name
  image_repo         = local.plugins_image_repo
  image_tag          = local.image_tag
  cmd                = local.plugins_cmd
  tags               = var.tags

  vpc_config = {
    subnet_ids         = local.cloud_env.private_subnets
    security_group_ids = local.security_groups
  }

  environment = {
    "BUCKET" = local.data_bucket_name
    "BUCKET_PATH" = var.env == "dev" ? local.custom_stack_name : ""
  }

  log_retention_in_days = 14
  timeout               = 150
  memory_size           = 256
  ephemeral_storage_size = 512

}

module data_workflows_lambda {
  source                  = "../lambda-container"
  function_name           = local.data_workflows_function_name
  image_repo              = local.data_workflows_image_repo
  image_tag               = local.image_tag
  cmd                     = local.data_workflows_cmd
  tags                    = var.tags

  vpc_config              = {
    subnet_ids         = local.cloud_env.private_subnets
    security_group_ids = local.security_groups
  }

  environment             = {
    "SNOWFLAKE_USER" = local.snowflake_user
    "SNOWFLAKE_PASSWORD" = local.snowflake_password
  }

  log_retention_in_days   = 14
  timeout                 = 300
  memory_size             = 256
  ephemeral_storage_size  = 512
}

resource aws_ssm_parameter data_workflow_config {
  name        = "/${local.custom_stack_name}/napari-hub/data-workflows/config"
  type        = "SecureString"
  value       = jsonencode({last_activity_fetched_timestamp = 0})
  tags        = var.tags
  lifecycle {
    ignore_changes = [
      "value",
    ]
  }
}

resource aws_sqs_queue data_workflows_queue {
  name                        = "${local.custom_stack_name}-data-workflows"
  delay_seconds               = 0
  message_retention_seconds   = 86400
  receive_wait_time_seconds   = 10
  visibility_timeout_seconds  = 300
  policy                      = data.aws_iam_policy_document.data_workflows_sqs_policy.json
  tags                        = var.tags
}

resource "aws_lambda_event_source_mapping" "data_workflow_sqs_event_source_mapping" {
  event_source_arn = aws_sqs_queue.data_workflows_queue.arn
  function_name    = module.data_workflows_lambda.function_arn
  batch_size       = 1
}

module api_gateway_proxy_stage {
  source               = "../api-gateway-proxy-stage"
  lambda_function_name = local.backend_function_name
  tags                 = var.tags
  custom_stack_name    = local.custom_stack_name
  app_name             = "backend"
  cloud_env            = local.cloud_env
  rest_api_id          = local.rest_api_id
  deployment_id        = local.deployment_id
}

# Cron job running the update endpoint
resource "aws_cloudwatch_event_rule" "update_rule" {
  name                = "${local.custom_stack_name}-update"
  description         = "Schedule update for backend"
  schedule_expression = local.plugin_update_schedule
  tags                = var.tags
}

resource "aws_cloudwatch_event_target" "update_target" {
    rule = aws_cloudwatch_event_rule.update_rule.name
    arn = module.backend_lambda.function_arn
    input_transformer {
        input_template = jsonencode({
          path = "/update",
          httpMethod = "POST",
          headers = {"X-API-Key": random_uuid.api_key.result}
        })
    }
}

# Cron job updating the activity data
resource "aws_cloudwatch_event_rule" "activity_rule" {
  name                = "${local.custom_stack_name}-activity"
  description         = "Schedule update for activity data"
  schedule_expression = "cron(0 13 * * ? *)"
  tags                = var.tags
}

resource "aws_cloudwatch_event_target" "activity_target" {
    rule = aws_cloudwatch_event_rule.activity_rule.name
    arn = module.backend_lambda.function_arn
    input_transformer {
        input_template = jsonencode({
          path = "/activity/update",
          httpMethod = "POST",
          headers = {"X-API-Key": random_uuid.api_key.result}
        })
    }
}

resource "aws_cloudwatch_event_target" "activity_target_sqs" {
    rule = aws_cloudwatch_event_rule.activity_rule.name
    arn = aws_sqs_queue.data_workflows_queue.arn
    input_transformer {
        input_template = jsonencode({type = "activity"})
    }
}

locals {
  allowed_triggers = {
    LambdaPermission = {
      service    = "apigateway"
      source_arn = "${local.execution_arn}*"
    },
    AllowExecutionFromCloudWatchForPlugin = {
      service    = "events"
      source_arn = aws_cloudwatch_event_rule.update_rule.arn
    },
    AllowExecutionFromCloudWatchForActivity = {
      service    = "events"
      source_arn = aws_cloudwatch_event_rule.activity_rule.arn
    }
  }
}

# Breaking this out of terraform-aws-modules because triggers
resource "aws_lambda_permission" "unqualified_alias_triggers" {
  for_each = local.allowed_triggers

  function_name = module.backend_lambda.function_name

  statement_id       = lookup(each.value, "statement_id", each.key)
  action             = lookup(each.value, "action", "lambda:InvokeFunction")
  principal          = lookup(each.value, "principal", format("%s.amazonaws.com", lookup(each.value, "service", "")))
  source_arn         = lookup(each.value, "source_arn", null)
  source_account     = lookup(each.value, "source_account", null)
  event_source_token = lookup(each.value, "event_source_token", null)
}

# Let the Lambda Container read/write the bucket
data aws_iam_policy_document backend_policy {
  statement {
    actions = [
      "s3:PutObject",
      "s3:GetObject",
    ]

    resources = ["${local.data_bucket_arn}/*"]
  }

  statement {
    actions = [
      "dynamodb:GetItem",
      "dynamodb:Query",
    ]

    resources = [module.install_dynamodb_table.table_arn]
  }

  statement {
    actions = [
      "lambda:InvokeFunction"
    ]

    resources = [
      module.plugins_lambda.function_arn,
    ]
  }
}

data aws_iam_policy_document data_workflows_policy {
  statement {
    actions = [
      "dynamodb:Query",
      "dynamodb:BatchWriteItem",
    ]
    resources = [module.install_dynamodb_table.table_arn]
  }
  statement {
    actions = [
      "ssm:GetParameter",
      "ssm:PutParameter",
    ]
    resources = [aws_ssm_parameter.data_workflow_config.arn]
  }
  statement {
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
    ]
    resources = [aws_sqs_queue.data_workflows_queue.arn]
  }
}

data aws_iam_policy_document plugins_policy {
  statement {
    actions = [
      "s3:PutObject",
      "s3:GetObject",
    ]

    resources = ["${local.data_bucket_arn}/*"]
  }

  statement {
    actions = [
      "s3:ListBucket",
    ]

    resources = ["${local.data_bucket_arn}"]
  }
}

data aws_iam_policy_document data_workflows_sqs_policy {
  statement {
    actions = ["sqs:SendMessage"]
    resources = [aws_cloudwatch_event_rule.activity_rule.arn]
  }
  statement {
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
    ]
    resources = [module.data_workflows_lambda.function_arn]
  }
}

resource aws_iam_role_policy policy {
  name     = "${local.custom_stack_name}-policy"
  role     = module.backend_lambda.role_name
  policy   = data.aws_iam_policy_document.backend_policy.json
}

resource aws_iam_role_policy plugins_lambda_policy {
  name     = "${local.custom_stack_name}-plugins-lambda-policy"
  role     = module.plugins_lambda.role_name
  policy   = data.aws_iam_policy_document.plugins_policy.json
}

resource aws_iam_role_policy data_workflows_lambda_policy {
  name     = "${local.custom_stack_name}-data-workflows-lambda-policy"
  role     = module.data_workflows_lambda.role_name
  policy   = data.aws_iam_policy_document.data_workflows_policy.json
}

resource aws_acm_certificate cert {
  domain_name               = "${module.frontend_dns.dns_prefix}.${local.external_dns}"
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource aws_route53_record cert_validation {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = local.zone
}

resource aws_acm_certificate_validation cert {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource aws_lb_listener_certificate cert {
  depends_on      = [aws_acm_certificate_validation.cert]
  listener_arn    = local.frontend_listener_arn
  certificate_arn = aws_acm_certificate.cert.arn
}

resource "aws_lambda_function_event_invoke_config" "async-config" {
  function_name                = module.plugins_lambda.function_name
  maximum_event_age_in_seconds = 500
  maximum_retry_attempts       = 0
}
