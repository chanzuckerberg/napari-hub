locals {
  metrics_namespace = "${var.stack_name}-metrics"
}

#module log_metric {
#  source  = "terraform-aws-modules/cloudwatch/aws//modules/log-metric-filter"
#  version = "3.3.0"
#
#  log_group_name = var.log_group_name
#
#  name    = "${var.name}-metric-filter"
#  pattern = var.metric_filter_pattern
#  metric_transformation_default_value = var.default_value
#  metric_transformation_value = var.value
#
#  metric_transformation_namespace = var.namespace
#  metric_transformation_name      = "${var.name}-metric"
#
#  create_cloudwatch_log_metric_filter = var.metrics_enabled
#}

resource aws_sns_topic alarm_sns {
  name = "${var.stack_name}-alarm"
  display_name = "${var.stack_name}-alarm"
  count = var.alarms_enabled ? 1 : 0
  tags = var.tags
}

resource aws_cloudwatch_log_metric_filter backend_500_log_metric {
  name = "${var.stack_name}-backend-500-metric-filter"
  log_group_name = var.backend_lambda_log_group_name
  pattern = " 500 INTERNAL SERVER ERROR"
  count = var.metrics_enabled ? 1 : 0

  metric_transformation {
    name      = "${var.stack_name}-backend-500"
    namespace = local.metrics_namespace
    value     = "1"
    unit      = "Count"
  }
}

module "alarm_metric_query" {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/metric-alarm"
  version = "3.3.0"

  create_metric_alarm = var.alarms_enabled
  alarm_name          = "${var.stack_name}-lambda-error-alarm"
  alarm_description   = "Lambda has errors"
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
      period      = 60
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
      period      = 60
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
      period      = 60
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
