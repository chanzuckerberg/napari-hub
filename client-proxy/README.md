# Client Proxy

Node.js server for making requests to the hub API on behalf of the host server.
When combined with SSH local forwarding, it's possible to make API requests
locally for development to the API securely in an SSH tunnel.

## SSH Setup

This client assumes the infrastructure is using
[blessclient](https://github.com/chanzuckerberg/blessclient) for managing SSH
certificates. Install blessclient and run the following to gain access to the
AWS imaging infrastructure:

```sh
blessclient import-config git@github.com:chanzuckerberg/sci-imaging-infra/blessconfig.yml
```

## Proxy Script

The entrypoint to the client proxy is `proxy.sh`, a shell script with
commands for creating, uploading, and starting the proxy on a remote EC2
instance.

Some of the flags are required for some commands. The `help` command will
specify what commands are required for a specific flag.

### Help Message

A good starting point is the help message. Run the following to see the commands
and flags available:

```sh
./proxy.sh help
Usage: ./proxy.sh <command> [flags]

Commands:
  build                - Builds the image
  clean                - Removes the image and running container from the EC2 server
  connect              - Connects to the EC2 server with local port forwarding
  help                 - Prints this message
  start                - Starts the proxy server on the EC2 server
  stop                 - Stops the proxy server on the EC2 server
  upload               - Uploads the docker image to the EC2 server

Flags:
  --api-url            - URL to internal hub API (required: start)
  --server-ip          - The IP address of the EC2 server (required: clean, connect, start, stop, upload)
  --server-port        - The local port to forward API requests from
  --remote-server-port - The remote port to use on the server
```

### Status

To get the image and container status, use the `status` command:

```sh
./proxy.sh status --server-ip <ip-address>
```

The value `<ip-address>` should be the IP of the EC2 machine in AWS.

### Starting

To start the proxy server, the image will first need to be built and uploaded to
the EC2 server. After, a container can be started remotely.

```sh
./proxy.sh build
./proxy.sh upload --server-ip <ip-address>
./proxy.sh start --server-ip <ip-address> --api-url <api-url>
```

The value`<api-url>` should be the URL to the internal hub API.

### Cleaning

To update the server, first use the `clean` command:

```sh
./proxy.sh clean --server-ip <ip-address>
```

This will remove the proxy image and running container from the EC2 server.

### Local Port Forwarding

To access the API locally, a persistent SSH connection needs to be established
with the EC2 server. After starting the proxy, use the `connect` command to
connect to the EC2 server with local ports forwarded to the proxy:

```sh
./proxy.sh connect --server-ip <ip-address>
```

The default port to host on is `8081`. To change the default, use the
`--server-port` flag:

```sh
./proxy.sh connect --server-ip <ip-address> --server-port 12345
```

## Is There a Better Way?

There probably is a better way to set this up. Maybe we can create a simpler
Docker image with an nginx reverse proxy or if/when we open the hub API, we'll
be able to make requests directly.

Until then, this solution works fairly well :smile:
