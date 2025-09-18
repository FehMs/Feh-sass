import { useState } from "react";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from "react-router-dom";
import BannerBackground from "../assets/img/beckground.jpg";
import Logo from "../assets/img/LogoNewWallet.png"
import "../assets/css/login.css";
// Para o ícone do Google, instale com: npm install react-icons
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Obter as funções login e signInWithGoogle do contexto
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Falha ao entrar na conta. Verifique suas credenciais.");
    }
    setLoading(false);
  }

  // 2. Criar a função para o clique no botão do Google
  async function handleGoogleSignIn() {
    try {
      setError("");
      setLoading(true);
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      setError("Falha ao fazer login com o Google. Tente novamente.");
    }
    setLoading(false);
  }

  return (
    <div className="page__login">
      <div className="login-container">
        <section className="background__image">
          <img src={BannerBackground} alt="Banner" />
        </section>
        <section className="form__section">
          <div className="logo__container">
            <img src={Logo} alt="Logo"/>
          </div>
          {error && <p className="error-message">{error}</p>}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-container">
              {/* Notei que seu input de e-mail no login usava um SVG de usuário. Troquei pelo de e-mail para consistência. */}
              <label>
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 9.00005L10.2 13.65C11.2667 14.45 12.7333 14.45 13.8 13.65L20 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 9.17681C3 8.45047 3.39378 7.78123 4.02871 7.42849L11.0287 3.5396C11.6328 3.20402 12.3672 3.20402 12.9713 3.5396L19.9713 7.42849C20.6062 7.78123 21 8.45047 21 9.17681V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V9.17681Z" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" required />
              </label>
              <label>
                <svg fill="#ffffff" height="18px" width="18px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512.006 512.006" transform="rotate(90)matrix(1, 0, 0, -1, 0, 0)" stroke="#ffffff"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><g><g><path d="M362.673,0C280.192,0,213.34,66.853,213.34,149.333c0,33.545,11.059,64.505,29.729,89.434l-98.147,98.147 c0,0,0,0-0.001,0.001s0,0-0.001,0.001l-63.999,63.999c0,0,0,0-0.001,0.001s0,0-0.001,0.001L6.248,475.588 c-8.331,8.331-8.331,21.839,0,30.17s21.839,8.331,30.17,0l59.588-59.588l59.582,59.582c8.331,8.331,21.839,8.331,30.17,0 c8.331-8.331,8.331-21.839,0-30.17L126.176,416l33.83-33.83l38.248,38.248c8.331,8.331,21.839,8.331,30.17,0 c8.331-8.331,8.331-21.839,0-30.17L190.176,352l83.062-83.063c24.929,18.67,55.889,29.729,89.434,29.729 c82.481,0,149.333-66.853,149.333-149.333S445.154,0,362.673,0z M362.673,256c-29.38,0-55.982-11.876-75.272-31.088 c-0.051-0.052-0.094-0.109-0.146-0.161s-0.109-0.095-0.161-0.146c-19.212-19.29-31.088-45.892-31.088-75.272 c0-58.917,47.75-106.667,106.667-106.667c58.917,0,106.667,47.75,106.667,106.667C469.34,208.25,421.59,256,362.673,256z"></path></g></g></g></svg>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required />
              </label>
            </div>
            <span className="text-reg">Não tem conta? <Link to="/register">Registrar-se</Link></span>
            <button disabled={loading} type="submit">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* 3. ADICIONAR O DIVISOR E O BOTÃO */}
          <div className="divider">
            <span>OU</span>
          </div>
          <button className="social-button google" onClick={handleGoogleSignIn} disabled={loading}>
            <FcGoogle size={22} /> Continuar com Google
          </button>
        </section>
      </div>
    </div>
  );
}