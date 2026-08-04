import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Register() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role_id: 2
    });

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await api.post("/auth/register", form);

            alert("Registration Successful");

            navigate("/");

        } catch (error) {

            alert(error.response?.data?.message || "Registration Failed");

        }

    };

    return (

        <div className="container mt-5">

            <div className="row justify-content-center">

                <div className="col-md-5">

                    <div className="card shadow">

                        <div className="card-body">

                            <h2 className="text-center mb-4">
                                AI-Based Food Redistribution System
                            </h2>

                            <h4 className="text-center mb-4">
                                Register
                            </h4>

                            <form onSubmit={handleSubmit}>

                                <div className="mb-3">

                                    <label>Name</label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                                <div className="mb-3">

                                    <label>Email</label>

                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                                <div className="mb-3">

                                    <label>Password</label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                                <div className="mb-3">

                                    <label>Role</label>

                                    <select
                                        className="form-select"
                                        name="role_id"
                                        value={form.role_id}
                                        onChange={handleChange}
                                    >

                                        <option value="1">Admin</option>
                                        <option value="2">Donor</option>
                                        <option value="3">NGO</option>
                                        <option value="4">Volunteer</option>

                                    </select>

                                </div>

                                <button
                                    className="btn btn-success w-100"
                                    type="submit"
                                >
                                    Register
                                </button>

                            </form>

                            <div className="text-center mt-3">

                                <Link to="/">
                                    Already have an account? Login
                                </Link>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Register;