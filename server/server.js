const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

// Data storage (using a JSON file)
const DATA_FILE = path.join(__dirname, "data.json");

function readData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const content = fs.readFileSync(DATA_FILE, "utf8").trim();
    if (!content) return [];
    return JSON.parse(content);
  } catch (error) {
    console.error("Error parsing data.json:", error);
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API Endpoints

// Save an element
app.post("/api/elements", (req, res) => {
  const { type, content } = req.body;
  if (!type || !content) {
    return res.status(400).json({ error: "Invalid data" });
  }
  const elements = readData();
  const newElement = { id: Date.now(), type, content };
  elements.push(newElement);
  writeData(elements);
  res.status(201).json(newElement);
});

// Get all saved elements
app.get("/api/elements", (req, res) => {
  const elements = readData();
  res.json(elements);
});

// Get a specific element by docId
app.get('/api/elements/:docId', (req, res) => {
  const docId = parseInt(req.params.docId, 10);
  const elements = readData();
  const doc = elements.find(item => item.id === docId);
  if (doc) {
    res.json(doc);
  } else {
    res.status(404).json({ error: "Document not found." });
  }
});

// Update an element (merges additional fields)
app.put("/api/elements/:id", (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const elements = readData();
  const idx = elements.findIndex((el) => el.id === parseInt(id));
  if (idx === -1) {
    return res.status(404).json({ error: "Element not found" });
  }
  elements[idx] = { ...elements[idx], ...updatedData };
  writeData(elements);
  res.json(elements[idx]);
});

// Reorder saved elements
app.post("/api/elements/reorder", (req, res) => {
  const { order } = req.body; // expects an array of element IDs
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: "Order must be an array of IDs" });
  }
  const elements = readData();
  const reordered = [];
  order.forEach((id) => {
    const found = elements.find((el) => el.id === id);
    if (found) reordered.push(found);
  });
  // Append elements not in the order array
  elements.forEach((el) => {
    if (!order.includes(el.id)) {
      reordered.push(el);
    }
  });
  writeData(reordered);
  res.json(reordered);
});

// Delete an element
app.delete("/api/elements/:id", (req, res) => {
  const { id } = req.params;
  const elements = readData();
  const updated = elements.filter((el) => el.id !== parseInt(id));
  if (elements.length === updated.length) {
    return res.status(404).json({ error: "Element not found" });
  }
  writeData(updated);
  res.status(204).send();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
