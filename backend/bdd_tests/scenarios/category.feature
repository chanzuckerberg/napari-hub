Feature: Category
  Category helps add classification information to plugins

  Scenario: get all categories
    Given we call /categories api
    Then response status is 200
    And it will have valid all categories response

  Scenario: get valid category
    Given we call /categories/Cell tracking api
    Then response status is 200
    And it will have valid category response for Cell tracking

  Scenario: get invalid category
    Given we call /categories/foo api
    Then response status is 200
    And it will have empty list as response

  Scenario: get valid category with valid version
    Given we call /categories/Cell segmentation/versions/EDAM-BIOIMAGING:alpha06 api
    Then response status is 200
    And it will have valid category response for Cell segmentation

  Scenario: get invalid category with valid version
    Given we call /categories/foo/versions/EDAM-BIOIMAGING:alpha06 api
    Then response status is 200
    And it will have empty list as response

  Scenario: get valid category with invalid version
    Given we call /categories/Cell segmentation/versions/foo api
    Then response status is 200
    And it will have empty list as response

  Scenario: get invalid category with invalid version
    Given we call /categories/foo/versions/bar api
    Then response status is 200
    And it will have empty list as response
