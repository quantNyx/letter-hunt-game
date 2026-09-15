(() => {
  const isLocal = (value) => {
    try {
      const url = new URL(String(value), location.href);
      return url.origin === location.origin && ["http:", "https:"].includes(url.protocol);
    } catch {
      return false;
    }
  };

  const disconnectElement = (element) => {
    if (element instanceof HTMLAnchorElement) {
      const href = element.getAttribute("href");
      if (href && !isLocal(href)) {
        element.dataset.offlineHref = href;
        element.removeAttribute("href");
        element.removeAttribute("target");
        element.setAttribute("aria-disabled", "true");
        element.style.cursor = "default";
      }
    }

    if (element instanceof HTMLFormElement) {
      element.removeAttribute("action");
      element.addEventListener("submit", (event) => event.preventDefault());
    }

    for (const attribute of ["src", "href", "poster"]) {
      const value = element.getAttribute?.(attribute);
      if (value && !isLocal(value) && !value.startsWith("data:") && !value.startsWith("blob:")) {
        element.removeAttribute(attribute);
      }
    }
  };

  const disconnectTree = (root) => {
    if (root instanceof Element) disconnectElement(root);
    root.querySelectorAll?.("a, form, [src], [href], [poster]").forEach(disconnectElement);
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const target = input instanceof Request ? input.url : input;
    return isLocal(target)
      ? originalFetch(input, init)
      : Promise.reject(new TypeError("External network access is disabled in this offline mirror."));
  };

  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = class OfflineXMLHttpRequest extends OriginalXHR {
    open(method, url, ...rest) {
      if (!isLocal(url)) throw new DOMException("External network access is disabled.", "SecurityError");
      return super.open(method, url, ...rest);
    }
  };

  const originalSendBeacon = navigator.sendBeacon?.bind(navigator);
  navigator.sendBeacon = (url, data) => Boolean(originalSendBeacon && isLocal(url) && originalSendBeacon(url, data));
  window.WebSocket = class OfflineWebSocket {
    constructor() { throw new DOMException("External network access is disabled.", "SecurityError"); }
  };
  window.EventSource = class OfflineEventSource {
    constructor() { throw new DOMException("External network access is disabled.", "SecurityError"); }
  };

  document.addEventListener("DOMContentLoaded", () => disconnectTree(document), { once: true });
  new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === "attributes") disconnectElement(record.target);
      record.addedNodes.forEach((node) => disconnectTree(node));
    });
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["action", "href", "poster", "src", "target"],
    childList: true,
    subtree: true,
  });
})();
