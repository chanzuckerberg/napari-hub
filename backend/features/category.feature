Feature: category

  Scenario: get all categories
     Given we call categories api
      Then it will have valid all categories response

  Scenario: get valid category
     Given we call categories api for Cell tracking
      Then it will have valid category response

  Scenario: get invalid category
     Given we call categories api for foo
      Then it will have empty list response with status 200

  Scenario: get valid category with valid version
     Given we call categories api for Cell segmentation with version EDAM-BIOIMAGING:alpha06
      Then it will have valid category response

  Scenario: get invalid category with valid version
     Given we call categories api for foo with version EDAM-BIOIMAGING:alpha06
      Then it will have empty list response with status 200

  Scenario: get valid category with invalid version
     Given we call categories api for Cell segmentation with version foo
      Then it will have empty list response with status 200

  Scenario: get invalid category with invalid version
     Given we call categories api for foo with version bar
      Then it will have empty list response with status 200
