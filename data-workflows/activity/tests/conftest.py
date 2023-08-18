from datetime import datetime, timezone
from typing import Callable
from unittest.mock import Mock

import pytest
import snowflake.connector


@pytest.fixture
def snowflake_user():
    return "super-secret-username"


@pytest.fixture
def snowflake_password():
    return "a-password-that-cant-be-shared"


@pytest.fixture(autouse=True)
def setup_connection(monkeypatch, snowflake_user, snowflake_password):
    monkeypatch.setenv("SNOWFLAKE_USER", snowflake_user)
    monkeypatch.setenv("SNOWFLAKE_PASSWORD", snowflake_password)

    def _setup_connection(connection_config, expected_cursor_result):
        connection_mock = Mock()

        def _get_mock_snowflake_connect(*_, **kwargs):
            if connection_config == kwargs:
                connection_mock.execute_string.return_value = expected_cursor_result
                return connection_mock
            return None

        monkeypatch.setattr(snowflake.connector, "connect", _get_mock_snowflake_connect)
        return connection_mock

    return _setup_connection


@pytest.fixture
def connection_params(snowflake_user, snowflake_password) -> dict[str, str]:
    return {
        "user": snowflake_user,
        "password": snowflake_password,
        "account": "CZI-IMAGING",
        "warehouse": "IMAGING",
        "database": "IMAGING",
    }


@pytest.fixture
def to_ts() -> Callable[[int], datetime]:
    return lambda epoch: datetime.fromtimestamp(epoch, tz=timezone.utc)


@pytest.fixture
def plugins_by_earliest_ts(to_ts) -> dict[str, datetime]:
    return {
        "foo": to_ts(1615680000),
        "bar": to_ts(1656979200),
        "baz": to_ts(1687737600),
    }
