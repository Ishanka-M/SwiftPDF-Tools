// --- INITIALIZATION ---
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const updateStatus = (msg) => {
    document.getElementById('statusIndicator').innerText = msg;
};

// --- SLIDER LABEL LOGIC ---
const compSlider = document.getElementById('compLevel');
const levelDisplay = document.getElementById('levelDisplay');
compSlider.addEventListener('input', function() {
    const labels = { "1": "Low (Sharp)", "2": "Medium", "3": "Ultra (199KB)" };
    levelDisplay.innerText = labels[this.value];
});

// --- DRAG & DROP LOGIC ---
const dropZone = document.getElementById('dropZone');
const pdfInput = document.getElementById('pdfInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');

dropZone.onclick = () => pdfInput.click();
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drop-area-active'); };
dropZone.ondragleave = () => dropZone.classList.remove('drop-area-active');
dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('drop-area-active');
    if (e.dataTransfer.files[0]?.type === "application/pdf") {
        pdfInput.files = e.dataTransfer.files;
        fileNameDisplay.innerText = "Selected: " + e.dataTransfer.files[0].name;
    }
};
pdfInput.onchange = () => {
    if (pdfInput.files[0]) fileNameDisplay.innerText = "Selected: " + pdfInput.files[0].name;
};

// --- TOOL 1: COMPRESSOR (DPI OPTIMIZED) ---
async function handleCompress() {
    if (!pdfInput.files[0]) return alert("Please select a PDF!");
    updateStatus("Processing PDF...");
    
    const arrayBuffer = await pdfInput.files[0].arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const { jsPDF } = window.jspdf;
    const outPdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true });

    let dpiScale = compSlider.value == "3" ? 1.2 : 1.8; 
    let quality = compSlider.value == "3" ? 0.4 : 0.7;

    for (let i = 1; i <= pdf.numPages; i++) {
        updateStatus(`Optimizing Page ${i}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: dpiScale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        ctx.imageSmoothingQuality = 'high';
        
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        const imgData = canvas.toDataURL('image/jpeg', quality);
        
        if (i > 1) outPdf.addPage();
        outPdf.addImage(imgData, 'JPEG', 0, 0, 595, 842);
        canvas.remove();
    }
    outPdf.save("SwiftPDF_Compressed.pdf");
    updateStatus("System Ready");
}

// --- TOOL 2: PDF CONTENT EDITOR ---
async function handleEditPdf() {
    const pdfFile = document.getElementById('editPdfInput').files[0];
    const imgFile = document.getElementById('editImgInput').files[0];
    const textToAdd = document.getElementById('addTextInput').value;
    const x = parseInt(document.getElementById('posX').value) || 50;
    const y = parseInt(document.getElementById('posY').value) || 50;

    if (!pdfFile) return alert("Select PDF to edit!");
    updateStatus("Applying Edits...");

    try {
        const { PDFDocument, rgb, StandardFonts } = PDFLib;
        const pdfBytes = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        if (textToAdd) {
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            firstPage.drawText(textToAdd, { x, y, size: 18, font, color: rgb(0, 0, 0) });
        }

        if (imgFile) {
            const imgBytes = await imgFile.arrayBuffer();
            const embeddedImg = imgFile.type === "image/png" ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
            const dims = embeddedImg.scale(0.5);
            firstPage.drawImage(embeddedImg, { x: x + 10, y: y - 50, width: dims.width, height: dims.height });
        }

        const resultBytes = await pdfDoc.save();
        const blob = new Blob([resultBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "SwiftPDF_Edited.pdf";
        link.click();
        updateStatus("Edit Successful!");
    } catch (err) {
        console.error(err);
        updateStatus("Edit Error!", true);
    }
}

// --- TOOL 3: IMAGE TO PDF ---
async function handleImgToPdf() {
    const files = document.getElementById('imgInput').files;
    if (files.length === 0) return alert("Select images!");
    updateStatus("Converting...");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    for (let i = 0; i < files.length; i++) {
        const dataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(files[i]);
        });
        if (i > 0) doc.addPage();
        doc.addImage(dataUrl, 'JPEG', 10, 10, 190, 277);
    }
    doc.save("SwiftPDF_Gallery.pdf");
    updateStatus("System Ready");
}

// --- TOOL 4: PDF TO IMAGE ---
async function handlePdfToImg() {
    const file = document.getElementById('pdfToImgInput').files[0];
    if (!file) return alert("Select PDF!");
    updateStatus("Extracting...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height; canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.download = `Page_${i}.jpg`;
        link.click();
    }
    updateStatus("System Ready");
}
