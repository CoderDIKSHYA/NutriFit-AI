import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/Auth';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/desktop/Auth.scss';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const { login, register, user, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard or previous page
    if (user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please fill in all fields');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    let success;
    if (isLogin) {
      success = await login(email, password);
    } else {
      success = await register(email, password);
    }

    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-container">
        <h2>{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
        <p className="auth-subtitle">
          {isLogin
            ? 'Sign in to access your personal dashboard & tracking logs'
            : 'Create an account to start tracking calories & workout goals'}
        </p>

        {(validationError || error) && (
          <div className="auth-error-box">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="auth-submit-btn">
            {isLogin ? 'Sign In' : 'Create Account'}
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </form>

        <div className="auth-toggle">
          <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
          <button
            type="button"
            className="toggle-mode-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setValidationError('');
            }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </main>
  );
};

export default Auth;
