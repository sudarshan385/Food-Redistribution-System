import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

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

            console.log("Response:", error.response?.data);

            alert(error.response?.data?.message || "CSV Upload Failed");

        }

    };

    const filteredFood = food.filter(item =>
        item.food_name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <div className="container-fluid">

            <div className="row">

                {/* Sidebar */}

                <div className="col-md-2">

                    <Sidebar />

                </div>

                {/* Main Content */}

                <div className="col-md-10 p-4">

                    {/* Header */}

                    <div className="d-flex justify-content-between align-items-center mb-3">

                        <div>

                            <h2 className="fw-bold">
                                Food Inventory
                            </h2>

                            <p className="text-muted">
                                Total Items : <strong>{food.length}</strong>
                            </p>

                        </div>

                        <div>

                            <button
                                className="btn btn-success me-2"
                                onClick={() => navigate("/add-food")}
                            >
                                + Add Food
                            </button>

                            <button
                                className="btn btn-primary me-2"
                                onClick={() => fileInputRef.current.click()}
                            >
                                Upload CSV
                            </button>

                            <button
                                className="btn btn-dark"
                                onClick={() => navigate("/scan")}
                            >
                                Scan QR
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

                    {/* Search */}

                    <div className="row mb-3">

                        <div className="col-md-4">

                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search Food..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                        </div>

                    </div>

                    {/* Table */}

                    <div className="table-responsive">

                        <table className="table table-bordered table-hover align-middle">

                            <thead className="table-dark">

                            <tr>

                                <th>ID</th>
                                <th>Food Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Expiry</th>
                                <th>Status</th>
                                <th>Barcode</th>
                                <th>QR Code</th>
                                <th>Actions</th>


                            </tr>

                            </thead>

                            <tbody>

                            {filteredFood.length === 0 ? (

                                <tr>

                                    <td colSpan="9" className="text-center">

                                        No Food Items Found

                                    </td>

                                </tr>

                            ) : (

                                filteredFood.map(item => (

                                    <tr key={item.food_id}>

                                        <td>{item.food_id}</td>

                                        <td>{item.food_name}</td>

                                        <td>{item.category}</td>

                                        <td>{item.quantity}</td>

                                        <td>

                                            {item.expiry_status === "HIGH" && (
                                                <span className="badge bg-danger">High</span>
                                            )}

                                            {item.expiry_status === "MODERATE" && (
                                                <span className="badge bg-warning text-dark">Moderate</span>
                                            )}

                                            {item.expiry_status === "LOW" && (
                                                <span className="badge bg-success">Low</span>
                                            )}

                                        </td>

                                        <td>
        <span className="badge bg-success">
            {item.status}
        </span>
                                        </td>

                                        <td>{item.barcode}</td>

                                        <td className="text-center">

                                            {item.qr_code && (

                                                <img
                                                    src={item.qr_code}
                                                    alt="QR"
                                                    width="80"
                                                    height="80"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => navigate(`/food/${item.food_id}`)}
                                                />

                                            )}

                                        </td>

                                        <td>

                                            <button
                                                className="btn btn-warning btn-sm me-2"
                                                onClick={() => navigate(`/edit-food/${item.food_id}`)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => deleteFood(item.food_id)}
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>
                                ))

                            )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Inventory;