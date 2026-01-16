// Status Update Helper
function updateStatus(msg, isError = false) {
    const el = document.getElementById('statusIndicator');
    el.innerText = msg;
    el.style.color = isError ? "#f87171" : "#34d399";
}

// --- TOOL 1: DPI OPTIMIZED COMPRESSOR ---
async function handleCompress() {
    const fileInput = document.getElementById('pdfInput');
    const compLevel = document.getElementById('compLevel').value;
    if (!fileInput.files[0]) return alert("කරුණාකර PDF එකක් තෝරන්න!");

    updateStatus("DPI ප්‍රශස්ත කරමින් පවතී...");
    const arrayBuffer = await fileInput.files[0].arrayBuffer();
    
    // PDF.js මගින් මුල් PDF එක කියවීම
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const { jsPDF } = window.jspdf;
    const outPdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true });

    for (let i = 1; i <= pdf.numPages; i++) {
        updateStatus(`සකසමින්: පිටුව ${i}/${pdf.numPages}`);
        const page = await pdf.getPage(i);
        
        // --- DPI සහ QUALITY පාලනය ---
        // 1 = High (200 DPI), 2 = Medium (150 DPI), 3 = Ultra (120 DPI)
        let dpiScale = 2.0; 
        let imgQuality = 0.7;

        if (compLevel === "2") {
            dpiScale = 1.5; // Medium DPI
            imgQuality = 0.5;
        } else if (compLevel === "3") {
            dpiScale = 1.2; // Ultra Low DPI (199KB target)
            imgQuality = 0.35; // මෙහිදී අකුරු කැඩීම වැලැක්වීමට quality එක 0.3 ට වඩා අඩු නොකරයි
        }

        const viewport = page.getViewport({ scale: dpiScale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // අකුරු වල තියුණු බව (Sharpness) වැඩි කරන සැකසුම්
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        // JPEG format එකෙන් compression එක උපරිම කරයි
        const imgData = canvas.toDataURL('image/jpeg', imgQuality);
        
        if (i > 1) outPdf.addPage();
        const pdfWidth = outPdf.internal.pageSize.getWidth();
        const pdfHeight = outPdf.internal.pageSize.getHeight();
        
        outPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'MEDIUM');
        canvas.remove();
    }
    
    const blob = outPdf.output('blob');
    const sizeKB = (blob.size / 1024).toFixed(0);
    updateStatus(`නිමයි! ප්‍රමාණය: ${sizeKB} KB`);
    downloadFile(blob, `Compressed_DPI_Optimized_${sizeKB}KB.pdf`);
}

// --- අනෙකුත් Tools වෙනස් නොවේ ---
async function handleImgToPdf() {
    const input = document.getElementById('imgInput');
    if (input.files.length === 0) return alert("පින්තූර තෝරන්න!");
    updateStatus("Building PDF...");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    for (let i = 0; i < input.files.length; i++) {
        const dataUrl = await new Promise(r => {
            const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(input.files[i]);
        });
        if (i > 0) pdf.addPage();
        // පින්තූර PDF කිරීමේදී DPI එක 150 ට limit කිරීම
        pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297, undefined, 'SLOW');
    }
    pdf.save("Images_to_PDF.pdf");
    updateStatus("Done!");
}

async function handlePdfToImg() {
    const input = document.getElementById('pdfToImgInput');
    if (!input.files[0]) return alert("PDF එකක් තෝරන්න!");
    updateStatus("Extracting...");
    const buffer = await input.files[0].arrayBuffer();
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High Res for images
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height; canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        const a = document.createElement('a');
        a.download = `Page_${i}.jpg`;
        a.href = canvas.toDataURL('image/jpeg', 0.9);
        a.click();
    }
    updateStatus("All Pages Saved!");
}

function downloadFile(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
}
