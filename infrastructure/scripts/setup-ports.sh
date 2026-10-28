#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
infrastructure_dir=$(dirname "$script_dir")
ports=$(python3 -c 'import socket
sockets = [socket.socket() for _ in range(2)]
for item in sockets:
    item.bind(("127.0.0.1", 0))
print(*(item.getsockname()[1] for item in sockets))
for item in sockets:
    item.close()')
set -- $ports
printf 'FRONTEND_PORT=%s\nBACKEND_PORT=%s\n' "$1" "$2" > "$infrastructure_dir/.env"
