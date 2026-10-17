# Setup: timwhite.ninja

Operational notes for hosting this blog at `https://timwhite.ninja`. These are
account actions (registrar, DNS, GitHub settings), done by hand. The repo only
carries the site config.

State verified 2026-10-16.

## Current state

| Item | Value | How verified |
|---|---|---|
| Registrar | Porkbun (`tenaxlabs` account), transferred 2026-10-08 | RDAP |
| Registered / expires | 2015-06-22 / 2028-06-22, auto-renew on | RDAP, Porkbun API |
| Locks | client transfer + delete prohibited | RDAP |
| **Authoritative DNS** | **still `dns1-3.iwantmyname.com`** | `.ninja` registry, RDAP, 1.1.1.1, Porkbun `getNs` |
| Email | Google Workspace (5 MX) | live zone |
| SPF / DKIM / DMARC | **none** | live zone |
| Apex A | `34.211.99.25`, dead (no HTTP response) | curl |

The Porkbun zone (imported on transfer) **matches the live iwantmyname zone
record for record**, so switching nameservers does not interrupt email.

### Zone contents (identical in both places)

| Type | Host | Value |
|---|---|---|
| A | @ | 34.211.99.25 (dead; replace, see below) |
| MX | @ | 1 aspmx.l.google.com |
| MX | @ | 5 alt1.aspmx.l.google.com |
| MX | @ | 5 alt2.aspmx.l.google.com |
| MX | @ | 10 alt3.aspmx.l.google.com |
| MX | @ | 10 alt4.aspmx.l.google.com |
| TXT | @ | google-site-verification=ObpFO9o3cJs3TokN4DvexY0jQWzOODrbr_J6COczNCQ |
| TXT | @ | keybase-site-verification=9N00Mi2vO7ZS6E8et_dkGsoVgxf75l9-jKgY4d2O_n0 |
| CNAME | docs, mail, calendar | ghs.googlehosted.com (legacy Google Apps URLs) |
| SRV | _xmpp-server._tcp | 5× Google XMPP (Google Talk, defunct) |

## Step 1: move DNS to Porkbun

1. Porkbun → Domain Management → timwhite.ninja → Authoritative Nameservers →
   **use Porkbun defaults** (use the button; don't type names).
2. Wait for the registry delegation to update (TTL 3600s, so usually within a few hours).
3. Verify:

   ```sh
   tld=$(dig +short ninja NS | head -1)
   dig +norec @$tld timwhite.ninja NS        # expect *.porkbun.com
   dig +short @1.1.1.1 timwhite.ninja MX     # expect the 5 Google MX
   dig +short @1.1.1.1 timwhite.ninja TXT
   ```

## Step 2: GitHub Pages (after the first deploy)

Repo: `timwhite.ninja` (public). Deploy is `.github/workflows/deploy.yml`
(Astro's Pages action). The site's URL comes from `site` in
`astro.config.mjs`, and `public/CNAME` holds `timwhite.ninja`.

1. GitHub → repo Settings → Pages → Source: **GitHub Actions**.
2. In Porkbun DNS:
   - **Delete** A `@ → 34.211.99.25`, plus any Porkbun parking A/ALIAS/CNAME records on `@`/`www`/`*`.
   - **Add** A `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - (optional) AAAA `@` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - **Add** CNAME `www` → `<github-user>.github.io`
   - **Do not touch** the MX or TXT records.
3. GitHub → Settings → Pages → Custom domain: `timwhite.ninja`. Once the
   certificate is issued (minutes to about an hour), enable **Enforce HTTPS**.
4. Optional: verify the domain for your GitHub account (Settings → Pages →
   Verified domains, which adds a `_github-pages-challenge-<user>` TXT record).
   This stops anyone else's repo from claiming the domain.

Verify:

```sh
dig +short timwhite.ninja A       # the four 185.199.x.153 addresses
dig +short www.timwhite.ninja     # <user>.github.io → 185.199.x.153
curl -sI https://timwhite.ninja | head -3
```

## Step 3: email authentication (independent of the blog; do it soon)

With no SPF or DMARC, anyone can spoof `@timwhite.ninja`, and legitimate mail
is more likely to land in spam. A public site makes the domain more visible.

| Type | Host | Value |
|---|---|---|
| TXT | @ | `v=spf1 include:_spf.google.com ~all` |
| TXT | google._domainkey | generated in Google Admin → Apps → Gmail → Authenticate email |
| TXT | _dmarc | `v=DMARC1; p=none; rua=mailto:<you>@timwhite.ninja` |

Start DMARC at `p=none`. After a few weeks of clean reports, tighten it to
`p=quarantine`, then `p=reject`. There can only be one SPF record.

## Optional cleanup

- Delete the 5 `_xmpp-server._tcp` SRV records (Google Talk is gone).
- Delete the `docs` / `mail` / `calendar` CNAMEs unless you use those URLs.
- Porkbun's zone listing reports `"cloudflare": "enabled"`. This hasn't been
  investigated; check Porkbun's docs before changing it.
