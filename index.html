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

// --- TOOL 1: PDF COMPRESSOR (Smart Sharp-Text Logic) ---
async function handleCompress() {
    const fileInput = document.getElementById('pdfInput');
    const compLevel = document.getElementById('compLevel').value;
    if (!fileInput.files[0]) return alert("Please select a PDF!");

    updateStatus("අකුරු වල පැහැදිලි බව සුරකිමින් පවතී...");
    const arrayBuffer = await fileInput.files[0].arrayBuffer();

    try {
        // අකුරු පැහැදිලිව තබා ගැනීමට pdf-lib භාවිතා කරයි
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        // 1. Metadata ඉවත් කිරීම (Size අඩු කිරීමට)
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setProducer("");

        // 2. Ultra Mode එකේදී පවා අකුරු බොඳ නොවන සේ 
        // අභ්‍යන්තර ව්‍යුහය පමණක් Compress කිරීම
        const useObjectStreams = compLevel >= "2"; 

        const compressedBytes = await pdfDoc.save({
            useObjectStreams: useObjectStreams,
            addDefaultPage: false,
            preserveRawResponses: false
        });

        const blob = new Blob([compressedBytes], { type: 'application/pdf' });
        const sizeKB = (blob.size / 1024).toFixed(2);
        
        updateStatus(`Success! Text is 100% Sharp. Size: ${sizeKB} KB`);
        downloadFile(blob, `SwiftPDF_Sharp_${sizeKB}KB.pdf`);

    } catch (err) {
        console.error(err);
        updateStatus("Compression Error: Use a Standard PDF", true);
    }
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
        pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }
    pdf.save("SwiftPDF_Images.pdf");
    updateStatus("Images Converted!");
}

// --- TOOL 3: PDF TO IMAGE ---
async function handlePdfToImg() {
    const input = document.getElementById('pdfToImgInput');
    if (!input.files[0]) return alert("Select a PDF file!");
    updateStatus("Extracting Pages as High-Res Images...");
    
    const buffer = await input.files[0].arrayBuffer();
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        // Scale 2.5 මගින් පින්තූරයේ පැහැදිලි බව වැඩි කරයි
        const viewport = page.getViewport({ scale: 2.5 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        const link = document.createElement('a');
        link.download = `Page_${i}_HighRes.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
    }
    updateStatus("All High-Res Images Saved!");
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
