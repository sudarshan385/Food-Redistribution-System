import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ScanQR() {

    const navigate = useNavigate();

    const [barcode, setBarcode] = useState("");

    useEffect(() => {

        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true
            },
            false
        );

        const onScanSuccess = async (decodedText) => {

            console.log("Scanned QR Value:", decodedText);

            alert("Scanned QR: " + decodedText);

            try {

                await scanner.clear();

                const response = await api.get(
                    `/inventory/barcode/${decodedText.trim()}`
                );

                console.log(response.data);

                navigate(`/food/${response.data.food.food_id}`);

            } catch (error) {

                console.log(error.response?.data);

                alert("Food Not Found");

            }

        };
        scanner.render(onScanSuccess);

        return () => {

            scanner.clear().catch(() => {});

        };

    }, [navigate]);

    const searchBarcode = async () => {

        if (!barcode.trim()) {

            alert("Please Enter Barcode");

            return;

        }

        try {

            const response = await api.get(
                `/inventory/barcode/${barcode.trim()}`
            );

            navigate(`/food/${response.data.food.food_id}`);

        } catch (error) {

            console.error(error);

            alert("Food Not Found");

        }

    };

    return (

        <div className="container mt-4">

            <h2 className="mb-4 text-center">
                Scan Food QR Code
            </h2>

            <div
                id="reader"
                style={{
                    width: "350px",
                    margin: "auto"
                }}
            ></div>

            <div className="mt-4">

                <h5 className="text-center">
                    OR Search Using Barcode
                </h5>

                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                />

                <button
                    className="btn btn-primary w-100 mt-3"
                    onClick={searchBarcode}
                >
                    Search
                </button>

            </div>

        </div>

    );

}

export default ScanQR;