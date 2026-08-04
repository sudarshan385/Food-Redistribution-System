const fs = require("fs");
const csv = require("csv-parser");
const pool = require("../config/db");

// Upload CSV
const uploadCSV = (filePath, donorId) => {

    return new Promise((resolve, reject) => {

        const rows = [];

        fs.createReadStream(filePath)

            .pipe(csv())

            .on("data", (data) => {

                rows.push(data);

            })

            .on("end", async () => {

                try {

                    for (const item of rows) {

                        if (
                            !item.food_name ||
                            !item.category ||
                            !item.quantity ||
                            !item.expiry_date ||
                            !item.storage_condition
                        ) {
                            continue;
                        }

                        await pool.query(

                            `INSERT INTO food_item
                            (
                                donor_id,
                                food_name,
                                category,
                                quantity,
                                expiry_date,
                                storage_condition
                            )
                            VALUES ($1, $2, $3, $4, $5, $6)`,

                            [
                                donorId,
                                item.food_name,
                                item.category,
                                item.quantity,
                                item.expiry_date,
                                item.storage_condition
                            ]

                        );

                    }

                    // Delete uploaded CSV after processing
                    fs.unlinkSync(filePath);

                    resolve(rows.length);

                } catch (error) {

                    reject(error);

                }

            })

            .on("error", (error) => {

                reject(error);

            });

    });

};

module.exports = {
    uploadCSV
};