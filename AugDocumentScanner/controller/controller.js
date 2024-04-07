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
  let qrresultElement = document.getElementById('qrresult');
  if (qr == undefined) {
    qrresultElement.innerHTML = "";
  }
  else {
    let points = qr.points;    qrresultElement.innerHTML = `QR point coordinates: (${points[0].x}, ${points[0].y}), (${points[1].x}, ${points[1].y}), (${points[2].x}, ${points[2].y})`
  }
}
const { PDFDocument, StandardFonts, rgb } = PDFLib //important for the PDFLib

async function generatePdfEvent(images)
{
  let cropResults = crop(images);
  //let pdf = generatePDF(cropResults.croppedImages, cropResults.pageSize);
  //downloadPDF(pdf);
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

    console.log("params: " +params)
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
    let qrPoint0y = detective.points[0].y;
    let qrPoint1y = detective.points[1].y;
    let qrPoint0x = detective.points[0].x;
    let qrPoint1x = detective.points[1].x;
    let qrWidthInPixels = Math.sqrt(Math.abs(qrPoint1y - qrPoint0y)**2 + Math.abs(qrPoint1x - qrPoint0x)**2)/(qrWidthInBits-11)*(qrWidthInBits);
    let qrPixelMargin = 5.5/qrWidthInBits * qrWidthInPixels;
    let pixelsPerInch = qrWidthInPixels/tokenParams["qw"];
    let inchesPerPixel = tokenParams["qw"]/qrWidthInPixels;
    let qrVertXDiff = detective.points[1].x - detective.points[0].x;
    let qrVertYDiff = detective.points[1].y - detective.points[0].y;
    let qrVertDiff = Math.sqrt(qrVertXDiff**2 + qrVertYDiff**2);
    let qrHorXDiff = detective.points[2].x - detective.points[1].x;
    let qrHorYDiff = detective.points[2].y - detective.points[1].y;
    let qrHorDiff = Math.sqrt(qrHorXDiff**2 + qrHorYDiff**2);


    let canvas = document.createElement('canvas');
    canvas.hidden = true;
    canvas.height = tokenParams['l'] * pixelsPerInch;
    canvas.width = tokenParams['w'] * pixelsPerInch;
    let context = canvas.getContext('2d');

    console.log('qrwidthinbits: '+qrWidthInBits)
    console.log('qrwidthinpixels: '+ qrWidthInPixels)
    console.log('qrpixelmargin: '+qrPixelMargin)
    console.log('pixelsPerInch: '+pixelsPerInch)

    //calculate scaling
    let scaleForY = 1;
    let scaleForX = qrVertDiff / qrHorDiff;
    console.log('scaleforx: '+scaleForX)

    
    //calculate skew
    let horizontalSkew = 0;
    if(qrHorYDiff != 0)
      //horizontalSkew = qrHorXDiff / qrHorYDiff;
      horizontalSkew = -1 * qrHorYDiff / qrHorXDiff;
    console.log('horizontalskew: '+horizontalSkew)

    let verticalSkew = 0;
    if(qrVertXDiff != 0)
      //verticalSkew = qrVertYDiff / qrVertXDiff;
      verticalSkew = -1 * qrVertXDiff / qrVertYDiff;
    console.log('verticalskew: '+verticalSkew)
    

    //cropped image size (height, width)
    let newHeight = tokenParams['l'] * pixelsPerInch;
    let newWidth = tokenParams['w'] * pixelsPerInch;
    console.log(`newheight formula: ${tokenParams['l']} * ${pixelsPerInch}`)
    console.log(`newwidth formula: ${tokenParams['w']} * ${pixelsPerInch}`)
    console.log('newheight: '+newHeight)
    console.log('newwidth: '+newWidth)

    //cropped image displacement     console.log('encoded: '+encoded)
    let pageTopPixel = (tokenParams['l']*pixelsPerInch - tokenParams['qy']*pixelsPerInch - qrPixelMargin) - detective.points[0].y;
    let pageLeftPixel = (tokenParams['qx']*pixelsPerInch + qrPixelMargin) - detective.points[0].x ;
    console.log('pageTopPixel '+pageTopPixel)
    console.log('pageleftpixel '+ pageLeftPixel)

    //set the canvas size
    canvas.width = tokenParams['w'] * pixelsPerInch;
    canvas.height = tokenParams['l'] * pixelsPerInch;

    //set transform
    context.setTransform(scaleForX, horizontalSkew, verticalSkew, scaleForY, pageLeftPixel, pageTopPixel);
    //context.setTransform(scaleForX, 0, 0, scaleForY, pageLeftPixel, pageTopPixel);

    //draw image with displacement
    context.drawImage(images[0], 0, 0);

    //export canvas
    let thisCroppedImage = new Image();
    let imgDataUrl = canvas.toDataURL("image/png");
    thisCroppedImage.src = imgDataUrl;
    outputImages.push(thisCroppedImage);

    images = images.slice(1);
    if(images.length > 0)
      qrcode.decode(images[0]);
    else
    {
      generatePDF(outputImages, pageSize);
    }
    //do something with image
  }

  qrcode.callback=cropCallback;
  qrcode.decode(images[0].src);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));


