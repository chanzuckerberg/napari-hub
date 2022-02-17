resource aws_api_gateway_stage api_stage {
  stage_name            = var.custom_stack_name
  rest_api_id           = var.rest_api_id
  deployment_id         = var.deployment_id
  cache_cluster_enabled = var.tags.env == "prod" ? true : false
  cache_cluster_size    = 6.1

  # See sci-imaging/terraform/modules/happy-napari-hub/api_gateway.tf
  # for more information about how this is used to redirect to different
  # lambdas for each happy stack.
  variables = {
    "lambda_function_name": var.lambda_function_name
  }
}

resource aws_api_gateway_method_settings proxy_cache {
  count = var.tags.env == "prod" ? 1 : 0
  rest_api_id = var.rest_api_id
  stage_name  = aws_api_gateway_stage.api_stage.stage_name
  method_path = "{proxy+}/GET"

  settings {
    caching_enabled = true
  }
}

resource aws_api_gateway_method_settings root_cache {
  count = var.tags.env == "prod" ? 1 : 0
  rest_api_id = var.rest_api_id
  stage_name  = aws_api_gateway_stage.api_stage.stage_name
  method_path = "/GET"

  settings {
    caching_enabled = true
  }
}