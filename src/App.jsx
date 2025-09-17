import { useState } from "react";
import "./assets/css/login.css";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="page__login">
      <div className="login-container">
        <h1>Login</h1>
        <form className="login-form">
          <label>
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.6673 16.5V14.8333C14.6673 13.9493 14.3161 13.1014 13.691 12.4764C13.0659 11.8512 12.218 11.5 11.334 11.5H4.66731C3.78326 11.5 2.93541 11.8512 2.31029 12.4764C1.68517 13.1014 1.33398 13.9493 1.33398 14.8333V16.5" stroke="white" stroke-width="2.35294" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7.99936 8.16667C9.84025 8.16667 11.3327 6.67428 11.3327 4.83333C11.3327 2.99239 9.84025 1.5 7.99936 1.5C6.1584 1.5 4.66602 2.99239 4.66602 4.83333C4.66602 6.67428 6.1584 8.16667 7.99936 8.16667Z" stroke="white" stroke-width="2.35294" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
           <svg fill="#ffffff" height="18px" width="18px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512.006 512.006" xml:space="preserve" transform="rotate(90)matrix(1, 0, 0, -1, 0, 0)" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M362.673,0C280.192,0,213.34,66.853,213.34,149.333c0,33.545,11.059,64.505,29.729,89.434l-98.147,98.147 c0,0,0,0-0.001,0.001s0,0-0.001,0.001l-63.999,63.999c0,0,0,0-0.001,0.001s0,0-0.001,0.001L6.248,475.588 c-8.331,8.331-8.331,21.839,0,30.17s21.839,8.331,30.17,0l59.588-59.588l59.582,59.582c8.331,8.331,21.839,8.331,30.17,0 c8.331-8.331,8.331-21.839,0-30.17L126.176,416l33.83-33.83l38.248,38.248c8.331,8.331,21.839,8.331,30.17,0 c8.331-8.331,8.331-21.839,0-30.17L190.176,352l83.062-83.063c24.929,18.67,55.889,29.729,89.434,29.729 c82.481,0,149.333-66.853,149.333-149.333S445.154,0,362.673,0z M362.673,256c-29.38,0-55.982-11.876-75.272-31.088 c-0.051-0.052-0.094-0.109-0.146-0.161s-0.109-0.095-0.161-0.146c-19.212-19.29-31.088-45.892-31.088-75.272 c0-58.917,47.75-106.667,106.667-106.667c58.917,0,106.667,47.75,106.667,106.667C469.34,208.25,421.59,256,362.673,256z"></path> </g> </g> </g></svg>            
           <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <span className="text-reg">Não tem conta? <a href="/">Registrar-se</a></span>
          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}
