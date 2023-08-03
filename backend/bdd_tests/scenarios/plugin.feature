Feature: plugins

  Scenario: valid plugin api with version
    Given we call plugins api for napari-demo version 0.2.3
    Then response status is 200
    And  it will have valid plugin response

  Scenario: valid plugin api with invalid version
    Given we call plugins api for napari-demo version 1.2.5
    Then response status is 200

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
