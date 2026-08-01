export interface ReleaseCallout {
  type: 'info' | 'tip' | 'warning' | 'danger';
  title?: string;
  body: string;
}

export interface ReleaseNote {
  callouts?: ReleaseCallout[];
  body?: string;
}

export const releaseNotes: Record<string, Record<string, ReleaseNote>> = {
  panel: {
    '1.1.0': {
      callouts: [
        { type: 'warning', title: 'Extensions', body: 'Extensions must be updated before using this version.' },
        {
          type: 'warning',
          title: 'Update Wings after the panel',
          body: 'After updating the panel, update Wings as well. **DO NOT UPDATE WINGS BEFOREHAND**, as this may lead to issues.',
        },
      ],
    },
    '1.0.11': {
      callouts: [
        {
          type: 'warning',
          title: 'Update Wings first',
          body: 'Update Wings **before** updating the Panel to this version to prevent servers getting stuck loading forever. This was the last release before 1.1.0.',
        },
      ],
    },
    '1.0.7': {
      callouts: [
        {
          type: 'info',
          title: 'Migration note',
          body: 'If you get a migration error due to email templates, you will need to clear out that table - some changes have been made that cannot be properly migrated with data inside. Back up any modifications to those templates and reapply them afterwards.',
        },
      ],
    },
    '1.0.6': {
      callouts: [
        {
          type: 'warning',
          title: 'Update Wings first',
          body: 'Make sure to update Wings before installing this release.',
        },
      ],
    },
    '1.0.0': {
      body: `### Added

- Added support for web extension management in the \`heavy\` docker images
- Added tons of new pages to the OOBE
- Added translations to the schedules page
- Added support for ignoring casing in schedule console line actions
- Added mass-context menu to files when right-clicking a selected file
- Added support for opening compressed text files (e.g. \`.log.gz\`)
- Added egg configuration system for layered egg-specific configurations (e.g. allocation-related / route order / filtering)
- Added server deployment endpoint for billing support
- Added more allocation modes to mass server transfers

### Fixed

- Fixed some issues with websocket error handling
- Improved note editing of server allocations
- Rewrote file manager upload code to be more reliable and less buggy`,
    },
    '1.0.0-pre.3': {
      callouts: [
        {
          type: 'info',
          body: 'This release fixed a small change in the rustis library that caused all binary redis writes to fail.',
        },
      ],
      body: `### Added

- Added clock out of sync warning to 2FA setup
- Added link to the updating guide when a new version is available

### Fixed

- Fixed passing an incorrect type to rustis causing a syntax error
- Made Biome format translations in extension public folders`,
    },
    '1.0.0-pre.2': {
      callouts: [
        {
          type: 'warning',
          title: 'Update Wings first',
          body: 'Please make sure to upgrade Wings before the panel to avoid any issues. If you are already on Wings `1.0.0-pre.3` it will be fine.',
        },
      ],
      body: `### Added

- Added ability to mass-update-from-repo for eggs
- Added ETA to backup restores and transfers
- Added more toasts for panel events, like installations finishing
- Added better toast API and better translation API for more control
- Added missing egg configuration options from the UI
- Added context menu to admin assets for quicker one-off deletions
- Added French translations
- Added ability to prevent users from changing their own language

### Fixed

- Completely reworked the heavy image so it uses less time and resources to compile
- Rely on Wings for determining whether files are editable or not to improve accuracy
- Reworked the OOBE UI
- Reorganized the file dropdown so it has fewer direct options
- Reworked the extension database system to be finally stable
- Fixed redirects when a server transfer finishes
- Fixed doubled ANSI-escape codes in tracing logs
- Completely fixed the extension translation system for better HMR and proper support for shipping translation files in extensions
- Fixed not being able to press enter in the console in some cases
- Fixed some missing autofocus in modals, mainly in the file manager
- Fixed admin/client \`BackupRows\` not properly handling failed/pending backups
- Allowed editing name/lock of pending and failed backups
- Migrated from Mantine 8 to Mantine 9

### Removed

- Removed requirement for redis/valkey - the panel can now run on only its internal cache for simple environments`,
    },
    '1.0.0-pre.1': {
      body: `### Added

- Added line wrap option to the file editor
- Added tons of new extension APIs
- Switched to Vite 8
- Added option for non-admins to see transfer status
- Added ability to reset variables to their default value
- Added user preview when logging in and getting to the TOTP page
- Added server screen blocks (installing, transferring, restoring backup, ...)
- Added credential ID field to security keys
- Added file details modal with additional file entry information
- Added ability for users to acknowledge installation failures
- Added support for differentiating logical and physical sizes in the file manager
- Added extension support for extending API structs
- Added support for mass-transferring node servers
- Added transfer progress overview page to nodes
- Added SSH Details modal to the server console
- Added the last server UI tab - Mounts
- Added command snippets feature

### Fixed

- Translated more generic elements
- Fixed page shift when copying text with the secure context bypass
- Automatically disable the security key button when not in a secure context
- Automatically delete stale, unconfigured security keys
- Removed country from language names
- Fixed tons of issues with server resource fetching
- Fixed some backend cache invalidation issues
- Improved & simplified the auth UI
- Fixed performance issues in admin forms
- Fixed \`TranslationProvider\` doing unnecessary HTTP requests
- Fixed compatibility issue on the Pterodactyl import CLI
- Cleaned up the sidebar
- Switched file manager search to \`CTRL + K\` to keep working browser search
- Fixed TOTP QR code issues
- Fixed backup rows not handling failed backups properly
- Drastically improved websocket connection logic
- Limited the window provider to 32 open windows and reuse z-indexes to avoid cursed issues
- Fixed some D&D related z-index issues on schedules
- Fixed mobile scrolling on the grouped servers page`,
    },
  },

  wings: {
    '1.0.8': {
      callouts: [
        {
          type: 'warning',
          title: 'Pterodactyl hosts: update immediately',
          body: 'If you are using Pterodactyl and you are a server host, update to this release **immediately**. If you are using Calagopus, there is no need for an immediate rush.',
        },
      ],
    },
    '1.0.7': {
      callouts: [
        {
          type: 'warning',
          title: 'Update the Panel first',
          body: 'Update the Panel **before** updating Wings to this release. This applies to both Pterodactyl and Calagopus.',
        },
      ],
    },
    '1.0.3': {
      callouts: [{ type: 'info', title: '200th release', body: 'This was the 200th release of Calagopus Wings.' }],
    },
    '1.0.0': {
      body: `### Added

- Added support for ignoring casing in schedule console line actions
- Added \`inner_editable\` to the directory entry struct for compressed text files

### Fixed

- Added an explicit check for the root user as a container user and block it`,
    },
    '1.0.0-pre.8': {
      body: `### Fixed

- Do not mount the \`product_uuid\` sys mount when in rootless mode anymore
- Fixed \`control.read-console\` permission check in SSH mode by reworking the Calagopus compat permission system
- Cleaned up websocket code, migrated to better permission checks
- Fixed docker user initialization code causing invalid defaults`,
    },
    '1.0.0-pre.7': {
      body: `### Added

- Added \`editable\` to directory entry structs so that Wings can better identify editable files for the panel
- Added ANSI escape code for setting the terminal title when using SSH shell to connect to a server

### Fixed

- Updated ddup-bak for more reliable repo saving
- Cleaned up some websocket code, revoke all ws permissions on transfer finish
- Do not recurse symlinks in the inotify watcher disk checker implementation
- Made the game version endpoint use a different hash order for Java edition`,
    },
    '1.0.0-pre.6': {
      body: `### Fixed

- Fixed unchecked cast from \`i64\` to \`u64\` being able to cause massive disk usage inflation`,
    },
    '1.0.0-pre.5': {
      body: `### Added

- Added endpoint for getting server utilization of the node (instead of needing to fetch full server structs)
- Added endpoint for getting server transfer status of outgoing transfers (instead of requiring ws for this info)
- Added \`size_physical\` to file entry structs for the new separation of disk tracking

### Fixed

- Further improved the inotify checker
- Fixed how disk usage is propagated in partial disk usage checks
- Properly separate "logical" and "physical" file sizes, using physical for the quota
- Properly preserve ctime in archives and add it for 7z archives
- Adjusted ws transfer progress message to separate archive and network progress`,
    },
    '1.0.0-pre.4': {
      body: `### Added

- Added \`system.disk_check_use_inotify\` config option to use the new inotify-based disk checker instead of forcing full rescans
- Added \`ignore_panel_wings_upgrades\` config option to disable the remote update binary endpoint of Wings
- Added support for \`users-groups-by-id@openssh.com\` in the SFTP server
- Added websocket messages for machine-readable server transfer status updates

### Fixed

- Fixed installation logs not capturing some early logs that ran instantly at container creation
- Fixed logic bug in the file move process that caused incorrect disk usage modification guess`,
    },
    '1.0.0-pre.1': {
      callouts: [
        {
          type: 'info',
          title: 'Release tag change',
          body: 'Starting with this release, the `:latest` docker tag no longer contains all commits from `main` - only the latest release. Existing releases are no longer patched, so new commits only land on new version numbers. The `:nightly` docker tag now runs for every commit on the `main` branch and there is no more dedicated `nightly` branch. All 1.0.0 pre-releases are available under `:latest`; in the future, pre-releases will only be available on `:latest-pre`.',
        },
      ],
      body: 'Compared to 0.24.9 this has essentially zero notable changes.',
    },
  },

  'db-agent': {},
};
