const statusEl = document.getElementById("status");

/* ================= STATUS ================= */
function setStatus(msg, type = "info") {
  statusEl.textContent = msg;
  statusEl.className =
    type === "error"
      ? "text-red-500"
      : type === "success"
      ? "text-green-500"
      : "text-blue-500";
}

/* ================= THEME ================= */
document.getElementById("themeToggle").onclick = () => {
  document.documentElement.classList.toggle("dark");
};

/* ================= LIB CHECK ================= */
function checkLibs() {
  if (!window.jspdf || !window.PDFLib || !window.pdfjsLib) {
    throw new Error("Required libraries failed to load.");
  }
}

/* ================= IMAGE TO PDF ================= */
async function imageToPDF() {
  try {
    checkLibs();
    setStatus("Processing images...");

    const files = document.getElementById("imgInput").files;
    if (!files.length) throw new Error("No images selected.");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    for (let i = 0; i < files.length; i++) {
      const img = await loadImage(files[i]);
      const width = pdf.internal.pageSize.getWidth();
      const height = (img.height * width) / img.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, width, height);
    }

    pdf.save("images.pdf");
    setStatus("PDF created successfully!", "success");
  } catch (err) {
    setStatus(err.message, "error");
  }
}

function loadImage(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
}

/* ================= PDF COMPRESSOR ================= */
async function compressPDF() {
  try {
    checkLibs();
    setStatus("Compressing PDF...");

    const file = document.getElementById("compressInput").files[0];
    if (!file) throw new Error("No PDF selected.");

    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);

    const compressed = await pdfDoc.save({
      useObjectStreams: true,
      compress: true,
    });

    download(compressed, "compressed.pdf");
    setStatus("PDF compressed!", "success");
  } catch (err) {
    setStatus(err.message, "error");
  }
}

/* ================= PDF TO IMAGE ================= */
async function pdfToImage() {
  try {
    checkLibs();
    setStatus("Rendering PDF pages...");

    const file = document.getElementById("pdfImageInput").files[0];
    if (!file) throw new Error("No PDF selected.");

    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    const canvas = document.getElementById("hiddenCanvas");
    const ctx = canvas.getContext("2d");

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const imgURL = canvas.toDataURL("image/png");
      download(imgURL, `page-${i}.png`);
    }

    setStatus("Images downloaded!", "success");
  } catch (err) {
    setStatus(err.message, "error");
  }
}

/* ================= DOWNLOAD ================= */
function download(data, filename) {
  const a = document.createElement("a");
  a.href = data instanceof Uint8Array ? URL.createObjectURL(new Blob([data])) : data;
  a.download = filename;
  a.click();
}
