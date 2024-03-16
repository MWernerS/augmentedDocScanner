console.log("controller loaded");


function qrCodeFound(contents)
{
  console.log(contents);
  try {
    let detective = new Detector(qrcode.grayScaleToBitmap(qrcode.grayscale()))
    qrCoordsToPage(detective.detect());
  } catch (e)
  {
    qrCoordsToPage(null);
  }
}

function detectAndAlertCode(img)
{
  console.log("controller operating")
  qrcode.callback=qrCodeFound;
  qrcode.error = () => {qrCoordsToPage(null)}
  qrcode.decode(img);
}

function qrCoordsToPage(qr)
{
  console.log(qr);
  let qrresultElement = document.getElementById('qrresult');
  if (qr == undefined)
  {
    qrresultElement.innerHTML="";
  }
  else
  {
    let points = qr.points;
    console.log(qr.bits);
    qrresultElement.innerHTML = `QR point coordinates: (${points[0].x}, ${points[0].y}), (${points[1].x}, ${points[1].y}), (${points[2].x}, ${points[2].y})`
  }
}

function generatePdfEvent(images)
{

}

function crop(images)
{
  function cropCallback(encoded)
  {
    const params = encoded.split('?')[1].split('&');
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

    let detective = new Detector(qrcode.grayScaleToBitmap(qrcode.grayscale())).detect();
    let qrWidthInBits = detective.bits.Height+4;
    let qrPoint0, qrPoint1;
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
    let pageTopPixel = ;
    let pageLeftPixel;

    //set transform
    //set the canvas size
    //draw image with displacement
    context.drawImage(image[0], 0, 0);

    //export canvas
    let thisCroppedImage = new Image();
    thisCroppedImage.src = context.toDataURL();
    outputImages.push(thisCroppedImage);

    images = images.slice(1);
    if(images.length == 0)
      return outputImages;

    //do something with image
  }

  qrcode.callback=cropCallback;
}

function deskew(image, detective)
{



  
  context.drawImage(image);
}

function tokenize(l, separator){

  let output= [];
  for (let i=0; i<l.length;i++){

    let t = l[i].split(separator)
    output[l[0]] = l[1];
  }

  return output;
}


function generatePDF(images)
{

}

function downloadPDF(pdf)
{

}
