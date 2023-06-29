Feature: plugins

  Scenario: valid plugin api with version
    Given we call plugins api for napari-demo version 0.2.3
    Then response status is 200
    And  it will have valid plugin response

  Scenario: valid plugin api with invalid version
    Given we call plugins api for napari-demo version 1.2.5
    Then response status is 500

  Scenario: invalid plugin api with version
    Given we call plugins api for foo version 0.1
    Then response status is 200
    And it will have empty map as response

  Scenario: valid plugin api without version
    Given we call plugins api for napari-demo without version
    Then response status is 200
    And it will have valid plugin response

  Scenario: invalid plugin api without version
    Given we call plugins api for foo without version
    Then response status is 200
    And it will have empty map as response

  Scenario: get all public plugins-version map
    Given we call plugins api
    Then response status is 200
    And it should have public plugins defaults

  Scenario: get all public plugins
    Given we call plugins index api
    Then response status is 200
    And it should have public plugins defaults
    And it will fetch all public plugins

  Scenario: get excluded plugins
    Given we call excluded plugins api
    Then response status is 200
    And it will have only return plugins with excluded type

  Scenario: valid plugin api with version with test on
    Given we call plugins api for napari-demo version 0.2.3 with use_dynamo_plugin=true
    Then response status is 200
    And  it will have valid plugin response

  Scenario: valid plugin api with invalid version with test on
    Given we call plugins api for napari-demo version 1.2.5 with use_dynamo_plugin=true
    Then response status is 200
    And  it will have empty map as response

  Scenario: invalid plugin api with version with test on
    Given we call plugins api for foo version 0.1 with use_dynamo_plugin=true
    Then response status is 200
    And it will have empty map as response

  Scenario: valid plugin api without version with test on
    Given we call plugins api for napari-demo without version with use_dynamo_plugin=true
    Then response status is 200
    And it will have valid plugin response

  Scenario: invalid plugin api without version with test on
    Given we call plugins api for foo without version with use_dynamo_plugin=true
    Then response status is 200
    And it will have empty map as response

  Scenario: get all public plugins-version map with test on
    Given we call plugins api with use_dynamo_plugin=true
    Then response status is 200
    And it should have public plugins defaults

  Scenario: get all public plugins with test on
    Given we call plugins index api with use_dynamo_plugin=true
    Then response status is 200
    And it should have public plugins defaults
    And it will fetch all public plugins

  Scenario: get excluded plugins with test on
    Given we call excluded plugins api with use_dynamo_plugin=true
    Then response status is 200
    And it will have only return plugins with excluded type
