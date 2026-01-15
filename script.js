// Status පෙන්වීමට
const updateStatus = (msg, isError = false) => {
    const el = document.getElementById('statusIndicator');
    el.innerText = msg;
    el.className = isError ? "px-4 py-1 rounded-full text-xs font-bold bg-red-900/20 text-red-400 border border-red-700" : "px-4 py-1 rounded-full text-xs font-bold bg-emerald-900/20 text-emerald-400 border border-emerald-700";
};

// Slider එකේ අකුරු වෙනස් කිරීමට
document.getElementById('compLevel').addEventListener('input', function() {
    const display = document.getElementById('levelDisplay');
    const val = this.value;
    if(val == "1") display.innerText = "LOW (Best Quality)";
    if(val == "2") display.innerText = "MEDIUM (Balanced)";
    if(val == "3") display.innerText = "ULTRA (Smallest Size)";
});

async function handleCompress() {
    const fileInput = document.getElementById('pdfInput');
    const compLevel = document.getElementById('compLevel').value; // Slider එකේ අගය
    
    if (!fileInput.files[0]) return alert("කරුණාකර PDF එකක් තෝරන්න!");

    const file = fileInput.files[0];
    updateStatus("Processing... Please wait.");

    // මට්ටම අනුව DPI සහ Quality තෝරා ගැනීම
    let scaleVal, qualityVal;

    if (compLevel === "1") {
        scaleVal = 1.5;   // වැඩි DPI (පැහැදිලියි)
        qualityVal = 0.8; // වැඩි Quality
    } else if (compLevel === "2") {
        scaleVal = 0.9;   // මධ්‍යම DPI
        qualityVal = 0.5; // මධ්‍යම Quality
    } else {
        scaleVal = 0.5;   // ඉතා අඩු DPI (72 DPI වලටත් අඩුයි - 199KB සඳහා)
        qualityVal = 0.15; // ඉතා අඩු Quality
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const { jsPDF } = window.jspdf;
        
        // අලුත් PDF එක සෑදීම
        const outPdf = new jsPDF('p', 'mm', 'a4');

        for (let i = 1; i <= pdf.numPages; i++) {
            updateStatus(`Processing Page ${i} of ${pdf.numPages}...`);
            
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: scaleVal }); // මෙන්න මෙතැනින් DPI එක වෙනස් වේ
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            // JPEG බවට හරවා Quality එක අඩු කිරීම
            const imgData = canvas.toDataURL('image/jpeg', qualityVal);
            
            if (i > 1) outPdf.addPage();
            
            const pdfWidth = outPdf.internal.pageSize.getWidth();
            const pdfHeight = outPdf.internal.pageSize.getHeight();
            
            // පින්තූරය ඇතුළත් කිරීම
            outPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            canvas.remove();
        }

        const pdfBlob = outPdf.output('blob');
        const finalSize = (pdfBlob.size / 1024).toFixed(2);
        
        updateStatus(`Done! Size: ${finalSize} KB`);

        // ස්වයංක්‍රීයව Download කිරීම
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SwiftPDF_${finalSize}KB.pdf`;
        a.click();
        URL.revokeObjectURL(url);

    } catch (err) {
        console.error(err);
        updateStatus("Error: " + err.message, true);
    }
}

// අනෙක් Tools සඳහා කේත මෙතැනින් පසුව...
