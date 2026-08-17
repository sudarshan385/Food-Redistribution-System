import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { FiEdit, FiTrash2, FiArrowLeft, FiImage } from "react-icons/fi";

function FoodDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [food, setFood] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFood();
    }, [id]);

    const loadFood = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/inventory/${id}`);
            setFood(response.data.food);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const markRemoved = async () => {
        if (!window.confirm("Remove this food item?")) return;
        try {
            await api.delete(`/inventory/${food.food_id}`);
            navigate("/inventory");
        } catch (error) {
            console.error(error);
            alert("Failed to remove food");
        }
    };

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <div className="eyebrow">INVENTORY MANAGEMENT</div>
                        <h1>Food Details</h1>
                        <p>Detailed view of inventory item # {id}</p>
                    </div>
                    <Link to="/inventory" className="btn btn-light">
                        <FiArrowLeft /> Back to Inventory
                    </Link>
                </div>

                <section className="modern-panel" style={{ maxWidth: "800px" }}>
                    <div className="panel-toolbar">
                        <div>
                            <h2>Item Information</h2>
                        </div>
                        {food && (
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button className="btn btn-warning" onClick={() => navigate(`/edit-food/${food.food_id}`)}>
                                    <FiEdit /> Edit
                                </button>
                                <button className="btn btn-danger" onClick={markRemoved}>
                                    <FiTrash2 /> Remove
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div style={{ padding: "24px" }}>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading food details...</div>
                        ) : !food ? (
                            <div className="empty-state">
                                <h3>Food not found</h3>
                                <p>The requested food item does not exist.</p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                <div>
                                    <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", color: "var(--text)" }}>Specifications</h3>
                                    <table className="modern-table" style={{ border: "1px solid var(--border)", borderRadius: "8px" }}>
                                        <tbody>
                                            <tr>
                                                <th style={{ width: "40%", backgroundColor: "var(--bg-main)" }}>Food Name</th>
                                                <td><strong>{food.food_name}</strong></td>
                                            </tr>
                                            <tr>
                                                <th style={{ backgroundColor: "var(--bg-main)" }}>Category</th>
                                                <td><span className="status-pill info">{food.category}</span></td>
                                            </tr>
                                            <tr>
                                                <th style={{ backgroundColor: "var(--bg-main)" }}>Quantity</th>
                                                <td>{food.quantity} units</td>
                                            </tr>
                                            <tr>
                                                <th style={{ backgroundColor: "var(--bg-main)" }}>Expiry Date</th>
                                                <td>{new Date(food.expiry_date).toLocaleDateString()}</td>
                                            </tr>
                                            <tr>
                                                <th style={{ backgroundColor: "var(--bg-main)" }}>Storage Condition</th>
                                                <td>{food.storage_condition}</td>
                                            </tr>
                                            <tr>
                                                <th style={{ backgroundColor: "var(--bg-main)" }}>Status</th>
                                                <td><span className="status-pill success">{food.status || "AVAILABLE"}</span></td>
                                            </tr>
                                            <tr>
                                                <th style={{ backgroundColor: "var(--bg-main)" }}>Barcode</th>
                                                <td><code>{food.barcode || "N/A"}</code></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-main)", borderRadius: "12px", border: "1px solid var(--border)", padding: "24px" }}>
                                    <h3 style={{ fontSize: "1.1rem", margin: "0", color: "var(--text)" }}>QR Code</h3>
                                    {food.qr_code ? (
                                        <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                                            <img src={food.qr_code} width="160" alt="QR Code" style={{ display: "block" }} />
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}>
                                            <FiImage size={40} />
                                            <span>No QR Code generated</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default FoodDetails;