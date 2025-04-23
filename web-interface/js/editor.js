// Initialize drag-and-drop for the editor
Sortable.create(editor, { animation: 150, handle: ".handle" });

// Create a new block element function
function createElement(type, content = null) {
  const container = document.createElement("div");
  container.classList.add("draggable");
  container.setAttribute("tabindex", "0");

  // Create and append a drag handle
  const handle = document.createElement("span");
  handle.className = "handle";
  handle.textContent = "⋮";
  container.appendChild(handle);

  let elem;
  switch (type) {
    case "heading":
      elem = document.createElement("h1");
      elem.textContent = content || "New Heading";
      break;
    case "subheading":
      elem = document.createElement("h3");
      elem.textContent = content || "New Sub-heading";
      break;
    case "paragraph":
      if (content) {
        elem = document.createElement("p");
        elem.innerHTML = content;
      } else {
        elem = document.createElement("p");
        elem.textContent = "New paragraph...";
      }
      break;
    case "bullet":
      elem = document.createElement("ul");
      const li = document.createElement("li");
      li.textContent = content || "Bullet point";
      elem.appendChild(li);
      break;
    default:
      return;
  }
  elem.contentEditable = true;
  elem.addEventListener("click", (e) => e.stopPropagation());
  container.appendChild(elem);
  editor.appendChild(container);
}

// Toolbar button event listeners
document
  .getElementById("addHeading")
  .addEventListener("click", () => createElement("heading"));
document
  .getElementById("addSubheading")
  .addEventListener("click", () => createElement("subheading"));
document
  .getElementById("addParagraph")
  .addEventListener("click", () => createElement("paragraph"));
document
  .getElementById("addBullet")
  .addEventListener("click", () => createElement("bullet"));

// Save document event
document.getElementById("saveContent").addEventListener("click", () => {
  const content = editor.innerHTML;
  fetch("http://localhost:3000/api/elements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "custom", content }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Document saved successfully!");
      loadSavedElements();
    })
    .catch((error) => console.error("Error saving document:", error));
});

// Load saved elements functionality
async function loadSavedElements() {
  try {
    const res = await fetch("http://localhost:3000/api/elements");
    let data = await res.json();
    data.sort((a, b) => b.id - a.id);
    const searchValue = document
      .getElementById("searchInput")
      .value.toLowerCase();
    if (searchValue) {
      data = data.filter((el) => {
        let contentStr = "";
        if (el.type === "html-css") {
          contentStr = el.content.html;
        } else {
          contentStr =
            typeof el.content === "string"
              ? el.content
              : JSON.stringify(el.content);
        }
        return (
          el.type.toLowerCase().includes(searchValue) ||
          contentStr.toLowerCase().includes(searchValue)
        );
      });
    }
    const list = document.getElementById("savedElements");
    list.innerHTML = "";
    data.forEach((el) => {
      if (el.type !== "custom") {
        const li = document.createElement("li");
        li.className = "saved-element";
        li.dataset.id = el.id;
        let contentHtml = "";
        if (el.type === "screenshot") {
          contentHtml = `<img src="${el.content}" alt="Screenshot" style="max-width:100%;" />`;
        } else if (el.type === "html-css") {
          contentHtml = el.content.html;
        } else {
          contentHtml = el.content;
        }
        li.innerHTML = `
          <strong>${el.type}</strong>
          <div class="editable" contenteditable="false">${contentHtml}</div>
          <button class="btn btn-sm btn-primary mt-2" onclick="saveEdit(${el.id}, this)">Save</button>
          <button class="btn btn-sm btn-danger mt-2" onclick="deleteElement(${el.id}, this)">Delete</button>
        `;
        li.addEventListener("click", () => {
          insertSavedElement(el);
        });
        list.appendChild(li);
      }
    });
    Sortable.create(list, { animation: 150, onEnd: updateSavedOrder });
  } catch (error) {
    console.error("Error fetching saved elements:", error);
  }
}

// Insert saved element into the editor
function insertSavedElement(elementData) {
  let htmlContent = "";
  if (elementData.type === "screenshot") {
    htmlContent = `<img src="${elementData.content}" alt="Screenshot" style="max-width:100%;" />`;
    createElement("paragraph", htmlContent);
  } else if (elementData.type === "html-css") {
    htmlContent = elementData.content.html;
    createElement("paragraph", htmlContent);
  } else if (elementData.type === "custom") {
    htmlContent = elementData.content;
    editor.innerHTML += htmlContent;
  } else {
    htmlContent = elementData.content;
    createElement("paragraph", htmlContent);
  }
}

// Save edited content for saved element
async function saveEdit(id, btn) {
  const li = btn.parentElement;
  const newContent = li.querySelector(".editable").innerText;
  try {
    await fetch(`http://localhost:3000/api/elements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent }),
    });
    alert("Saved!");
    loadSavedElements();
  } catch (error) {
    console.error("Error saving edit:", error);
  }
}

// Delete saved element
async function deleteElement(id, btn) {
  if (!confirm("Are you sure you want to delete this element?")) return;
  try {
    const res = await fetch(`http://localhost:3000/api/elements/${id}`, {
      method: "DELETE",
    });
    if (res.status === 204) {
      alert("Element deleted successfully!");
      loadSavedElements();
    } else {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete element.");
    }
  } catch (error) {
    console.error("Error deleting element:", error);
    alert("Error: " + error.message);
  }
}

// Update order of saved elements
async function updateSavedOrder() {
  const list = document.getElementById("savedElements");
  const order = [...list.children].map((li) => Number(li.dataset.id));
  try {
    await fetch("http://localhost:3000/api/elements/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    loadSavedElements();
  } catch (error) {
    console.error("Error updating order:", error);
  }
}

// Listen for search input changes
document
  .getElementById("searchInput")
  .addEventListener("input", loadSavedElements);

// Load saved elements on page load
window.onload = () => {
  loadSavedElements();
};

// Inline block menu functions
function showBlockMenu(btn) {
  const menu = document.getElementById("inlineBlockMenu");
  const rect = btn.getBoundingClientRect();
  menu.style.top = rect.top + "px";
  menu.style.left = rect.left - menu.offsetWidth - 10 + "px";
  menu.style.display = "block";
  menu.dataset.target = btn.parentElement;
}

function addInlineBlock(type) {
  const menu = document.getElementById("inlineBlockMenu");
  const targetBlock = menu.dataset.target;
  const newBlock = document.createElement("div");
  newBlock.classList.add("editor-block");
  newBlock.contentEditable = true;
  let elem;
  switch (type) {
    case "heading":
      elem = document.createElement("h1");
      elem.textContent = "New Heading";
      break;
    case "subheading":
      elem = document.createElement("h3");
      elem.textContent = "New Sub-heading";
      break;
    case "paragraph":
      elem = document.createElement("p");
      elem.textContent = "New paragraph...";
      break;
    case "bullet":
      elem = document.createElement("ul");
      const li = document.createElement("li");
      li.textContent = "Bullet point";
      elem.appendChild(li);
      break;
    default:
      return;
  }
  elem.contentEditable = true;
  newBlock.appendChild(elem);
  const addBtn = document.createElement("div");
  addBtn.className = "block-add-btn";
  addBtn.textContent = "+";
  addBtn.onclick = function () {
    showBlockMenu(addBtn);
  };
  newBlock.appendChild(addBtn);
  targetBlock.parentElement.insertBefore(newBlock, targetBlock.nextSibling);
  menu.style.display = "none";
}
