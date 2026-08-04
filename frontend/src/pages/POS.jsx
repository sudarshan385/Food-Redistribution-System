import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

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

        <div className="container-fluid">

            <div className="row">

                <div className="col-md-2">
                    <Sidebar />
                </div>

                <div className="col-md-10 p-4">

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <div>

                            <h2 className="fw-bold">
                                POS Integration
                            </h2>

                            <p className="text-muted mb-0">
                                Products fetched from POS through REST API
                            </p>

                        </div>

                        <span className="badge bg-success fs-6">
                            REST API Connected
                        </span>

                    </div>

                    <div className="mb-3">

                        <h5>
                            Total Products :
                            <span className="text-primary">
                                {" "}{products.length}
                            </span>
                        </h5>

                    </div>

                    <div className="table-responsive">

                        <table className="table table-bordered table-hover align-middle">

                            <thead className="table-dark">

                            <tr>

                                <th>ID</th>
                                <th>Food Name</th>
                                <th>Category</th>
                                <th>Quantity</th>

                            </tr>

                            </thead>

                            <tbody>

                            {products.length > 0 ? (

                                products.map((item) => (

                                    <tr key={item.food_id}>

                                        <td>{item.food_id}</td>

                                        <td>{item.food_name}</td>

                                        <td>{item.category}</td>

                                        <td>{item.quantity}</td>

                                    </tr>

                                ))

                            ) : (

                                <tr>

                                    <td
                                        colSpan="4"
                                        className="text-center text-muted"
                                    >
                                        No POS Products Available
                                    </td>

                                </tr>

                            )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default POS;