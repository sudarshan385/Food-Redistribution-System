import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

function FoodDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [food, setFood] = useState(null);

    useEffect(() => {
        loadFood();
    }, [id]);

    const loadFood = async () => {

        try {

            const response = await api.get(`/inventory/${id}`);

            setFood(response.data.food);

        } catch (error) {

            console.log(error);

        }

    };

    const markRemoved = async () => {

        if (!window.confirm("Remove this food item?")) return;

        try {

            await api.delete(`/inventory/${food.food_id}`);

            alert("Food Removed Successfully");

            navigate("/inventory");

        } catch (error) {

            console.log(error);

            alert("Failed to remove food");

        }

    };

    if (!food) {

        return (

            <div className="container mt-5">

                <h3>Loading...</h3>

            </div>

        );

    }

    return (

        <div className="container mt-5">

            <h2 className="mb-4">Food Details</h2>

            <table className="table table-bordered">

                <tbody>

                <tr>
                    <th>Food Name</th>
                    <td>{food.food_name}</td>
                </tr>

                <tr>
                    <th>Category</th>
                    <td>{food.category}</td>
                </tr>

                <tr>
                    <th>Quantity</th>
                    <td>{food.quantity}</td>
                </tr>

                <tr>
                    <th>Expiry Date</th>
                    <td>{new Date(food.expiry_date).toLocaleDateString()}</td>
                </tr>

                <tr>
                    <th>Storage Condition</th>
                    <td>{food.storage_condition}</td>
                </tr>

                <tr>
                    <th>Status</th>
                    <td>{food.status}</td>
                </tr>
                <tr>
                    <th>Barcode</th>
                    <td>{food.barcode}</td>
                </tr>

                <tr>
                    <th>QR Code</th>
                    <td>
                        <img
                            src={food.qr_code}
                            width="120"
                            alt="QR"
                        />
                    </td>
                </tr>

                </tbody>

            </table>

            <div className="mt-4">

                <button
                    className="btn btn-warning me-2"
                    onClick={() => navigate(`/edit-food/${food.food_id}`)}
                >
                    Update Food
                </button>

                <button
                    className="btn btn-danger"
                    onClick={markRemoved}
                >
                    Mark Removed
                </button>
                <button
                    className="btn btn-secondary ms-2"
                    onClick={() => navigate("/inventory")}
                >
                    Back
                </button>

            </div>

        </div>

    );

}

export default FoodDetails;