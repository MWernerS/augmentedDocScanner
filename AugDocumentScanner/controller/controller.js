//import { PDFDocument } from 'pdf-lib'
console.log("controller loaded");

//imports

//<script src="https://unpkg.com/pdf-lib@1.4.0"></script>


function qrCodeFound(contents) {
  console.log(contents);
  try {
    let detective = new Detector(qrcode.grayScaleToBitmap(qrcode.grayscale()))
    qrCoordsToPage(detective.detect());
  } catch (e) {
    qrCoordsToPage(null);
  }
}

function detectAndAlertCode(img) {
  console.log("controller operating")
  qrcode.callback = qrCodeFound;
  qrcode.error = () => { qrCoordsToPage(null) }
  qrcode.decode(img);
}

function qrCoordsToPage(qr) {
  console.log(qr);
  let qrresultElement = document.getElementById('qrresult');
  if (qr == undefined) {
    qrresultElement.innerHTML = "";
  }
  else {
    let points = qr.points;
    qrresultElement.innerHTML = `QR point coordinates: (${points[0].x}, ${points[0].y}), (${points[1].x}, ${points[1].y}), (${points[2].x}, ${points[2].y})`
  }
}
const { PDFDocument, StandardFonts, rgb } = PDFLib
function generatePdfEvent(images) {
  //crop(images);

  generatePDF(images);


}

function crop(images) {

}

async function generatePDF(images, pageSize) {
  let imageBytes = []; //this is a list
  for(let i=0; i < images.length; i++)
    imageBytes.push(images[i].src);

  //pageSize.length (inches)
  //pageSize.width (inches)

  //create new .pdf document
  const pdfDoc = await PDFDocument.create()

  //array of pages
  const pages = [];
  const { width, height } = ( 0, 0);
  var imgDims;

  for (let i = 0; i < imageBytes.length; i++) {
    // Add a blank page to the document
    pages[i] = pdfDoc.addPage()

    // Get the width and height of the page1
    let { width, height } = pages[i].getSize()

    console.log(imageBytes[i]);
    imageBytes[i] = await pdfDoc.embedPng(imageBytes[i])
    //images to imageBytes
    //imgDims = imageBytes[i].scale(1)
    imgDims = imageBytes[i].scale(1)
    //add first image of images[] to .pdf
    pages[i].drawImage(imageBytes[i], {
      x: 0,
      y: 0,
      width: pages[i].getWidth(),
      height: pages[i].getHeight(),
    })
  }
  //const pngImageBytes = "data:image/png;base64,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"
  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save()
  downloadPDF(pdfBytes, "docScan.pdf", "application/pdf")
}

function downloadPDF(pdfBytes, pdfName, fileLoc) {
   // Trigger the browser to download the PDF document
   download(pdfBytes, pdfName, fileLoc);
}
