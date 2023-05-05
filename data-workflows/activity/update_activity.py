import activity.processor
import utils.utils

from utils.utils import ParameterStoreAdapter


def update_activity() -> None:
    parameter_store_adapter = ParameterStoreAdapter()
    last_updated_timestamp = parameter_store_adapter.get_last_updated_timestamp()
    current_timestamp = utils.utils.get_current_timestamp()
    activity.processor.update_install_activity(
        last_updated_timestamp, current_timestamp
    )
    activity.processor.update_github_activity(last_updated_timestamp, current_timestamp)
    parameter_store_adapter.set_last_updated_timestamp(current_timestamp)
