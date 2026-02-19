# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately to help us address it responsibly.

### How to Report

1. **Do NOT open a public issue** for security vulnerabilities
2. Email security details to: **info@visaoenhance.com**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix timeline**: Depends on severity (critical issues prioritized)
- **Credit**: We'll acknowledge your contribution (unless you prefer anonymity)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Best Practices

### For Users

1. **Never commit `.env.local`** - This file contains your real API keys and credentials
2. **Rotate keys immediately** if they're exposed in logs, screenshots, or public channels
3. **Use environment-specific keys** - Separate keys for development vs. production
4. **Least-privilege access** - Use Supabase service role key only server-side
5. **Review `.gitignore`** - Ensure sensitive files are excluded before pushing

### For Contributors

1. **No hardcoded secrets** - Use environment variables for all credentials
2. **Validate user input** - Sanitize data before database queries
3. **Debug endpoints** - Must check `NODE_ENV === 'production'` and return 404
4. **Dependencies** - Keep `npm audit` clean, update regularly
5. **Code review** - All PRs reviewed for security concerns

## Known Security Considerations

### Demo Mode

This project uses a shared `DEMO_PROFILE_ID` for demonstrations. This is intentional for the demo, but **NOT production-ready**:

- All users share the same cart and orders
- No authentication or authorization
- Suitable for demos and learning only

**For production use:**
- Implement proper authentication (e.g., [Supabase Auth](https://supabase.com/docs/guides/auth))
- Use user-specific profile IDs
- Add row-level security policies in Supabase

### Debug Endpoints

Debug endpoints (`/api/debug/*`) are protected:
- Return 404 when `NODE_ENV=production`
- Should only be enabled in development environments
- Do not expose sensitive data in logs

## Security Updates

We take security seriously. Critical security updates will be:
- Released as soon as possible
- Documented in release notes
- Announced via GitHub releases

## Questions?

For general security questions (not vulnerability reports), open a GitHub Discussion.

For vulnerability reports, email: **info@visaoenhance.com**
