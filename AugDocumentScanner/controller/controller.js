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
    qrresultElement.innerHTML = "<span style='color: red;'>Error detecting QR code, please insert an image with a valid QR code.</span>";
  }
  else {
    let points = qr.points; 
    qrresultElement.innerHTML = `QR point coordinates: (${points[0].x}, ${points[0].y}), (${points[1].x}, ${points[1].y}), (${points[2].x}, ${points[2].y})`
  }
}
const { PDFDocument, StandardFonts, rgb } = PDFLib //important for the PDFLib

async function generatePdfEvent(images)
{
  let cropResults = crop(images);
  //let pdf = generatePDF(cropResults.croppedImages, cropResults.pageSize);
  //downloadPDF(pdf);
}

function pythagorean()
{
  let sum = 0;
  for (let i=0; i < arguments.length; i++)
    sum+=arguments[i]**2;
  return Math.sqrt(sum);
}

async function getQRData(tokenParams, canvas, context){

  if (canvas != undefined && context != undefined){
    console.log("changing detector source");
    let promise = new Promise((resolve) => {
      qrcode.callback = resolve;
      qrcode.decode(canvas.toDataURL("image/png"));
    })
    let before=Date.now();
    console.log(`Promise result ${await promise}`);
    console.log(`Waited ${Date.now() - before} millis for detection`)
  }

  let detective = new Detector(qrcode.grayScaleToBitmap(qrcode.grayscale())).detect();
  let qrWidthInBits = detective.bits.Height+4; //i think includes white margin
  let qrPoint0y = detective.points[0].y;
  let qrPoint1y = detective.points[1].y;
  let qrPoint0x = detective.points[0].x;
  let qrPoint1x = detective.points[1].x;

  let qrWidthInPixels = pythagorean(qrPoint1y - qrPoint0y, qrPoint1x - qrPoint0x)/(qrWidthInBits-11)*(qrWidthInBits);
  let qrPixelMargin = 5.5/qrWidthInBits * qrWidthInPixels;
  let pixelsPerInch = qrWidthInPixels/tokenParams["qw"];
  let inchesPerPixel = tokenParams["qw"]/qrWidthInPixels;
  let qrVertXDiff = detective.points[1].x - detective.points[0].x;
  let qrVertYDiff = detective.points[1].y - detective.points[0].y;
  let qrVertDiff = pythagorean(qrVertXDiff, qrVertYDiff);
  let qrHorXDiff = detective.points[2].x - detective.points[1].x;
  let qrHorYDiff = detective.points[2].y - detective.points[1].y;
  let qrHorDiff = pythagorean(qrHorXDiff, qrHorYDiff);

  let newHeight = tokenParams['l'] * pixelsPerInch;
  let newWidth = tokenParams['w'] * pixelsPerInch;

  ///detect page orientation
  let qrRotation = Math.atan(qrHorYDiff / qrHorXDiff); //in radians
  if(qrVertYDiff > 0)
    qrRotation=Math.PI/2 - qrRotation;
    
    ///detect both skews
  let imaginaryDot = getImaginaryDot([detective.points[0].x, detective.points[0].y],
    [detective.points[1].x,detective.points[1].y],
    [detective.points[2].x,detective.points[2].y],
    [detective.points[3].x, detective.points[3].y],
    qrWidthInBits);
    console.log(`Imaginary coordinages: (${imaginaryDot.x}, ${imaginaryDot.y})`)


  let rightLineLength = pythagorean((detective.points[2].x - imaginaryDot.x), (detective.points[2].y- imaginaryDot.y));
  let leftLineLength = pythagorean((detective.points[0].x - detective.points[1].x), (detective.points[0].y - detective.points[1].y));
  let leftToRightLengthRatio = (leftLineLength / rightLineLength) ** (tokenParams['w'] / tokenParams['qw']);
  console.log(`leftLine / rightLine -> ${leftLineLength} / ${rightLineLength} = ${leftToRightLengthRatio}`);

  let topLineLength = pythagorean((detective.points[1].x - detective.points[2].x), (detective.points[1].y - detective.points[2].y));
  let bottomLineLength = pythagorean((detective.points[0].x - imaginaryDot.x), (detective.points[0].y - imaginaryDot.y));
  let topToBottomLengthRatio = (topLineLength / bottomLineLength) ** (tokenParams['l']/tokenParams['qw']);
  console.log(`topLine / bottomLine -> ${topLineLength} / ${bottomLineLength} = ${topToBottomLengthRatio}`);

  console.log(`(${qrPoint0x}, ${qrPoint0y}), (${qrPoint1x}, ${qrPoint1y})`);

  return {
    detective, qrWidthInBits, qrPoint0y, qrPoint1y, qrPoint0x, qrPoint1x, qrWidthInPixels, qrPixelMargin, pixelsPerInch,inchesPerPixel,
    qrVertXDiff, qrVertYDiff,qrVertDiff ,qrHorXDiff, qrHorYDiff, qrHorDiff, qrRotation, imaginaryDot, rightLineLength, leftLineLength, leftToRightLengthRatio,
    topLineLength, bottomLineLength, topToBottomLengthRatio, newHeight, newWidth
  }
}

