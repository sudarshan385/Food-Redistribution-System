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
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: "480px" }}>
                <div className="auth-header">
                    <div style={{ fontSize: "40px", display: "inline-block", marginBottom: "8px" }}>🌱</div>
                    <h1>Create Account</h1>
                    <p>Join the AI-based Food Redistribution System</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            className="modern-input"
                            style={{ maxWidth: "100%" }}
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            className="modern-input"
                            style={{ maxWidth: "100%" }}
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="name@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="modern-input"
                            style={{ maxWidth: "100%" }}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="role_id">Your Role</label>
                        <select
                            id="role_id"
                            className="modern-select"
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
                        className="btn btn-primary"
                        type="submit"
                        style={{ marginTop: "10px" }}
                    >
                        Sign Up
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/">Login</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;