import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api.js";

function EditFood() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [food, setFood] = useState({
        food_name: "",
        category: "",
        quantity: "",
        expiry_date: "",
        storage_condition: ""
    });

    useEffect(() => {
        loadFood();
    }, []);

    const loadFood = async () => {
        try {
            const response = await api.get(`/inventory/${id}`);

            setFood(response.data.food);

        } catch (error) {
            console.log(error);
        }
    };

    const handleChange = (e) => {
        setFood({
            ...food,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {

            await api.put(`/inventory/${id}`, food);

            alert("Food Updated Successfully");

            navigate("/inventory");

        } catch (error) {

            console.log(error);

            alert("Update Failed");

        }
    };

    return (
        <div className="container-fluid">
            <div className="row">

                <div className="col-md-2">
                    <Sidebar />
                </div>

                <div className="col-md-10 p-4">

                    <h2>Edit Food</h2>

                    <form onSubmit={handleSubmit}>

                        <div className="mb-3">
                            <label>Food Name</label>
                            <input
                                type="text"
                                className="form-control"
                                name="food_name"
                                value={food.food_name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label>Category</label>
                            <input
                                type="text"
                                className="form-control"
                                name="category"
                                value={food.category}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label>Quantity</label>
                            <input
                                type="number"
                                className="form-control"
                                name="quantity"
                                value={food.quantity}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label>Expiry Date</label>
                            <input
                                type="date"
                                className="form-control"
                                name="expiry_date"
                                value={food.expiry_date?.substring(0,10)}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label>Storage Condition</label>
                            <input
                                type="text"
                                className="form-control"
                                name="storage_condition"
                                value={food.storage_condition}
                                onChange={handleChange}
                            />
                        </div>

                        <button
                            className="btn btn-primary"
                            type="submit"
                        >
                            Update Food
                        </button>

                    </form>

                </div>

            </div>
        </div>
    );
}

export default EditFood;