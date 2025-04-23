// Export PDF using html2pdf with cross-origin image support
function exportPDF() {
  const editorContent = document.getElementById("editor");
  html2pdf()
    .from(editorContent)
    .set({
      margin: 0.5,
      filename: "document.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: false },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    })
    .save();
}

// Export Word by downloading the editor content as HTML with a .doc extension
function exportWord() {
  const editorContent = document.getElementById("editor").innerHTML;
  const preHtml =
    "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
    "xmlns:w='urn:schemas-microsoft-com:office:word' " +
    "xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export as Word Document</title></head><body>";
  const postHtml = "</body></html>";
  const html = preHtml + editorContent + postHtml;
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "document.doc";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Attach export events to the Export buttons
document.getElementById("exportPDF").addEventListener("click", exportPDF);
document.getElementById("exportWord").addEventListener("click", exportWord);
