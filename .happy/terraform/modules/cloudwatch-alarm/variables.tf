variable alarms_enabled {
  type        = bool
  description = "Please provide if alarms is enabled"
  default     = true
}

variable backend_lambda_log_group_name {
  type        = string
  description = "Please provide backend lambda's log group name"
}

variable backend_lambda_function_name {
  type        = string
  description = "Please provide backend lambda function's name"
}

variable env {
  type        = string
  description = "Environment for the app"
}

variable data_workflows_lambda_function_name {
  type        = string
  description = "Please provide data-workflows lambda function's name"
}


variable metrics_enabled {
  type        = bool
  description = "Please provide if metrics is enabled"
  default     = true
}

variable plugins_lambda_function_name {
  type        = string
  description = "Please provide plugin lambda function's name"
}

variable stack_name {
  type        = string
  description = "Happy Path stack name"
}

variable tags {
    type      = map(string)
}
