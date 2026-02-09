# Content Security Policy (CSP) Implementation

## Overview

This document explains the Content Security Policy (CSP) implementation for the School Election System.

## What is CSP?

Content Security Policy is a security standard that helps prevent XSS (Cross-Site Scripting) attacks by controlling which resources the browser is allowed to load and execute.

## Current Implementation

### CSP Headers

CSP headers are configured in `next.config.ts` and include:

- **default-src 'self'**: Only allow resources from the same origin by default
- **script-src 'self'**: Allow scripts only from same origin (with 'unsafe-eval' in development for Next.js)
- **style-src 'self' 'unsafe-inline' https://fonts.googleapis.com**: Allow styles from self, inline styles (needed for Tailwind CSS), and Google Fonts
- **font-src 'self' https://fonts.gstatic.com data:** Allow fonts from self, Google Fonts, and data URIs
- **img-src 'self' data: blob:** Allow images from self, data URIs, and blob URLs (for uploaded candidate photos)
- **connect-src 'self'**: Only allow API calls to same origin
- **frame-ancestors 'self'**: Prevent clickjacking (same as X-Frame-Options)
- **object-src 'none'**: Block plugins (Flash, etc.)
- **form-action 'self'**: Only allow form submissions to same origin

### Inline Scripts

**Before**: The theme initialization script was inline using `dangerouslySetInnerHTML`, which required `'unsafe-inline'` in CSP.

**After**: The script has been moved to `/public/scripts/theme-init.js` and loaded as an external script. This allows us to remove `'unsafe-inline'` from `script-src`, improving security.

### Why 'unsafe-inline' for Styles?

Tailwind CSS generates utility classes that are applied inline via the `style` attribute. This is a fundamental part of how Tailwind works, so we must allow `'unsafe-inline'` for styles. This is generally safe because:

1. Styles cannot execute JavaScript
2. Tailwind classes are generated at build time
3. User input is sanitized before being rendered

### Development vs Production

- **Development**: Includes `'unsafe-eval'` in `script-src` because Next.js requires it for hot module replacement and development features
- **Production**: Removes `'unsafe-eval'` for stricter security

## Security Benefits

1. **XSS Protection**: Prevents malicious scripts from executing
2. **Data Exfiltration Prevention**: Restricts where data can be sent
3. **Clickjacking Protection**: Prevents embedding in malicious frames
4. **Plugin Blocking**: Prevents Flash and other plugins from loading

## Testing CSP

To test if CSP is working:

1. Open browser DevTools → Network tab
2. Look for CSP violation reports in the console
3. Check that all resources load correctly
4. Verify no inline scripts are blocked (except the ones we allow)

## Future Improvements

1. **Report-URI**: Add `report-uri` directive to collect CSP violation reports
2. **Nonce-based Scripts**: For dynamic scripts, consider using nonces instead of allowing specific domains
3. **Stricter Styles**: If possible, move away from inline styles (though this may require significant refactoring with Tailwind)

## Files Modified

- `next.config.ts`: Added CSP headers
- `app/layout.tsx`: Moved inline script to external file
- `public/scripts/theme-init.js`: New external script file

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config/headers)
