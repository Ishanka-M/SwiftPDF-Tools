// Initialization check
const updateStatus = (msg, isError = false) => {
    const el = document.getElementById('statusIndicator');
    el.innerText = msg;
    el.className = isError ? "text-red-400 p-2 bg-red-900/20 rounded" : "text-emerald-400 p-2 bg-emerald-900/20 rounded";
};

// 1. IMPROVED PDF COMPRESSOR
async function handleCompress() {
    const fileInput = document.getElementById('pdfInput');
    
    if (!fileInput.files[0]) {
        updateStatus("කරුණාකර PDF ගොනුවක් තෝරන්න!", true);
        return;
    }

    const file = fileInput.files[0];
    updateStatus(`Compressing: ${file.name}... Please wait.`);

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        // PDFLib නිවැරදිව load වී ඇත්දැයි පරීක්ෂාව
        if (typeof PDFLib === 'undefined') {
            throw new Error("PDF Library එක load වී නැත. කරුණාකර Refresh කරන්න.");
        }

        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // වඩාත් බලවත් Compression එකක් සඳහා Metadata ඉවත් කිරීම
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");

        // 'useObjectStreams' මගින් file size එක සැලකිය යුතු ලෙස අඩු කරයි
        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false
        });

        // Download කරගැනීම සඳහා වඩාත් ආරක්ෂිත ක්‍රමය
        const blob = new Blob([compressedBytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        
        downloadLink.href = url;
        downloadLink.download = "SwiftPDF_Compressed_" + file.name;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // පසු පිරිසිදු කිරීම් (Cleanup)
        setTimeout(() => {
            document.body.removeChild(downloadLink);
            window.URL.revokeObjectURL(url);
        }, 100);

        updateStatus("සාර්ථකව Download විය!");
    } catch (err) {
        console.error("Full Error:", err);
        updateStatus("Error: " + err.message, true);
    }
}

// 2. IMAGE TO PDF
async function handleImgToPdf() {
    const input = document.getElementById('imgInput');
    if (!input.files.length) return updateStatus("Select images!", true);

    updateStatus("Images conversion in progress...");
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        for (let i = 0; i < input.files.length; i++) {
            const dataUrl = await readFileAsDataURL(input.files[i]);
            if (i > 0) pdf.addPage();
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, 0);
        }
        pdf.save("SwiftPDF_Images.pdf");
        updateStatus("Images converted successfully!");
    } catch (err) {
        updateStatus("Conversion failed!", true);
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
