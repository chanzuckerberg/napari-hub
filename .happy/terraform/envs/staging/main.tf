locals {
  env = "staging"
  service = "${var.stack_name}-napari-hub"

  tags = {
    project   = "imaging"
    env       = local.env
    service   = local.service
    owner     = "org-sci-eng-imaging@chanzuckerberg.com"
    managedBy = "happy"
  }
}

module stack {
  source                = "./modules/ecs-stack"
  aws_account_id        = var.aws_account_id
  aws_role              = var.aws_role
  happymeta_            = var.happymeta_
  happy_config_secret   = var.happy_config_secret
  image_tag             = var.image_tag
  priority              = var.priority
  stack_name            = var.stack_name
  env                   = local.env
  delete_protected      = false
  require_okta          = false
  frontend_url          = "https://staging.napari-hub.org"
  backend_url           = "https://staging.api.napari-hub.org"
  stack_prefix          = "/${var.stack_name}"
  tags                  = local.tags
  wait_for_steady_state = var.wait_for_steady_state
}
