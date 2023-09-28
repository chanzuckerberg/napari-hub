variable attributes {
  type        = list(map(string))
  description = "Please provide the attributes list for the keys"
  default     = []
}

variable autoscaling_enabled {
  type        = bool
  description = "Please provide if autoscaling is enabled"
  default     = false
}

variable create_table {
  type        = bool
  description = "Please provide if table should be created"
  default     = false
}

variable hash_key {
  type        = string
  description = "Please provide the hash key for table"
}

variable global_secondary_indexes {
  type        = any
  description = "Please provide GSI configuration"
  default     = []
}

variable range_key {
  type        = string
  description = "Please provide the range key for table"
  default     = null
}

variable stream_enabled {
  type        = bool
  description = "Please provide if stream is enabled"
  default     = false
}

variable stream_view_type {
  type        = string
  description = "Please provide the stream_view_type for table if stream enabled"
  default     = null
}

variable table_class {
  type        = string
  description = "Please provide table_class"
  default     = "STANDARD"
}

variable table_name {
  type        = string
  description = "Please provide name for dynamo table"
}

variable tags {
    type      = map(string)
}

variable ttl_attribute_name {
  type        = string
  description = "Please provide the name of the time to live attribute"
  default     = ""
}

variable ttl_enabled {
  type        = bool
  description = "Please specify if ttl is enabled"
  default     = false
}
