---
title: Reverse Proxy for Wings
description: Put Nginx, Apache or Caddy in front of a standalone Calagopus Wings node, serve it over HTTPS on port 443, and keep real client IPs working.
---

# Putting Wings Behind a Reverse Proxy

This guide applies to standalone Wings nodes installed with the [Wings guides](../../wings/installation/index.md). If you run the [All-in-One image](../../panel/installation/docker.md#option-a-all-in-one-recommended-for-single-node-setups), the bundled Wings is already covered by the [Panel guide](./panel.md).

See [Setting up a Reverse Proxy](./index.md) for how a reverse proxy fits into the request path if you haven't read that yet.

You have three ways to secure a standalone node, and most setups only need the first:

| Approach | When to use it |
| --- | --- |
| [Wings' built-in SSL](../../wings/configuration.md#ssl-configuration) | The node runs nothing else on ports 443/8080. Point Wings at the certificate files and you're done. No proxy involved. |
| Reverse proxy in front of Wings (this guide) | A proxy already runs on the node, you want Wings on port 443, or you want one place to manage certificates. |
| [Wings Proxy Mode](../../wings/advanced/exposing-wings-in-a-homelab.md) | The node can't be reached from the internet at all. The Panel relays browser traffic to it. |

With the first two options, browsers connect to Wings directly for the console, file uploads and downloads, so the node's public URL must be reachable from your users' machines. Only Wings Proxy Mode routes that traffic through the Panel instead.

## Prerequisites

Have these ready before you start:

- Wings is [installed](../../wings/installation/index.md) and reachable at `http://<node-ip>:8080`.
- A domain name for the node with an `A` record (and `AAAA` if you use IPv6) pointing at its public IP. This guide uses `<node-domain>` as a placeholder; replace it everywhere it appears.
- Ports `80` and `443` open in your firewall and forwarded on your router if the node is at home.
- A TLS certificate for the domain, unless you pick Caddy (which issues one by itself). See [Generating SSL Certificates](../ssl-certificates.md).
- The proxy software installed on the node: `apt install nginx`, `apt install apache2`, or the [Caddy install guide](https://caddyserver.com/docs/install).

::: warning
A broken proxy configuration makes the node unreachable until it is fixed, so keep a terminal open and know how to roll back.
:::

## Step 1: Trust the Proxy in Wings

Like the Panel, Wings needs to know which address the proxy connects from before it believes the forwarded IP headers. It uses them for its [per-IP WebSocket connection limits](../../wings/configuration.md#system-websocket-unauthenticated-connections-per-ip) and for the IP recorded on file-upload activity, so without this every user shares one budget.

Edit the node's `config.yml` (`/etc/calagopus-wings/config.yml`, or `config/config.yml` in the Wings compose directory) and set [`api.trusted_proxies`](../../wings/configuration.md#api-trusted-proxies):

::: code-group
```yaml [Wings as a binary or package]
# Wings listens on 127.0.0.1, so the proxy connects from the same machine:
api:
  trusted_proxies:
    - 127.0.0.1
```
```yaml [Wings in Docker]
# Print the gateway address inside the Wings compose directory:
#   docker inspect -f '{{range .NetworkSettings.Networks}}{{println .Gateway}}{{end}}' $(docker compose ps -q wings)
api:
  trusted_proxies:
    - 172.20.0.1
```
:::

This key is deliberately excluded from configuration updates pushed by the Panel, so it has to be edited on the node itself. Restart Wings afterwards:

::: code-group
```bash [Binary or package]
sudo systemctl restart wings
```
```bash [Docker]
docker compose restart wings
```
:::

You don't need to trust the Panel here. When the Panel relays a request in proxy mode, it authenticates the forwarded IP with the node token instead.

## Step 2: Configure the Proxy

The configuration is the same shape as the Panel's, forwarding to port `8080` instead, with two differences:

- **Uploads and downloads can be large.** The body limit should match [`api.upload_limit`](../../wings/configuration.md#api-upload-limit) in `config.yml` (in MiB, default `100`). The file manager splits larger files into requests of at most 95 MiB, so a limit below that breaks every big upload, and one at the default never gets in the way. Buffering is turned off so a multi-gigabyte backup streams through the proxy instead of being written to the proxy's disk first.
- **Only HTTP goes through the proxy.** SFTP (port `2022`) connects to the node directly, and so does the private network tunnel. That works on its own as long as the node's hostname resolves to the node's real IP.

Replace `<node-domain>` with the node's hostname.

::::tabs
=== Nginx

Uses the same `map` block from the [Panel configuration](./panel.md#step-2-configure-the-proxy); add it to `nginx.conf` if this node doesn't have it yet.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name <node-domain>;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name <node-domain>;

    access_log /var/log/nginx/calagopus-wings.access.log;
    error_log  /var/log/nginx/calagopus-wings.error.log error;

    ssl_certificate     /etc/letsencrypt/live/<node-domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<node-domain>/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Match api.upload_limit in config.yml (MiB)
    client_max_body_size 100M;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Upgrade          $http_upgrade;
        proxy_set_header Connection       $connection_upgrade;
        proxy_set_header Host             $host;
        proxy_set_header X-Real-IP        $remote_addr;
        proxy_set_header X-Forwarded-For  $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Stream uploads and downloads instead of spooling them to disk
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_pass http://127.0.0.1:8080;
    }
}
```

Save it as `/etc/nginx/sites-available/calagopus-wings.conf`, then enable and reload as in the [Panel guide](./panel.md#step-2-configure-the-proxy).

=== Apache

```apache
<VirtualHost *:80>
    ServerName <node-domain>
    RewriteEngine On
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName <node-domain>

    AllowEncodedSlashes NoDecode
    Protocols h2 http/1.1

    ErrorLog  /var/log/apache2/calagopus-wings.error.log
    CustomLog /var/log/apache2/calagopus-wings.access.log combined

    EnableSendfile Off
    # Match api.upload_limit in config.yml (bytes; 104857600 = 100 MiB)
    LimitRequestBody 104857600

    SSLEngine on
    SSLCertificateFile    /etc/letsencrypt/live/<node-domain>/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/<node-domain>/privkey.pem
    SSLProtocol           -all +TLSv1.2 +TLSv1.3

    ProxyPreserveHost On
    ProxyRequests Off

    <Proxy *>
        Require all granted
    </Proxy>

    # upgrade=websocket needs Apache 2.4.47 or newer
    ProxyPass        / http://127.0.0.1:8080/ retry=0 upgrade=websocket
    ProxyPassReverse / http://127.0.0.1:8080/

    RequestHeader set X-Real-IP        %{REMOTE_ADDR}s
    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
```

Save it as `/etc/apache2/sites-available/calagopus-wings.conf`, then enable and reload as in the [Panel guide](./panel.md#step-2-configure-the-proxy). The same [note about Apache older than 2.4.47](./panel.md#step-2-configure-the-proxy) applies.

=== Caddy

```text
<node-domain> {
    # Match api.upload_limit in config.yml
    request_body {
        max_size 100MB
    }

    reverse_proxy 127.0.0.1:8080
}
```

Caddy streams request bodies by default. Validate and reload as in the [Panel guide](./panel.md#step-2-configure-the-proxy).

::::

## Step 3: Point the Panel at the Proxied URL

In **Admin → Nodes → (your node) → General**, set **URL** to `https://<node-domain>` **without a port**. The proxy listens on `443`, which is what the URL implies. The form warns that no port was given and offers to add `:8080`; ignore it here, since `:8080` would bypass the proxy. Leave **Public URL** empty unless you want browsers to use a different address than the Panel does.

Keep `api.port` in `config.yml` at `8080`. The Panel's warning about the URL port not matching the API port only matters when Wings is reached directly.

Then open the node's **Configuration** tab and run **Verify Connection**. Both checks have to pass: **Backend to Wings** proves the Panel reaches the node through the proxy, and **Frontend to Wings** proves your browser does, which the console, uploads and downloads depend on.

## Docker and Cloudflare

If your proxy runs in Docker, or the node sits behind Cloudflare, the same adjustments as the Panel apply, just aimed at Wings' port `8080` instead of the Panel's `8000`:

- [Proxies Running in Docker](./panel.md#proxies-running-in-docker): forward to the Wings service name over a shared Docker network instead of a published port, and trust that network's subnet in `api.trusted_proxies` instead of a single gateway address.
- [Cloudflare](./panel.md#cloudflare): trust Cloudflare's IP ranges in `api.trusted_proxies` alongside your proxy's address, set the zone's SSL/TLS mode to Full (strict), and keep SFTP, game ports and the [private network](../../wings/advanced/private-network.md) tunnel on a DNS-only (grey cloud) hostname, since none of them are HTTP.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| 502 Bad Gateway, or the proxy's own error page | The proxy can't reach Wings. Check that it's running with `systemctl status wings` or `docker compose ps`, and that `curl -I http://127.0.0.1:8080` answers on the node. If the proxy runs in Docker, make sure both containers are on the same network and the forward target is the service name, not `127.0.0.1`. |
| The console stays on "connecting" and live statistics never appear | WebSocket upgrades aren't getting through. On Nginx, confirm the `map` block from the [Panel configuration](./panel.md#step-2-configure-the-proxy) exists in `nginx.conf` and both `Upgrade` and `Connection` headers are set. On Apache, check the version note in the Panel guide. |
| Uploads or downloads fail with `413 Request Entity Too Large` | Raise the body limit in the proxy configuration (`client_max_body_size`, `LimitRequestBody`, `max_size`) so it matches or exceeds [`api.upload_limit`](../../wings/configuration.md#api-upload-limit). |
| Rate limits or connection limits trigger for everyone at once, as if every user shares one budget | `api.trusted_proxies` doesn't contain the address the proxy connects from. Re-check [Step 1](#step-1-trust-the-proxy-in-wings); the address can change if the compose network was recreated. |
| "Frontend to Wings" fails while "Backend to Wings" passes | The Panel can reach the node but your browser can't. Usually the node's certificate isn't valid for the hostname, the hostname doesn't resolve publicly, or port 443 is blocked between you and the node. |
| Browser shows a certificate warning | The certificate has expired or was issued for a different name. See [Generating SSL Certificates](../ssl-certificates.md#troubleshooting) for renewal problems. |

Problems that aren't caused by the proxy, such as the node URL, tokens or clock skew, are collected on the [Troubleshooting](../troubleshooting.md) page.
