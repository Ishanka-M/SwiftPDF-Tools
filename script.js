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
    updateStatus("Optimizing PDF Structure...");

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        // මෙවර අපි භාවිතා කරන්නේ pdf-lib (Structure එක රැක ගැනීමට)
        // මේ සඳහා index.html හි head එකට පහත script එක ඇති බව සහතික කරගන්න:
        // <script src="https://unpkg.com/pdf-lib/dist/pdf-lib.min.js"></script>
        
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // 1. අනවශ්‍ය Metadata ඉවත් කිරීම (Size අඩු කිරීමට ප්‍රධාන පියවරක්)
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setCreator("");

        // 2. Slider එකේ අගය අනුව Compression settings තීරණය කිරීම
        // 'useObjectStreams' මගින් මුල් ගොනුවේ ගුණාත්මකභාවයට හානි නොකර size එක අඩු කරයි
        const shouldCompressStreams = (compLevel >= 2); 

        const compressedBytes = await pdfDoc.save({
            useObjectStreams: shouldCompressStreams,
            addDefaultPage: false,
            preserveRawResponses: false
        });

        const pdfBlob = new Blob([compressedBytes], { type: "application/pdf" });
        const finalSize = (pdfBlob.size / 1024).toFixed(2);
        
        // පරීක්ෂාව: මුල් ගොනුවට වඩා විශාල නම් මුල් ගොනුවම ලබා දෙන්න
        if (pdfBlob.size >= file.size && compLevel == 1) {
            updateStatus("Original is already optimized!", false);
            downloadFile(new Blob([arrayBuffer]), file.name);
        } else {
            updateStatus(`Done! Optimized to: ${finalSize} KB`);
            downloadFile(pdfBlob, `SwiftPDF_Optimized_${file.name}`);
        }

    } catch (err) {
        console.error("Compression Error:", err);
        updateStatus("Error: " + err.message, true);
    }
}

function downloadFile(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
}
