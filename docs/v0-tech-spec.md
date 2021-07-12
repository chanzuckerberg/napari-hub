# Technical Specifications

The purpose of this document is to provide technical details in order to assist in engineering implementation for napari hub.


## Scope for v0
### Pages
#### Landing page
* Has some welcome copy and other info.
* User can search and browse as described in the search/list/browse view.
* Includes Email list signup. More details for this feature defined under Features: Mailing List

#### Search/List/Browse view
* Ability for users to search for a plugin by words (i.e. global search bar with plugins as results)
* Ability to browse existing plugins with additional filter and sort functionality
* Technical requirements:
  * Page and plugin data should load in a reasonable amount of time.
  * Search/list functionality should be able to support low 100s of plugins for the first version. 
  * Search inputs should have form validation.
  * Search form fields:
    * Search [input/textbox] - Fields to search are defined in [this table](https://github.com/chanzuckerberg/napari-hub/wiki/Customizing-your-plugin's-listing#fields). We will use all items from the “Searched” 
      column. More details for this feature defined under Features: Global Search Bar.
    * Filter [checkboxes] - Fields to filter are defined in [this table](https://github.com/chanzuckerberg/napari-hub/wiki/Customizing-your-plugin's-listing#fields). We will use all items from the “Filterable” column. 
      More details for this feature defined under Features: Filter/Sort
    * Sort [dropdown/radio buttons] - Fields to sort are defined in [this table](https://github.com/chanzuckerberg/napari-hub/wiki/Customizing-your-plugin's-listing#fields). We will use all items from the “Sortable” 
      column. More details for this feature defined under Features: Filter/Sort
  * Plugin list data to display
    * Fields to display are defined in [this table](https://github.com/chanzuckerberg/napari-hub/wiki/Customizing-your-plugin's-listing#fields). We will use all items from the “List view” column
    * Link to details page
    * We will add an “exclude” list for plugins to exclude from the list. The exclusions will be stored in a file and plugin data returned will not include those excluded plugins.
  * Actions (what happens when a user clicks on each link, button, etc.) 
    * Will be defined in the final Figma design/prototype

#### Details view
* Ability to learn more about each plugin (i.e. on a page of its own)
* Content sourced from pypi & available sources linked from there (such as github)
* Includes a call to action to install the plugin. More details of this feature defined in Features: Install “CTA”
* Technical requirements:
  * Page should be built as a reusable template and only data will change dynamically.
  * Page should load in a reasonable amount of time.
  * Plugin data to display from Pypi JSON API or Github:
  * Fields to display are defined in [this table](https://github.com/chanzuckerberg/napari-hub/wiki/Customizing-your-plugin's-listing#fields)v. We will use all items from the “Full view” column.
  * Flags for engineering:
    * Description - will need to be parsed from markdown format or possible other formats like plain text or rst. 
      For v0, we will support markdown and plain text formats only. 
    * “Github source” column data will be sourced from files within a .napari folder as defined in this document
  * Actions (what happens when a user clicks on each link, button, etc.) 
    * “Install” button - Details defined in Features: Install “CTA”

#### Supplemental pages
* About 
* Contact 
* Privacy Policy 
* FAQ

### Overall site
Technical requirements:
* Site traffic: Site should be able to support 200 unique visitors / 1,000 page views per day at the bare minimum
* Error pages: Show a friendly error page if there is a site error. This should not happen often, 
  but in case it does, the user should see a friendly error page.
* Analytics tracking code: We will use Plausible without the need for cookie banners
* Deployment: work with CZI Infra’s modules for deployment to ecs cluster, we will ship our front end in a docker container
* SEO: For v0, we should give minimal attention to SEO best practices. e.g. the title should include the plugin name. 
  Each plugin should get a unique URL that includes the plugin name. The site should be readable by Google and Bing.

### Features
#### Global Search Bar
##### Technical decision
Filter on the client-side using a JS indexing library like fuse.js, lunr or minisearch. After research, we decided to use fuse.js.
Pros: Quick search for medium sized data and provides more complex search capabilities like fuzzy search out of the box.
Cons: Requires developer time to get familiar with the libraries and how to implement them. Libraries are fixed in what 
they can support, but they should be good enough for our needs.

##### Technical requirements
* TBD Specifications on ordering, fuzzy search, etc. will be determined once Jeremy researches options in Solution #3.
* The search/filter/sort query should be encoded in the URL. User should be able to navigate  to another page such as 
  the details page and when returning to the page with filters, the page should remember the filters and sort and load that state. 
  * This will enable linking to specific search results from elsewhere on the site (e.g. link to all plugins with a 
    certain tag by clicking the tag name on the plugin detail page)
  * This will allow users to easily share search results with a copy+paste of the URL

#### napari-specific readme template
Details on how to customize the plugin listing using this feature can be found on the [wiki](https://github.com/chanzuckerberg/napari-hub/wiki/Customizing-your-plugin's-listing).

#### Manual input of plugin contributor name(s) and description
Details on how to customize the plugin listing using this feature can be found on the [wiki](https://github.com/chanzuckerberg/napari-hub/wiki/Customizing-your-plugin's-listing).

#### Install “CTA”
We will provide a call to action which will trigger a means to install a plugin. For the first version, installation 
may be several steps which include copying and pasting an install command into the napari viewer where future versions 
may be a “one click” solution which opens up the napari viewer automatically and starts the installation of the plugin. 
There are further considerations to explore in the workflow of the user journey and engineering options to explore 
so this will not be the target for the first version. Implementation on the engineering side should be low for this first version.

Decision for v0: The "install" CTA on the plugin detail page should pop up a modal that gives template-generated instructions 
for installation. Modal is subject to the responsive design.

#### Filter/Sort
We will provide users with the ability to filter and sort plugins on the search/browse/list page. Filter and sorting 
are two different types of features that will be used in conjunction with one another to provide a better discovery 
experience. Fields to use are defined in [this table](https://github.com/chanzuckerberg/napari-hub/wiki/Customizing-your-plugin's-listing#fields). We will use all items from the “Filterable” and "Sortable" columns. We should keep 
in mind that filters may be added or removed based on user feedback and we should be able to provide a solution that 
will scale both in design and implementation.

##### Technical decision
Use client-side filtering and sorting. Add query string parameters to the URL without reloading the entire page which 
will allow the user to reload the filtered state when needed. Keep in mind that we may need to provide a more robust 
filter/sort functionality after v0 as we grow our plugins to use an indexing service.

##### Technical requirements
* The user should have the ability to:
  * Add filters
    * Refreshes the list to filter by the selected filter
  * Remove filters
    * Refreshes the list to filter without the removed filter
  * Clear all filters
    * Refreshes the list with no filters applied
  * Select a sort option
    * Refreshes the list sorted by the user’s selection
* The search/filter/sort query should be encoded in the URL. User should be able to navigate to another page such as 
  the details page and when returning to the page with filters, the page should remember the filters and sort and load that state. 
  * This will enable linking to specific search results from elsewhere on the site (e.g. link to all plugins with a 
    certain tag by clicking the tag name on the plugin detail page)
  * This will allow users to easily share search results with a copy+paste of the URL
* User should be able to select filters or sort actions without the full page refreshing in a reasonable amount of time.

#### Mailing List
We will collect user data via a subscription form with the purpose of sending out future updates to subscribers.

##### Technical decision
Use Mailchimp forms and collect data within Mailchimp.

##### Technical requirements
* Form fields: Email address
* Form validation: Required field error, email address validation
* Email notification goes to admin when user signs up and subscriber gets added to list in Mailchimp.

### Test Plan
#### Frontend Testing
* The frontend will be tested using a variety of methods to verify correctness
  * Unit and E2E test support added in https://github.com/chanzuckerberg/napari-hub/pull/3
* Unit / Integration / Snapshot Tests
  * PRs ideally should include tests for new code
  * Components should include snapshot tests to prevent unintentionally updating the UI
  * Unit tests should focus on specific units: components, hooks, utils, etc.
  * Integration tests should test multiple components, hooks, utils working together
  * There should be more unit tests / snapshot tests than integration tests
  * There should be a GitHub workflow that runs tests for PRs to prevent merging failing tests
* End-To-End Tests
  * PRs should ideally include E2E tests for things like common actions, high value features, and features that depend on the backend
* Can be used to promote staging to production:
  * Staging site can’t be promoted to production unless the E2E tests pass
* Browser Testing
  * Developers should ideally test on as many browsers they can (Chrome, Safari, Firefox are Edge if 
    developer has a Windows computer)
    * BrowserStack is a possible solution for testing multiple browsers
  * Would be nice to setup E2E tests for multiple browsers
    * Playwright has experimental support
    * It’s possible to test Edge since it’s a webkit browser
* Lighthouse Tests (Extra)
  * Need to setup a GitHub workflow to run Lighthouse CI for every PR
  * This will help reduce regressions in accessibility, performance, and SEO
  * Highlight improvements in aforementioned areas

#### Backend testing
* API functional testing
  * Unit test for api setup for different endpoints
* API Load testing 
  * Confirm traffic we can handle in the current setup
* Health test
  * Health check for the http server

### Release Plan
First version of the site was released on production on June 30, 2021. Subsequent major and minor versions to follow.

#### Domain name
Decision: We will use napari-hub.org with naparihub.org redirecting to napari-hub.org

#### Hosting strategy
* We will use CZI hosted AWS since it will allow us more flexibility, is more future proof than Github pages and we 
  have a budget for services. We can take advantage of AWS services like Lambda and load balancing.
* We will work with CZI Infra Team to understand the components they have available for use. Terraform will be used. 
  Option to open source the Terraform files after release is still an open question on how best to do this.

#### Staging site
* We should have a separate staging site for testing
* We will likely put up a coming soon page on the production site until release

### Solutions
 
#### API
Deploy AWS lambda (to avoid machine level maintenance) to support API where we parse pypi result with a frequency 
of 5min (configurable, fine tune later between 1min to 1 hour), and cache to aws s3. We will use the public google 
bigquery dataset as a backup data source when the main query fails (this should also trigger an alert to our team 
channel to indicate that the lambdas have switched to the backup approach, eng team is responsible to react to such 
alerts and make adjustment (be it pypi outage or pypi website structure change to address the failure and bring the
parsing back online). The API to be built should return a list of plugin names, in the format of 
“[“plugin_1”, “plugin_2]”, where each individual plugin name can then be used to query qypi api
 
##### endpoints
* /plugins
  * return list of plugin and versions:
* /plugins/index
  * return all plugins’ metadata used in main page
* /plugins/{plugin_name}
  * return metadata for a plugin
* /plugins/{plugin_name}/version/{version}: 
  * return metadata for a specific version of plugin

#### Overall back-end technology:
We decided to use AWS which we will use services like Lambda, S3 and API Gateway.
 
#### Overall front-end technology:
After building some proof of concepts and testing, we decided to use React + Next.js and TailwindCSS. Further 
information to support this decision can be found in this document:Next.js vs SvelteKit

## Publishing of plugins
* To be transparent and not require an approval process as well as share the responsibility to flagging bad plugins, we will publish activity to the hub-updates stream on the [napari Zulip](https://napari.zulipchat.com). Activity will be published for brand new plugins, new versions of plugins as well as plugin removals.

## Further Considerations
* Since the first version will be very minimal, consider future features that may affect the chosen technologies and engineering design.
  * Even though the first version will support a small number of plugins, we should have a plan in order to scale and 
    support potentially 1,000s of plugins in future versions.
  * We will use Plausible for analytics for the first version. In future releases, we may need more detailed analytics 
    and should provide this without the use of a cookie banner.
* Impact on other teams/projects
  * Depending on our solution to getting the plugin list data, this could be something that the napari desktop 
    application could use as well. This may help to keep consistent.
  * After starting the implementation, we learned that there is a CZI Science effort to create a unified design system 
    based on Material UI. After doing a spike to figure out how much effort and the value we would get from using this 
    framework, we decided to integrate it into our implementation. Research from the spike can be found in this 
    document Material UI Integration
* User support
* Who is responsible for the maintenance of this site?
 
 

### Milestones
* Milestone April 5th: Plugin Page Design Complete and Ready to Build
* Milestone May 6th: Discovery Page Design Complete and Ready to Build
* Milestone June 30th: plugin discovery site alpha/v0 release

 
### Future work
* First version will be minimal
* We will iteratively add new features and get feedback from users in a continuous cycle of future releases
 
## Questions
* Do we expect the site to still function if Pypi is down? How should we handle this if we don’t cache the data on our side? 
  * For v0, it’s ok for the site to go down if Pypi goes down
* What amount of time is appropriate before a plugin’s meta data gets updated on the site
  * Do not have a number but the scale would be within range of minutes level (eg. 1min, 5min, etc) we can fine tune 
    the number to specifics later through configuration, but the design would be accommodating towards this range.
  * We can achieve up to hourly delay when building backend around google bigquery, and could improve to arbitrarily 
    close when we are parsing their html, technically I would recommend the approach of using bigquery if the product 
    requirement is tolerance up to an hour, and cache result from API when below 1 hour
* During the Trust XFN meeting, it was emphasized that we should have some moderation built in to monitor the plugins 
  which are published (and updated?). We need to determine what kind of mechanism to put in place in order to satisfy this requirement.
  * Since the napari community wants to support a very open environment, they would not support a system in place 
    which requires approval before plugins are published. One compromise that we can probably make is to provide a 
    process to openly monitor plugin publishing activity and post it to a group/community through a tool like Zulip so 
    that it is everyone's responsibility to flag a bad plugin and there is a process in place that allows for the 
    removal of the plugin from showing up on the napari hub. 
  * Decision:
    * We will add an “exclude” list for plugins to exclude from the hub search results. The exclusions will be stored 
      in a file and plugin data returned will not include those excluded plugins.
    * To be transparent and not require an approval process as well as share the responsibility to flagging bad 
      plugins, we will publish activity to a stream with topics on Zulip. Activity will be published for brand new 
      plugins, new versions of plugins as well as if a plugin is removed.
