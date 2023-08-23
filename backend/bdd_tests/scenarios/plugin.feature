Feature: plugins

  Scenario: valid plugin api with version
    Given we call /plugins/napari-demo/versions/0.2.3 api
    Then response status is 200
    And  it will have valid plugin response

  Scenario: valid plugin api with invalid version
    Given we call /plugins/napari-demo/versions/1.2.5 api
    Then response status is 200
    And it will have empty map as response

  Scenario: invalid plugin api with version
    Given we call /plugins/foo/versions/0.1 api
    Then response status is 200
    And it will have empty map as response

  Scenario: valid plugin api without version
    Given we call /plugins/napari-demo api
    Then response status is 200
    And it will have valid plugin response

  Scenario: invalid plugin api without version
    Given we call /plugins/foo api
    Then response status is 200
    And it will have empty map as response

  Scenario: get all public plugins
    Given we call /plugins/index api
    Then response status is 200
    And it will have min plugins of 250
    And it will have valid plugins in response
    And it will have total_installs field
    And it will fetch plugins with visibility public

  Scenario: get all plugins
    Given we call /plugins/index/all api
    Then response status is 200
    And it will have min plugins of 250
    And it will have valid plugins in response
    And it will not have total_installs fields
    And it will fetch plugins with visibility public,hidden,disabled,blocked
