import activity.processor

from utils.utils import ParameterStoreAdapter, get_current_timestamp


def update_activity() -> None:
    parameter_store_adapter = ParameterStoreAdapter()
    last_updated_timestamp = parameter_store_adapter.get_last_updated_timestamp()
    current_timestamp = get_current_timestamp()
    activity.processor.update_install_activity(
        last_updated_timestamp, current_timestamp
    )
    parameter_store_adapter.set_last_updated_timestamp(current_timestamp)
