document
  .getElementById("save-screenshot")
  .addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "START_SELECTION",
        payload: "screenshot",
      });
    });
  });

document
  .getElementById("fullScreenButton")
  .addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "START_SELECTION",
        payload: "viewport",
      });
    });
  });

document
  .getElementById("squareSelectButton")
  .addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "START_SELECTION",
        payload: "square",
      });
    });
  });

document.getElementById("save-html-css").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: startSelection,
      args: ["html-css"],
    });
  });
});

// NEW: Complete webpage screenshot handler
document
  .getElementById("completePageButton")
  .addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "START_SELECTION",
        payload: "full",
      });
    });
  });

function startSelection(type) {
  // Communicate with content.js to start element selection
  window.postMessage({ type: "START_SELECTION", payload: type }, "*");
}

document.addEventListener("DOMContentLoaded", function () {
  const saveButton = document.getElementById("saveButton");
  saveButton.addEventListener("click", saveElement);
});

function saveElement() {
  // Get the selected element
  const element = getSelectedElement();

  if (element) {
    // Save the selected element based on the selection option
    switch (event.data.selectionType) {
      case "activeElement":
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
        break;
      default:
        console.log("No element selected.");
    }
  } else {
    console.log("No element selected.");
  }
}

function getSelectedElement() {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    return range.commonAncestorContainer.nodeType === 1
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentNode;
  }
  return null;
}
