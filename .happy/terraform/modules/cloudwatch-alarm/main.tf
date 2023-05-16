locals {
  metrics_namespace = "${var.stack_name}-metrics"
  period            = var.env == "prod" ? 300 : 3600
}

resource aws_sns_topic alarm_sns {
  name          = "${var.stack_name}-alarm"
  count         = var.alarms_enabled ? 1 : 0
  tags          = var.tags
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

    resources = [aws_sns_topic.alarm_sns[0].arn]
    sid = "__default_statement_ID"
  }
}

resource aws_sns_topic_policy alarm_sns_policy {
  arn    = aws_sns_topic.alarm_sns[0].arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
  count  = var.alarms_enabled ? 1 : 0
}

resource aws_cloudwatch_log_metric_filter backend_api_500_log_metric {
  name            = "${var.stack_name}-backend-500-metric-filter"
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

resource aws_cloudwatch_log_metric_filter backend_plugin_update_successful {
  name            = "${var.stack_name}-backend-plugin-update-successful"
  log_group_name  = var.backend_lambda_log_group_name
  pattern         = "plugin update successful"
  count           = var.metrics_enabled ? 1 : 0

  metric_transformation {
    name      = "${var.stack_name}-backend-plugin-update-successful"
    namespace = local.metrics_namespace
    value     = "1"
    unit      = "Count"
  }
}

resource aws_cloudwatch_log_metric_filter backend_metrics_update_successful {
  name            = "${var.stack_name}-backend-metrics-update-successful"
  log_group_name  = var.backend_lambda_log_group_name
  pattern         = "Completed data refresh for metrics successfully"
  count           = var.metrics_enabled ? 1 : 0

  metric_transformation {
    name      = "${var.stack_name}-backend-metrics-update-successful"
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

module backend_api_500_alarm {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  alarm_actions       = [aws_sns_topic.alarm_sns[0].arn]
  alarm_name          = "${var.stack_name}-backend-500-alarm"
  alarm_description   = "API returning 500s"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  create_metric_alarm = var.alarms_enabled
  datapoints_to_alarm = 1
  evaluation_periods  = 2
  metric_name         = aws_cloudwatch_log_metric_filter.backend_api_500_log_metric[0].name
  namespace           = local.metrics_namespace
  period              = local.period
  statistic           = "Sum"
  tags                = var.tags
  threshold           = 2
}

module plugins_missing_update_alarm {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  alarm_actions       = [aws_sns_topic.alarm_sns[0].arn]
  alarm_name          = "${var.stack_name}-plugins-missing-update-alarm"
  alarm_description   = "Plugin update failure"
  comparison_operator = "LessThanThreshold"
  create_metric_alarm = var.alarms_enabled
  datapoints_to_alarm = 2
  evaluation_periods  = 3
  metric_name         = aws_cloudwatch_log_metric_filter.backend_plugin_update_successful[0].name
  namespace           = local.metrics_namespace
  period              = local.period
  statistic           = "Sum"
  tags                = var.tags
  threshold           = 2
}

module metrics_missing_update_alarm {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  alarm_actions       = [aws_sns_topic.alarm_sns[0].arn]
  alarm_name          = "${var.stack_name}-metrics-missing-update-alarm"
  alarm_description   = "Metrics update failure"
  comparison_operator = "LessThanThreshold"
  create_metric_alarm = var.alarms_enabled
  datapoints_to_alarm = 1
  evaluation_periods  = 1
  metric_query = [{
    id = "success_count"

    return_data = true
    expression  = "SUM(METRICS())"
    label       = "Total Count of Success"
    }, {
    id = "backend_workflows_successful"

    metric = [{
      namespace   = local.metrics_namespace
      metric_name = aws_cloudwatch_log_metric_filter.backend_metrics_update_successful[0].name
      period      = 86400
      stat        = "Sum"
      unit        = "Count"
    }]
    }, {
    id = "data_workflows_successful"

    metric = [{
      namespace   = local.metrics_namespace
      metric_name = aws_cloudwatch_log_metric_filter.data_workflows_metrics_update_successful[0].name
      period      = 86400
      stat        = "Sum"
      unit        = "Count"
    }]
    },
  ]
  tags                = var.tags
  threshold           = 1
}

module lambda_errors_alarm {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  create_metric_alarm = var.alarms_enabled
  alarm_name          = "${var.stack_name}-lambda-error-alarm"
  alarm_description   = "Errors in lambda execution"
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

  alarm_actions = [aws_sns_topic.alarm_sns[0].arn]
  tags = var.tags
}
