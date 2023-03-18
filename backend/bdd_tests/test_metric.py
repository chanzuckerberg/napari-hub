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


@then(parsers.parse('it should have {limit:d} entries for timeline'))
def verify_timeline_limit(context, limit):
    activity = context['response'].json()['activity']
    context['activity'] = activity
    timeline = activity['timeline']
    assert len(timeline) == limit, f'actual size {len(timeline)} not equal to {limit}'
    for i, date in enumerate(_generate_dates(limit)):
        assert timeline[i]['timestamp'] == int(date) * 1000


@then(parsers.parse('it should have at least one non-zero installs in timeline'))
def verify_timeline_has_any_non_zero_installs(context):
    assert any(item['installs'] > 0 for item in context['activity']['timeline'])


@then(parsers.parse('it should have non-zero values for stats'))
def verify_it_has_non_zero_activity_stats(context):
    stats = context['activity']['stats']
    assert stats['installsInLast30Days'] >= 0
    assert stats['totalInstalls'] > 0


@then(parsers.parse('it should have all zero installs in timeline'))
def verify_timeline_has_any_non_zero_installs(context):
    assert all(item['installs'] == 0 for item in context['activity']['timeline'])


@then(parsers.parse('it should have zero values for stats and timelines'))
def verify_it_has_zero_activity_data(context):
    stats = context['activity']['stats']
    assert stats['installsInLast30Days'] == 0
    assert stats['totalInstalls'] == 0


def _generate_dates(limit):
    start_date = datetime.combine(datetime.now().replace(day=1), datetime.min.time()).replace(tzinfo=timezone.utc)
    return [(start_date - relativedelta(months=i)).timestamp() for i in range(limit, 0, -1)]
