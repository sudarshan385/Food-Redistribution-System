const { v4: uuidv4 } = require("uuid");

const generateBarcode = () => {
    return "FD-" + uuidv4().substring(0, 8).toUpperCase();
};

module.exports = generateBarcode;