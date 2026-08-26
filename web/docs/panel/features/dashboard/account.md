---
title: Account
description: Manage your Calagopus account, password, email, two-factor authentication, account details, and avatar.
---

# Account

The Account page covers everything about your own user profile: password, email, two-factor authentication, display details, and avatar.

![](./images/account/overview.webp)

## Password

Enter your current password, then your new password twice, and hit **Update**. You always have to confirm your current password first, even if you're already logged in. If your account was created through an OAuth provider and has no password set, the **Current Password** field is hidden and this is how you set one for the first time.

## Email

Same idea: enter your new email and your current password, then **Update**.

## Two-Factor Authentication

Standard TOTP-based 2FA, the same kind used by most apps. Scan the QR code (or enter the code shown below it) in your authenticator app, then enter the 6-digit code it generates along with your current password to enable it.

<img src="./images/account/2fa-setup.webp" width="220" alt="" />

Right after enabling, a **Recovery Codes** dialog appears: "Below are your recovery codes. Store these in a safe place. If you lose access to your authentication device, you can use these codes to regain access to your account." You get ten codes; click the code block to copy them all. Each code works exactly once at the [login checkpoint](../auth/login.md#two-factor-checkpoint), and this dialog is the only time they're shown, so store them somewhere safe before closing it.

<img src="./images/account/2fa-recovery-codes.webp" width="220" alt="" />

Once you have a second factor set up, the card lists each enrolled method as a green badge - **Authenticator App**, **Security Key**, or **Email** - plus a line showing when your authenticator app was last used. With nothing set up it reads "No second factor is set up on your account yet." instead.

Up to three buttons sit at the bottom of the card: **Setup Two-Factor** or **Disable Two-Factor** for the authenticator app, **Enable Email** or **Disable Email** when the administrator has turned on email two-factor, and **Security Keys**, which takes you to the [Security Keys](./security-keys.md) page. Disabling asks for a valid authentication code and your password again.

If your role or the panel requires 2FA, the card also tells you whether your account currently meets that requirement. A frozen account shows an alert explaining that account details cannot be changed.

<img src="./images/account/2fa-disable.webp" width="220" alt="" />

## Account Details

Your first name, last name, username, and panel language. First and last name are optional; username is required, and the language selector only appears when the administrator allows changing it.

## Preferences

A separate card holding **Toast Position** (where notifications pop up on screen) and a toggle for whether the panel should open to the **Grouped Servers** view instead of **All Servers**, off by default. See [Servers](./servers.md) for the difference.

## Avatar

Click the empty **Avatar** field to upload an image. If it doesn't crop the way you want, drag the position handles on the preview grid to adjust it before saving.

<img src="./images/account/avatar-empty.webp" width="349" alt="" />

Once you have an avatar set, upload a new file and hit **Update** to replace it, or **Remove** to delete it.

<img src="./images/account/avatar-set.webp" width="338" alt="" />
