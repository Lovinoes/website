---
title: Package Manager Wings Installation
description: Install Calagopus Wings from the APT, RPM, or APK repository, or from the AUR.
---

# Package Manager Wings Installation

Install Wings directly from the APT, RPM or APK repository, or from the Arch User Repository (AUR). Select your package manager:

::::tabs
=== APT (Debian / Ubuntu)

### Install Docker

Wings requires Docker to manage game server containers. Verify your installation:

```bash
docker --version
```

If Docker is not installed, the easiest way to get it is Docker's installation script:

```bash
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).

### Add the Repository

```bash
curl -fsSL https://packages.calagopus.com/pub.gpg -o /usr/share/keyrings/calagopus-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/calagopus-archive-keyring.gpg] https://packages.calagopus.com/deb stable main" | sudo tee /etc/apt/sources.list.d/calagopus.list
apt update
```

### Install Wings

```bash
apt install -y calagopus-wings
```

Verify the installation:

```bash
calagopus-wings version
```

### Add an Alias (Optional)

If you'd prefer to type `wings` instead of `calagopus-wings`, create a symlink:

```bash
ln -s $(whereis -b calagopus-wings | awk '{print $2}') /usr/local/bin/wings
```

=== RPM (RHEL / Fedora / Rocky / Alma)

### Install a Container Runtime

Wings needs either Docker or Podman installed and running. RHEL-family distributions ship Podman by default, so you may already have it.

::: info Already have Podman?
You can keep it. Skip ahead to [Add the Repository](#add-the-repository-1). After Wings is installed, follow the [Running Wings with Podman](../../wings/advanced/running-wings-with-podman.md) guide to configure Wings to use the Podman socket instead of Docker.
:::

To use Docker instead, remove Podman first:

```bash
dnf remove podman buildah
```

### Install Docker

Wings requires Docker to manage game server containers. Verify your installation:

```bash
docker --version
```

If Docker is not installed, the easiest way to get it is Docker's installation script:

```bash
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).

### Add the Repository

```bash
sudo rpm --import https://packages.calagopus.com/pubring.gpg
sudo tee /etc/yum.repos.d/calagopus.repo > /dev/null <<EOF
[calagopus]
name=Calagopus Repository
baseurl=https://packages.calagopus.com/rpm
enabled=1
gpgcheck=1
gpgkey=https://packages.calagopus.com/pubring.gpg
EOF
```

### Install Wings

```bash
dnf install calagopus-wings
```

Verify the installation:

```bash
calagopus-wings version
```

### Add an Alias (Optional)

If you'd prefer to type `wings` instead of `calagopus-wings`, create a symlink:

```bash
ln -s $(whereis -b calagopus-wings | awk '{print $2}') /usr/local/bin/wings
```

=== APK (Alpine)

### Install Docker

Wings requires Docker to manage game server containers. Verify your installation:

```bash
docker --version
```

If Docker is not installed, enable the community repository and install it:

```bash
apk add docker docker-cli-compose
rc-update add docker
rc-service docker start
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).

### Add the Repository

```bash
wget -q -O /etc/apk/keys/calagopus.rsa.pub https://packages.calagopus.com/apk/calagopus.rsa.pub
echo "https://packages.calagopus.com/apk" >> /etc/apk/repositories
apk update
```

### Install Wings

```bash
apk add calagopus-wings
```

Verify the installation:

```bash
calagopus-wings version
```

### Add an Alias (Optional)

If you'd prefer to type `wings` instead of `calagopus-wings`, create a symlink:

```bash
ln -s $(whereis -b calagopus-wings | awk '{print $2}') /usr/local/bin/wings
```

=== AUR (Arch Linux)

### Install Docker

Wings requires Docker to manage game server containers. Verify your installation:

```bash
docker --version
```

If Docker is not installed, install it from the official repositories:

```bash
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
```

Otherwise refer to the [official Docker installation guide](https://docs.docker.com/engine/install).

### Install Wings

Wings is published to the [AUR](https://aur.archlinux.org/packages/calagopus-wings-bin). Install it with your preferred AUR helper:

```bash
yay -S calagopus-wings-bin
```

Verify the installation:

```bash
calagopus-wings version
```

### Add an Alias (Optional)

If you'd prefer to type `wings` instead of `calagopus-wings`, create a symlink:

```bash
ln -s $(whereis -b calagopus-wings | awk '{print $2}') /usr/local/bin/wings
```

::::

## Configure Wings

On a fresh installation, Wings starts in setup mode when no configuration file exists. You can start it in the foreground:

```bash
calagopus-wings
```

Read the pairing code printed in the terminal, then follow [Pair a Waiting Node](../next-steps/configure-node.md#pair-a-waiting-node) in the Panel. Keep Wings running while you pair it; it writes its configuration and starts normal operation when pairing succeeds.

To create the node entry first, use the Panel's [enrollment command](../next-steps/configure-node.md#use-an-enrollment-command), or apply the generated YAML or `configure --join-data` command. Existing configurations continue to load normally.

## Install as a Service

Stop any foreground Wings process with `Ctrl+C` before starting the service:

```bash
calagopus-wings service-install
```

The installer creates, enables, and starts a service for the host's init system. An unconfigured installation starts in setup mode; a configured one starts normal operation. On systemd, check its status and read the pairing code with:

```bash
systemctl status wings
journalctl -u wings -n 50 --no-pager
```

On Alpine/OpenRC, check it with `rc-service wings status`; if the pairing code is not visible in service logs, configure it using the enrollment command before starting the service.

## Next Steps

With Wings running, the next step is to set up allocations - the IP and port combinations you can assign to servers. See [Setting up Allocations](../next-steps/setting-up-allocations.md).
