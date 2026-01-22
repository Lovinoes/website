# Wings

## Minimum Requirements

Before installing the Calagopus Wings Daemon, ensure that your system meets the following minimum requirements:

- **Operating System**: Ubuntu 22.04 LTS or later, Debian 11 or later, or anything that supports modern Docker versions
- **CPU Architecture**: x86_64, ARM64, RISC-V or PPC64LE
- **RAM**: Minimum 512 MB (1 GB or more recommended)
- **Disk Space**: At least 256 MB of free disk space

**Important:** Wings **requires** Docker to be installed and running on the host machine to manage game server containers, these minimum requirements also do not include actual load from game servers which will require additional resources based on the games being hosted.

## Technical Overview

The Calagopus Wings Daemon is a lightweight agent responsible for managing game server containers on behalf of the Calagopus Panel. It communicates securely with the Panel to receive instructions and report status updates.

- **Language**: :crab: Rust
- **Container Management**: Docker/Podman via [`bollard`](https://crates.io/crates/bollard)
- **Web Framework**: [`axum`](https://crates.io/crates/axum)
- **Runtime**: [`tokio`](https://crates.io/crates/tokio)
- **SSH Handling**: [`russh`](https://crates.io/crates/russh)

While Cross-Platform support is a goal for Wings, at this time only Linux/MacOS is officially supported due to the reliance on Unix-specific features.
Most of the other functionality is implemented from scatch or using smaller crates to keep dependencies minimal and avoid bloat.
