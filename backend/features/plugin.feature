Feature: plugins

  Scenario: valid plugin api with version
     Given we call plugins api for blik version 0.3.4
      Then it will have valid plugin response

  Scenario: invalid plugin api with version
     Given we call plugins api for foo version 0.1
      Then it will have empty map response with status 200

  Scenario: valid plugin api without version
     Given we call plugins api for blik
      Then it will have valid plugin response

  Scenario: invalid plugin api with version
     Given we call plugins api for foo
      Then it will have empty map response with status 200

  Scenario: get all public plugins-version map
    Given we call plugins api
    Then it should have public plugins defaults

  Scenario: get all public plugins
    Given we call plugins index api
    Then it will fetch all public plugins
