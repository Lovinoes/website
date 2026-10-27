---
title: File Overrides
description: Swap a whole Panel frontend module for your own at build time with overrides.ts and defineOverride.
---

# File Overrides

Slots, interceptors and [hookable components](./theming.md#hookable-components) all work by plugging into places the Panel opened up for extensions. Sometimes the thing you want to change has no such opening, like a modal that isn't built from hookable pieces or a page whose layout you want to rethink. For those cases an extension can replace a whole frontend file.

You declare the swap in `src/overrides.ts`, and a Vite plugin in the Panel's build rewrites every import of the original file to point at yours instead. Nothing is registered at runtime, because the replacement is baked into the bundle.

## Declaring an Override

Create `src/overrides.ts` next to your `index.ts`:

```bash
backend-extensions/
  (package_identifier)/
    frontend/
      src/
        index.ts
        overrides.ts # optional, read at build time
        SftpDetailsModal.tsx # your replacement
```

Import the core file you want to replace and your replacement, and pass both to `defineOverride`:

```ts
import { defineOverride } from 'shared';
import SftpDetailsModal from '@/pages/server/files/modals/SftpDetailsModal.tsx';
import MySftpDetailsModal from './SftpDetailsModal.tsx';

export default [defineOverride(SftpDetailsModal, MySftpDetailsModal)];
```

From the next build (or dev server restart) on, every file in the Panel that imports `@/pages/server/files/modals/SftpDetailsModal.tsx` gets `./SftpDetailsModal.tsx` from your extension instead. That covers core pages, other extensions, and lazy `import()` calls.

`defineOverride` types its second argument as `NoInfer<T>` of the first, so your replacement has to match the original's type. When the core component's props change in a Panel update, typechecking your extension flags the drift before anyone sees a broken page.

## How It Works

The `extension-overrides` plugin in `frontend/vite-plugins/` runs before every other plugin. At startup it walks each extension's `src/overrides.ts` and parses it without executing it, which puts a few rules on how you write the file:

- **Both arguments must be plain identifiers bound by an `import`.** The plugin looks up each identifier in the file's import declarations to find the path. A default import and a named import both work (`import { Modal } from '@/elements/modals/Modal.tsx'`), but anything it can't trace back to an import is skipped without a warning: `defineOverride(Modal.Footer, ...)`, a namespace import (`import * as X`), a variable you assigned yourself, an inline `() => ...`.
- **Paths must be `@/...` or relative.** The original is resolved against the Panel's `src/`, relative paths against your `overrides.ts`. Overrides of package imports (`@mantine/core`, `shared`) are ignored.
- **Nothing in `overrides.ts` runs in the browser.** The Panel never imports the file at runtime, so the default export is there for readability and typechecking only. Register hooks, routes and the like in `index.ts`.
- **Matching ignores the file extension.** `@/elements/Foo` and `@/elements/Foo.tsx` point at the same original, and symlinked paths are resolved to their real location first.

## Replacing the Whole Module

The override swaps the whole module, and the export you pass to `defineOverride` only decides what gets typechecked. Every import of the original path is redirected, named imports included, so if the core file exports more than one thing, your replacement has to export all of them:

```ts
// core: @/elements/modals/Modal.tsx exports both Modal and ModalFooter
import { defineOverride } from 'shared';
import { Modal } from '@/elements/modals/Modal.tsx';
import { Modal as MyModal } from './Modal.tsx';

export default [defineOverride(Modal, MyModal)];
```

```tsx
// ./Modal.tsx - must also provide ModalFooter, or every
// `import { ModalFooter } from '@/elements/modals/Modal.tsx'` breaks
import { makeComponentHookable } from 'shared';

export const Modal = makeComponentHookable(/* ... */);
export const ModalFooter = makeComponentHookable(/* ... */);
```

If the original is [hookable](./theming.md#hookable-components), wrap your replacement with `makeComponentHookable` too. Other extensions calling `Modal.addPropsInterceptor(...)` import your module now, and without the wrapper those calls throw.

## Wrapping the Original

Your replacement file is the one place where importing the original path still gives you the real core module, so you can wrap it instead of rewriting it:

```tsx
// ./SftpDetailsModal.tsx
import type { ModalProps } from '@mantine/core';
import Alert from '@/elements/feedback/Alert.tsx';
import CoreSftpDetailsModal from '@/pages/server/files/modals/SftpDetailsModal.tsx';

export default function SftpDetailsModal(props: ModalProps) {
  return (
    <>
      {props.opened && <Alert>SFTP access is logged.</Alert>}
      <CoreSftpDetailsModal {...props} />
    </>
  );
}
```

The exception covers only the replacement file itself. Any other file in your extension that imports the original path, including a component that your replacement renders, gets your replacement. If that component then renders the "original", it renders your replacement again, and you end up with infinite recursion. Import the core module directly from the replacement file and pass it down if a child needs it.

## Conflicts

Only one extension can override a given core file. If two installed extensions both declare an override for the same path, the build fails and the error names both extensions:

```txt
[extension-overrides] Duplicate override: both "dev_0x7d8_a" and "dev_0x7d8_b" override "pages/server/files/modals/SftpDetailsModal". Only one extension may override a given core component.
```

A syntax error in `overrides.ts` also fails the build, naming the file. Overrides that are silently skipped (see [How It Works](#how-it-works)) don't produce an error, so if your replacement doesn't show up, check the identifiers and paths first.

## During Development

`pnpm dev` watches every extension's `overrides.ts`. Adding, editing or deleting one restarts the dev server so the new override map takes effect. Your replacement component itself hot-reloads like any other file.

In production, overrides are part of the compiled frontend, so adding or changing one needs a rebuild, the same as installing an extension. This also means [disabling an extension](../disabling-extensions.md) doesn't undo its overrides: the frontend never runs the disabled extension's entrypoint, but the replaced file stays replaced until the extension is uninstalled and the frontend rebuilt.

## When to Use It

A file override is the bluntest tool the frontend has, a step past `replaceBaseComponent`. Once you override a file you own a copy of core code. The type check catches signature drift, but behavior changes and bug fixes in the original won't reach your copy, so you'll have to port them yourself. And because only one override per file is allowed, overriding a commonly targeted component makes your extension incompatible with any other extension that wants it.

If a [slot](./mounting-ui.md#slotting-into-existing-pages) or a [hookable component](./theming.md#hookable-components) interceptor can do the job, use that. Reach for an override when the file has no extension point that fits.
