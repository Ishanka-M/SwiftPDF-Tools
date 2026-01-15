const updateStatus = (msg, isError = false) => {
    const el = document.getElementById('statusIndicator');
    el.innerText = msg;
    el.className = isError ? "text-red-400 p-2 bg-red-900/20 rounded" : "text-emerald-400 p-2 bg-emerald-900/20 rounded";
};

async function handleCompress() {
    const fileInput = document.getElementById('pdfInput');
    if (!fileInput.files[0]) return alert("කරුණාකර PDF එකක් තෝරන්න!");

    const file = fileInput.files[0];
    updateStatus("Aggressive DPI Reduction ක්‍රියාත්මකයි... මදක් රැඳී සිටින්න.");

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        // PDF.js මගින් PDF එක කියවීම
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        const { jsPDF } = window.jspdf;
        const outPdf = new jsPDF('p', 'mm', 'a4');
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
            updateStatus(`Processing Page ${i} of ${totalPages}...`);
            
            const page = await pdf.getPage(i);
            // ඉතා අඩු DPI එකක් ලබා ගැනීමට scale එක 1.0 හෝ 0.8 වැනි අගයකට පත් කරයි
            const viewport = page.getViewport({ scale: 1.0 }); 
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            // පින්තූරය ඉතා අඩු Quality (0.3) සහිත JPEG එකක් බවට පත් කිරීම
            const imgData = canvas.toDataURL('image/jpeg', 0.3); 
            
            if (i > 1) outPdf.addPage();
            
            const imgProps = outPdf.getImageProperties(imgData);
            const pdfWidth = outPdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            outPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            
            // Canvas එක Memory එකෙන් ඉවත් කිරීම
            canvas.remove();
        }

        const pdfBlob = outPdf.output('blob');
        const fileSizeKB = pdfBlob.size / 1024;

        updateStatus(`නිමයි! නව ප්‍රමාණය: ${fileSizeKB.toFixed(2)} KB`);

        // Download Link
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SwiftPDF_Ultra_Low_${fileSizeKB.toFixed(0)}KB.pdf`;
        a.click();
        URL.revokeObjectURL(url);

    } catch (err) {
        console.error(err);
        updateStatus("Error: " + err.message, true);
    }
}
