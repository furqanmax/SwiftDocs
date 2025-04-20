chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CAPTURE_SCREENSHOT") {
    chrome.tabs.captureVisibleTab(
      sender.tab.windowId,
      { format: "png" },
      (dataUrl) => {
        sendResponse({ screenshot: dataUrl });
      }
    );
    return true; // indicate response will be sent asynchronously
  }
});

self.addEventListener("message", (event) => {
  if (event.data.action === "saveElement") {
    const element = event.data.element;
    // Create an outline of the selected element
    const outline = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    outline.setAttribute("x", 10);
    outline.setAttribute("y", 10);
    outline.setAttribute("width", 100);
    outline.setAttribute("height", 20);
    outline.setAttribute("fill", "#000000");
    document.body.appendChild(outline);

    // Remove the outline and stop the selection process
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(outline);

    // Save the selected element based on the selection option
    if (event.data.selectionType === "activeElement") {
      const textContent = document.body.textContent;
      const paragraph = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "p"
      );
      paragraph.setAttribute("x", 10);
      paragraph.setAttribute("y", 20);
      paragraph.setAttribute("width", 100);
      paragraph.setAttribute("height", 20);
      paragraph.setAttribute("fill", "#000000");
      document.body.appendChild(paragraph);

      // Add the selected text to the paragraph
      paragraph.textContent = textContent;
    }
  }
});
