variable custom_stack_name {
  type        = string
  description = "Please provide the stack name"
}

variable tags {
  type        = map(string)
  description = "Tags to apply to resources"
  default     = {}
}
