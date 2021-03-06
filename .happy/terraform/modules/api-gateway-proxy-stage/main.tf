resource aws_api_gateway_stage api_stage {
  stage_name            = var.custom_stack_name
  rest_api_id           = var.rest_api_id
  deployment_id         = var.deployment_id
  cache_cluster_enabled = true
  cache_cluster_size    = 0.5

  # See sci-imaging/terraform/modules/happy-napari-hub/api_gateway.tf
  # for more information about how this is used to redirect to different
  # lambdas for each happy stack.
  variables = {
    "lambda_function_name": var.lambda_function_name
  }
}

resource aws_api_gateway_method_settings api_gateway_stage_setting {
  rest_api_id = var.rest_api_id
  stage_name  = aws_api_gateway_stage.api_stage.stage_name
  method_path = "*/*"

  settings {
    data_trace_enabled = false
    metrics_enabled    = false
    logging_level      = "OFF"
  }
}
