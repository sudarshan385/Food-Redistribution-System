const getExpiryStatus = (expiryDate) => {

    const today = new Date();

    const expiry = new Date(expiryDate);

    const diffTime = expiry - today;

    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft <= 1) {
        return "HIGH";
    } else if (daysLeft <= 3) {
        return "MODERATE";
    } else {
        return "LOW";
    }

};

module.exports = getExpiryStatus;