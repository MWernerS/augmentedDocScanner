//import { PDFDocument } from 'pdf-lib'
console.log("controller loaded");

//imports
//import { PageSizes } from 'pdf-lib'

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
function generatePdfEvent(images)
{
  let cropResults = crop(images);
  let pdf = generatePDF(cropResults.croppedImages, cropResults.pageSize);
  downloadPDF(pdf);
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
  var pages = [];
  //var {width, height} = (0, 0);
  var imgDims;

  for (let i = 0; i < imageBytes.length; i++) {
    // Add a blank page to the document
    
    pages[i] = pdfDoc.addPage([pageSize.width*72, pageSize.height*72])

    // Get the width and height of the page
    //let {width, height} = pages[i].getSize()

    console.log(pages[i].getWidth());
    console.log(pages[i].getHeight());
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

  //downloadPDF(pdfDoc);
  return pdfDoc;
}

async function downloadPDF(pdfDoc) {
  //PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save()
  // Trigger the browser to download the PDF document
  download(pdfBytes, "docScan.pdf", "application/pdf");
}
