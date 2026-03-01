# Open Bookmarks in New Tab — Chrome Extension

A Chrome extension that automatically opens bookmarks in a **new tab** instead of replacing your current page — without any page reload or flash.

## How It Works

The extension uses the **"newtab@ prefix" trick** (inspired by [this article](https://dev.to/vitalets/open-bookmarks-in-a-new-tab-by-default-easier-said-than-done-a3n)):

1. **Bookmark rewriting** — On install/enable, every bookmark URL is rewritten from `https://example.com` → `https://newtab@example.com`. The `newtab@` part uses the URL's userinfo field (RFC 3986), which browsers and servers ignore — favicons and titles are preserved.

2. **Redirect rule** — A `declarativeNetRequest` rule intercepts any main-frame request containing `newtab@` and redirects it to a dummy `empty.zip` file bundled with the extension. This triggers a download instead of a page navigation, so **the current tab is never touched**.

3. **Download interception** — The `downloads` API catches the dummy download the instant it starts, cancels it (no file saved, no download bar), extracts the original URL, and opens it in a **new tab**.

4. **Cleanup on disable/uninstall** — When toggled off, all bookmark URLs are restored to their original form (prefix stripped).

## Features

- **Zero page disruption** — Current tab is never navigated; YouTube videos keep playing
- **Toggle on/off** — Pause the extension without uninstalling (bookmarks are restored)
- **Focus control** — Choose whether the new tab gets focus automatically
- **Tab placement** — Open new tabs at the end of the bar or right next to the current tab
- **Auto-prefix new bookmarks** — Bookmarks added while the extension is active are automatically prefixed
- **Dark-themed popup UI** — Accessible, clean, and compact

## Installation (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `open-bookmarks-newtab` folder
5. The extension icon will appear in your toolbar — click it to configure

## File Structure

```
open-bookmarks-newtab/
├── manifest.json          # Extension manifest (Manifest V3)
├── rules.json             # declarativeNetRequest redirect rule
├── empty.zip              # Dummy file for download interception
├── popup.html             # Popup UI markup
├── css/
│   └── popup.css          # Popup styles (dark theme)
├── js/
│   ├── background.js      # Service worker — core logic
│   └── popup.js           # Popup interaction script
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md
```

## Known Limitations

- **Internal URLs** (`chrome://`, `edge://`, `about:`) cannot have a userinfo prefix — these bookmarks retain default click behavior.
- **Middle-click / Ctrl+Click** already open in a new tab natively — the extension does not interfere with these.
- **Bookmark URLs are modified** — The `newtab@` prefix is visible if you inspect bookmark properties. Disabling the extension restores all URLs.
- **Service worker keep-alive** — An alarm fires every 30 seconds to keep the downloads listener active. This is a Chrome MV3 limitation.

## Permissions

| Permission              | Why it's needed                                              |
|-------------------------|--------------------------------------------------------------|
| `bookmarks`             | Read and rewrite bookmark URLs with the newtab@ prefix       |
| `tabs`                  | Open new tabs with user-preferred focus and position          |
| `storage`               | Persist user settings across sessions                        |
| `downloads`             | Intercept and cancel the dummy empty.zip download            |
| `declarativeNetRequest` | Redirect newtab@ URLs to empty.zip before page navigation    |
| `alarms`                | Keep the service worker alive for the download listener      |
| `<all_urls>` (host)     | Required for declarativeNetRequest to match any URL          |

## License

MIT — use freely.
