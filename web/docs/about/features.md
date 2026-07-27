---
title: Feature Reference
description: A full list of Calagopus features and a side-by-side comparison with Pterodactyl, Pelican, and AMP. See what sets Calagopus apart.
---

# Feature Reference

A categorized overview of what Calagopus offers, followed by a comparison with other panels wherever we're confident of the other panel's behavior. Categories with a comparison table are followed by an "Also included" list of further Calagopus-specific capabilities in that area.

Pterodactyl and Pelican are compared against the current state of their public main branches, which may include features not yet in a tagged release. AMP is closed-source, so cells we cannot verify from source are left blank rather than guessed.

## Highlights

- **Fast**: Both the node daemon and panel backend are written in Rust, designed to use as few resources as possible while delivering a responsive experience.
- **Secure**: Security is a first-class concern in the architecture, with hardening built in by default.
- **Easy to use**: The panel is designed to be approachable without requiring a background in server administration.
- **Open Source**: The code is on GitHub and contributions are welcome.
- **Cross-Platform**: The panel runs on essentially any operating system.
- **Extensible**: A built-in extension system lets you add custom backend logic, routes, UI elements, and more.
- **Scalable**: The architecture scales horizontally - add more backend instances, read replicas, and Wings nodes as load grows.
- **WebAuthn**: Users can authenticate with passkeys, biometrics, or hardware security keys.
- **Schedule Tasks**: Automate server management with time- and event-based scheduling.
- **Subuser Management**: Grant other users scoped access to a server without full admin rights.
- **File Manager**: Browse, upload, download, and edit server files directly from the panel, including archive and backup browsing.
- **API**: A comprehensive API covers everything the panel UI does. See the [API Reference](https://demo.calagopus.com/api) for details.

## Core & Extensibility

<FeatureTable id="core" />

## Console & Real-Time Management

<FeatureTable id="console" />

## File Management

<FeatureTable id="files" />

## Databases

<FeatureTable id="databases" />

## Backups

<FeatureTable id="backups" />

## Scheduling & Automation

<FeatureTable id="scheduling" />

## Networking

<FeatureTable id="networking" />

## Subusers & Roles

<FeatureTable id="subusers-roles" />

## Authentication & Security

<FeatureTable id="auth-security" />

## Account & Onboarding

<FeatureTable id="account-onboarding" />

## Administration

<FeatureTable id="administration" />

## Nodes & Infrastructure

<FeatureTable id="nodes-infrastructure" />

## UI/UX & Internationalization

<FeatureTable id="ui-ux" />

If anything on this page looks inaccurate, let us know on Discord or open an issue on GitHub.
