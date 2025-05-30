// content.js
console.log("saveChat content script loaded.");

const BLUR_CLASS = "savechat-blurred-title";

// --- !!! IMPORTANT: UPDATE THESE SELECTORS !!! ---
// You MUST inspect each website to find the correct selectors.
// These are placeholders and WILL LIKELY NOT WORK out-of-the-box.
//
// How to find selectors:
// 1. Go to the website (e.g., chat.openai.com).
// 2. Open Developer Tools (F12 or Right-click -> Inspect).
// 3. Use the element picker (often an icon of a square with a pointer).
// 4. Click on a conversation title in the sidebar.
// 5. Examine the HTML. Find a class, tag, or attribute combination unique to the titles.
//    - `titleElementSelector`: Should target the text element of the title or its immediate clickable parent.
//    - `sidebarContainerSelector`: Should target a stable parent element containing ALL chat history links.
// ---
function injectBlurStyle() {
  if (!document.getElementById("savechat-blur-style")) {
    const style = document.createElement("style");
    style.id = "savechat-blur-style";
    style.textContent = `
      .${BLUR_CLASS} {
        filter: blur(6px);
        transition: filter 0.2s;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }
}

function getPlatformSelectors() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  if (
    hostname.includes("chat.openai.com") ||
    hostname.includes("chatgpt.com")
  ) {
    // ChatGPT (chat.openai.com and chatgpt.com)
    return {
      titleElementSelector: "#history a > div",
      sidebarContainerSelector: "#history",
    };
  } else if (hostname.includes("gemini.google.com")) {
    // Gemini (robust selectors)
    return {
      titleElementSelector: "div.conversation-title",
      sidebarContainerSelector: "div.sidenav-with-history-container",
    };
  } else if (hostname.includes("claude.ai")) {
    // Claude
    return {
      titleElementSelector: "nav ul li a",
      sidebarContainerSelector: "nav ul",
    };
  }
  return null; // Unknown platform
}

function applyBlurToTitle(element) {
  element.classList.add(BLUR_CLASS);
}

function removeBlurFromTitle(element) {
  element.classList.remove(BLUR_CLASS);
}

function processTitles() {
  const selectors = getPlatformSelectors();
  if (!selectors || !selectors.titleElementSelector) {
    return;
  }

  const titles = document.querySelectorAll(selectors.titleElementSelector);

  titles.forEach((title) => {
    // Remove previous listeners by cloning the node (removes all listeners)
    const newTitle = title.cloneNode(true);
    title.replaceWith(newTitle);
    // Always apply blur
    applyBlurToTitle(newTitle);
    // Add listeners
    newTitle.addEventListener(
      "mouseenter",
      () => {
        removeBlurFromTitle(newTitle);
      },
      { once: true }
    );
    // Only add the blur back if mouse leaves, but do not re-add if already unblurred
    newTitle.addEventListener("mouseleave", () => {
      if (!newTitle.classList.contains(BLUR_CLASS)) {
        applyBlurToTitle(newTitle);
        // Re-enable the mouseenter for next hover
        newTitle.addEventListener(
          "mouseenter",
          () => {
            removeBlurFromTitle(newTitle);
          },
          { once: true }
        );
      }
    });
  });
}

// --- Main Execution ---
injectBlurStyle();

// Initial run - wait a bit for the page to load, especially for SPAs
// Using a small timeout as SPA hydration can take a moment.
// A more robust solution for SPAs might involve waiting for a specific element to appear.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(processTitles, 1000); // Further delay for dynamic content
    setupObserver();
  });
} else {
  setTimeout(processTitles, 1000); // Content already loaded, but give a sec for JS frameworks
  setupObserver();
}

function setupObserver() {
  const selectors = getPlatformSelectors();
  console.log(selectors.titleElementSelector);
  console.log(selectors.sidebarContainerSelector);
  if (!selectors || !selectors.sidebarContainerSelector) {
    console.log(
      "saveChat: Cannot set up MutationObserver, sidebarContainerSelector missing."
    );
    // Fallback to periodic checks if observer can't be set up (less efficient)
    setInterval(processTitles, 3000);
    return;
  }

  const targetNode = document.querySelector(selectors.sidebarContainerSelector);

  if (targetNode) {
    const observerConfig = { childList: true, subtree: true };
    const observer = new MutationObserver((mutationsList, observer) => {
      let newNodesPotentiallyAdded = false;
      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // A more refined check could be to see if addedNodes or their children
          // match the titleElementSelector or contain elements that do.
          newNodesPotentiallyAdded = true;
          break;
        }
      }
      if (newNodesPotentiallyAdded) {
        // console.log("saveChat: DOM changed, re-processing titles.");
        // Use a small timeout to allow the DOM to fully update after mutations
        setTimeout(processTitles, 200);
      }
    });
    observer.observe(targetNode, observerConfig);
    console.log(
      `saveChat: Observing ${selectors.sidebarContainerSelector} for changes.`
    );
  } else {
    console.warn(
      `saveChat: Could not find sidebar container ('${selectors.sidebarContainerSelector}') to observe. Titles might not blur on dynamic load.`
    );
    // Fallback: If the container isn't found initially, try to find it again later,
    // or just rely on periodic checks.
    setTimeout(setupObserver, 3000); // Try again in 3 seconds
    setInterval(processTitles, 5000); // And also run periodic checks
  }
}
