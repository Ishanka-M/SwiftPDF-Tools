// Slider එකේ වෙනස්කම් පෙන්වීමට
document.getElementById('compLevel').addEventListener('input', function() {
    const display = document.getElementById('levelDisplay');
    const levels = { "1": "LOW (Good Quality)", "2": "MEDIUM (Balanced)", "3": "ULTRA (Under 200KB Target)" };
    display.innerText = levels[this.value];
});

async function handleCompress() {
    const fileInput = document.getElementById('pdfInput');
    const compLevel = document.getElementById('compLevel').value; // 1, 2, or 3
    
    if (!fileInput.files[0]) return alert("කරුණාකර PDF එකක් තෝරන්න!");

    const file = fileInput.files[0];
    updateStatus("Compression Level පද්ධතිය ක්‍රියාත්මකයි...");

    // Compression Settings තීරණය කිරීම
    let scaleVal = 1.5; // DPI Scale
    let qualityVal = 0.7; // JPEG Quality

    if (compLevel === "1") {
        scaleVal = 1.5; qualityVal = 0.8; // Low compression
    } else if (compLevel === "2") {
        scaleVal = 1.0; qualityVal = 0.5; // Medium
    } else if (compLevel === "3") {
        scaleVal = 0.7; qualityVal = 0.2; // Ultra (Maximum reduction)
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const { jsPDF } = window.jspdf;
        const outPdf = new jsPDF('p', 'mm', 'a4');

        for (let i = 1; i <= pdf.numPages; i++) {
            updateStatus(`Processing: Page ${i} of ${pdf.numPages}...`);
            
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: scaleVal });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            // තෝරාගත් Quality එක අනුව JPEG එක සෑදීම
            const imgData = canvas.toDataURL('image/jpeg', qualityVal);
            
            if (i > 1) outPdf.addPage();
            
            const pdfWidth = outPdf.internal.pageSize.getWidth();
            const pdfHeight = outPdf.internal.pageSize.getHeight();
            
            // පින්තූරය පිටුවට සරිලන සේ ඇතුළත් කිරීම
            outPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            canvas.remove();
        }

        const pdfBlob = outPdf.output('blob');
        const finalSize = (pdfBlob.size / 1024).toFixed(2);
        
        updateStatus(`නිමයි! නව ප්‍රමාණය: ${finalSize} KB`);

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
