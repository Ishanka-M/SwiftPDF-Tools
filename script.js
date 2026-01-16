// Status Update
const updateStatus = (msg) => document.getElementById('statusIndicator').innerText = msg;

// --- SLIDER LABEL LOGIC (FIXED) ---
const compSlider = document.getElementById('compLevel');
const levelDisplay = document.getElementById('levelDisplay');

compSlider.addEventListener('input', function() {
    const labels = { "1": "LOW", "2": "MEDIUM", "3": "ULTRA (199KB)" };
    levelDisplay.innerText = labels[this.value];
});

// --- DRAG & DROP LOGIC ---
const dropZone = document.getElementById('dropZone');
const pdfInput = document.getElementById('pdfInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');

dropZone.onclick = () => pdfInput.click();
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('border-blue-500', 'bg-blue-500/10'); };
dropZone.ondragleave = () => dropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
    if (e.dataTransfer.files[0]?.type === "application/pdf") {
        pdfInput.files = e.dataTransfer.files;
        fileNameDisplay.innerText = "Selected: " + e.dataTransfer.files[0].name;
    }
};
pdfInput.onchange = () => {
    if (pdfInput.files[0]) fileNameDisplay.innerText = "Selected: " + pdfInput.files[0].name;
};

// --- TOOL 1: COMPRESSOR ---
async function handleCompress() {
    if (!pdfInput.files[0]) return alert("Please select a PDF!");
    updateStatus("Compressing...");
    
    const arrayBuffer = await pdfInput.files[0].arrayBuffer();
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const { jsPDF } = window.jspdf;
    const outPdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true });

    let dpiScale = compSlider.value == "3" ? 1.2 : 1.8; 
    let quality = compSlider.value == "3" ? 0.4 : 0.7;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: dpiScale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        const imgData = canvas.toDataURL('image/jpeg', quality);
        if (i > 1) outPdf.addPage();
        outPdf.addImage(imgData, 'JPEG', 0, 0, 595, 842);
    }
    outPdf.save("Compressed_Sharp.pdf");
    updateStatus("System Ready");
}

// --- TOOL 2: IMAGE TO PDF ---
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
    doc.save("Images_to_PDF.pdf");
    updateStatus("System Ready");
}

// --- TOOL 3: PDF TO IMAGE ---
async function handlePdfToImg() {
    const file = document.getElementById('pdfToImgInput').files[0];
    if (!file) return alert("Select PDF!");
    updateStatus("Extracting...");
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
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
