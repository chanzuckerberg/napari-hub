variable tags {
    type = map(string)
}

variable cloud_env {
  description = "Information about the VPC environment"
  type = object({
    public_subnets   = list(string)
    private_subnets  = list(string)
    database_subnets = list(string)
    db_subnet_group  = string
    vpc_id           = string
    vpc_cidr_block   = string
  })
}

variable custom_stack_name {
  type        = string
  description = "Please provide the stack name"
}

variable app_name {
  type        = string
  description = "Please provide the ECS service name"
}

variable lambda_function_name {
  type        = string
  description = "Name of the Lambda function to direct all requests for this stage to."
}

variable rest_api_id {
  type        = string
  description = "ID of the API Gateway"
}

variable deployment_id {
  type        = string
  description = "ID for the API Gateway deployment"
}
