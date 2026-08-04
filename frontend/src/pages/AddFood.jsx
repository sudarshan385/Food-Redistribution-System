import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api.js";

function AddFood() {

    const navigate = useNavigate();

    const [food, setFood] = useState({
        food_name: "",
        category: "",
        quantity: "",
        expiry_date: "",
        storage_condition: ""
    });

    const handleChange = (e) => {

        setFood({
            ...food,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await api.post("/inventory", food);

            alert("Food Added Successfully");

            navigate("/inventory");

        } catch (error) {

            console.log(error);

            alert("Unable to Add Food");

        }

    };

    return (

        <div className="container-fluid">

            <div className="row">

                <div className="col-md-2">
                    <Sidebar />
                </div>

                <div className="col-md-10 p-4">

                    <h2>Add Food</h2>

                    <form onSubmit={handleSubmit}>

                        <div className="mb-3">

                            <label>Food Name</label>

                            <input
                                type="text"
                                className="form-control"
                                name="food_name"
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="mb-3">

                            <label>Category</label>

                            <select
                                className="form-control"
                                name="category"
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select</option>
                                <option>Cooked Food</option>
                                <option>Fruits</option>
                                <option>Vegetables</option>
                                <option>Dairy</option>
                                <option>Bakery</option>
                            </select>

                        </div>

                        <div className="mb-3">

                            <label>Quantity</label>

                            <input
                                type="number"
                                className="form-control"
                                name="quantity"
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="mb-3">

                            <label>Expiry Date</label>

                            <input
                                type="date"
                                className="form-control"
                                name="expiry_date"
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="mb-3">

                            <label>Storage Condition</label>

                            <select
                                className="form-control"
                                name="storage_condition"
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select</option>
                                <option>Room Temperature</option>
                                <option>Cold Storage</option>
                                <option>Refrigerated</option>
                            </select>

                        </div>

                        <button
                            className="btn btn-success"
                            type="submit"
                        >
                            Save Food
                        </button>

                    </form>

                </div>

            </div>

        </div>

    );

}

export default AddFood;