locals {
  metrics_namespace = "${var.stack_name}-metrics"
  period            = var.env == "prod" ? 300 : 3600
}

resource aws_sns_topic alarm_sns {
  name  = "${var.stack_name}-alarm"
  count = var.alarms_enabled ? 1 : 0
  tags  = var.tags
}

locals {
  alarm_sns_arn = var.alarms_enabled ? aws_sns_topic.alarm_sns[0].arn : ""
}

resource aws_sns_topic_subscription alarm_sns_subscription {
  endpoint  = "napari-hub-monitoring@chanzuckerberg.com"
  protocol  = "email"
  topic_arn = local.alarm_sns_arn
  count     = var.alarms_enabled ? 1 : 0
}

data aws_iam_policy_document sns_topic_policy {
  policy_id = "__default_policy_ID"

  statement {
    actions = ["SNS:Publish"]
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    resources = [local.alarm_sns_arn]
    sid = "__default_statement_ID"
  }
}

resource aws_sns_topic_policy alarm_sns_policy {
  arn    = local.alarm_sns_arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
  count  = var.alarms_enabled ? 1 : 0
}

resource aws_cloudwatch_log_metric_filter backend_api_500_log_metric {
  name            = "${var.stack_name}-backend-500-metric"
  log_group_name  = var.backend_lambda_log_group_name
  pattern         = " 500 INTERNAL SERVER ERROR"
  count           = var.metrics_enabled ? 1 : 0

  metric_transformation {
    name      = "${var.stack_name}-backend-500"
    namespace = local.metrics_namespace
    value     = "1"
    unit      = "Count"
  }
}

resource aws_cloudwatch_log_metric_filter data_workflows_metrics_update_successful {
  name            = "${var.stack_name}-data-workflows-metrics-update-successful"
  log_group_name  = var.data_workflows_lambda_log_group_name
  pattern         = "Update successful for type=activity"
  count           = var.metrics_enabled ? 1 : 0

  metric_transformation {
    name      = "${var.stack_name}-data-workflows-metrics-update-successful"
    namespace = local.metrics_namespace
    value     = "1"
    unit      = "Count"
  }
}

resource aws_cloudwatch_log_metric_filter data_workflows_plugin_update_successful {
  name            = "${var.stack_name}-data-workflows-plugin-update-successful"
  log_group_name  = var.data_workflows_lambda_log_group_name
  pattern         = "Update successful for type=plugin"
  count           = var.metrics_enabled ? 1 : 0

  metric_transformation {
    name      = "${var.stack_name}-data-workflows-plugin-update-successful"
    namespace = local.metrics_namespace
    value     = "1"
    unit      = "Count"
  }
}

resource aws_cloudwatch_log_metric_filter frontend_error {
  name            = "${var.stack_name}-frontend-error"
  log_group_name  = var.frontend_log_group_name
  pattern         = "{ $.level = \"error\" && $.error != %404% }"
  count           = var.metrics_enabled ? 1 : 0

  metric_transformation {
    name      = "${var.stack_name}-frontend-error"
    namespace = local.metrics_namespace
    value     = "1"
    unit      = "Count"
  }
}

resource aws_cloudwatch_log_metric_filter frontend_uncaught_error {
  name            = "${var.stack_name}-frontend-uncaught-error"
  log_group_name  = var.frontend_rum_log_group_name
  pattern         = join(" ", [
    "\"com.amazon.rum.js_error_event\"",
    # Errors that occur when fetching RUM credentials. Safe to ignore because
    # this is due to the user's network environment:
    # https://github.com/aws-observability/aws-rum-web/issues/227#issuecomment-1252712017
    "-\"CWR: Failed to retrieve Cognito identity\"",
    "-\"CWR: Failed to retrieve credentials\"",
    "-\"CWR: Failed to retrieve Cognito OpenId token\"",
    "-\"CWR: Failed to retrieve credentials from STS\"",
    # Below errors are safe to ignore because they occur intermittently and do
    # not impact the user's abilty to use the napari hub
    "-\"ResizeObserver loop\"",
    "-\"Script error\"",
    "-\"The request is not allowed by the user agent\"",
  ])
  count           = var.metrics_enabled ? 1 : 0

  metric_transformation {
    name      = "${var.stack_name}-frontend-uncaught-error"
    namespace = local.metrics_namespace
    value     = "1"
    unit      = "Count"
  }
}

locals {
  backend_api_500_log_metric_name = var.metrics_enabled ? aws_cloudwatch_log_metric_filter.backend_api_500_log_metric[0].name : "backend_api_500_log_metric"
  data_workflows_metrics_update_successful_name = var.metrics_enabled ? aws_cloudwatch_log_metric_filter.data_workflows_metrics_update_successful[0].name : "data_workflows_metrics_update_successful"
  data_workflows_plugin_update_successful_name = var.metrics_enabled ? aws_cloudwatch_log_metric_filter.data_workflows_plugin_update_successful[0].name : "data_workflows_plugin_update_successful"
  frontend_error_name = var.metrics_enabled ? aws_cloudwatch_log_metric_filter.frontend_error[0].name : "frontend_error"
  frontend_uncaught_error_name = var.metrics_enabled ? aws_cloudwatch_log_metric_filter.frontend_uncaught_error[0].name : "frontend_uncaught_error"
}

