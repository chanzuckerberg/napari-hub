from behave import given, then
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta


@given('we call metrics api for {plugin_name} with limit {limit}')
def call_metrics_with_plugin_name_with_limit(context, plugin_name, limit):
    context.execute_steps(f'given we call api /metrics/{plugin_name}?limit={limit}')


@given('we call metrics api for {plugin_name}')
def call_metrics_with_plugin_name(context, plugin_name):
    context.execute_steps(f'given we call api /metrics/{plugin_name}')


def _generate_dates(limit):
    start_date = datetime.combine(datetime.now().replace(day=1), datetime.min.time()).replace(tzinfo=timezone.utc)
    return [(start_date - relativedelta(months=i)).timestamp() for i in range(limit, 0, -1)]


@then('it should have {limit_str} entries for timeline')
def verify_timeline_limit(context, limit_str):
    activity = context.response.json()['activity']
    context.activity = activity
    timeline = activity['timeline']
    limit = int(limit_str)
    assert len(timeline) == limit, f'actual size {len(timeline)} not equal to {limit}'
    for i, date in enumerate(_generate_dates(limit)):
        assert timeline[i]['timestamp'] == int(date) * 1000


@then('it should have at least one non-zero installs in timeline')
def verify_timeline_has_any_non_zero_installs(context):
    assert any(item['installs'] > 0 for item in context.activity['timeline'])


@then('it should have non-zero values for stats')
def verify_it_has_non_zero_activity_stats(context):
    stats = context.activity['stats']
    assert stats['installsInLast30Days'] >= 0
    assert stats['totalInstalls'] > 0


@then('it should have all zero installs in timeline')
def verify_timeline_has_any_non_zero_installs(context):
    assert all(item['installs'] == 0 for item in context.activity['timeline'])


@then('it should have zero values for stats and timelines')
def verify_it_has_zero_activity_data(context):
    stats = context.activity['stats']
    assert stats['installsInLast30Days'] == 0
    assert stats['totalInstalls'] == 0
