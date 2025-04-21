let selectionType = null;
let outlineStyle = "2px solid red";
let lastHovered = null;

// Remove legacy window message listener
// ...existing code...

// Consolidated message listener for all popup options
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_SELECTION") {
    switch (message.payload) {
      case "viewport":
        captureViewportScreenshot();
        break;
      case "fullPage":
        captureFullPageScreenshot();
        break;
      case "square":
        captureDrawSquareScreenshot();
        break;
      case "html-css":
      case "screenshot":
        startSelectionMode();
        break;
      default:
        console.warn("Unknown selection payload:", message.payload);
    }
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

function captureFullScreen() {
  html2canvas(document.body)
    .then((canvas) => {
      const dataURL = canvas.toDataURL("image/png");
      sendToServer("screenshot", dataURL);
    })
    .catch((error) => {
      console.error("Error capturing full screen:", error);
    });
}

function startSquareSelection() {
  let startX, startY;
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.border = "2px dashed red";
  overlay.style.zIndex = "9999";
  document.body.appendChild(overlay);

  function onMouseDown(e) {
    startX = e.pageX;
    startY = e.pageY;
    overlay.style.left = startX + "px";
    overlay.style.top = startY + "px";
    overlay.style.width = "0px";
    overlay.style.height = "0px";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.removeEventListener("mousedown", onMouseDown);
  }

  function onMouseMove(e) {
    const width = e.pageX - startX;
    const height = e.pageY - startY;
    overlay.style.width = Math.abs(width) + "px";
    overlay.style.height = Math.abs(height) + "px";
    overlay.style.left = (width < 0 ? e.pageX : startX) + "px";
    overlay.style.top = (height < 0 ? e.pageY : startY) + "px";
  }

  function onMouseUp(e) {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    const rect = overlay.getBoundingClientRect();
    document.body.removeChild(overlay);
    captureSquareScreenshot(rect);
  }

  document.addEventListener("mousedown", onMouseDown);
}

function captureSquareScreenshot(rect) {
  html2canvas(document.body)
    .then((canvas) => {
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = rect.width;
      croppedCanvas.height = rect.height;
      const ctx = croppedCanvas.getContext("2d");
      ctx.drawImage(
        canvas,
        rect.left,
        rect.top,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height
      );
      const dataURL = croppedCanvas.toDataURL("image/png");
      sendToServer("screenshot", dataURL);
    })
    .catch((error) => {
      console.error("Error capturing square screenshot:", error);
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

// Capture the visible area (viewport) as seen by the user.
function captureViewportScreenshot() {
  // Create a temporary clone capturing viewport options
  html2canvas(document.documentElement, {
    x: window.scrollX,
    y: window.scrollY,
    width: window.innerWidth,
    height: window.innerHeight,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    useCORS: true,
  })
    .then((canvas) => {
      const dataURL = canvas.toDataURL("image/png");
      sendToServer("screenshot", dataURL);
      alert("Viewport screenshot saved!");
    })
    .catch((err) => console.error("Error capturing viewport screenshot:", err));
}

// Capture the complete webpage regardless of viewport.
function captureFullPageScreenshot() {
  html2canvas(document.documentElement, { useCORS: true })
    .then((canvas) => {
      const dataURL = canvas.toDataURL("image/png");
      sendToServer("screenshot", dataURL);
      alert("Full page screenshot saved!");
    })
    .catch((err) =>
      console.error("Error capturing full page screenshot:", err)
    );
}

// Allow user to draw a rectangle (custom area) to capture what's visible on the screen.
function captureDrawSquareScreenshot() {
  let startX, startY, overlay;
  overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.border = "2px dashed #f00";
  overlay.style.background = "rgba(255,255,255,0.3)";
  overlay.style.zIndex = "9999";
  document.body.appendChild(overlay);

  function mouseDownHandler(e) {
    startX = e.clientX;
    startY = e.clientY;
    overlay.style.left = startX + "px";
    overlay.style.top = startY + "px";
    overlay.style.width = "0px";
    overlay.style.height = "0px";
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  function mouseMoveHandler(e) {
    const currentX = e.clientX;
    const currentY = e.clientY;
    const rect = {
      left: Math.min(startX, currentX),
      top: Math.min(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY),
    };
    overlay.style.left = rect.left + "px";
    overlay.style.top = rect.top + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
  }

  function mouseUpHandler(e) {
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("mouseup", mouseUpHandler);
    const rect = overlay.getBoundingClientRect();
    document.body.removeChild(overlay);
    // Convert rect coordinates to absolute page coordinates.
    const absoluteX = rect.left + window.scrollX;
    const absoluteY = rect.top + window.scrollY;
    // Capture the visible portion using similar options to the viewport capture.
    html2canvas(document.documentElement, {
      x: absoluteX,
      y: absoluteY,
      width: rect.width,
      height: rect.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      useCORS: true,
    })
      .then((canvas) => {
        const dataURL = canvas.toDataURL("image/png");
        sendToServer("screenshot", dataURL);
        alert("Draw square screenshot saved!");
      })
      .catch((err) =>
        console.error("Error capturing drawn square screenshot:", err)
      );
  }

  document.addEventListener("mousedown", mouseDownHandler, { once: true });
}
