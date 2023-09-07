output cloudwatch_log_group_name {
  description = "The name of the Cloudwatch Log Group"
  value       = aws_cloudwatch_log_group.cloud_watch_logs_group.name
}
