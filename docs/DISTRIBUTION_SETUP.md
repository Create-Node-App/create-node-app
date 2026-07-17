# Distribution Channels — One-Time Setup

`create-awesome-node-app` publishes to four channels on every release tag
(`create-awesome-node-app@X.Y.Z`):

| Channel      | Workflow                               | Secret(s) needed                        |
| ------------ | -------------------------------------- | --------------------------------------- |
| **npm**      | `publish.yml`                          | (OIDC trusted publishing — no secret)   |
| **Docker**   | `publish-docker.yml`                   | `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` |
| **AUR**      | `publish-aur.yml`                      | `AUR_SSH_PRIVATE_KEY`, `AUR_REPO_TOKEN` |
| **Homebrew** | `notify-homebrew.yml` → `homebrew-tap` | `HOMEBREW_TAP_TOKEN`                    |

This document walks through configuring all five secrets. Once done, every
release tag automatically publishes to every channel.

All secrets go in **Settings → Secrets and variables → Actions → Repository
secrets** on
[`Create-Node-App/create-node-app`](https://github.com/Create-Node-App/create-node-app/settings/secrets/actions).

---

## 1. Docker Hub (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`)

**Prereqs**: A Docker Hub account (`ulisesjeremias`) with push access to the
[`ulisesjeremias/create-awesome-node-app`](https://hub.docker.com/r/ulisesjeremias/create-awesome-node-app)
repository.

**Steps:**

1. Log in to [hub.docker.com](https://hub.docker.com).
2. Go to **Account Settings → Security → Personal access tokens**.
3. Click **Generate new token**.
   - Description: `create-node-app CI release`
   - Access permissions: **Read, Write, Delete**
4. Copy the generated token — you'll only see it once.
5. On GitHub, add both secrets:
   - `DOCKERHUB_USERNAME` = your Docker Hub username (e.g. `ulisesjeremias`)
   - `DOCKERHUB_TOKEN` = the token from step 4

**Verify**: run the `Publish Docker image` workflow via **Actions →
Publish Docker image → Run workflow** with a released version (e.g. `0.12.0`).

---

## 2. AUR (`AUR_SSH_PRIVATE_KEY`, `AUR_REPO_TOKEN`)

**Prereqs**: An AUR account with the package `create-awesome-node-app`
registered under your ownership (or ability to submit a new package).

### 2a. Bootstrap the AUR package (first release only)

The AUR package `create-awesome-node-app` does not exist yet on
aur.archlinux.org. Push it once from your local machine:

```bash
# You already have SSH config for aur.archlinux.org (via ~/.ssh/config).
# Ensure ~/.ssh/known_hosts includes aur.archlinux.org:
ssh-keyscan -H aur.archlinux.org >> ~/.ssh/known_hosts

# Push the already-prepared PKGBUILD from the GitHub mirror:
cd /tmp
rm -rf aur-bootstrap
git clone git@github.com:Create-Node-App/aur-package.git aur-bootstrap
cd aur-bootstrap
git remote add aur ssh://aur@aur.archlinux.org/create-awesome-node-app.git
git push aur main:master
```

If the AUR server rejects the push because the package doesn't exist,
create it via [aur.archlinux.org/packages/submit](https://aur.archlinux.org/packages/submit)
first, then retry.

### 2b. Generate the AUR SSH key (if you don't have one)

If you don't already have an SSH key registered with your AUR account:

```bash
ssh-keygen -t ed25519 -C "aur-publish" -f ~/.ssh/aur_publish -N ""
cat ~/.ssh/aur_publish.pub
```

Copy the public key output and paste it under
[**My Account → SSH Public Key**](https://aur.archlinux.org/account) on AUR.

### 2c. Add the private key as a secret

```bash
cat ~/.ssh/aur_publish   # or ~/.ssh/personal_rsa if you already use that key
```

Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and
`-----END OPENSSH PRIVATE KEY-----`) and paste it as the value of
`AUR_SSH_PRIVATE_KEY`.

### 2d. Generate `AUR_REPO_TOKEN`

This is a GitHub fine-grained PAT so the workflow can push the updated
PKGBUILD back to
[`Create-Node-App/aur-package`](https://github.com/Create-Node-App/aur-package):

1. Go to [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens).
2. **Generate new token → Fine-grained**.
3. Configure:
   - **Token name**: `create-node-app aur-package sync`
   - **Expiration**: 90 days (or per your policy)
   - **Repository access**: **Only select repositories** →
     `Create-Node-App/aur-package`
   - **Permissions → Repository → Contents**: **Read and write**
4. Generate, copy, and paste as `AUR_REPO_TOKEN`.

---

## 3. Homebrew (`HOMEBREW_TAP_TOKEN`)

**Prereqs**: The [`Create-Node-App/homebrew-tap`](https://github.com/Create-Node-App/homebrew-tap)
repo already exists and contains `Formula/create-awesome-node-app.rb`.

**Steps:**

1. Go to [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens).
2. **Generate new token → Fine-grained**.
3. Configure:
   - **Token name**: `create-node-app homebrew-tap dispatch`
   - **Expiration**: 90 days (or per your policy)
   - **Repository access**: **Only select repositories** →
     `Create-Node-App/homebrew-tap`
   - **Permissions → Repository → Contents**: **Read and write**
   - **Permissions → Repository → Actions**: **Read and write**
4. Generate, copy, and paste as `HOMEBREW_TAP_TOKEN`.

---

## Verification

After configuring all five secrets, trigger each workflow manually to
confirm it publishes cleanly:

```bash
# Docker
gh workflow run "Publish Docker image" --repo Create-Node-App/create-node-app -f version=0.12.0

# AUR
gh workflow run "Publish to AUR" --repo Create-Node-App/create-node-app -f version=0.12.0

# Homebrew
gh workflow run "Notify Homebrew tap" --repo Create-Node-App/create-node-app -f version=0.12.0
```

Each run should end with a green check. Then run the end-to-end verification:

```bash
# Docker
docker run --rm ulisesjeremias/create-awesome-node-app:0.12.0 --version
# → 0.12.0

# AUR (from an Arch Linux machine)
yay -S create-awesome-node-app     # or paru -S create-awesome-node-app
create-awesome-node-app --version
# → 0.12.0

# Homebrew (from macOS / Linux)
brew tap Create-Node-App/tap
brew install create-awesome-node-app
create-awesome-node-app --version
# → 0.12.0
```

---

## After secrets are in place

Every subsequent release only requires:

1. Merging the auto-generated **Version Packages** PR from Changesets.
2. Nothing else — `publish.yml` publishes to npm, tags the release, and
   the three tag-based workflows fan out to Docker Hub, AUR, and Homebrew.
   Each channel waits/retries on the npm registry so CDN lag after publish
   does not fail the first attempt.
