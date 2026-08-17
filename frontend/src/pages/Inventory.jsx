import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiUpload, FiMaximize, FiSearch, FiTrash2, FiEdit2 } from "react-icons/fi";

function Inventory() {
    const [food, setFood] = useState([]);
    const [search, setSearch] = useState("");
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadFood();
    }, []);

    const loadFood = async () => {
        try {
            const response = await api.get("/inventory");
            setFood(response.data.food);
        } catch (error) {
            console.log(error);
        }
    };

    const deleteFood = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this food item?"
        );
        if (!confirmDelete) return;

        try {
            await api.delete(`/inventory/${id}`);
            setFood(food.filter(item => item.food_id !== id));
            loadFood();
        } catch (error) {
            console.log(error);
            alert("Delete Failed");
        }
    };

    const uploadCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            await api.post("/upload/csv", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            alert("CSV Uploaded Successfully");
            loadFood();
        } catch (error) {
            console.log("Upload Error:", error);
            alert(error.response?.data?.message || "CSV Upload Failed");
        }
    };

    const filteredFood = food.filter(item =>
        item.food_name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <div className="eyebrow">INVENTORY CONTROL</div>
                        <h1>Food Inventory</h1>
                        <p>Track food stock levels, check expiry status, scan QR codes, or upload bulk items.</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate("/add-food")}
                        >
                            <FiPlus /> Add Food
                        </button>
                        <button
                            className="btn btn-light"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <FiUpload /> Upload CSV
                        </button>
                        <button
                            className="btn btn-dark"
                            onClick={() => navigate("/scan")}
                        >
                            <FiMaximize /> Scan QR
                        </button>
                        <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={uploadCSV}
                        />
                    </div>
                </div>

                <section className="modern-panel">
                    <div className="panel-toolbar">
                        <div>
                            <h2>Inventory Records</h2>
                            <span>Total Items: <strong>{food.length}</strong></span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative" }}>
                            <FiSearch style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }} />
                            <input
                                type="text"
                                className="modern-input"
                                placeholder="Search inventory..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: "36px" }}
                            />
                        </div>
                    </div>

                    {filteredFood.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">✓</div>
                            <h3>No Food Items Found</h3>
                            <p>Try searching for a different food name or category, or add a new food item.</p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Food Name</th>
                                        <th>Category</th>
                                        <th>Quantity</th>
                                        <th>Expiry Hazard</th>
                                        <th>Status</th>
                                        <th>Barcode</th>
                                        <th style={{ textAlign: "center" }}>QR Code</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFood.map(item => (
                                        <tr key={item.food_id}>
                                            <td>{item.food_id}</td>
                                            <td>
                                                <strong style={{ display: "block" }}>{item.food_name}</strong>
                                                <small style={{ color: "var(--text-muted)" }}>
                                                    Created: {item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}
                                                </small>
                                            </td>
                                            <td>
                                                <span className="status-pill info">{item.category}</span>
                                            </td>
                                            <td><strong>{item.quantity}</strong> units</td>
                                            <td>
                                                {item.expiry_status === "HIGH" && (
                                                    <span className="status-pill danger">High Hazard</span>
                                                )}
                                                {item.expiry_status === "MODERATE" && (
                                                    <span className="status-pill warning">Moderate</span>
                                                )}
                                                {item.expiry_status === "LOW" && (
                                                    <span className="status-pill success">Low</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="status-pill success">
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td><code>{item.barcode}</code></td>
                                            <td style={{ textAlign: "center" }}>
                                                {item.qr_code && (
                                                    <img
                                                        src={item.qr_code}
                                                        alt="QR"
                                                        width="50"
                                                        height="50"
                                                        style={{ 
                                                            cursor: "pointer", 
                                                            borderRadius: "6px",
                                                            border: "1px solid var(--border-light)",
                                                            padding: "2px"
                                                        }}
                                                        onClick={() => navigate(`/food/${item.food_id}`)}
                                                    />
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button
                                                        className="btn btn-light btn-sm"
                                                        onClick={() => navigate(`/edit-food/${item.food_id}`)}
                                                        title="Edit Product"
                                                    >
                                                        <FiEdit2 /> Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => deleteFood(item.food_id)}
                                                        title="Delete Product"
                                                    >
                                                        <FiTrash2 /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Inventory;