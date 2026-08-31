# Language switch contrast regression

The active locale pill intentionally uses a light background with a forced dark foreground color, including `WebkitTextFillColor`, because iOS Safari can otherwise inherit the site's global anchor foreground and render white text on the light active pill.

Acceptance:
- Active `EN`/`EL` is dark text on the light pill.
- Inactive locale remains muted text on the dark control.
- Both compact mobile and desktop variants use the same contrast behavior.
