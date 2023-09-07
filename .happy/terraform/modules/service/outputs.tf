output cloudwatch_log_group_name {
  description = "The name of the Cloudwatch Log Group"
  value       = module.cloud_watch_logs_group.name
}
