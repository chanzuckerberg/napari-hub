from typing import Any, Dict, List

from pytest_bdd import scenarios, then, parsers
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta

scenarios("metric.feature")


def _generate_dates(limit: int):
    start_date = datetime.combine(
        datetime.now().replace(day=1), datetime.min.time()
    ).replace(tzinfo=timezone.utc)
    return [
        (start_date - relativedelta(months=i)).timestamp() for i in range(limit, 0, -1)
    ]


def _validate_timeline(timeline: List[Dict], limit: int):
    assert len(timeline) == limit, f"actual size {len(timeline)} not equal to {limit}"
    for i, date in enumerate(_generate_dates(limit)):
        assert timeline[i]["timestamp"] == int(date) * 1000


@then(parsers.parse("it should only have fields {fields}"))
def verify_response_properties(context: Dict[str, Any], fields: str):
    fields = fields.split(", ")
    response = context["response"].json()
    assert len(response) == len(fields)
    for field in fields:
        assert field in response, f"{field} not in response"
        context[field] = response[field]


@then(parsers.parse("it should have {limit:d} entries for usage.timeline"))
def verify_usage_timeline_limit(context: Dict[str, Any], limit: int):
    _validate_timeline(context["usage"]["timeline"], limit)


@then(parsers.parse("it should have {limit:d} entries for maintenance.timeline"))
def verify_maintenance_timeline_limit(context: Dict[str, Any], limit: int):
    _validate_timeline(context["maintenance"]["timeline"], limit)


@then(parsers.parse("it should have at least one non-zero installs in usage.timeline"))
def verify_usage_timeline_has_any_non_zero_installs(context: Dict[str, Any]):
    assert any(item["installs"] > 0 for item in context["usage"]["timeline"])


@then(
    parsers.parse(
        "it should have at least one non-zero commits in maintenance.timeline"
    )
)
def verify_maintenance_timeline_has_any_non_zero_commits(context: Dict[str, Any]):
    assert any(item["commits"] > 0 for item in context["maintenance"]["timeline"])


@then(parsers.parse("it should have non-zero values for usage.stats"))
def verify_it_has_non_zero_usage_stats(context: Dict[str, Any]):
    stats = context["usage"]["stats"]
    assert stats["installs_in_last_30_days"] >= 0
    assert stats["total_installs"] > 0


@then(parsers.parse("it should have non-zero values for maintenance.stats"))
def verify_it_has_non_zero_maintenance_stats(context: Dict[str, Any]):
    stats = context["maintenance"]["stats"]
    assert stats["latest_commit_timestamp"] is not None
    assert stats["total_commits"] > 0


@then(parsers.parse("it should have all zero installs in usage.timeline"))
def verify_usage_timeline_has_any_non_zero_installs(context: Dict[str, Any]):
    assert all(item["installs"] == 0 for item in context["usage"]["timeline"])


@then(parsers.parse("it should have all zero commits in maintenance.timeline"))
def verify_maintenance_timeline_has_any_non_zero_commits(context: Dict[str, Any]):
    assert all(item["commits"] == 0 for item in context["maintenance"]["timeline"])


@then(parsers.parse("it should have zero values for usage.stats"))
def verify_it_has_zero_usage_data(context: Dict[str, Any]):
    stats = context["usage"]["stats"]
    assert stats["installs_in_last_30_days"] == 0
    assert stats["total_installs"] == 0


@then(parsers.parse("it should have zero values for maintenance.stats"))
def verify_it_has_zero_maintenance_data(context: Dict[str, Any]):
    stats = context["maintenance"]["stats"]
    assert stats["latest_commit_timestamp"] is None
    assert stats["total_commits"] == 0
