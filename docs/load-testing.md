# Load Test Hub API
We can use [k6](https://k6.io/docs/) for load testing purpose, and [openapi generator](https://github.com/OpenAPITools/openapi-generator)
conveniently convert from OpenAPI specification to a k6 testing script, so we don't have to manually create the test script.

## installation
### openapi generator
For macOS, openapi generator can be installed via brew:
```
brew install openapi-generator 
```
See [openapi generator installation guide](https://github.com/OpenAPITools/openapi-generator#1---installation) when used on other platforms

### generate k6 load testing script
openapi generator can use an openapi specification to generate script used by k6, for example, to generate the script to /tmp/napari-hub-api-test/ with production api specification:
```
openapi-generator generate -i https://api.napari-hub.org/swagger.yml  -o /tmp/napari-hub-api-test/ -g k6
```
optionally modify the generated script to change input parameters, etc.

### k6
For macOS, k6 can be installed via brew:
```
brew install k6
```
See [k6 installation guide](https://k6.io/docs/getting-started/installation/) when used on other platforms

### Datadog
We can use datadog to visualize the result and share with others, see [datadog guide](https://docs.datadoghq.com/integrations/k6/) to set up integration on metrics reporting

The datadog api key can be fetched under organization setting when logged in to datadog, and to start datadog agent via docker
```
DOCKER_CONTENT_TRUST=1 \
docker run -d \
    --name datadog \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    -v /proc/:/host/proc/:ro \
    -v /sys/fs/cgroup/:/host/sys/fs/cgroup:ro \
    -e DD_SITE="datadoghq.com" \
    -e DD_API_KEY=<YOUR_DATADOG_API_KEY> \
    -e DD_DOGSTATSD_NON_LOCAL_TRAFFIC=1 \
    -p 8125:8125/udp \
    datadog/agent:latest
```

## Load Testing
Now to run k6 testing kit with the generated testing script:
```
k6 run /tmp/napari-hub-api-test/script.js -u 200 -i 100000
```

To report metrics during the run to datadog, first [start the datadog agent](#datadog), and then run k6 with statsd:
```
K6_STATSD_ENABLE_TAGS=true k6 run --out statsd /tmp/napari-hub-api-test/script.js -u 200 -i 100000
```
Optionally configure the amount of virtual users (the above command uses 200), and number of iterations (the command above use 100000)