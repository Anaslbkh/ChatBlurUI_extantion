# ChatBlurUI

ChatBlurUI is a privacy-focused browser extension that automatically blurs chat titles in the sidebars of popular AI chat platforms, helping you keep your conversations private from prying eyes. The blur is removed on hover, allowing you to quickly reveal titles when you need them.

## Supported Platforms

- ChatGPT (chat.openai.com, chatgpt.com)
- Gemini (gemini.google.com)
- Claude (claude.ai)

## Features

- **Automatic Blur:** Chat titles in the sidebar are blurred by default for privacy.
- **Reveal on Hover:** Hovering over a title temporarily removes the blur for easy reading.
- **Performance Optimized:** Uses efficient DOM observation and event delegation for smooth operation.
- **Multi-Platform:** Works seamlessly across several major AI chat platforms.

## How It Works

1. The extension injects a small script into supported chat sites.
2. It identifies the sidebar and chat title elements using platform-specific selectors.
3. Titles are blurred using a CSS filter. When you hover over a title, the blur is removed.
4. The extension observes sidebar changes to ensure new chats are always blurred.

## Installation

1. Download or clone this repository.
2. Open your browser's extensions page (e.g., `chrome://extensions/` for Chrome).
3. Enable "Developer mode".
4. Click "Load unpacked" and select the extension folder.

## Customization

- You can edit the CSS in `content.js` to change the blur strength or transition.
- Add or update platform selectors in `content.js` to support more sites.

## Support & Contact

Developed by Anass Lebkhaiti. For questions, feedback, or collaboration, [connect with me on LinkedIn](https://www.linkedin.com/in/anass-lebkhaiti-2446b5170/).

---

**Short Description:**

> ChatBlurUI blurs chat titles in the sidebar of ChatGPT, Gemini and Claude Chat for privacy. Hover to reveal titles. Fast, lightweight, and easy to use.

## Privacy Policy

ChatBlurUI is designed with privacy in mind and does not collect, store, or share any personal data. The extension works entirely within your browser to blur chat titles on supported AI chat platforms.

Data Collection and Usage
ChatBlurUI does not collect or transmit user data.

The extension does not store chat content, browsing history, or user activity.

No personal information such as emails, usernames, or financial details is accessed or shared.

Permissions Explanation
The extension requests minimal permissions necessary to apply blurring effects to chat titles.

Permissions are used solely for modifying the webpage's appearance and do not track user behavior.

Third-Party Services
ChatBlurUI does not use external services or third-party tracking.

No remote code is loaded or executed within the extension.

Security and Transparency
The code is fully open-source and available for review.

Users can customize the extension’s CSS settings for personal preferences.

For any concerns or suggestions regarding privacy, please contact Anass Lebkhaiti on LinkedIn.
