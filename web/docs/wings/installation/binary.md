---
title: Binary Wings Installation
description: How to install Calagopus Wings as a standalone binary on Linux. Wings manages game server Docker containers on behalf of the Calagopus Panel.
---

# Binary Wings Installation

## Install a Container Runtime

Wings requires Docker or Podman to be installed and running on the host to manage game server containers.

::::tabs
=== Docker

Verify your installation:

```bash
docker --version
```

If Docker is not installed, the easiest way to get it is Docker's installation script:

```bash
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install) for your distribution.

=== Podman

Podman is supported as a drop-in alternative. Install it via your distribution's package manager (e.g. `apt install podman` or `dnf install podman`), then follow the [Running Wings with Podman](../advanced/running-wings-with-podman.md) guide to configure Wings to use the Podman socket.

::::

## Install the Wings Binary

```bash
curl -L "https://github.com/calagopus/wings/releases/latest/download/wings-rs-$(uname -m)-linux" -o /usr/local/bin/wings
chmod +x /usr/local/bin/wings
```

Verify the installation:

```bash
wings version
```

## Configure Wings

On a fresh installation, Wings starts in setup mode when no configuration file exists. You can start it in the foreground:

```bash
wings
```

Read the pairing code printed in the terminal, then follow [Pair a Waiting Node](../next-steps/configure-node.md#pair-a-waiting-node) in the Panel. Keep Wings running while you pair it; it writes its configuration and starts normal operation when pairing succeeds.

To create the node entry first, use the Panel's [enrollment command](../next-steps/configure-node.md#use-an-enrollment-command), or apply the generated YAML or `configure --join-data` command. Existing configurations continue to load normally.

## Install as a Service

Stop any foreground Wings process with `Ctrl+C` before starting the service:

```bash
wings service-install
```

The installer creates, enables, and starts a service for the host's init system. An unconfigured installation starts in setup mode; a configured one starts normal operation. On systemd, check its status and read the pairing code with:

```bash
systemctl status wings
journalctl -u wings -n 50 --no-pager
```

On Alpine/OpenRC, check it with `rc-service wings status`; if the pairing code is not visible in service logs, configure it using the enrollment command before starting the service.

## Next Steps

With Wings running, the next step is to set up allocations - the IP and port combinations you can assign to servers. See [Setting up Allocations](../next-steps/setting-up-allocations.md).
