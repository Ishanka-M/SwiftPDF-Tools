// SwiftPDF Tools - Main Application Script

// Global variables
let selectedImages = [];
let selectedPdfFile = null;
let selectedImageIndex = null;

// DOM Elements
const imageUploadArea = document.getElementById('imageUploadArea');
const imageInput = document.getElementById('imageInput');
const browseImagesBtn = document.getElementById('browseImagesBtn');
const imagePreview = document.getElementById('imagePreview');
const imageList = document.getElementById('imageList');
const imageCount = document.getElementById('imageCount');
const clearImagesBtn = document.getElementById('clearImagesBtn');
const moveUpBtn = document.getElementById('moveUpBtn');
const moveDownBtn = document.getElementById('moveDownBtn');
const convertToPdfBtn = document.getElementById('convertToPdfBtn');
const imageConversionProgress = document.getElementById('imageConversionProgress');
const imageProgressBar = document.getElementById('imageProgressBar');
const imageProgressPercent = document.getElementById('imageProgressPercent');

const pdfUploadArea = document.getElementById('pdfUploadArea');
const pdfInput = document.getElementById('pdfInput');
const browsePdfBtn = document.getElementById('browsePdfBtn');
const pdfPreview = document.getElementById('pdfPreview');
const pdfFileName = document.getElementById('pdfFileName');
const pdfFileSize = document.getElementById('pdfFileSize');
const removePdfBtn = document.getElementById('removePdfBtn');
const compressPdfBtn = document.getElementById('compressPdfBtn');
const pdfCompressionProgress = document.getElementById('pdfCompressionProgress');
const pdfProgressBar = document.getElementById('pdfProgressBar');
const pdfProgressPercent = document.getElementById('pdfProgressPercent');
const compressionLevel = document.getElementById('compressionLevel');
const scaleFactor = document.getElementById('scaleFactor');
const compressionEstimate = document.getElementById('compressionEstimate');

const resultsSection = document.getElementById('resultsSection');
const resultDescription = document.getElementById('resultDescription');
const resultFileName = document.getElementById('resultFileName');
const resultFileSize = document.getElementById('resultFileSize');
const compressionResult = document.getElementById('compressionResult');
const sizeReduction = document.getElementById('sizeReduction');
const downloadResultBtn = document.getElementById('downloadResultBtn');
const processAnotherBtn = document.getElementById('processAnotherBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners
    initEventListeners();
    
    // Update compression estimate based on settings
    updateCompressionEstimate();
    
    console.log('SwiftPDF Tools initialized successfully');
});

// Initialize all event listeners
function initEventListeners() {
    // Image to PDF section
    browseImagesBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageSelection);
    imageUploadArea.addEventListener('dragover', handleDragOver);
    imageUploadArea.addEventListener('dragleave', handleDragLeave);
    imageUploadArea.addEventListener('drop', handleImageDrop);
    clearImagesBtn.addEventListener('click', clearAllImages);
    moveUpBtn.addEventListener('click', moveSelectedImageUp);
    moveDownBtn.addEventListener('click', moveSelectedImageDown);
    convertToPdfBtn.addEventListener('click', convertImagesToPdf);
    
    // PDF Compressor section
    browsePdfBtn.addEventListener('click', () => pdfInput.click());
    pdfInput.addEventListener('change', handlePdfSelection);
    pdfUploadArea.addEventListener('dragover', handleDragOver);
    pdfUploadArea.addEventListener('dragleave', handleDragLeave);
    pdfUploadArea.addEventListener('drop', handlePdfDrop);
    removePdfBtn.addEventListener('click', removeSelectedPdf);
    compressPdfBtn.addEventListener('click', compressPdf);
    
    // Compression settings
    compressionLevel.addEventListener('change', updateCompressionEstimate);
    scaleFactor.addEventListener('change', updateCompressionEstimate);
    
    // Results section
    downloadResultBtn.addEventListener('click', downloadResult);
    processAnotherBtn.addEventListener('click', processAnotherFile);
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

function handleImageDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
        processImageFiles(imageFiles);
    } else {
        alert('Please drop only image files (JPG, PNG, GIF, BMP, WebP)');
    }
}

function handlePdfDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length > 0) {
        if (pdfFiles.length > 1) {
            alert('Please drop only one PDF file at a time');
            return;
        }
        loadPdfFile(pdfFiles[0]);
    } else {
        alert('Please drop a PDF file');
    }
}

// Image handling functions
function handleImageSelection(e) {
    const files = Array.from(e.target.files);
    processImageFiles(files);
}

function processImageFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        alert('Please select only image files (JPG, PNG, GIF, BMP, WebP)');
        return;
    }
    
    // Add new images to the list
    imageFiles.forEach(file => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            selectedImages.push({
                id: Date.now() + Math.random(),
                file: file,
                dataUrl: e.target.result
            });
            
            updateImagePreview();
        };
        
        reader.readAsDataURL(file);
    });
    
    // Reset file input to allow selecting the same file again
    imageInput.value = '';
}

function updateImagePreview() {
    if (selectedImages.length === 0) {
        imagePreview.classList.add('hidden');
        convertToPdfBtn.disabled = true;
        selectedImageIndex = null;
        moveUpBtn.disabled = true;
        moveDownBtn.disabled = true;
        return;
    }
    
    imagePreview.classList.remove('hidden');
    imageCount.textContent = selectedImages.length;
    convertToPdfBtn.disabled = false;
    
    // Clear current preview
    imageList.innerHTML = '';
    
    // Add images to preview
    selectedImages.forEach((image, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = `image-preview-item ${index === selectedImageIndex ? 'selected-image' : ''}`;
        imageItem.dataset.index = index;
        
        imageItem.innerHTML = `
            <img src="${image.dataUrl}" alt="Image ${index + 1}">
            <div class="image-index">${index + 1}</div>
            <div class="remove-btn" data-index="${index}">
                <i class="fas fa-times"></i>
            </div>
        `;
        
        // Add click event to select image
        imageItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-btn') && !e.target.parentElement.classList.contains('remove-btn')) {
                // Deselect if already selected
                if (selectedImageIndex === index) {
                    selectedImageIndex = null;
                    moveUpBtn.disabled = true;
                    moveDownBtn.disabled = true;
                } else {
                    selectedImageIndex = index;
                    moveUpBtn.disabled = index === 0;
                    moveDownBtn.disabled = index === selectedImages.length - 1;
                }
                updateImagePreview();
            }
        });
        
        // Add event to remove button
        const removeBtn = imageItem.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeImage(index);
        });
        
        imageList.appendChild(imageItem);
    });
    
    // Style for image index
    const style = document.createElement('style');
    style.textContent = `
        .image-preview-item .image-index {
            position: absolute;
            bottom: 8px;
            left: 8px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    
    // Adjust selected index if needed
    if (selectedImageIndex !== null) {
        if (index === selectedImageIndex) {
            selectedImageIndex = null;
        } else if (index < selectedImageIndex) {
            selectedImageIndex--;
        }
    }
    
    updateImagePreview();
}

function clearAllImages() {
    selectedImages = [];
    selectedImageIndex = null;
    updateImagePreview();
}

function moveSelectedImageUp() {
    if (selectedImageIndex === null || selectedImageIndex === 0) return;
    
    // Swap images
    const temp = selectedImages[selectedImageIndex];
    selectedImages[selectedImageIndex] = selectedImages[selectedImageIndex - 1];
    selectedImages[selectedImageIndex - 1] = temp;
    
    selectedImageIndex--;
    updateImagePreview();
}

function moveSelectedImageDown() {
    if (selectedImageIndex === null || selectedImageIndex === selectedImages.length - 1) return;
    
    // Swap images
    const temp = selectedImages[selectedImageIndex];
    selectedImages[selectedImageIndex] = selectedImages[selectedImageIndex + 1];
    selectedImages[selectedImageIndex + 1] = temp;
    
    selectedImageIndex++;
    updateImagePreview();
}

// PDF handling functions
function handlePdfSelection(e) {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
        loadPdfFile(files[0]);
    }
}

function loadPdfFile(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please select a PDF file');
        return;
    }
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
        alert('File size exceeds 50 MB limit. Please select a smaller file.');
        return;
    }
    
    selectedPdfFile = file;
    
    // Update preview
    pdfFileName.textContent = file.name;
    pdfFileSize.textContent = formatFileSize(file.size);
    pdfPreview.classList.remove('hidden');
    compressPdfBtn.disabled = false;
    
    // Reset file input to allow selecting the same file again
    pdfInput.value = '';
}

function removeSelectedPdf() {
    selectedPdfFile = null;
    pdfPreview.classList.add('hidden');
    compressPdfBtn.disabled = true;
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateCompressionEstimate() {
    const level = compressionLevel.value;
    const scale = parseFloat(scaleFactor.value);
    
    let estimate = '~';
    
    if (level === 'low') {
        estimate += '10-20%';
    } else if (level === 'medium') {
        estimate += '30-50%';
    } else {
        estimate += '50-70%';
    }
    
    if (scale < 1.0) {
        estimate += ` + ${Math.round((1 - scale) * 100)}% from scaling`;
    }
    
    estimate += ' size reduction';
    
    compressionEstimate.textContent = estimate;
}

// Image to PDF conversion
async function convertImagesToPdf() {
    if (selectedImages.length === 0) {
        alert('Please select at least one image to convert');
        return;
    }
    
    // Show progress bar
    imageConversionProgress.classList.remove('hidden');
    imageProgressBar.style.width = '0%';
    imageProgressPercent.textContent = '0%';
    convertToPdfBtn.disabled = true;
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const pageSize = document.getElementById('pageSize').value;
        const orientation = document.getElementById('pageOrientation').value;
        
        // Set document properties
        doc.setProperties({
            title: 'SwiftPDF - Converted Images',
            subject: 'Images converted to PDF',
            creator: 'SwiftPDF Tools',
            author: 'User'
        });
        
        // Process each image
        for (let i = 0; i < selectedImages.length; i++) {
            // Update progress
            const progress = Math.round((i / selectedImages.length) * 100);
            imageProgressBar.style.width = `${progress}%`;
            imageProgressPercent.textContent = `${progress}%`;
            
            const image = selectedImages[i];
            
            // Add a new page for each image (except the first)
            if (i > 0) {
                doc.addPage();
            }
            
            // Get image dimensions
            const img = new Image();
            await new Promise((resolve) => {
                img.onload = resolve;
                img.src = image.dataUrl;
            });
            
            // Calculate dimensions to fit page
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            let imgWidth = img.width;
            let imgHeight = img.height;
            
            // Scale image to fit page
            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
            imgWidth *= ratio * 0.9; // 90% of page to add margins
            imgHeight *= ratio * 0.9;
            
            // Center image on page
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;
            
            // Add image to PDF
            doc.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);
            
            // Add page number
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text(`Page ${i + 1} of ${selectedImages.length}`, pageWidth - 30, pageHeight - 10);
        }
        
        // Complete progress
        imageProgressBar.style.width = '100%';
        imageProgressPercent.textContent = '100%';
        
        // Generate PDF blob
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Show results
        showResult(
            'Image to PDF Conversion Complete',
            'converted-images.pdf',
            pdfBlob.size,
            pdfUrl,
            null
        );
        
    } catch (error) {
        console.error('Error converting images to PDF:', error);
        alert('An error occurred while converting images to PDF. Please try again.');
    } finally {
        // Hide progress bar
        setTimeout(() => {
            imageConversionProgress.classList.add('hidden');
            convertToPdfBtn.disabled = false;
        }, 1000);
    }
}

// PDF Compression
async function compressPdf() {
    if (!selectedPdfFile) {
        alert('Please select a PDF file to compress');
        return;
    }
    
    // Show progress bar
    pdfCompressionProgress.classList.remove('hidden');
    pdfProgressBar.style.width = '0%';
    pdfProgressPercent.textContent = '0%';
    compressPdfBtn.disabled = true;
    
    try {
        // Read the PDF file
        const arrayBuffer = await selectedPdfFile.arrayBuffer();
        const originalSize = selectedPdfFile.size;
        
        // Update progress
        pdfProgressBar.style.width = '30%';
        pdfProgressPercent.textContent = '30%';
        
        // Load PDF with pdf-lib
        const pdfDoc = await window.pdfLib.PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        
        // Get compression settings
        const scale = parseFloat(scaleFactor.value);
        const compressionLevelValue = compressionLevel.value;
        
        // Apply compression by scaling pages if needed
        if (scale < 1.0) {
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();
                
                // Scale down the page
                page.scale(scale, scale);
                
                // Update progress incrementally
                const progress = 30 + Math.round((i / pages.length) * 50);
                pdfProgressBar.style.width = `${progress}%`;
                pdfProgressPercent.textContent = `${progress}%`;
            }
        }
        
        // Update progress
        pdfProgressBar.style.width = '80%';
        pdfProgressPercent.textContent = '80%';
        
        // Save the PDF with compression options
        const saveOptions = {
            useObjectStreams: true,
            addDefaultPage: false,
        };
        
        // Apply different compression levels
        if (compressionLevelValue === 'high') {
            saveOptions.forceCanonical = true;
            saveOptions.objectsPerTick = 10;
        } else if (compressionLevelValue === 'medium') {
            saveOptions.objectsPerTick = 50;
        } else {
            saveOptions.objectsPerTick = 100;
        }
        
        const compressedPdfBytes = await pdfDoc.save(saveOptions);
        
        // Update progress
        pdfProgressBar.style.width = '100%';
        pdfProgressPercent.textContent = '100%';
        
        // Create blob from compressed PDF
        const compressedPdfBlob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
        const compressedPdfUrl = URL.createObjectURL(compressedPdfBlob);
        
        // Calculate size reduction
        const reduction = ((originalSize - compressedPdfBlob.size) / originalSize) * 100;
        
        // Show results
        showResult(
            'PDF Compression Complete',
            selectedPdfFile.name.replace('.pdf', '-compressed.pdf'),
            compressedPdfBlob.size,
            compressedPdfUrl,
            {
                originalSize,
                compressedSize: compressedPdfBlob.size,
                reduction
            }
        );
        
    } catch (error) {
        console.error('Error compressing PDF:', error);
        alert('An error occurred while compressing the PDF. Please try again.');
    } finally {
        // Hide progress bar
        setTimeout(() => {
            pdfCompressionProgress.classList.add('hidden');
            compressPdfBtn.disabled = false;
        }, 1000);
    }
}

// Results handling
function showResult(title, fileName, fileSize, fileUrl, compressionInfo) {
    // Update result details
    resultDescription.textContent = title;
    resultFileName.textContent = fileName;
    resultFileSize.textContent = formatFileSize(fileSize);
    
    // Show compression info if available
    if (compressionInfo) {
        compressionResult.classList.remove('hidden');
        sizeReduction.textContent = `${compressionInfo.reduction.toFixed(1)}% reduction`;
    } else {
        compressionResult.classList.add('hidden');
    }
    
    // Set download link
    downloadResultBtn.href = fileUrl;
    downloadResultBtn.download = fileName;
    
    // Show results section
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function downloadResult() {
    // The download happens automatically via the anchor tag
    // We'll just clean up the URL after a delay
    setTimeout(() => {
        const url = downloadResultBtn.href;
        if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    }, 10000);
}

function processAnotherFile() {
    // Hide results section
    resultsSection.classList.add('hidden');
    
    // Clear all selections
    clearAllImages();
    removeSelectedPdf();
    
    // Revoke any object URLs
    if (downloadResultBtn.href.startsWith('blob:')) {
        URL.revokeObjectURL(downloadResultBtn.href);
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}