async function crop(images)
{
  let outputImages = [];
  let pageSize = {};
  async function cropCallback(encoded)
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

    //this is where we scan and get data
    let data = await getQRData(tokenParams);

    console.log('qrwidthinbits: '+data.qrWidthInBits)
    console.log('qrwidthinpixels: '+ data.qrWidthInPixels)
    console.log('qrpixelmargin: '+data.qrPixelMargin)
    console.log('pixelsPerInch: '+data.pixelsPerInch)

    let [beginningCanvas, beginningContext] = newHiddenCanvas(images[0].naturalWidth, images[0].naturalHeight);
    beginningContext.drawImage(images[0], 0, 0);
    beginningCanvas = colorCorrect(beginningCanvas);
    let tries=1;

    do {
    ///rotate page to 90 degrees
    let [canvas90, context90] = newHiddenCanvas(beginningCanvas.height, beginningCanvas.width);
    context90.rotate(degreesToRadians(90) - data.qrRotation);
    console.log("qr rotation: "+radiansToDegrees(data.qrRotation));
    context90.translate(0, -1*canvas90.width * Math.sin(degreesToRadians(90)-data.qrRotation));
    context90.drawImage(beginningCanvas, 0, 0);


    ///fix vertical keystone
    let unskewed90Canvas = trapezoid(canvas90, 1, data.leftToRightLengthRatio)[0];
    //let unskewed90Canvas = canvas90;
    
    ///rotate page to 0 degrees
    let [canvas0, context0] = newHiddenCanvas(canvas90.height, canvas90.width);
    context0.rotate(degreesToRadians(-90))
    context0.translate(-1*canvas0.height, 0);
    context0.drawImage(unskewed90Canvas, 0, 0)

    ///fix new vertical keystone
    let [unskewed0Canvas, unskewed0Context] = trapezoid(canvas0, 1, data.topToBottomLengthRatio);
    //let [unskewed0Canvas, unskewed0Context] = [canvas0, context0];

    
    ///re-scan for stretching
    data = await getQRData(tokenParams, unskewed0Canvas, unskewed0Context);

    var [stretchedCanvas, stretchedContext] = newHiddenCanvas(unskewed0Canvas.width, unskewed0Canvas.height * data.qrHorDiff/data.qrVertDiff)
    console.log(`qrVertXDiff: `+data.qrVertXDiff);
    console.log(`qrVertYDiff: `+data.qrVertYDiff);
    console.log(`data.qrHorDiff/data.qrVertDiff -> ${data.qrHorDiff}/${data.qrVertDiff} = ${data.qrHorDiff/data.qrVertDiff}`);
    stretchedContext.drawImage(unskewed0Canvas, 0, 0, stretchedCanvas.width, stretchedCanvas.height);
    beginningCanvas = stretchedCanvas;
    beginningContext = stretchedContext;

    data = await getQRData(tokenParams, stretchedCanvas, stretchedContext);


    } while (.99 < data.topToBottomLengthRatio
            && data.topToBottomLengthRatio < 1.01
            && .99 < data.leftToRightLengthRatio
            && data.leftToRightLengthRatio < 1.01
            && data.qrHorDiff==data.qrVertDiff
            && --tries > 0);

    let secondData = data;
    ///crop
    let [finalCanvas, finalContext] = newHiddenCanvas(secondData.newWidth, secondData.newHeight);

    ///place
    let pageTopPixel = (tokenParams['l']*secondData.pixelsPerInch - tokenParams['qy']*secondData.pixelsPerInch - secondData.qrPixelMargin) - secondData.detective.points[0].y;
    let pageLeftPixel = (tokenParams['qx']*secondData.pixelsPerInch + secondData.qrPixelMargin) - secondData.detective.points[0].x ;
    console.log('pageTopPixel '+pageTopPixel);
    console.log('pageleftpixel '+ pageLeftPixel);

    finalContext.drawImage(stretchedCanvas, pageLeftPixel, pageTopPixel);
    

    //export canvas
    let thisCroppedImage = new Image();
    let imgDataUrl = finalCanvas.toDataURL("image/png");
    //console.log(`height: ${secondUnskewed0Canvas.height}, width: ${secondUnskewed0Canvas.width}`)
    //let imgDataUrl = secondUnskewed0Canvas.toDataURL("image/png");
    thisCroppedImage.src = imgDataUrl;
    outputImages.push(thisCroppedImage);

    images = images.slice(1);
    if(images.length > 0)
    {
      qrcode.callback = cropCallback;
      qrcode.decode(images[0]);
    }
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

function destroy(element) {element.remove()};

function tokenize(l, separator){

  let output= {};
  for (let i=0; i<l.length;i++){

    let t = l[i].split(separator)
    output[t[0]] = t[1];
  }

  return output;
}

function newHiddenCanvas(width, length)
{
  if (length == undefined)
    length=0;
  if(width == undefined)
    width=0;

  let canvas = document.createElement('canvas');
  canvas.hidden = true;
  //document.body.appendChild(canvas);
  canvas.height = length;
  canvas.width = width;
  let context = canvas.getContext('2d');

  return [canvas, context]
}

function trapezoid(canvas, newTopPercent, newBottomPercent) { ///source image, percent at top, percent at bottom
	const {width, height} = canvas;
	const [trapezoidedCanvas, ctx] = newHiddenCanvas(width, height);
	for (let y = 0; y < height; y++) {
		const percentYOfHeight = y / height;
		const percentWidth = ((1 - percentYOfHeight) * newTopPercent + percentYOfHeight * newBottomPercent);
		const widthHere = width * percentWidth;
		const leftXHere = (width / 2) - (widthHere / 2);
    let sourceX = 0;
    let sourceHeight = 1;
    let destinationHeight = 1;
		ctx.drawImage(canvas, sourceX, y, width, sourceHeight, leftXHere, y, widthHere, destinationHeight);
	}
	return [trapezoidedCanvas, ctx];
}

function degreesToRadians(d)
{
  return d * Math.PI / 180;
}
function radiansToDegrees(r)
{
  return r*180/Math.PI;
}

function getImaginaryDot([ax, ay], [bx, by], [cx, cy], [dx, dy], qrWidthInBits)
{
  function getRuntDotCoordsBits(qrWidthInBits) //will need to subtract 3 from this for compatibility with library 
  {
    let qrModules = qrWidthInBits - 4;
    return qrModules - 25 + 18;
  }


  let lengthOfRuntLine = Math.sqrt((dx - bx)**2 + (dy - by)**2);

  let lengthOfRuntLineBits = getRuntDotCoordsBits(qrWidthInBits) - 3;
  let expansionCoefficient = (lengthOfRuntLineBits+3)/lengthOfRuntLineBits;

  let lengthOfImaginaryLine = expansionCoefficient * lengthOfRuntLine;

  let ix = ((dx - bx) * expansionCoefficient) + bx;
  let iy = ((dy - by) * expansionCoefficient) + by;

  return {x:ix, y:iy};
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

  previewPDF(pdfDoc);
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
    x: qrX,
    y: qrY,
    width: qrS,
    height: qrS,
  })

  downloadPDF(pdfDoc, "template");
}

