import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { FiUploadCloud, FiArrowLeft, FiFileText } from "react-icons/fi";

function UploadCSV() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError("");
            setSuccess("");
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setError("Please select a CSV file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        setError("");
        setSuccess("");

        try {
            await api.post("/inventory/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setSuccess("CSV data successfully imported.");
            setTimeout(() => {
                navigate("/inventory");
            }, 1500);
        } catch (error) {
            console.error(error);
            setError("Failed to upload CSV. Please ensure the format is correct.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <div className="eyebrow">INVENTORY TOOLS</div>
                        <h1>Upload CSV Data</h1>
                        <p>Bulk import food inventory items using a comma-separated values file.</p>
                    </div>
                    <Link to="/inventory" className="btn btn-light">
                        <FiArrowLeft /> Back to Inventory
                    </Link>
                </div>

                {error && <div className="modern-alert danger">{error}</div>}
                {success && <div className="modern-alert success">{success}</div>}

                <section className="modern-panel" style={{ maxWidth: "600px", margin: "0 auto" }}>
                    <div className="panel-toolbar">
                        <div>
                            <h2>Import File</h2>
                        </div>
                    </div>
                    <div style={{ padding: "32px" }}>
                        <form onSubmit={handleUpload}>
                            <div 
                                style={{ 
                                    border: "2px dashed var(--border)", 
                                    borderRadius: "12px", 
                                    padding: "40px 24px", 
                                    textAlign: "center",
                                    backgroundColor: file ? "rgba(16,185,129,0.05)" : "var(--bg-main)",
                                    borderColor: file ? "var(--primary)" : "var(--border)",
                                    transition: "all 0.2s ease",
                                    marginBottom: "24px"
                                }}
                            >
                                <input
                                    type="file"
                                    accept=".csv"
                                    id="csv-upload"
                                    style={{ display: "none" }}
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="csv-upload" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    {file ? (
                                        <>
                                            <FiFileText size={48} style={{ color: "var(--primary)", marginBottom: "16px" }} />
                                            <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", color: "var(--text)" }}>{file.name}</h3>
                                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{(file.size / 1024).toFixed(1)} KB</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiUploadCloud size={48} style={{ color: "var(--text-muted)", marginBottom: "16px" }} />
                                            <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", color: "var(--text)" }}>Click to browse or drag file here</h3>
                                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Only .csv files are supported</span>
                                        </>
                                    )}
                                </label>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                                {file && (
                                    <button 
                                        type="button" 
                                        className="btn btn-light" 
                                        onClick={() => setFile(null)}
                                        disabled={uploading}
                                    >
                                        Clear
                                    </button>
                                )}
                                <button 
                                    className="btn btn-primary" 
                                    type="submit" 
                                    disabled={!file || uploading}
                                    style={{ padding: "10px 24px" }}
                                >
                                    <FiUploadCloud /> {uploading ? "Uploading..." : "Upload File"}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default UploadCSV;