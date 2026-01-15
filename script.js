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
            updateStatus("Ultra Mode: Auto-adjusting for 199KB limit...");
            await compressUltraAuto(arrayBuffer);
        } else {
            updateStatus("Optimization Mode: Quality Preserved.");
            await compressVector(arrayBuffer, compLevel);
        }
    } catch (err) {
        console.error(err);
        updateStatus("Error: " + err.message, true);
    }
}

// 1. පිටු ගණන අනුව DPI පාලනය වන Ultra Mode
async function compressUltraAuto(buffer) {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const { jsPDF } = window.jspdf;
    const totalPages = pdf.numPages;

    // --- Dynamic Scaling Logic ---
    // පිටු ගණන වැඩි වන විට DPI (scale) සහ Quality එක ස්වයංක්‍රීයව අඩු කරයි
    let scaleVal = 0.5;
    let qualityVal = 0.2;

    if (totalPages > 10) {
        scaleVal = 0.3; // පිටු 10 ට වැඩි නම් DPI ගොඩක් අඩු කරයි
        qualityVal = 0.1;
    }
    if (totalPages > 30) {
        scaleVal = 0.2; // පිටු 30 ට වැඩි නම් ඉතාම අඩු DPI භාවිතා කරයි
        qualityVal = 0.05;
    }

    const outPdf = new jsPDF({ compress: true });

    for (let i = 1; i <= totalPages; i++) {
        updateStatus(`Processing Page ${i} / ${totalPages} (Auto-scaling applied)`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: scaleVal });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        const imgData = canvas.toDataURL('image/jpeg', qualityVal);
        
        if (i > 1) outPdf.addPage();
        outPdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        canvas.remove();
    }
    finishDownload(outPdf.output('blob'));
}

// 2. Vector Optimization (Level 1 & 2)
async function compressVector(buffer, level) {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.load(buffer);
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    finishDownload(new Blob([compressedBytes], { type: "application/pdf" }));
}

function finishDownload(blob) {
    const size = (blob.size / 1024).toFixed(2);
    updateStatus(`Done! New Size: ${size} KB`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SwiftPDF_${size}KB.pdf`;
    a.click();
}
