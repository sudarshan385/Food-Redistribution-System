import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api.js";
import { FiSave, FiArrowLeft } from "react-icons/fi";

function AddFood() {
    const navigate = useNavigate();
    const [food, setFood] = useState({
        food_name: "",
        category: "",
        quantity: "",
        expiry_date: "",
        storage_condition: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFood({ ...food, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.post("/inventory", food);
            navigate("/inventory");
        } catch (error) {
            console.error(error);
            setError("Unable to Add Food. Please check your connection or inputs.");
            setLoading(false);
        }
    };

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <div className="eyebrow">INVENTORY MANAGEMENT</div>
                        <h1>Add New Food</h1>
                        <p>Register a new food item into the warehouse inventory system.</p>
                    </div>
                    <Link to="/inventory" className="btn btn-light">
                        <FiArrowLeft /> Back to Inventory
                    </Link>
                </div>

                {error && <div className="modern-alert danger">{error}</div>}

                <section className="modern-panel" style={{ maxWidth: "600px" }}>
                    <div className="panel-toolbar">
                        <div>
                            <h2>Food Details</h2>
                        </div>
                    </div>
                    
                    <div style={{ padding: "24px" }}>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Food Name</label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    name="food_name"
                                    placeholder="e.g. Organic Apples"
                                    onChange={handleChange}
                                    required
                                    style={{ width: "100%" }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Category</label>
                                <select
                                    className="modern-input"
                                    name="category"
                                    onChange={handleChange}
                                    required
                                    style={{ width: "100%" }}
                                >
                                    <option value="">Select Category</option>
                                    <option>Cooked Food</option>
                                    <option>Fruits</option>
                                    <option>Vegetables</option>
                                    <option>Dairy</option>
                                    <option>Bakery</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Quantity</label>
                                <input
                                    type="number"
                                    className="modern-input"
                                    name="quantity"
                                    placeholder="0"
                                    onChange={handleChange}
                                    required
                                    style={{ width: "100%" }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Expiry Date</label>
                                <input
                                    type="date"
                                    className="modern-input"
                                    name="expiry_date"
                                    onChange={handleChange}
                                    required
                                    style={{ width: "100%" }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Storage Condition</label>
                                <select
                                    className="modern-input"
                                    name="storage_condition"
                                    onChange={handleChange}
                                    required
                                    style={{ width: "100%" }}
                                >
                                    <option value="">Select Storage Condition</option>
                                    <option>Room Temperature</option>
                                    <option>Cold Storage</option>
                                    <option>Refrigerated</option>
                                </select>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                                <Link to="/inventory" className="btn btn-light">Cancel</Link>
                                <button className="btn btn-success" type="submit" disabled={loading}>
                                    <FiSave /> {loading ? "Saving..." : "Save Food"}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default AddFood;