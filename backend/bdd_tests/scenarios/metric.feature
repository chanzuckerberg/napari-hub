Feature: metrics

  Scenario: metrics api for valid plugin
    Given we call metrics api for napari-assistant
    Then response status is 200
    And it should have 12 entries for timeline
    And it should have at least one non-zero installs in timeline
    And it should have non-zero values for stats

  Scenario: metrics api for invalid plugin
    Given we call metrics api for foo
    Then response status is 200
    And it should have 12 entries for timeline
    And it should have all zero installs in timeline
    And it should have zero values for stats and timelines

  Scenario: metrics api for valid plugin with limit
    Given we call metrics api for napari-assistant with limit 5
    Then response status is 200
    And it should have 5 entries for timeline
    And it should have at least one non-zero installs in timeline
    And it should have non-zero values for stats

  Scenario: metrics api for invalid plugin with limit
    Given we call metrics api for foo with limit 15
    Then response status is 200
    And it should have 15 entries for timeline
    And it should have all zero installs in timeline
    And it should have zero values for stats and timelines
