let selectionType = null;
let outlineStyle = "2px solid red";
let lastHovered = null;

window.addEventListener("message", (event) => {
  if (event.data.type === "START_SELECTION") {
    selectionType = event.data.payload;
    startSelectionMode();
  }
});

function mouseOverHandler(e) {
  if (lastHovered && lastHovered !== e.target) {
    lastHovered.style.outline = "";
  }
  e.target.style.outline = outlineStyle;
  lastHovered = e.target;
}

function mouseOutHandler(e) {
  if (e.target === lastHovered) {
    e.target.style.outline = "";
    lastHovered = null;
  }
}

function selectElementHandler(e) {
  e.preventDefault();
  e.stopPropagation();

  document.removeEventListener("mouseover", mouseOverHandler);
  document.removeEventListener("mouseout", mouseOutHandler);
  document.removeEventListener("click", selectElementHandler, true);

  if (lastHovered) lastHovered.style.outline = "";

  if (selectionType === "screenshot") {
    captureScreenshot(e.target);
  } else if (selectionType === "html-css") {
    saveHtmlCss(e.target);
  } else {
    console.warn("Unknown selection type:", selectionType);
  }
}

function startSelectionMode() {
  document.addEventListener("mouseover", mouseOverHandler);
  document.addEventListener("mouseout", mouseOutHandler);
  document.addEventListener("click", selectElementHandler, true);
}

function captureScreenshot(element) {
  html2canvas(element)
    .then((canvas) => {
      const dataURL = canvas.toDataURL("image/png");
      sendToServer("screenshot", dataURL);
    })
    .catch((error) => {
      console.error("Error capturing element image:", error);
    });
}

function saveHtmlCss(element) {
  const html = element.outerHTML;
  const css = window.getComputedStyle(element).cssText;
  sendToServer("html-css", { html, css });
}

function sendToServer(type, content) {
  fetch("http://localhost:3000/api/elements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, content }),
  })
    .then((res) => res.json())
    .then((data) => console.log("Saved to server:", data))
    .catch((err) => console.error("Error saving to server:", err));
}
