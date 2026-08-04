const QRCode = require("qrcode");

const generateQR = async (barcode) => {

    return await QRCode.toDataURL(barcode);

};

module.exports = generateQR;