function tokenize(l, separator){

  let output= {};
  for (let i=0; i<l.length;i++){

    let t = l[i].split(separator)
    output[t[0]] = t[1];
  }

  return output;
}


async function generatePDF(images, pageSize) {
  console.log(images)
  let imageBytes = []; //list of images in byte form
  for(let i=0; i < images.length; i++)
    imageBytes.push(images[i].src);

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

  downloadPDF(pdfDoc, "scan");
  return pdfDoc;
}

let pngImageBytes = "";

async function createTemplate(pageWidth, pageHeight, qrX, qrY, qrS) {
  // Create a new PDFDocument
  const pdfDoc = await PDFDocument.create()

  // Add a blank page to the document
  const page = pdfDoc.addPage()

  page.setSize(pageWidth, pageHeight)

  //qr image
  await spawnQR(pageWidth/72, pageHeight/72, qrX/72, qrY/72, qrS/72);
  //console.log(pngImageBytes);
  const pngImage = await pdfDoc.embedPng(pngImageBytes)

  //correct
  page.drawImage(pngImage, {
    x: qrX-72,
    y: pageHeight-qrY,
    width: qrS,
    height: qrS,
  })

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save()

  downloadPDF(pdfDoc, "template");
}

async function spawnQR(pageWidth, pageHeight, qrX, qrY, qrS) {
  return new Promise((resolve, reject) => {
    //generate website URL
    var qrCodeImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=" +
      "https://user.fm/augdocscan.beastman.fastmail.com/view/home.html?" + // website
      "w=" + pageWidth +
      "&l=" + pageHeight +
      "&qw=" + qrS +
      "&qx=" + qrX +
      "&qy=" + qrY;
    //console.log(qrCodeImageUrl);

    //getch QR code image
    fetch(qrCodeImageUrl)
      .then(response => response.blob())
      .then(blob => {
        // Read blob as ArrayBuffer
        const reader = new FileReader();
        reader.readAsArrayBuffer(blob);

        // Handle when FileReader finishes loading
        reader.onloadend = () => {
          const arrayBuffer = reader.result;
          const bytes = new Uint8Array(arrayBuffer);
          const base64Data = btoa(String.fromCharCode(...bytes));
          pngImageBytes = base64Data;
          //console.log(pngImageBytes);
          resolve(); // Resolve the promise when image processing is complete
        };
      })
      .catch(error => {
        console.error("Error fetching QR code image:", error);
        reject(error); // Reject the promise if there's an error
      });
  });
}

async function downloadPDF(pdfDoc, pdfName) {
  //PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save()
  // Trigger the browser to download the PDF document
  download(pdfBytes, pdfName+".pdf", "application/pdf");
}
