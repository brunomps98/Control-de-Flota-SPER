import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import blackLogo from '../../assets/images/black-logo.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await fetch('http://localhost:8080/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al iniciar sesión');
            }

         

            if (data.user && data.user.isAdmin) {
                navigate('/vehicle-general');
            } else {
                navigate('/vehicle');
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    return (
        <div className="main-container">
            <div className="left-side">
                <div className="container login">
                    <h2 className="form-title">Iniciar sesión</h2>
                    <p className="form-subtitle">Bienvenido, por favor ingresa tus datos.</p>
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="mb-3">
                            <label htmlFor="usernameInput" className="form-label">Usuario</label>
                            <input
                                type="text"
                                className="form-control"
                                id="usernameInput"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="passwordInput" className="form-label">Contraseña</label>
                            <input
                                type="password"
                                className="form-control"
                                id="passwordInput"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="alert alert-danger mt-3" role="alert">
                                {error}
                            </div>
                        )}

                        <button type="submit" className="signup-btn1">Iniciar sesión</button>
                    </form>
                </div>
            </div>
            <div className="right-side">
                <img src={blackLogo} alt="SPER Logo" />
            </div>
        </div>
    );
};

export default Login;