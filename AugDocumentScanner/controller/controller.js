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
const { PDFDocument, StandardFonts, rgb } = PDFLib

async function generatePdfEvent(images)
{
  let cropResults = crop(images);
  //let pdf = generatePDF(cropResults.croppedImages, cropResults.pageSize);
  //downloadPDF(pdf);
}

function pythagorean(ax,ay,bx,by){
  return Math.sqrt((bx-ax)**2 + (by-ay)**2)
}

function getQRData(tokenParams, canvas, context){

  if (canvas != undefined && context != undefined){
    qrcode.imagedata = context.getImageData(0,0,canvas.width, canvas.height);
  }

  let detective = new Detector(qrcode.grayScaleToBitmap(qrcode.grayscale())).detect();
    let qrWidthInBits = detective.bits.Height+4; //i think includes white margin
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

    return {
      detective, qrWidthInBits, qrPoint0y, qrPoint1y, qrPoint0x, qrPoint1x, qrWidthInPixels, qrPixelMargin, pixelsPerInch,inchesPerPixel,
      qrVertXDiff, qrVertYDiff,qrVertDiff ,qrHorXDiff, qrHorYDiff, qrHorDiff
    }
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

    //this is where we scan and get data
    let data =  getQRData(tokenParams);


    let newHeight = tokenParams['l'] * data.pixelsPerInch;
    let newWidth = tokenParams['w'] * data.pixelsPerInch;

    console.log('qrwidthinbits: '+data.qrWidthInBits)
    console.log('qrwidthinpixels: '+ data.qrWidthInPixels)
    console.log('qrpixelmargin: '+data.qrPixelMargin)
    console.log('pixelsPerInch: '+data.pixelsPerInch)



    ///detect page orientation
    let qrRotation = Math.atan(data.qrHorYDiff / data.qrHorXDiff); //in radians

    ///rotate page to 90 degrees
    let bigEnoughCanvas;
    if(newHeight > newWidth)
      bigEnoughCanvas = Math.SQRT2 * newHeight;
    else
      bigEnoughCanvas = Math.SQRT2 * newWidth;
    let [canvas90, context90] = newHiddenCanvas(bigEnoughCanvas, bigEnoughCanvas);
    context90.rotate(degreesToRadians(90) - qrRotation);
    context90.drawImage(images[0], 0, 0);
    context90.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to prevent skewing of subsequent drawings


    ///detect both skews
   let imaginaryDot = getImaginaryDot([data.detective.points[0].x, data.detective.points[0].y],
    [data.detective.points[1].x,data.detective.points[1].y],
    [data.detective.points[2].x,data.detective.points[2].y],
    [data.detective.points[3].x, data.detective.points[3].y],
  data.qrWidthInBits);


   let rightLine = pythagorean(data.detective.points[2].x,data.detective.points[2].y,imaginaryDot.x, imaginaryDot.y);
   let leftLine = pythagorean(data.detective.points[0].x,data.detective.points[0].y,data.detective.points[1].x, data.detective.points[1].y);
   let rightOverLeft = rightLine / leftLine;

   let topLine = pythagorean(data.detective.points[1].x,data.detective.points[1].y,data.detective.points[2].x, data.detective.points[2].y);
   let bottomLine = pythagorean(data.detective.points[0].x,data.detective.points[0].y,imaginaryDot.x,imaginaryDot.y);
   let topOverBottom = topLine / bottomLine;

    ///fix vertical keystone
    let firstUnskewed90Canvas = trapezoid(canvas, rightOverLeft, 1);
    
    ///rotate page to 0 degrees
    context90.clearRect(0, 0, canvas90.width, canvas90.height); // Clear canvas
    context90.translate(canvas90.width / 2, canvas90.height / 2);
    context90.rotate(-Math.PI / 2);
    context90.drawImage(firstUnskewed90Canvas, -firstUnskewed90Canvas.width / 2, -firstUnskewed90Canvas.height / 2);


    ///fix new vertical keystone
    let secondUnskewed0Canvas = trapezoid(canvas90, topOverBottom, 1);

    ///re-scan qr code for qr placement cropping
    let secondData = getQRData(tokenParams, canvas90, context90);
    
    ///crop
    let [finalCanvas, finalContext] = newHiddenCanvas(tokenParams['l']*secondData.pixelsPerInch, tokenParams['w']*secondData.pixelsPerInch);
    
    

    ///place
    let pageTopPixel = (tokenParams['l']*secondData.pixelsPerInch - tokenParams['qy']*secondData.pixelsPerInch - secondData.qrPixelMargin) - secondData.detective.points[0].y;
    let pageLeftPixel = (tokenParams['qx']*secondData.pixelsPerInch + secondData.qrPixelMargin) - secondData.detective.points[0].x ;
    console.log('pageTopPixel '+pageTopPixel);
    console.log('pageleftpixel '+ pageLeftPixel);

    finalContext.drawImage(secondUnskewed0Canvas,pageLeftPixel, pageTopPixel);

    //export canvas
    let thisCroppedImage = new Image();
    let imgDataUrl = finalCanvas.toDataURL("image/png");
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

function kill(element) {element.remove()};

function tokenize(l, separator){

  let output= {};
  for (let i=0; i<l.length;i++){

    let t = l[i].split(separator)
    output[t[0]] = t[1];
  }

  return output;
}

function newHiddenCanvas(length, width)
{
  if (length == undefined)
    length=0;
  if(width == undefined)
    width=0;

  let canvas = document.createElement('canvas');
  canvas.hidden = true;
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
	return trapezoidedCanvas;
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

  downloadPDF(pdfDoc);
  return pdfDoc;
}

async function downloadPDF(pdfDoc) {
  //PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save()
  // Trigger the browser to download the PDF document
  download(pdfBytes, "docScan.pdf", "application/pdf");
}
