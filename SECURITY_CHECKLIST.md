# Security Checklist for Pull Requests

Use this checklist when creating or reviewing pull requests to ensure security best practices are followed.

## Pre-Submission Checklist

### Input Validation
- [ ] All user inputs are validated on the backend
- [ ] Input validation uses schema-based validation (Zod) where possible
- [ ] No raw user input is used in database queries or API calls
- [ ] File uploads are validated for type and size

### Authentication & Authorization
- [ ] Authentication is required for sensitive endpoints
- [ ] User permissions are checked before allowing actions
- [ ] No sensitive operations can be performed without proper auth
- [ ] Session management follows best practices

### Data Protection
- [ ] No sensitive data (keys, secrets, tokens) in code or logs
- [ ] Environment variables are used for configuration
- [ ] Sensitive data is not stored in localStorage (except auth tokens managed by Supabase)
- [ ] User data is properly sanitized before display

### XSS Prevention
- [ ] No new `dangerouslySetInnerHTML` without security review
- [ ] User-generated content is sanitized before rendering
- [ ] Content Security Policy (CSP) is respected

### CORS Configuration
- [ ] No hardcoded `Access-Control-Allow-Origin: '*'` in production
- [ ] CORS origins are configurable via environment variables
- [ ] Only trusted origins are allowed

### Error Handling
- [ ] Error messages to users are generic (no sensitive info)
- [ ] Detailed errors are logged server-side only
- [ ] No stack traces exposed to clients

### Rate Limiting
- [ ] Server-side rate limiting is implemented for sensitive endpoints
- [ ] Rate limits are appropriate for the endpoint's sensitivity
- [ ] Client-side rate limiting is used only for UX, not security

### Dependencies
- [ ] New dependencies are reviewed for security
- [ ] `npm audit` passes or vulnerabilities are documented
- [ ] Dependencies are kept up to date

### Headers & Configuration
- [ ] Security headers are configured (CSP, X-Frame-Options, etc.)
- [ ] HTTPS is enforced in production
- [ ] No debug mode enabled in production

## Review Questions

1. **Does this change expose any sensitive data?**
   - Check for API keys, secrets, tokens in code
   - Verify no sensitive data in logs or error messages

2. **Can this be exploited for unauthorized access?**
   - Verify authentication/authorization checks
   - Check for privilege escalation risks

3. **Are inputs properly validated?**
   - Backend validation is mandatory
   - Frontend validation is for UX only

4. **Does this introduce new attack vectors?**
   - Check for XSS, CSRF, injection risks
   - Verify rate limiting is in place

5. **Is error handling secure?**
   - Generic error messages to users
   - Detailed logging server-side only

## Automated Checks

The following checks run automatically on PRs:
- `npm audit` for dependency vulnerabilities
- ESLint for code quality
- Secret scanning (basic pattern matching)
- CORS configuration checks

## Reporting Security Issues

If you discover a security vulnerability, please:
1. **DO NOT** create a public issue
2. Email security concerns to the security team
3. Include steps to reproduce and potential impact

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
