// Export to PDF
document.getElementById("exportPDF").addEventListener("click", function () {
  const editor = document.getElementById("editor");
  const exportClone = editor.cloneNode(true);
  // Remove action features before exporting
  exportClone
    .querySelectorAll(".handle, .remove-btn, .block-add-btn, .saved-actions")
    .forEach((el) => el.remove());

  html2pdf()
    .from(exportClone)
    .set({
      margin: 1,
      filename: "document.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    })
    .save();
});

// Export to Word
document.getElementById("exportWord").addEventListener("click", function () {
  const editor = document.getElementById("editor");
  const exportClone = editor.cloneNode(true);
  // Remove action features before exporting
  exportClone
    .querySelectorAll(".handle, .remove-btn, .block-add-btn, .saved-actions")
    .forEach((el) => el.remove());

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Export Document</title></head>
      <body>${exportClone.innerHTML}</body>
    </html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url =
    "data:application/vnd.ms-word;charset=utf-8," + encodeURIComponent(html);
  const link = document.createElement("a");
  link.href = url;
  link.download = "document.doc";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
