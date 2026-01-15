// Status පෙන්වීමට සහාය වන function එක
const updateStatus = (msg, isError = false) => {
    const el = document.getElementById('statusIndicator');
    if (!el) return;
    el.innerText = msg;
    el.className = isError 
        ? "px-4 py-1 rounded-full text-xs font-bold bg-red-900/20 text-red-400 border border-red-700" 
        : "px-4 py-1 rounded-full text-xs font-bold bg-emerald-900/20 text-emerald-400 border border-emerald-700";
};

// Slider එකේ අකුරු වෙනස් කිරීම
const compSlider = document.getElementById('compLevel');
if (compSlider) {
    compSlider.addEventListener('input', function() {
        const display = document.getElementById('levelDisplay');
        const val = this.value;
        if(val == "1") display.innerText = "LOW (Best Quality)";
        if(val == "2") display.innerText = "MEDIUM (Balanced)";
        if(val == "3") display.innerText = "ULTRA (Smallest Size)";
    });
}

async function handleCompress() {
    const fileInput = document.getElementById('pdfInput');
    const compLevel = document.getElementById('compLevel').value;
    
    if (!fileInput || !fileInput.files[0]) {
        alert("කරුණාකර PDF එකක් තෝරන්න!");
        return;
    }

    const file = fileInput.files[0];
    updateStatus("Processing... Please wait.");

    // Compression Levels
    let scaleVal, qualityVal;
    if (compLevel === "1") { scaleVal = 1.2; qualityVal = 0.7; }
    else if (compLevel === "2") { scaleVal = 0.8; qualityVal = 0.4; }
    else { scaleVal = 0.5; qualityVal = 0.15; } // Ultra Low DPI

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        // PDF.js නිවැරදිව සැකසීම
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        const { jsPDF } = window.jspdf;
        const outPdf = new jsPDF('p', 'mm', 'a4');

        for (let i = 1; i <= pdf.numPages; i++) {
            updateStatus(`Processing Page ${i} of ${pdf.numPages}...`);
            
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: scaleVal });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const imgData = canvas.toDataURL('image/jpeg', qualityVal);
            
            if (i > 1) outPdf.addPage();
            
            const pdfWidth = outPdf.internal.pageSize.getWidth();
            const pdfHeight = outPdf.internal.pageSize.getHeight();
            
            outPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            canvas.remove();
        }

        // PDF එක Blob එකක් ලෙස ලබා ගැනීම
        const pdfBlob = outPdf.output('blob');
        const finalSize = (pdfBlob.size / 1024).toFixed(2);
        
        updateStatus(`Done! Size: ${finalSize} KB`);

        // ස්ථාවර Download ක්‍රමය
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.style.display = 'none';
        a.href = url;
        a.download = `SwiftPDF_${finalSize}KB.pdf`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);

    } catch (err) {
        console.error("Compression Error:", err);
        updateStatus("Error: " + err.message, true);
    }
}
