# Claude.md

This document provides project context for Claude (or any AI assistant) to support the **PoC (Proof of Concept)** for a local multi-zone Next.js setup. The goal is to ensure consistent guidance while keeping the scope intentionally small.

---

# 📘 Project Overview

This project is a **Proof of Concept** exploring how to run a **multi-zone Next.js architecture** locally using:

* **kind** (local Kubernetes cluster)
* **Tilt** (live reload & container rebuild automation)
* **mkcert** (local HTTPS certificates)
* **Ingress** (path-based routing between zones)

The PoC does **not** aim to build a production application. It only demonstrates architecture viability.

Next.js applications used in this PoC are simple starter templates or boilerplates.

---

# 🎯 Goals of the PoC

* Validate that multiple Next.js zones can run under one domain.
* Confirm that HTTPS works locally with mkcert.
* Verify path routing via Kubernetes Ingress.
* Test Pod separation per zone.
* Ensure Tilt handles rebuilds automatically during development.

This PoC focuses only on the **local developer experience**.

---

# 🧩 Architecture Summary

```
local.example.com
 ├── /           → zone-main (Next.js app #1)
 └── /admin      → zone-admin (Next.js app #2)`
```

Each zone runs in a separate Pod with its own Service.

An Ingress routes requests using path prefixes.

TLS certificates for `local.example.com` are generated with **mkcert** and injected as Kubernetes Secrets.

Tilt manages:

* Docker builds
* Kubernetes deployments
* Automatic updates on file changes

---

# 🧪 Local Development Flow

1. **Create mkcert certificates** for `local.example.com`.
2. **Set up a kind cluster** (single-node is sufficient).
3. **Install ingress-nginx** into kind.
4. **Add the mkcert certificate as a Kubernetes TLS Secret**.
5. **Prepare two simple Next.js apps** (zone-main & zone-admin).
6. **Write Kubernetes manifests** for:

   * Deployments
   * Services
   * Ingress
7. **Write a Tiltfile** to:

   * Build Docker images
   * Apply manifests
   * Auto-reload on file changes
8. Access the project via:
   **[https://local.example.com/](https://local.example.com/)**
   **[https://local.example.com/admin](https://local.example.com/admin)**

This completes the proof of concept environment.

---

# 📁 Suggested Directory Structure

```
poc/
  apps/
    zone-main/       # simple Next.js template
    zone-admin/      # simple Next.js template
  k8s/
    zone-main.yaml
    zone-admin.yaml
    ingress.yaml
  certs/
    local.example.com.pem
    local.example.com-key.pem
  Tiltfile
```

---

# 📝 Notes

* This PoC is NOT intended for production.
* Authentication, API, persistent storage, and CI/CD are explicitly out of scope.
* Next.js templates can be any minimal boilerplate.
* The primary purpose is validating **architecture feasibility**.

---

# 💻 Git Commit Guidelines

When creating git commits:

* **Author**: All commits should be authored by the user only
* **Co-authorship**: Do NOT include "Co-Authored-By: Claude" or similar AI attribution
* **Attribution**: Do NOT add "Generated with Claude Code" footers or banners
* **Messages**: Write clear, concise commit messages describing the changes
* **Format**: Use conventional commit format when appropriate

The user is the sole author of all code and commits in this repository.

---

# 🏁 End of Claude.md

This file should remain concise and focused on helping AI assistants provide accurate, context-aware guidance for the PoC.
