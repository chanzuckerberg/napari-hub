from datetime import datetime, timezone

from activity.install_activity_model import InstallActivityType, InstallActivity


def to_ts(epoch):
    return datetime.fromtimestamp(epoch)


def sorting_key(install_activity: InstallActivity):
    return install_activity.plugin_name + ' ' + install_activity.type_timestamp


def verify(actual, expected):
    actual.sort(key=sorting_key)
    expected.sort(key=sorting_key)
    assert len(actual) == len(expected)
    for i in range(0, len(expected)):
        assert expected[i].plugin_name == actual[i].plugin_name
        assert expected[i].type_timestamp == actual[i].type_timestamp
        assert expected[i].granularity == actual[i].granularity
        assert expected[i].timestamp == actual[i].timestamp
        assert expected[i].install_count == actual[i].install_count
        assert expected[i].last_updated_timestamp >= actual[i].last_updated_timestamp


def generate_expected(data, granularity, type_timestamp_format, timestamp_format):
    expected = []
    for key, values in data.items():
        for val in values:
            timestamp = val['timestamp']
            ia = InstallActivity(key.lower(),
                                 f'{type_timestamp_format(timestamp)}',
                                 granularity=granularity,
                                 timestamp=timestamp_format(timestamp),
                                 install_count=val['count'])
            expected.append(ia)
    return expected


def timestamp_format(timestamp):
    return timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000


class TestInstallActivityModels:

    def test_transform_to_dynamo_records_for_day(self):
        data = {
            'FOO': [{'timestamp': to_ts(1629072000), 'count': 2}, {'timestamp': to_ts(1662940800), 'count': 3}],
            'BAR': [{'timestamp': to_ts(1666656000), 'count': 8}],
        }

        from activity.install_activity_model import transform_to_dynamo_records
        actual = transform_to_dynamo_records(data, InstallActivityType.DAY)

        expected = generate_expected(data, 'DAY', lambda ts: f'DAY:{ts.strftime("%Y%m%d")}', timestamp_format)
        verify(actual, expected)

    def test_transform_to_dynamo_records_for_month(self):
        data = {
            'FOO': [{'timestamp': to_ts(1629072000), 'count': 2}, {'timestamp': to_ts(1662940800), 'count': 3}],
            'BAR': [{'timestamp': to_ts(1666656000), 'count': 8}],
        }

        from activity.install_activity_model import transform_to_dynamo_records
        actual = transform_to_dynamo_records(data, InstallActivityType.MONTH)

        expected = generate_expected(data, 'MONTH', lambda ts: f'MONTH:{ts.strftime("%Y%m")}', timestamp_format)
        verify(actual, expected)

    def test_transform_to_dynamo_records_for_total(self):
        data = {
            'FOO': [{'timestamp': to_ts(1629072000), 'count': 2}],
            'BAR': [{'timestamp': to_ts(1666656000), 'count': 8}],
            'BAZ': [{'timestamp': to_ts(1662940800), 'count': 3}]
        }

        from activity.install_activity_model import transform_to_dynamo_records
        actual = transform_to_dynamo_records(data, InstallActivityType.TOTAL)

        expected = generate_expected(data, 'TOTAL', lambda ts: f'TOTAL:', lambda ts: 0)
        verify(actual, expected)
