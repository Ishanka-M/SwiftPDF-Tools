// Status Update
const updateStatus = (msg, isError = false) => {
    const el = document.getElementById('statusIndicator');
    el.innerText = msg;
    el.style.color = isError ? "#f87171" : "#34d399";
};

// Drag & Drop Handling
const dropZone = document.getElementById('dropZone');
const pdfInput = document.getElementById('pdfInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');

// Click to open file explorer
dropZone.addEventListener('click', () => pdfInput.click());

// Drag events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-blue-500', 'bg-blue-500/10');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
        pdfInput.files = files;
        fileNameDisplay.innerText = "Selected: " + files[0].name;
    } else {
        alert("කරුණාකර PDF එකක් පමණක් Drop කරන්න!");
    }
});

// Display file name when chosen normally
pdfInput.addEventListener('change', () => {
    if (pdfInput.files.length > 0) {
        fileNameDisplay.innerText = "Selected: " + pdfInput.files[0].name;
    }
});

// Slider logic
document.getElementById('compLevel').addEventListener('input', function() {
    const labels = { "1": "LOW DPI", "2": "MEDIUM", "3": "ULTRA (199KB)" };
    document.getElementById('levelDisplay').innerText = labels[this.value];
});

// --- MAIN COMPRESSOR (DPI OPTIMIZED) ---
async function handleCompress() {
    if (!pdfInput.files[0]) return alert("කරුණාකර PDF එකක් Drop කරන්න හෝ තෝරන්න!");

    updateStatus("DPI Optimize කරමින් පවතී...");
    const arrayBuffer = await pdfInput.files[0].arrayBuffer();
    
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const { jsPDF } = window.jspdf;
    const outPdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true });

    const level = document.getElementById('compLevel').value;
    let dpiScale = level == "3" ? 1.2 : 1.8; // ULTRA = 1.2 DPI for small size
    let quality = level == "3" ? 0.4 : 0.7;

    for (let i = 1; i <= pdf.numPages; i++) {
        updateStatus(`සකසමින්: පිටුව ${i}/${pdf.numPages}`);
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
        outPdf.addImage(imgData, 'JPEG', 0, 0, 595.28, 841.89); // A4 Standard
        canvas.remove();
    }
    
    const blob = outPdf.output('blob');
    updateStatus(`නිමයි! ${(blob.size/1024).toFixed(0)} KB`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "Compressed_Sharp.pdf"; a.click();
}

// Image to PDF & PDF to Image functions remain same as previous version...
// (කලින් ලබාදුන් ඉතිරි functions මෙහි අවසානයට එකතු කරන්න)
