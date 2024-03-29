Feature: metrics

  Scenario: metrics api for valid plugin
    Given we call /metrics/napari-assistant api
    Then response status is 200
    And it should only have fields usage, maintenance
    And it should have 12 entries for usage.timeline
    And it should have at least one non-zero installs in usage.timeline
    And it should have non-zero values for usage.stats
    And it should have 12 entries for maintenance.timeline
    And it should have at least one non-zero commits in maintenance.timeline
    And it should have non-zero values for maintenance.stats

  Scenario: metrics api for invalid plugin
    Given we call /metrics/foo api
    Then response status is 200
    And it should only have fields usage, maintenance
    And it should have 12 entries for usage.timeline
    And it should have all zero installs in usage.timeline
    And it should have zero values for usage.stats
    And it should have 12 entries for maintenance.timeline
    And it should have all zero commits in maintenance.timeline
    And it should have zero values for maintenance.stats

  Scenario: metrics api for valid plugin with limit
    Given we call /metrics/napari-assistant?limit=5 api
    Then response status is 200
    And it should only have fields usage, maintenance
    And it should have 5 entries for usage.timeline
    And it should have at least one non-zero installs in usage.timeline
    And it should have non-zero values for usage.stats
    And it should have 5 entries for maintenance.timeline
    And it should have at least one non-zero commits in maintenance.timeline
    And it should have non-zero values for maintenance.stats

  Scenario: metrics api for invalid plugin with limit
    Given we call /metrics/foo?limit=15 api
    Then response status is 200
    And it should only have fields usage, maintenance
    And it should have 15 entries for usage.timeline
    And it should have all zero installs in usage.timeline
    And it should have zero values for usage.stats
    And it should have 15 entries for maintenance.timeline
    And it should have all zero commits in maintenance.timeline
    And it should have zero values for maintenance.stats
