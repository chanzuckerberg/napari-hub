Feature: Category
  Category helps add classification information to plugins

  Scenario: get all categories
    Given we call categories api
    Then response status is 200
    And it will have valid all categories response

  Scenario: get valid category
    Given we call categories api for Cell tracking
    Then response status is 200
    And it will have valid category response

  Scenario: get invalid category
    Given we call categories api for foo
    Then response status is 200
    And it will have empty list as response

  Scenario: get valid category with valid version
    Given we call categories api for Cell segmentation with version EDAM-BIOIMAGING:alpha06
    Then response status is 200
    And it will have valid category response

  Scenario: get invalid category with valid version
    Given we call categories api for foo with version EDAM-BIOIMAGING:alpha06
    Then response status is 200
    And it will have empty list as response

  Scenario: get valid category with invalid version
    Given we call categories api for Cell segmentation with version foo
    Then response status is 200
    And it will have empty list as response

  Scenario: get invalid category with invalid version
    Given we call categories api for foo with version bar
    Then response status is 200
    And it will have empty list as response