module backend_api_500_alarm {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  alarm_actions       = [local.alarm_sns_arn]
  alarm_name          = "${var.stack_name}-backend-500-alarm"
  alarm_description   = "API returning 500s"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  create_metric_alarm = var.alarms_enabled
  datapoints_to_alarm = 2
  evaluation_periods  = 3
  metric_name         = local.backend_api_500_log_metric_name
  namespace           = local.metrics_namespace
  period              = local.period
  statistic           = "Sum"
  tags                = var.tags
  threshold           = 1
}

module data_workflow_plugins_missing_update_alarm {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  alarm_actions       = [local.alarm_sns_arn]
  alarm_name          = "${var.stack_name}-dataworkflow-plugins-update-alarm"
  alarm_description   = "data-workflows plugin update failure"
  comparison_operator = "LessThanThreshold"
  create_metric_alarm = var.alarms_enabled
  datapoints_to_alarm = 2
  evaluation_periods  = 3
  metric_name         = local.data_workflows_plugin_update_successful_name
  namespace           = local.metrics_namespace
  period              = local.period
  statistic           = "Sum"
  tags                = var.tags
  threshold           = 1
  treat_missing_data  = "breaching"
}

module data_workflows_metrics_missing_update_alarm {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  alarm_actions       = [local.alarm_sns_arn]
  alarm_name          = "${var.stack_name}-data-workflows-metrics-missing-update-alarm"
  alarm_description   = "Metrics update failure for data-workflows"
  comparison_operator = "LessThanThreshold"
  create_metric_alarm = var.alarms_enabled
  datapoints_to_alarm = 1
  evaluation_periods  = 1
  metric_name         = local.data_workflows_metrics_update_successful_name
  namespace           = local.metrics_namespace
  period              = 86400
  statistic           = "Sum"
  tags                = var.tags
  threshold           = 1
  treat_missing_data  = "breaching"
}

module backend_lambda_errors_alarm {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  create_metric_alarm = var.alarms_enabled
  alarm_name          = "${var.stack_name}-backend-lambda-error-alarm"
  alarm_description   = "Errors in backend lambda execution"
  alarm_actions = [local.alarm_sns_arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 3
  threshold           = 1
  datapoints_to_alarm = 2
  metric_query = [{
    id = "error_sum"

    return_data = true
    expression  = "SUM(METRICS())"
    label       = "Total Error Count"
    }, {
    id = "backend_error"

    metric = [{
      namespace   = "AWS/Lambda"
      metric_name = "Error"
      period      = local.period
      stat        = "Sum"
      unit        = "Count"

      dimensions = {
        FunctionName = var.backend_lambda_function_name
      }
    }]
    }]
  tags = var.tags
}

module data_workflows_lambda_errors_alarm {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  create_metric_alarm = var.alarms_enabled
  alarm_name          = "${var.stack_name}-data-workflows-lambda-error-alarm"
  alarm_description   = "Errors in data-workflows lambda execution"
  alarm_actions = [local.alarm_sns_arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 2
  datapoints_to_alarm = 1
  metric_query = [{
    id = "error_sum"

    return_data = true
    expression  = "SUM(METRICS())"
    label       = "Total Error Count"
    }, {
    id = "data_workflows_error"

    metric = [{
      namespace   = "AWS/Lambda"
      metric_name = "Error"
      period      = local.period
      stat        = "Sum"
      unit        = "Count"

      dimensions = {
        FunctionName = var.data_workflows_lambda_function_name
      }
    }]
    }]
  tags = var.tags
}

module plugin_lambda_errors_alarm {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  create_metric_alarm = var.alarms_enabled
  alarm_name          = "${var.stack_name}-plugin-lambda-error-alarm"
  alarm_description   = "Errors in plugin lambda execution"
  alarm_actions = [local.alarm_sns_arn]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  threshold           = 1
  datapoints_to_alarm = 1
  metric_query = [{
    id = "error_sum"

    return_data = true
    expression  = "SUM(METRICS())"
    label       = "Total Error Count"
    }, {
    id = "plugin_error"

    metric = [{
      namespace   = "AWS/Lambda"
      metric_name = "Error"
      period      = local.period
      stat        = "Sum"
      unit        = "Count"

      dimensions = {
        FunctionName = var.plugins_lambda_function_name
      }
    }]
    }]
  tags = var.tags
}

module frontend_uncaught_error_alarm {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  alarm_actions       = [local.alarm_sns_arn]
  alarm_description   = "Errors that are not caught by any error handling on the frontend"
  alarm_name          = "${var.stack_name}-frontend-uncaught-error-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  create_metric_alarm = var.alarms_enabled
  datapoints_to_alarm = 2
  evaluation_periods  = 3
  metric_name         = local.frontend_uncaught_error_name
  namespace           = local.metrics_namespace
  period              = 60
  statistic           = "Sum"
  tags                = var.tags
  threshold           = 1
}

module frontend_error_alarm {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  alarm_actions       = [local.alarm_sns_arn]
  alarm_description   = "Errors that happen on the frontend that are handled by some form of error handling"
  alarm_name          = "${var.stack_name}-frontend-error-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  create_metric_alarm = var.alarms_enabled
  datapoints_to_alarm = 2
  evaluation_periods  = 3
  metric_name         = local.frontend_error_name
  namespace           = local.metrics_namespace
  period              = 60
  statistic           = "Sum"
  tags                = var.tags
  threshold           = 1
}
