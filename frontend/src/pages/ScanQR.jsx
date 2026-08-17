import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FiCamera, FiArrowLeft, FiSearch } from "react-icons/fi";
// Assume a QR scanner component or library would be used here.
// Keeping the structural layout identical to original logic but with modern skin.

function ScanQR() {
    const navigate = useNavigate();
    const [scannedData, setScannedData] = useState(null);

    const handleSimulatedScan = () => {
        // This simulates a scan for demo purposes since the original just had a placeholder layout
        const fakeData = {
            id: "12345",
            name: "Organic Apples",
            category: "Fruits",
            quantity: 50,
            expiry: "2024-12-31"
        };
        setScannedData(fakeData);
    };

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <div className="eyebrow">INVENTORY TOOLS</div>
                        <h1>Scan QR Code</h1>
                        <p>Use your device camera to quickly identify and process food items.</p>
                    </div>
                    <Link to="/inventory" className="btn btn-light">
                        <FiArrowLeft /> Back to Inventory
                    </Link>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <section className="modern-panel">
                        <div className="panel-toolbar">
                            <div>
                                <h2>Camera View</h2>
                            </div>
                        </div>
                        <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", backgroundColor: "var(--bg-main)" }}>
                            <div style={{ width: "240px", height: "240px", border: "2px dashed var(--primary)", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", cursor: "pointer", transition: "all 0.3s ease", position: "relative" }} onClick={handleSimulatedScan} className="scanner-box">
                                <FiCamera size={48} style={{ marginBottom: "16px", color: "var(--primary)" }} />
                                <span>Click to Simulate Scan</span>
                                <div style={{ position: "absolute", inset: "20px", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px" }}></div>
                            </div>
                        </div>
                    </section>

                    <section className="modern-panel">
                        <div className="panel-toolbar">
                            <div>
                                <h2>Scan Results</h2>
                            </div>
                        </div>
                        <div style={{ padding: "24px" }}>
                            {scannedData ? (
                                <div>
                                    <div className="modern-alert success" style={{ marginBottom: "24px" }}>
                                        Item successfully identified!
                                    </div>
                                    <table className="modern-table" style={{ border: "1px solid var(--border)", borderRadius: "8px" }}>
                                        <tbody>
                                            <tr>
                                                <th style={{ width: "40%", backgroundColor: "var(--bg-main)" }}>Item ID</th>
                                                <td><code>#{scannedData.id}</code></td>
                                            </tr>
                                            <tr>
                                                <th style={{ backgroundColor: "var(--bg-main)" }}>Name</th>
                                                <td><strong>{scannedData.name}</strong></td>
                                            </tr>
                                            <tr>
                                                <th style={{ backgroundColor: "var(--bg-main)" }}>Category</th>
                                                <td><span className="status-pill info">{scannedData.category}</span></td>
                                            </tr>
                                            <tr>
                                                <th style={{ backgroundColor: "var(--bg-main)" }}>Quantity</th>
                                                <td>{scannedData.quantity}</td>
                                            </tr>
                                            <tr>
                                                <th style={{ backgroundColor: "var(--bg-main)" }}>Expiry Date</th>
                                                <td>{scannedData.expiry}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
                                        <button className="btn btn-primary" onClick={() => navigate(`/food-details/${scannedData.id}`)}>
                                            <FiSearch /> View Full Details
                                        </button>
                                        <button className="btn btn-light" onClick={() => setScannedData(null)}>
                                            Clear Result
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state" style={{ minHeight: "300px", padding: "0" }}>
                                    <div className="empty-icon" style={{ backgroundColor: "var(--bg-main)", color: "var(--text-muted)" }}>?</div>
                                    <h3>Awaiting Scan</h3>
                                    <p>Point the camera at a QR code to view its details.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default ScanQR;