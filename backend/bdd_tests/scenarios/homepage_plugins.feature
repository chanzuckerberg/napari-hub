Feature: HomepagePlugins
  Homepage helps the discoverability of plugins

  Scenario: get plugin_types sections of homepage_plugins without limit
    Given we call plugins home api for plugin_types with query_param=use_dynamo_plugin=False
    Then response status is 200
    And it will have only the plugin_types sections
    And it will have valid type for plugin_types
    And each sections will have 3 valid plugins

  Scenario: get newest sections of homepage_plugins without limit
    Given we call plugins home api for newest with query_param=use_dynamo_plugin=False
    Then response status is 200
    And it will have only the newest sections
    And each sections will have 3 valid plugins
    And the newest section is sorted by first_released field

  Scenario: get recently_updated sections of homepage_plugins without limit
    Given we call plugins home api for recently_updated with query_param=use_dynamo_plugin=False
    Then response status is 200
    And it will have only the recently_updated sections
    And each sections will have 3 valid plugins
    And the recently_updated section is sorted by release_date field

  Scenario: get top_installed sections of homepage_plugins without limit
    Given we call plugins home api for top_installed with query_param=use_dynamo_plugin=False
    Then response status is 200
    And it will have only the top_installed sections
    And each sections will have 3 valid plugins
    And the top_installed section is sorted by total_installs field

  Scenario: get all sections of homepage_plugins without limit
    Given we call plugins home api for newest,recently_updated,top_installed,plugin_types with query_param=use_dynamo_plugin=False
    Then response status is 200
    And it will have only the newest,recently_updated,top_installed,plugin_types sections
    And it will have valid type for plugin_types
    And each sections will have 3 valid plugins
    And the newest section is sorted by first_released field
    And the recently_updated section is sorted by release_date field
    And the top_installed section is sorted by total_installs field

  Scenario: get all sections of homepage_plugins with limit
    Given we call plugins home api for newest,recently_updated,top_installed,plugin_types having a limit of 5 and query_param=use_dynamo_plugin=False
    Then response status is 200
    And it will have only the newest,recently_updated,top_installed,plugin_types sections
    And it will have valid type for plugin_types
    And each sections will have 5 valid plugins
    And the newest section is sorted by first_released field
    And the recently_updated section is sorted by release_date field
    And the top_installed section is sorted by total_installs field

  Scenario: get all sections of homepage_plugins with limit and use_dynamo_plugin=True
    Given we call plugins home api for newest,recently_updated,top_installed,plugin_types having a limit of 5 and query_param=use_dynamo_plugin=True
    Then response status is 200
    And it will have only the newest,recently_updated,top_installed,plugin_types sections
    And it will have valid type for plugin_types
    And each sections will have 5 valid plugins
    And the newest section is sorted by first_released field
    And the recently_updated section is sorted by release_date field
    And the top_installed section is sorted by total_installs field
