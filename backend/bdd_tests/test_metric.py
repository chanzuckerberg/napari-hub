from pytest_bdd import given, scenarios, then, parsers
from test_utils import call_api
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta

scenarios('metric.feature')


@given(parsers.parse('we call metrics api for {plugin_name} with limit {limit}'))
def call_metrics_with_plugin_name_with_limit(plugin_name, limit, context):
    call_api(context, f'/metrics/{plugin_name}?limit={limit}')


@given(parsers.parse('we call metrics api for {plugin_name}'))
def call_metrics_with_plugin_name(plugin_name, context):
    call_api(context, f'/metrics/{plugin_name}')


@given(parsers.parse('we call metrics api for {plugin_name} with limit {limit} and {query_param}'))
def call_metrics_with_plugin_name_with_limit_and_query_param(plugin_name, limit, query_param, context):
    call_api(context, f'/metrics/{plugin_name}?limit={limit}&{query_param}')


@given(parsers.parse('we call metrics api for {plugin_name} and {query_param}'))
def call_metrics_with_plugin_name_and_query_param(plugin_name, query_param, context):
    call_api(context, f'/metrics/{plugin_name}?{query_param}')


@then(parsers.parse('it should only have properties {properties_str}'))
def verify_response_properties(context, properties_str):
    properties = properties_str.split(', ')
    response = context['response'].json()
    assert len(response) == len(properties)
    for property in properties:
        assert property in response, f'{property} not in response'
        context[property] = response[property]


@then(parsers.parse('it should have {limit:d} entries for usage.timeline'))
def verify_usage_timeline_limit(context, limit):
    _validate_timeline(context['usage']['timeline'], limit)


@then(parsers.parse('it should have {limit:d} entries for maintenance.timeline'))
def verify_maintenance_timeline_limit(context, limit):
    _validate_timeline(context['maintenance']['timeline'], limit)


@then(parsers.parse('it should have at least one non-zero installs in usage.timeline'))
def verify_usage_timeline_has_any_non_zero_installs(context):
    assert any(item['installs'] > 0 for item in context['usage']['timeline'])


@then(parsers.parse('it should have at least one non-zero commits in maintenance.timeline'))
def verify_maintenance_timeline_has_any_non_zero_commits(context):
    assert any(item['commits'] > 0 for item in context['maintenance']['timeline'])


@then(parsers.parse('it should have non-zero values for usage.stats'))
def verify_it_has_non_zero_usage_stats(context):
    stats = context['usage']['stats']
    assert stats['installs_in_last_30_days'] >= 0
    assert stats['total_installs'] > 0


@then(parsers.parse('it should have non-zero values for maintenance.stats'))
def verify_it_has_non_zero_maintenance_stats(context):
    stats = context['maintenance']['stats']
    assert stats['latest_commit_timestamp'] > 0
    assert stats['total_commits'] > 0


@then(parsers.parse('it should have all zero installs in usage.timeline'))
def verify_usage_timeline_has_any_non_zero_installs(context):
    assert all(item['installs'] == 0 for item in context['usage']['timeline'])


@then(parsers.parse('it should have all zero commits in maintenance.timeline'))
def verify_maintenance_timeline_has_any_non_zero_commits(context):
    assert all(item['commits'] == 0 for item in context['maintenance']['timeline'])


@then(parsers.parse('it should have zero values for usage.stats'))
def verify_it_has_zero_usage_data(context):
    stats = context['usage']['stats']
    assert stats['installs_in_last_30_days'] == 0
    assert stats['total_installs'] == 0


@then(parsers.parse('it should have zero values for maintenance.stats'))
def verify_it_has_zero_maintenance_data(context):
    stats = context['maintenance']['stats']
    assert stats['latest_commit_timestamp'] == 0
    assert stats['total_commits'] == 0


def _generate_dates(limit):
    start_date = datetime.combine(datetime.now().replace(day=1), datetime.min.time()).replace(tzinfo=timezone.utc)
    return [(start_date - relativedelta(months=i)).timestamp() for i in range(limit, 0, -1)]


def _validate_timeline(timeline, limit):
    assert len(timeline) == limit, f'actual size {len(timeline)} not equal to {limit}'
    for i, date in enumerate(_generate_dates(limit)):
        assert timeline[i]['timestamp'] == int(date) * 1000