async function spawnQR(pageWidth, pageHeight, qrX, qrY, qrS) {
  return new Promise((resolve, reject) => {
    //generate website URL
    var qrCodeAPI = "https://quickchart.io/qr?text=";
    let encoded = "https://tiny.emich.edu/augdocscan?" + // website
      "w=" + pageWidth +
      "&l=" + pageHeight +
      "&qw=" + qrS +
      "&qx=" + qrX +
      "&qy=" + qrY;
    console.log(qrCodeAPI+encoded);
    encoded = encodeURIComponent(encoded);

    //getch QR code image
    fetch(qrCodeAPI+encoded)
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

async function previewPDF(pdfDoc) {
  const pdfBytes = await pdfDoc.save()
  //pdfBytes is placed into a blob which can create a URL to be opened into a new tab
  let blb = new Blob([pdfBytes], {type: 'application/pdf'});
  let link = window.URL.createObjectURL(blb);
  window.open(link);
}

async function downloadPDF(pdfDoc, pdfName) {
  //PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save()
  
  // Trigger the browser to download the PDF document
  download(pdfBytes, pdfName+".pdf", "application/pdf");
}

function colorCorrect(canvas){
    var context = canvas.getContext('2d');

    let [outputCanvas, outputContext] = newHiddenCanvas(canvas.width, canvas.height);

    // Get the CanvasPixelArray from the given coordinates and dimensions.
    var imgd = context.getImageData(0, 0, canvas.width, canvas.height);
    var pix = imgd.data;
    var black = 255;
    var white = 0;
    var OWR, OWG, OWB, OBR, OBG, OBB;
    for (var i = 0, n = pix.length; i < n; i += 4) {
        var color = pix[i] + pix[i+1] + pix[i+2];
        if(color > white){
            white = color;
            OWR = pix[i];
            OWG = pix[i + 1];
            OWB = pix[i + 2];
        }
        if(color < black){
            black = color;
            OBR = pix[i];
            OBG = pix[i + 1];
            OBB = pix[i + 2];
        }
    }
    // Loop over each pixel and invert the color.
    for (var i = 0, n = pix.length; i < n; i += 4) {
        pix[i] = (pix[i] - OBR) * (255/(OWR - OBR));
        pix[i + 1] = (pix[i + 1] - OBG) * (255/(OWG - OBG));
        pix[i + 2] = (pix[i + 2] - OBB) * (255/(OWB - OBB));
        // i+3 is alpha (the fourth element)
    }

    // Draw the ImageData at the given (x,y) coordinates.
    outputContext.putImageData(imgd, 0, 0, 0, 0, canvas.width, canvas.height);
    return outputCanvas;
}
