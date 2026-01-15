const updateStatus = (msg, isError = false) => {
    const el = document.getElementById('statusIndicator');
    if (!el) return;
    el.innerText = msg;
    el.className = isError 
        ? "px-4 py-1 rounded-full text-xs font-bold bg-red-900/20 text-red-400 border border-red-700" 
        : "px-4 py-1 rounded-full text-xs font-bold bg-emerald-900/20 text-emerald-400 border border-emerald-700";
};

async function handleCompress() {
    const fileInput = document.getElementById('pdfInput');
    const compLevel = document.getElementById('compLevel').value;
    
    if (!fileInput || !fileInput.files[0]) {
        alert("කරුණාකර PDF එකක් තෝරන්න!");
        return;
    }

    const file = fileInput.files[0];
    const arrayBuffer = await file.arrayBuffer();

    try {
        if (compLevel === "3") {
            // ULTRA MODE: 199KB සඳහා පිටු පින්තූර බවට හරවයි (Flattening)
            updateStatus("Ultra Mode: Scaling DPI to minimum...");
            await compressUltra(arrayBuffer);
        } else {
            // LEVEL 1 & 2: අකුරු වල පැහැදිලි බව (Vector) ආරක්ෂා කර Compress කරයි
            updateStatus("Optimization Mode: Preserving Text Quality...");
            await compressVector(arrayBuffer, compLevel);
        }
    } catch (err) {
        console.error(err);
        updateStatus("Error: " + err.message, true);
    }
}

// 1. Quality එක ආරක්ෂා කරන ක්‍රමය (Level 1 & 2)
async function compressVector(buffer, level) {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.load(buffer);
    
    // අනවශ්‍ය දත්ත ඉවත් කිරීම
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    
    const compressedBytes = await pdfDoc.save({
        useObjectStreams: true, // ව්‍යුහය ප්‍රශස්ත කරයි
        addDefaultPage: false
    });

    const blob = new Blob([compressedBytes], { type: "application/pdf" });
    if (blob.size >= buffer.byteLength && level == "1") {
        updateStatus("Already Optimized!");
        downloadFile(new Blob([buffer]), "Original_Optimized.pdf");
    } else {
        finishDownload(blob);
    }
}

// 2. 199KB සඳහා වන Ultra ක්‍රමය (Level 3)
async function compressUltra(buffer) {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const { jsPDF } = window.jspdf;
    const outPdf = new jsPDF('p', 'mm', 'a4');

    for (let i = 1; i <= pdf.numPages; i++) {
        updateStatus(`Ultra Compressing: Page ${i}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.6 }); // DPI ගොඩක් අඩු කරයි
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        const imgData = canvas.toDataURL('image/jpeg', 0.15); // Quality එක ගොඩක් අඩු කරයි
        
        if (i > 1) outPdf.addPage();
        outPdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        canvas.remove();
    }
    finishDownload(outPdf.output('blob'));
}

function finishDownload(blob) {
    const size = (blob.size / 1024).toFixed(2);
    updateStatus(`Success! Size: ${size} KB`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SwiftPDF_Result_${size}KB.pdf`;
    a.click();
}

function downloadFile(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
}
