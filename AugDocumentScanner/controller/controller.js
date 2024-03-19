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
    console.log(qr.bits);
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

async function crop(images)
{
  let isDone = [false];
  let outputImages = [];
  let pageSize = {};
  function cropCallback(encoded)
  {
    let params=[];
    if(encoded.includes("?"))
      params = encoded.split('?')[1].split('&');

    let tokenParams = tokenize(params, "=");
    if(tokenParams["w"] == undefined){
      tokenParams["w"] = 8.5;
    }
    if(tokenParams["l"] == undefined){
      tokenParams["l"] = 11;
    }
    if(tokenParams["qw"] == undefined){
      tokenParams["qw"] = 1;
    }
    if(tokenParams["qx"] == undefined){
      tokenParams["qx"] = 7;
    }
    if(tokenParams["qy"] == undefined){
      tokenParams["qy"] = .5;
    }
    pageSize.width = tokenParams['w'];
    pageSize.height = tokenParams['l'];

    let detective = new Detector(qrcode.grayScaleToBitmap(qrcode.grayscale())).detect();
    let qrWidthInBits = detective.bits.Height+4;
    let qrPoint0 = detective.points[0].x;
    let qrPoint1 = detective.points[1].x;
    let qrPixelMargin = (qrPoint1 - qrPoint0) / 2;
    let qrWidthInPixels = ((qrPoint1 - qrPoint0)/(qrWidthInBits-10)*(qrWidthInBits));
    let pixelsPerInch = qrWidthInPixels/tokenParams["qw"];
    let inchesPerPixel = tokenParams["qw"]/qrWidthInPixels;
    let qrVertXDiff = detective.points[1].x - detective.points[0].x;
    let qrVertYDiff = detective.points[1].y - detective.points[0].y;
    let qrHorXDiff = detective.points[2].x - detective.points[1].x;
    let qrHorYDiff = detective.points[2].y - detective.points[1].y;


    let canvas = document.createElement('canvas');
    canvas.hidden = true;
    let context = canvas.getContext('2d');


    //calculate scaling
    let scaleForY = 1;
    let scaleForX = qrVertYDiff / qrHorXDiff;
    

    //calculate skew
    let horizontalSkew = 0;
    if(qrHorYDiff != 0)
      horizontalSkew = qrHorXDiff / qrHorYDiff;

    let verticalSkew = 0;
    if(qrVertXDiff != 0)
      verticalSkew = qrVertYDiff / qrVertXDiff;


    //cropped image size (height, width)
    let newHeight = tokenParams['l'] * pixelsPerInch;
    let newWidth = tokenParams['w'] * pixelsPerInch;

    //cropped image displacement 
    let pageTopPixel = detective.points[0].y - (tokenParams['l'] - tokenParams['qy'] - qrPixelMargin);
    let pageLeftPixel = detective.points[0].x - (tokenParams['w'] - tokenParams['qx'] - qrPixelMargin);

    //set transform
    context.setTransform(scaleForX, horizontalSkew, verticalSkew, scaleForY, pageLeftPixel, pageTopPixel);

    //set the canvas size
    canvas.width = tokenParams['w'] * pixelsPerInch;
    canvas.height = tokenParams['l'] * pixelsPerInch;

    //draw image with displacement
    context.drawImage(image[0], 0, 0);

    //export canvas
    let thisCroppedImage = new Image();
    thisCroppedImage.src = context.toDataURL();
    outputImages.push(thisCroppedImage);

    images = images.slice(1);
    if(images.length == 0)
      isDone[0] = true;
    else
      qrcode.decode(images[0]);
    //do something with image
  }

  qrcode.callback=cropCallback;
  qrcode.decode(images[0]);

  while(isDone[0] == false)
    await sleep(100);
  return {'outputImages' : outputImages, 
          'pageSize' : pageSize};
}
const sleep = ms => new Promise(r => setTimeout(r, ms));


function tokenize(l, separator){

  let output= [];
  for (let i=0; i<l.length;i++){

    let t = l[i].split(separator)
    output[l[0]] = l[1];
  }

  return output;
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
