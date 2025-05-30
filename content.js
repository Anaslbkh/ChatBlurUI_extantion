// content.js
console.log("saveChat content script loaded.");

const BLUR_CLASS = "savechat-blurred-title";
const PROCESSED_ATTR = "data-savechat-processed"; // Custom attribute to mark processed elements

/**
 * Injects the CSS style for the blur effect into the document head.
 * Ensures the style is only added once.
 */
function injectBlurStyle() {
  if (!document.getElementById("savechat-blur-style")) {
    const style = document.createElement("style");
    style.id = "savechat-blur-style";
    style.textContent = `
      .${BLUR_CLASS} {
        filter: blur(6px); /* Adjust blur amount as needed */
        transition: filter 0.2s ease-out; /* Smooth transition for blur/unblur */
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Returns platform-specific CSS selectors for chat titles and their sidebar container.
 * These selectors are CRITICAL and must be accurate for the extension to work.
 *
 * How to find selectors:
 * 1. Go to the target website (e.g., chat.openai.com).
 * 2. Open Developer Tools (F12 or Right-click -> Inspect).
 * 3. Use the element picker tool.
 * 4. Click on a conversation title in the sidebar.
 * 5. Examine the HTML structure. Look for stable classes, IDs, or tag hierarchies
 *    that reliably select ALL conversation titles and their common parent.
 *
 * @returns {object|null} An object with `titleElementSelector` and `sidebarContainerSelector`, or null if platform is not recognized.
 */
function getPlatformSelectors() {
  const hostname = window.location.hostname;

  if (
    hostname.includes("chat.openai.com") ||
    hostname.includes("chatgpt.com")
  ) {
    // ChatGPT (chat.openai.com and chatgpt.com)
    return {
      // Updated selector: targets the div inside the <a> that contains the title text.
      titleElementSelector:
        "#history a > div.flex.flex-col.gap-2, #history a > div",
      sidebarContainerSelector: "#history",
      // For event delegation, always find the parent <a>
      eventTitleAncestor: "a",
    };
  } else if (hostname.includes("gemini.google.com")) {
    // Gemini (robust selectors)
    return {
      titleElementSelector: "div.conversation-title",
      sidebarContainerSelector: "div.sidenav-with-history-container",
      eventTitleAncestor: "div.conversation-title",
    };
  } else if (hostname.includes("claude.ai")) {
    // Claude
    return {
      // Selector matches both <a> and its children for event delegation
      titleElementSelector: "nav ul li a, nav ul li a *",
      sidebarContainerSelector: "nav ul",
      eventTitleAncestor: "a",
    };
  }
  return null; // Unknown platform
}

/**
 * Applies the blur class to all chat titles found that haven't been processed yet.
 * Marks processed elements with a custom attribute.
 */
function applyInitialBlurAndMark() {
  const selectors = getPlatformSelectors();
  if (!selectors || !selectors.titleElementSelector) {
    return;
  }

  // Only select the actual title elements (not their children)
  let allTitleCandidates;
  if (selectors.eventTitleAncestor === "a") {
    // For Claude and ChatGPT, select all <a> elements
    allTitleCandidates = document.querySelectorAll(
      selectors.sidebarContainerSelector + " a"
    );
  } else {
    // For Gemini, select the title element directly
    allTitleCandidates = document.querySelectorAll(
      selectors.titleElementSelector
    );
  }

  allTitleCandidates.forEach((titleElement) => {
    // Only process if not already marked
    if (!titleElement.hasAttribute(PROCESSED_ATTR)) {
      titleElement.classList.add(BLUR_CLASS);
      titleElement.setAttribute(PROCESSED_ATTR, "true");
    }
  });
}

/**
 * Sets up event delegation on the sidebar container for efficient hover effects.
 * A single pair of listeners handles all chat titles.
 */
function setupEventDelegation() {
  const selectors = getPlatformSelectors();
  if (!selectors || !selectors.sidebarContainerSelector) {
    console.warn(
      "saveChat: Cannot set up event delegation, sidebarContainerSelector missing."
    );
    return;
  }

  const sidebarContainer = document.querySelector(
    selectors.sidebarContainerSelector
  );

  if (!sidebarContainer) {
    console.warn(
      `saveChat: Sidebar container ('${selectors.sidebarContainerSelector}') not found for event delegation. Retrying...`
    );
    setTimeout(setupEventDelegation, 1000);
    return;
  }

  sidebarContainer.addEventListener("mouseover", (event) => {
    // Always find the ancestor (e.g., <a>) for the event
    const hoveredTitle = event.target.closest(
      selectors.sidebarContainerSelector + " " + selectors.eventTitleAncestor
    );
    if (hoveredTitle && hoveredTitle.hasAttribute(PROCESSED_ATTR)) {
      hoveredTitle.classList.remove(BLUR_CLASS);
    }
  });

  sidebarContainer.addEventListener("mouseout", (event) => {
    const exitedTitle = event.target.closest(
      selectors.sidebarContainerSelector + " " + selectors.eventTitleAncestor
    );
    if (
      exitedTitle &&
      exitedTitle.hasAttribute(PROCESSED_ATTR) &&
      !exitedTitle.contains(event.relatedTarget)
    ) {
      exitedTitle.classList.add(BLUR_CLASS);
    }
  });

  console.log(
    `saveChat: Event delegation setup on ${selectors.sidebarContainerSelector}`
  );
}

/**
 * Sets up a MutationObserver to watch for dynamically added chat titles in the sidebar.
 */
function setupMutationObserver() {
  const selectors = getPlatformSelectors();
  if (!selectors || !selectors.sidebarContainerSelector) {
    console.warn(
      "saveChat: Cannot set up MutationObserver, sidebarContainerSelector missing. Falling back to periodic checks."
    );
    setInterval(applyInitialBlurAndMark, 3000); // Periodically check for new titles
    return;
  }

  const targetNode = document.querySelector(selectors.sidebarContainerSelector);

  if (targetNode) {
    const observerConfig = { childList: true, subtree: true };
    const observer = new MutationObserver((mutationsList) => {
      let shouldProcess = false;
      for (const mutation of mutationsList) {
        // Check if new nodes were added
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // Optimize: Check if any added node (or its children) looks like a chat title
          for (const node of mutation.addedNodes) {
            if (
              node.nodeType === 1 &&
              (node.matches(selectors.titleElementSelector) ||
                node.querySelector(selectors.titleElementSelector))
            ) {
              shouldProcess = true;
              break; // Found a relevant node, no need to check further mutations
            }
          }
        }
        if (shouldProcess) break; // If we decided to process, break from outer loop
      }

      if (shouldProcess) {
        // console.log("saveChat: DOM changed, potentially new titles added. Re-applying blur.");
        // Use a small timeout to debounce rapid changes and allow the DOM to fully update
        setTimeout(applyInitialBlurAndMark, 100);
      }
    });
    observer.observe(targetNode, observerConfig);
    console.log(
      `saveChat: Observing ${selectors.sidebarContainerSelector} for new titles.`
    );
  } else {
    console.warn(
      `saveChat: Could not find sidebar container ('${selectors.sidebarContainerSelector}') for MutationObserver. Retrying...`
    );
    // If observer target isn't found initially, try again later.
    setTimeout(setupMutationObserver, 3000);
    // Also, fall back to periodic checks in case observer cannot be set up at all
    setInterval(applyInitialBlurAndMark, 5000);
  }
}

// --- Main Execution ---

// Inject the CSS rule once when the script loads.
injectBlurStyle();

// Initial setup: Apply blur to existing titles, set up hover listeners, and start observing.
// We use a small delay to ensure the Single Page Application (SPA) has time to render its initial content.
// The exact delay might need fine-tuning, but 200-500ms is usually a good starting point.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      applyInitialBlurAndMark(); // Apply blur to titles already present
      setupEventDelegation(); // Set up efficient hover listeners on the container
      setupMutationObserver(); // Start watching for new titles
    }, 500); // Delay for DOMContentLoaded
  });
} else {
  // If DOM is already ready (script loaded after DOMContentLoaded), run immediately with a small delay
  setTimeout(() => {
    applyInitialBlurAndMark();
    setupEventDelegation();
    setupMutationObserver();
  }, 200); // Shorter delay if DOM is already ready
}
