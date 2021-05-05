#!/bin/bash

server_ip=''
server_port=8081
remote_server_port=8081

# Helper function for running ssh commands on the EC2 server.
ssh_command() {
  if [ -z "$server_ip" ]; then
    echo 'Missing flag --server-ip'
    exit -1
  fi

  local flags=''

  if [ "$1" = '--port-forward' ]; then
    shift
    flags="-CL $server_port:$server_ip:$remote_server_port"
  fi

  ssh $flags $server_ip "$@"
}

# Connects to the EC2 server with local port forwarding.
connect() {
  ssh_command --port-forward
}

build() {
  docker build --rm -t frontend-proxy .
}

upload() {
  docker save frontend-proxy | ssh_command sudo docker load
}

# Removes the proxy image and container.
clean() {
  ssh_command <<EOF
  sudo docker rm -f frontend-proxy
  sudo docker rmi frontend-proxy
EOF
}

stop() {
  ssh_command sudo docker rm -f frontend-proxy
}

start() {
  local api_url=''

  while (( "$#" )); do
    case "$1" in
      --api-url)
        shift
        api_url="$1"
        shift
        ;;
      *)
        shift
        ;;
    esac
  done

  if [ -z "$api_url" ]; then
    echo '--api-url flag is missing'
    exit -1
  fi

  ssh_command sudo docker run \
    --name frontend-proxy \
    -d -p $remote_server_port:80 \
    -e API_URL=$api_url  \
    frontend-proxy
}

# Gets the status of the proxy image and container. This runs some remote bash
# code on the EC2 server that filters and formats the docker image and process
# data.
status() {
  ssh_command <<EOF
  get_last_created() {
    sudo docker images \
      --filter reference='frontend-proxy:latest' \
      --format '{{.CreatedAt}}'
  }

  get_proxy_status() {
    sudo docker ps \
      -a --filter name='frontend-proxy' \
      --format '{{.Status}}'
  }

  last_created="\$(get_last_created)"
  proxy_status="\$(get_proxy_status)"

  if [ -z "\$last_created" ]; then
    last_created='Not installed'
  fi

  if [ -z "\$proxy_status" ]; then
    proxy_status='Not running'
  fi

  echo 'Status:'
  echo "  Image: \$last_created"
  echo "  Container: \$proxy_status"
EOF
}

help() {
  echo "Usage: $0 <command> [flags]"
  echo
  echo 'Commands:'
  echo '  build                - Builds the image'
  echo '  clean                - Removes the image and running container from the EC2 server'
  echo '  connect              - Connects to the EC2 server with local port forwarding'
  echo '  help                 - Prints this message'
  echo '  start                - Starts the proxy server on the EC2 server'
  echo '  stop                 - Stops the proxy server on the EC2 server'
  echo '  upload               - Uploads the docker image to the EC2 server'
  echo
  echo 'Flags:'
  echo '  --api-url            - URL to internal hub API (required: start)'
  echo '  --server-ip          - The IP address of the EC2 server (required: clean, connect, start, stop, upload)'
  echo '  --server-port        - The local port to forward API requests from'
  echo '  --remote-server-port - The remote port to use on the server'
}

# Entrytpoint for the proxy script. This parses the command line arguments and
# separates the commands from flags. The command is then used to call a function
# above with the flags as arguments.
main() {
  local proxy_command=''
  local flags=''

  while (( "$#" )); do
    case "$1" in
      --server-ip)
        shift
        server_ip="$1"
        shift
        ;;
      --server-port)
        shift
        server_port="$1"
        shift
        ;;
      --remote-server-port)
        shift
        remote_server_port="$1"
        shift
        ;;
      --*)
        flags="$flags $1 $2"
        shift
        shift
        ;;
      *)
        proxy_command="$1"
        shift
        ;;
    esac
  done

  if [ -z "$proxy_command" ]; then
    help
    exit -1
  fi

  if [ $proxy_command = 'help' ]; then
    help
    exit
  fi

  $proxy_command $flags
}

main "$@"
