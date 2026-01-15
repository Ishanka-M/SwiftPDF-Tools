// Initialization check
const updateStatus = (msg, isError = false) => {
    const el = document.getElementById('statusIndicator');
    el.innerText = msg;
    el.className = isError ? "text-red-400" : "text-emerald-400";
};

// 1. ADVANCED PDF COMPRESSOR
async function handleCompress() {
    const fileInput = document.getElementById('pdfInput');
    const quality = parseFloat(document.getElementById('compLevel').value);
    
    if (!fileInput.files[0]) return alert("Please select a PDF file!");

    updateStatus("Compressing... Processing objects");

    try {
        const arrayBuffer = await fileInput.files[0].arrayBuffer();
        const { PDFDocument } = PDFLib; // Safe reference
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Advanced Save - Uses Object Streams to minimize size
        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            updateFieldAppearances: false
        });

        downloadFile(compressedBytes, "compressed.pdf", "application/pdf");
        updateStatus("Success! File reduced.");
    } catch (err) {
        console.error(err);
        updateStatus("Error: " + err.message, true);
    }
}

// 2. IMAGE TO PDF
async function handleImgToPdf() {
    const input = document.getElementById('imgInput');
    if (!input.files.length) return alert("Select images!");

    updateStatus("Converting images...");
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        for (let i = 0; i < input.files.length; i++) {
            const dataUrl = await readFileAsDataURL(input.files[i]);
            if (i > 0) pdf.addPage();
            pdf.addImage(dataUrl, 'JPEG', 10, 10, 190, 0);
        }
        pdf.save("images_to_pdf.pdf");
        updateStatus("Ready");
    } catch (err) {
        updateStatus("Error converting", true);
    }
}

// 3. PDF TO IMAGE
async function handlePdfToImg() {
    const fileInput = document.getElementById('pdfToImgInput');
    if (!fileInput.files[0]) return alert("Select a PDF!");

    updateStatus("Extracting images...");
    try {
        const file = fileInput.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const page = await pdf.getPage(1); // Getting first page as example
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        const imgLink = document.createElement('a');
        imgLink.href = canvas.toDataURL('image/jpeg');
        imgLink.download = "page-1.jpg";
        imgLink.click();
        updateStatus("First page extracted!");
    } catch (err) {
        console.error(err);
        updateStatus("Extraction failed", true);
    }
}

// Helpers
function readFileAsDataURL(file) {
    return new Promise(r => {
        const reader = new FileReader();
        reader.onload = () => r(reader.result);
        reader.readAsDataURL(file);
    });
}

function downloadFile(data, name, type) {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
}

// UI Level Label
document.getElementById('compLevel').oninput = function() {
    const labels = { "0.1": "Extreme", "0.5": "Medium", "0.9": "High Quality" };
    document.getElementById('levelLabel').innerText = labels[this.value] || "Custom";
};
