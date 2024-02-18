console.log("controller loaded");


function qrCodeFound(contents)
{
  console.log(contents);
  let detective = new Detector(qrcode.grayScaleToBitmap(qrcode.grayscale()))
  console.log(detective.detect());
}

function detectAndAlertCode(img)
{
  console.log("controller operating")
  let printer = function (s) {console.log(s)};
  qrcode.callback=qrCodeFound;
  qrcode.decode(img);
}
