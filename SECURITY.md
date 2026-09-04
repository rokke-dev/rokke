# Security Policy

Framework takes the security of its runtime, framework packages, and ecosystem seriously. We appreciate the efforts of security researchers and community members who help keep Framework safe.

## Supported Versions

Only the latest active release branch receives security updates and patches.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.0-alpha.x | :white_check_mark: |
| < 0.1.0-alpha | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you believe you have found a security vulnerability in any `@rokke/*` package or the core repository, please report it privately:

* **Email:** Send details to [ferchd@rokke.dev](mailto:ferchd@rokke.dev)
* **Subject:** `[SECURITY VULNERABILITY] <Brief description>`

### What to include in your report

To help us triage and resolve the issue quickly, please provide:

1. **Affected Package(s) and Version(s):** (e.g. `@rokke/security@0.1.0-alpha.1`, `@rokke/http@0.1.0-alpha.1`)
2. **Type of Vulnerability:** (e.g. CSRF bypass, HTTP request smuggling, injection, memory safety)
3. **Proof of Concept (PoC):** Minimal reproduction code or step-by-step instructions.
4. **Impact Assessment:** Explanation of what an attacker could achieve.
5. **Mitigation / Suggested Fix:** (Optional, if you have identified one).

## Response & Disclosure Process

* **Acknowledgment:** We aim to acknowledge reports within **48 hours**.
* **Investigation:** We will evaluate the vulnerability, assess its severity, and determine an remediation timeline.
* **Coordination:** We will keep the reporter informed of progress throughout the fix and verification process.
* **Release:** We will release a security advisory and patched version as soon as the fix is verified.
* **Credit:** We will publicly credit the reporter in the release notes and advisory (unless anonymity is requested).

## Security Principles in Framework

Framework is designed with security defaults:

* Zero third-party runtime dependencies.
* Safe-by-default SQL query generation via parameterized tagged templates (`bun:sql`).
* Native password hashing (`Bun.password` / Argon2id).
* Constant-time comparisons and standard Web Crypto APIs for JWT signatures.
* Opt-in defensive HTTP-header middleware plus tested rejection of header injection.
* Automatic supply-chain protection via Bun's `minimumReleaseAge` and explicit `trustedDependencies`.
