// Function to update the status bar
const updateStatus = (msg, isError = false) => {
    const el = document.getElementById('statusIndicator');
    el.innerText = msg;
    el.className = isError 
        ? "status-badge border-red-500 text-red-400 bg-red-900/20" 
        : "status-badge border-emerald-500 text-emerald-400 bg-emerald-900/20";
};

// Sync slider labels
document.getElementById('compLevel').addEventListener('input', function() {
    const labels = { "1": "LOW (Best Quality)", "2": "MEDIUM (Balanced)", "3": "ULTRA (Target 199KB)" };
    document.getElementById('levelDisplay').innerText = labels[this.value];
});

// --- TOOL 1: PDF COMPRESSOR ---
async function handleCompress() {
    const fileInput = document.getElementById('pdfInput');
    const compLevel = document.getElementById('compLevel').value;
    if (!fileInput.files[0]) return alert("Please select a PDF!");

    updateStatus("Processing Compressor...");
    const arrayBuffer = await fileInput.files[0].arrayBuffer();
    
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const { jsPDF } = window.jspdf;
    
    // Create new PDF with internal compression enabled
    const outPdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true });

    for (let i = 1; i <= pdf.numPages; i++) {
        updateStatus(`Compressing Page ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        
        // Smart Scaling Logic for clarity vs size
        let scale = (compLevel === "3") ? 1.2 : 1.8;
        let quality = (compLevel === "3") ? 0.25 : 0.6;

        const viewport = page.getViewport({ scale: scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        const imgData = canvas.toDataURL('image/jpeg', quality);
        
        if (i > 1) outPdf.addPage();
        outPdf.addImage(imgData, 'JPEG', 0, 0, outPdf.internal.pageSize.getWidth(), outPdf.internal.pageSize.getHeight(), undefined, 'MEDIUM');
        canvas.remove();
    }
    
    const blob = outPdf.output('blob');
    const sizeKB = (blob.size / 1024).toFixed(2);
    updateStatus(`Success! Final Size: ${sizeKB} KB`);
    downloadFile(blob, `SwiftPDF_Compressed_${sizeKB}KB.pdf`);
}

// --- TOOL 2: IMAGE TO PDF ---
async function handleImgToPdf() {
    const input = document.getElementById('imgInput');
    if (!input.files.length) return alert("Select images first!");
    updateStatus("Building PDF from Images...");
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    for (let i = 0; i < input.files.length; i++) {
        const dataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(input.files[i]);
        });
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297);
    }
    pdf.save("SwiftPDF_Images.pdf");
    updateStatus("Images Converted Successfully!");
}

// --- TOOL 3: PDF TO IMAGE ---
async function handlePdfToImg() {
    const input = document.getElementById('pdfToImgInput');
    if (!input.files[0]) return alert("Select a PDF file!");
    updateStatus("Extracting Pages as Images...");
    
    const buffer = await input.files[0].arrayBuffer();
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        const link = document.createElement('a');
        link.download = `Page_${i}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    }
    updateStatus("All Pages Extracted!");
}

// Helper: Download function
function downloadFile(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}
