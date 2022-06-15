variable vpc {
  type        = string
  description = "The VPC that the ECS cluster is deployed to"
}

variable custom_stack_name {
  type        = string
  description = "Please provide the stack name"
}

variable app_name {
  type        = string
  description = "Please provide the ECS service name"
}

variable cluster {
  type        = string
  description = "Please provide the ECS Cluster ID that this service should run on"
}

variable image_repo {
  type = string
}

variable image_tag {
  type = string
}

variable service_port {
  type        = number
  description = "What port does this service run on?"
  default     = 80
}

variable desired_count {
  type        = number
  description = "How many instances of this task should we run across our cluster?"
  default     = 2
}

variable listener {
  type        = string
  description = "The Application Load Balancer listener to register with"
}

variable host_match {
  type        = string
  description = "Host header to match for target rule. Leave empty to match all requests"
}

variable security_groups {
  type        = list(string)
  description = "Security groups for ECS tasks"
}

variable subnets {
  type        = list(string)
  description = "Subnets for ecs tasks"
}

variable task_role_arn {
  type        = string
  description = "ARN for the role assumed by tasks"
}

variable path {
  type        = string
  description = "The path to register with the Application Load Balancer"
  default     = "/*"
}

variable cmd {
  type        = list(string)
  description = "The path to register with the Application Load Balancer"
  default     = []
}

variable api_url {
  type        = string
  description = "URL for the backend api."
}

variable github_client_id {
  type        = string
  description = "client id for github api"
}

variable github_client_secret {
  type        = string
  description = "client secret for github api"
}

variable frontend_url {
  type        = string
  description = "URL for the frontend app."
}

variable priority {
  type        = number
  description = "Listener rule priority number within the given listener"
}

variable memory {
  type        = number
  description = "Amount of memory to allocate to each task"
  default     = 768
}

variable wait_for_steady_state {
  type        = bool
  description = "Whether Terraform should block until the service is in a steady state before exiting"
  default     = false
}

variable tags {
  type        = map(string)
  description = "Tags to apply to resources"
  default     = {}
}

variable env {
  type        = string
  description = "Name of environment"
}