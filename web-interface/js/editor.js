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

  // NEW: Add a remove button for the element
  const removeBtn = document.createElement("button");
  removeBtn.className = "btn btn-sm btn-danger remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.onclick = function(e) {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this element?")) {
      container.remove();
    }
  };
  container.appendChild(removeBtn);

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

// Global variable to keep track of the currently open document.
let currentDocId = null;
let currentDocName = null;

// Save document event (modified to save only the data content)
document.getElementById("saveContent").addEventListener("click", async () => {
  // Clone the editor and remove non-data elements
  const editorClone = editor.cloneNode(true);
  editorClone.querySelectorAll('.handle, .remove-btn, .block-add-btn').forEach(el => el.remove());
  const content = editorClone.innerHTML;
  
  let title = currentDocName;
  if (!currentDocId) {
    // New document: prompt for document name
    title = prompt("Enter document name:", "Untitled Document");
    if (!title) return; // Cancel if no title provided
    try {
      const response = await fetch("http://localhost:3000/api/elements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "custom", content, title }),
      });
      const data = await response.json();
      currentDocId = data.id;
      currentDocName = data.title;
      alert("Document saved successfully!");
    } catch (error) {
      console.error("Error saving document:", error);
    }
  } else {
    // Existing document: update with PUT
    try {
      await fetch(`http://localhost:3000/api/elements/${currentDocId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title }),
      });
      alert("Document updated successfully!");
    } catch (error) {
      console.error("Error updating document:", error);
    }
  }
  loadAllElements();
});

// Unified function to load both saved elements and custom documents with one API call
async function loadAllElements() {
  try {
    const res = await fetch("http://localhost:3000/api/elements");
    let data = await res.json();
    data.sort((a, b) => b.id - a.id);
    
    // Update Saved Elements (non-custom) in Editor Tab
    const savedData = data.filter(el => el.type !== "custom");
    const savedList = document.getElementById("savedElements");
    savedList.innerHTML = "";
    savedData.forEach((el) => {
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
        <div class="document-card">
          <strong>${el.type}</strong>
          <div class="editable" contenteditable="false">${contentHtml}</div>
          <div class="btn-group mt-2">
            <button class="btn btn-sm btn-primary" onclick="saveEdit(${el.id}, this)">Save</button>
            <button class="btn btn-sm btn-danger" onclick="deleteElement(${el.id}, this)">Delete</button>
          </div>
        </div>
      `;
      li.addEventListener("click", (e) => {
        if(e.target.tagName.toLowerCase() !== 'button'){
          insertSavedElement(el);
        }
      });
      savedList.appendChild(li);
    });
    
    // Update Documents Tab with custom documents and proper UI
    const customDocs = data.filter(el => el.type === "custom");
    const docsList = document.getElementById("documentsList");
    docsList.innerHTML = "";
    customDocs.forEach((doc) => {
      const docItem = document.createElement("div");
      docItem.className = "document-item card mb-2";
      docItem.style.cursor = "pointer";
      docItem.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${doc.title || 'Document ' + doc.id}</h5>
          <p class="card-text">${doc.content.substring(0, 100)}...</p>
        </div>
      `;
      docItem.onclick = function() {
        openDocument(doc.id);
      };
      docsList.appendChild(docItem);
    });
  } catch (error) {
    console.error("Error fetching elements:", error);
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
    loadAllElements();
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
      loadAllElements();
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
    loadAllElements();
  } catch (error) {
    console.error("Error updating order:", error);
  }
}

// Listen for search input changes
document
  .getElementById("searchInput")
  .addEventListener("input", loadAllElements);

// Load saved elements on page load
window.onload = () => {
  loadAllElements();
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

  // NEW: Add a remove button for the inline block element
  const inlineRemoveBtn = document.createElement("button");
  inlineRemoveBtn.className = "btn btn-sm btn-danger remove-btn";
  inlineRemoveBtn.textContent = "Remove";
  inlineRemoveBtn.onclick = function(e) {
    e.stopPropagation();
    if(confirm("Are you sure you want to remove this element?")){
      newBlock.remove();
    }
  };
  newBlock.appendChild(inlineRemoveBtn);

  targetBlock.parentElement.insertBefore(newBlock, targetBlock.nextSibling);
  menu.style.display = "none";
}

async function loadCustomDocuments() {
  try {
    const res = await fetch("http://localhost:3000/api/elements");
    let data = await res.json();
    data = data.filter(el => el.type === "custom");
    data.sort((a, b) => b.id - a.id);
    return data;
  } catch (error) {
    console.error("Error fetching custom documents:", error);
    return [];
  }
}

// NEW: Function to open a document in the editor with content load (modified to update global variables)
async function openDocument(docId) {
  const editorArea = document.getElementById("editor");
  // Check for unsaved changes:
  if (
    editorArea.innerText.trim() !== "Start writing your story here..." &&
    editorArea.innerText.trim() !== ""
  ) {
    if (!confirm("You have unsaved changes. Save before opening a new document?")) {
      return;
    }
    // Optionally, you can call a save function here (see above).
  }
  try {
    const response = await fetch(`http://localhost:3000/api/elements/${docId}`);
    if (!response.ok) {
      throw new Error("Failed to load document.");
    }
    const doc = await response.json();
    // Set global variables for current document.
    currentDocId = doc.id;
    currentDocName = doc.title || ("Document " + doc.id);
    // Load the document content into the editor; assumes doc.content holds HTML content.
    editorArea.innerHTML = `<div class="editor-block" contenteditable="true">
      ${doc.content}
      <div class="block-add-btn" onclick="showBlockMenu(this)">+</div>
    </div>`;
  } catch (error) {
    console.error("Error loading document:", error);
    alert("Error loading document. Please try again.");
  }
  
  // Switch to the Editor tab using Bootstrap's tab switch
  const editorTab = new bootstrap.Tab(document.querySelector('#editor-tab'));
  editorTab.show();
}
