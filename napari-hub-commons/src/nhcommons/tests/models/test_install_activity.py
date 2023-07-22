from datetime import datetime
from typing import Any, Dict, List

import pytest
from dateutil.relativedelta import relativedelta
from moto import mock_dynamodb
from nhcommons.models import install_activity


def get_granularity_fields(granularity: str, timestamp: datetime) -> [str, str]:
    if granularity == "TOTAL":
        return "TOTAL:", "true"
    elif granularity == "MONTH":
        return f"MONTH:{timestamp.strftime('%Y%M')}", None

    return f"DAY:{timestamp.strftime('%Y%M%d')}", None


def generate_install_activity(name: str,
                              granularity: str,
                              install_count: int,
                              is_input: bool,
                              timestamp: datetime = None) -> dict:
    type_key = "granularity" if is_input else "type"
    type_timestamp, is_total = get_granularity_fields(granularity, timestamp)
    install_activity_item = {
        "plugin_name": name if is_input else name.lower(),
        "type_timestamp": type_timestamp,
        type_key: granularity,
        "install_count": install_count,
    }
    if timestamp:
        install_activity_item["timestamp"] = int(timestamp.timestamp() * 1000)
    if is_total:
        install_activity_item["is_total"] = is_total
    return install_activity_item


def get_relative_timestamp(**args) -> datetime:
    return (datetime.now() - relativedelta(**args))\
        .replace(hour=0, minute=0, second=0, microsecond=0)


def generate_install_activity_list(is_input: bool) -> List[Dict[str, Any]]:
    return [
        generate_install_activity(
            name="Foo",
            granularity="DAY",
            install_count=5,
            timestamp=get_relative_timestamp(days=3),
            is_input=is_input,
        ),
        generate_install_activity(
            name="Foo",
            granularity="MONTH",
            install_count=10,
            timestamp=get_relative_timestamp(months=3),
            is_input=is_input,
        ),
        generate_install_activity(
            name="Foo",
            granularity="TOTAL",
            install_count=15,
            is_input=is_input,
        ),
    ]


class TestInstallActivity:

    @pytest.fixture()
    def table(self, create_dynamo_table):
        with mock_dynamodb():
            yield create_dynamo_table(
                install_activity._InstallActivity, "install-activity"
            )

    def test_batch_write(self, table, verify_table_data):
        install_activity.batch_write(generate_install_activity_list(True))

        verify_table_data(
            generate_install_activity_list(False), table
        )

    @pytest.mark.parametrize("excluded_field", [
        "plugin_name", "type_timestamp", "granularity"
    ])
    def test_batch_write_for_invalid_data(self, excluded_field, table):
        input_data = {
            "plugin_name": "Foo",
            "type_timestamp": "DAY:20230607",
            "install_count": 15,
            "granularity": "DAY",
            "timestamp": get_relative_timestamp(days=3),
        }
        del input_data[excluded_field]
        with pytest.raises(KeyError):
            install_activity.batch_write([input_data])
