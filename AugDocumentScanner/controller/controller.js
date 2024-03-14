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
  let remaining = [images.length];

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

    let detective = new Detector(qrcode.grayScaleToBitmap(qrcode.grayscale()));
    let qrWidthInBits = detective.bits.Height+4;
    let qrPoint0, qrPoint1;
    let qrWidthInPixels = ((qrPoint1 - qrPoint0)/(qrWidthInBits-10)*(qrWidthInBits));
    let pixelsPerInch = qrWidthInPixels/tokenParams["qw"];
    let inchesPerPixel = tokenParams["qw"]/qrWidthInPixels;
    
  }

  qrcode.callback=cropCallback;
  for(let i=0; i<images.length;i++){

  }

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
