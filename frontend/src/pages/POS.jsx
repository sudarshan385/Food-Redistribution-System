import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { FiMonitor } from "react-icons/fi";

function POS() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const response = await api.get("/pos/products");
            setProducts(response.data.products);
        } catch (error) {
            console.error(error);
            alert("Unable to load POS products.");
        }
    };

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <div className="eyebrow">SYSTEM INTEGRATIONS</div>
                        <h1>POS Integration</h1>
                        <p>Products fetched from the active Point of Sale terminal registry.</p>
                    </div>
                    <div>
                        <span className="status-pill success" style={{ padding: "8px 16px" }}>
                            ● REST API Connected
                        </span>
                    </div>
                </div>

                <section className="modern-panel">
                    <div className="panel-toolbar">
                        <div>
                            <h2>POS Register Items</h2>
                            <span>Total Products: <strong>{products.length}</strong></span>
                        </div>
                    </div>

                    {products.length > 0 ? (
                        <div className="table-wrap">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Product ID</th>
                                        <th>Food Name</th>
                                        <th>Category</th>
                                        <th>Quantity Available</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((item) => (
                                        <tr key={item.food_id}>
                                            <td><code>#{item.food_id}</code></td>
                                            <td><strong>{item.food_name}</strong></td>
                                            <td>
                                                <span className="status-pill info">{item.category}</span>
                                            </td>
                                            <td><strong>{item.quantity}</strong> units</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon"><FiMonitor /></div>
                            <h3>No POS Products Available</h3>
                            <p>No products were found registered in the remote POS registry.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default POS;