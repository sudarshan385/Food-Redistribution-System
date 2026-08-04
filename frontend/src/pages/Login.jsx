import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api.js";

function Login() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        console.log(formData);

        try {

            const response = await api.post("/auth/login", formData);

            console.log(response.data);

            localStorage.setItem("token", response.data.token);

            navigate("/dashboard");

        } catch (error) {

            console.log(error);

            if (error.response) {

                alert(error.response.data.message);

            } else {

                alert(error.message);

            }

        }

    };

    return (

        <div className="container mt-5">

            <div className="row justify-content-center">

                <div className="col-md-5">

                    <div className="card shadow">

                        <div className="card-body">

                            <h2 className="text-center mb-4">
                                AI Food Redistribution
                            </h2>

                            <form onSubmit={handleSubmit}>

                                <div className="mb-3">

                                    <label>Email</label>

                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control"
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                                <div className="mb-3">

                                    <label>Password</label>

                                    <input
                                        type="password"
                                        name="password"
                                        className="form-control"
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                                <button
                                    className="btn btn-success w-100"
                                >
                                    Login
                                </button>

                            </form>

                            <div className="mt-3 text-center">

                                <Link to="/register">

                                    Create New Account

                                </Link>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Login;