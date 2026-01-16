// Initialization
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const statusEl = document.getElementById('statusIndicator');
const updateStatus = (msg) => statusEl.innerText = msg;

// --- DRAG & DROP LOGIC ---
const dropZone = document.getElementById('dropZone');
const pdfInput = document.getElementById('pdfInput');

dropZone.onclick = () => pdfInput.click();
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('active'); };
dropZone.ondragleave = () => dropZone.classList.remove('active');
dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    if (e.dataTransfer.files[0]?.type === "application/pdf") {
        pdfInput.files = e.dataTransfer.files;
        document.getElementById('fileNameDisplay').innerText = "Selected: " + e.dataTransfer.files[0].name;
    }
};

pdfInput.onchange = () => {
    if (pdfInput.files[0]) document.getElementById('fileNameDisplay').innerText = "Selected: " + pdfInput.files[0].name;
};

// --- TOOL 1: PDF COMPRESSOR ---
async function handleCompress() {
    if (!pdfInput.files[0]) return alert("Please select a PDF!");
    updateStatus("Compressing...");
    
    const arrayBuffer = await pdfInput.files[0].arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const { jsPDF } = window.jspdf;
    const outPdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true });

    const level = document.getElementById('compLevel').value;
    let dpiScale = level == "3" ? 1.2 : 1.8; 
    let quality = level == "3" ? 0.4 : 0.7;

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
    outPdf.save("Compressed.pdf");
    updateStatus("System Ready");
}

// --- TOOL 2: IMAGE TO PDF (Fixed) ---
async function handleImgToPdf() {
    const imgFiles = document.getElementById('imgInput').files;
    if (imgFiles.length === 0) return alert("Select images!");
    updateStatus("Converting Images...");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    for (let i = 0; i < imgFiles.length; i++) {
        const dataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(imgFiles[i]);
        });
        
        if (i > 0) doc.addPage();
        // A4 ප්‍රමාණයට රූපය සකසයි
        doc.addImage(dataUrl, 'JPEG', 10, 10, 190, 277);
    }
    doc.save("Images_to_PDF.pdf");
    updateStatus("System Ready");
}

// --- TOOL 3: PDF TO IMAGE (Fixed) ---
async function handlePdfToImg() {
    const file = document.getElementById('pdfToImgInput').files[0];
    if (!file) return alert("Select a PDF!");
    updateStatus("Extracting Pages...");

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High Res
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.download = `Page_${i}.jpg`;
        link.click();
    }
    updateStatus("System Ready");
}
