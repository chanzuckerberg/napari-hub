from activity.install_activity import update_install_activity
from utils import get_last_updated_timestamp, get_current_timestamp, set_last_updated_timestamp


def update_activity() -> None:
    last_updated_timestamp = get_last_updated_timestamp()
    current_timestamp = get_current_timestamp()
    update_install_activity(last_updated_timestamp, current_timestamp)
    set_last_updated_timestamp(current_timestamp)
