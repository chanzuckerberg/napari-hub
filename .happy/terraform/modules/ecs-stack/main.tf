# This deploys a Napari Hub stack.
#

data aws_secretsmanager_secret_version config {
  secret_id = var.happy_config_secret
}

locals {
  secret = jsondecode(data.aws_secretsmanager_secret_version.config.secret_string)
  alb_key = var.require_okta ? "private_albs" : "public_albs"

  custom_stack_name     = var.stack_name
  image_tag             = var.image_tag
  priority              = var.priority
  wait_for_steady_state = var.wait_for_steady_state

  frontend_cmd = []
  backend_cmd  = []

  security_groups     = local.secret["security_groups"]
  zone                = local.secret["zone_id"]
  cluster             = local.secret["cluster_arn"]
  frontend_image_repo = local.secret["ecrs"]["frontend"]["url"]
  backend_image_repo  = local.secret["ecrs"]["backend"]["url"]
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

  slack_url = try(local.secret["slack_url"], "")
  zulip_credentials = try(local.secret["zulip_credentials"], "")

  frontend_url = var.frontend_url != "" ? var.frontend_url: try(join("", ["https://", module.frontend_dns.dns_prefix, ".", local.external_dns]), var.frontend_url)
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
  image             = "${local.frontend_image_repo}:${local.image_tag}"
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
  frontend_url      = local.frontend_url
  tags              = var.tags

  wait_for_steady_state = local.wait_for_steady_state
}

module backend_lambda {
  source            = "../lambda-container"
  custom_stack_name = local.custom_stack_name
  app_name          = "backend"
  image             = "${local.backend_image_repo}:${local.image_tag}"
  cmd               = local.backend_cmd
  tags              = var.tags

  vpc_config = {
    subnet_ids         = local.cloud_env.private_subnets
    security_group_ids = local.security_groups
  }

  environment = {
    "BUCKET" = local.data_bucket_name
    "BUCKET_PATH" = ""
    "GOOGLE_APPLICATION_CREDENTIALS" = "./credentials.json"
    "SLACK_URL" = local.slack_url
    "ZULIP_CREDENTIALS" = local.zulip_credentials
  }

  log_retention_in_days = 14
  timeout               = 30
}

module api_gateway_proxy_stage {
  source               = "../api-gateway-proxy-stage"
  lambda_function_name = module.backend_lambda.function_name
  tags                 = var.tags
  custom_stack_name    = local.custom_stack_name
  app_name             = "backend"
  cloud_env            = local.cloud_env
  rest_api_id          = local.rest_api_id
  deployment_id        = local.deployment_id
}

# Cron job running the update endpoint
resource "aws_cloudwatch_event_rule" "update_rule" {
  name                = "${var.env}-${local.custom_stack_name}-update"
  description         = "Schedule update for backend"
  schedule_expression = "rate(5 minutes)"
  tags                = var.tags
}

resource "aws_cloudwatch_event_target" "update_target" {
    rule = aws_cloudwatch_event_rule.update_rule.name
    arn = module.backend_lambda.function_arn
    input_transformer {
        input_template = jsonencode({path = "/plugins/index/update", httpMethod = "GET"})
    }
}

locals {
  allowed_triggers = {
    LambdaPermission = {
      service    = "apigateway"
      source_arn = "${local.execution_arn}*"
    },
    AllowExecutionFromCloudWatch = {
      service    = "events"
      source_arn = aws_cloudwatch_event_rule.update_rule.arn
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
}

resource aws_iam_role_policy policy {
  name     = "${local.custom_stack_name}-${var.env}-policy"
  role     = module.backend_lambda.role_name
  policy   = data.aws_iam_policy_document.backend_policy.json
}
