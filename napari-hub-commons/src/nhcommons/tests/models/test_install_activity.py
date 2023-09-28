from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import pytest
from dateutil.relativedelta import relativedelta
from moto import mock_dynamodb
from nhcommons.models import install_activity


def get_relative_utc_datetime(**kwargs) -> datetime:
    return datetime.combine(
        datetime.today() - relativedelta(**kwargs), datetime.min.time(), timezone.utc
    )


def type_timestamp() -> Dict[str, str]:
    return {
        "TOTAL": "TOTAL:",
        "MONTH": "MONTH:{ts:%Y%m}",
        "DAY": "DAY:{ts:%Y%m%d}",
    }


def generate_install_activity(
    name: str,
    granularity: str,
    install_count: int,
    is_input: bool,
    timestamp: Optional[datetime] = None,
) -> dict:
    type_key = "granularity" if is_input else "type"
    return {
        "plugin_name": name if is_input else name.lower(),
        "type_timestamp": type_timestamp()[granularity].format(ts=timestamp),
        type_key: granularity,
        "install_count": install_count,
        "is_total": "True" if granularity == "TOTAL" else None,
        "timestamp": int(timestamp.timestamp() * 1000) if timestamp else None,
    }


def generate_install_activity_list(is_input: bool) -> List[Dict[str, Any]]:
    return [
        generate_install_activity(
            "Plugin-1",
            granularity="DAY",
            install_count=5,
            timestamp=get_relative_utc_datetime(days=3),
            is_input=is_input,
        ),
        generate_install_activity(
            name="Plugin-1",
            granularity="DAY",
            install_count=2,
            timestamp=get_relative_utc_datetime(days=15),
            is_input=is_input,
        ),
        generate_install_activity(
            name="Plugin-1",
            granularity="MONTH",
            install_count=10,
            timestamp=get_relative_utc_datetime(months=6).replace(day=1),
            is_input=is_input,
        ),
        generate_install_activity(
            name="Plugin-1",
            granularity="MONTH",
            install_count=5,
            timestamp=get_relative_utc_datetime(months=3).replace(day=1),
            is_input=is_input,
        ),
        generate_install_activity(
            name="Plugin-1",
            granularity="TOTAL",
            install_count=25,
            is_input=is_input,
        ),
        generate_install_activity(
            name="Plugin-2",
            granularity="TOTAL",
            install_count=83,
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

    @pytest.fixture
    def seed_data(self, table):
        for entry in generate_install_activity_list(False):
            item = {key: val for key, val in entry.items() if val is not None}
            table.put_item(Item=item)

    def test_batch_write(self, table, verify_table_data):
        install_activity.batch_write(generate_install_activity_list(True))

        verify_table_data(generate_install_activity_list(False), table)

    @pytest.mark.parametrize(
        "excluded_field", ["plugin_name", "type_timestamp", "granularity"]
    )
    def test_batch_write_for_invalid_data(self, excluded_field, table):
        input_data = {
            "plugin_name": "Plugin-1",
            "type_timestamp": "DAY:20230607",
            "install_count": 15,
            "granularity": "DAY",
            "timestamp": get_relative_utc_datetime(days=3),
        }
        del input_data[excluded_field]
        with pytest.raises(KeyError):
            install_activity.batch_write([input_data])

    @pytest.mark.parametrize(
        "plugin_name, expected",
        [
            ("Plugin-1", 25),
            ("Plugin-7", 0),
        ],
    )
    def test_get_total_installs(self, seed_data, plugin_name, expected):
        assert install_activity.get_total_installs(plugin_name) == expected

    @pytest.mark.parametrize(
        "plugin_name, day_delta, expected",
        [
            ("Plugin-1", 10, 5),
            ("Plugin-1", 20, 7),
            ("Plugin-7", 30, 0),
        ],
    )
    def test_get_recent_installs(self, seed_data, plugin_name, day_delta, expected):
        assert install_activity.get_recent_installs(plugin_name, day_delta) == expected

    @pytest.mark.parametrize(
        "plugin_name, month_delta, expected",
        [
            ("Plugin-1", 0, {}),
            ("Plugin-7", 12, {}),
            ("Plugin-1", 12, {6: 10, 3: 5}),
        ],
    )
    def test_get_timeline(
        self, seed_data, generate_timeline, plugin_name, month_delta, expected
    ):
        actual = install_activity.get_timeline(plugin_name, month_delta)
        assert actual == generate_timeline(expected, month_delta, "installs")

    def test_get_total_installs_by_plugins(self, seed_data):
        expected = {"plugin-1": 25, "plugin-2": 83}
        assert install_activity.get_total_installs_by_plugins() == expected
