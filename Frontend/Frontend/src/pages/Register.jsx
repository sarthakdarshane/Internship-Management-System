import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/api";

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        role: "INTERN"
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            await register(formData);

            alert("Registration successful. Please sign in.");

            setFormData({
                full_name: "",
                email: "",
                password: "",
                role: "INTERN"
            });
            navigate("/login");

        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                "Registration failed"
            );
        }
    };

    return (
        <div className="login-container">

            <div className="login-card">

                <h1>Create Account</h1>

                <p>Register for your internship</p>

                <form onSubmit={handleRegister}>

                    <label>Full Name</label>

                    <input
                        type="text"
                        name="full_name"
                        placeholder="Enter full name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                    />

                    <label>Email</label>

                    <input
                        type="email"
                        name="email"
                        placeholder="Enter email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <label>Role</label>

                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="INTERN">Intern</option>
                        <option value="MENTOR">Mentor</option>
                        <option value="ADMIN">Admin</option>
                        <option value="HR">HR</option>
                    </select>

                    <button type="submit">
                        Register
                    </button>

                </form>

                <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>

            </div>

        </div>
    );
}

export default Register;
