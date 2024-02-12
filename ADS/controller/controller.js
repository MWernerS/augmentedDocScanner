console.log("controller loaded");

function detectAndAlertCode(img)
{
    let printer = function (s) {console.log(s)};
    qrcode.callback=qrCodeFound;
    qrcode.decode(img);
}

function qrCodeFound(contents)
{
  console.log(contents);
  let detective = new Detector(qrcode.grayScaleToBitmap(qrcode.grayscale()))
  console.log(detective.detect());
}
