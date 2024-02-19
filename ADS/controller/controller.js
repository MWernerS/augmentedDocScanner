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
    qrresultElement.innerHTML = `QR point coordinates: (${points[0].x}, ${points[0].y}), (${points[1].x}, ${points[1].y}), (${points[2].x}, ${points[2].y})`
  }
}
