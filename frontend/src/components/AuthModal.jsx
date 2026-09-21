import { useState } from "react";
import { apiUrl, saveSession } from "../auth";

function AuthModal({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState("login");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
  });

  const [forgotEmail, setForgotEmail] = useState("");
  const [resetData, setResetData] = useState({
    token: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetMessages = () => {
    setMessage("");
    setError("");
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;

    setLoginData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegisterData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleResetChange = (event) => {
    const { name, value } = event.target;

    setResetData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    resetMessages();
    setLoading(true);

    try {
      const response = await fetch(
        apiUrl("/api/auth/login"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de se connecter."
        );
      }

      saveSession(data.token, data.client);

      onAuthenticated(data.client);
      onClose();
    } catch (error) {
      console.error("Erreur de connexion :", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    resetMessages();
    setLoading(true);

    try {
      const response = await fetch(
        apiUrl("/api/auth/register"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de créer le compte."
        );
      }

      saveSession(data.token, data.client);

      onAuthenticated(data.client);
      onClose();
    } catch (error) {
      console.error("Erreur inscription :", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    resetMessages();
    setLoading(true);

    try {
      const response = await fetch(
        apiUrl("/api/auth/forgot-password"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: forgotEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de lancer la réinitialisation."
        );
      }

      setMessage(data.message);

      /*
       * En environnement local uniquement,
       * le backend peut renvoyer le token si
       * RETURN_RESET_TOKEN=true dans .env.
       */
      if (data.resetToken) {
        setResetData({
          token: data.resetToken,
          password: "",
        });

        setMode("reset");
      }
    } catch (error) {
      console.error(
        "Erreur mot de passe oublié :",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    resetMessages();
    setLoading(true);

    try {
      const response = await fetch(
        apiUrl("/api/auth/reset-password"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(resetData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de réinitialiser le mot de passe."
        );
      }

      setMessage(data.message);

      setResetData({
        token: "",
        password: "",
      });
    } catch (error) {
      console.error(
        "Erreur réinitialisation :",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-modal-overlay"
      onClick={onClose}
    >
      <div
        className="auth-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="close-button"
          onClick={onClose}
          aria-label="Fermer"
        >
          ×
        </button>

        {mode === "login" && (
          <>
            <h2>Connexion</h2>

            <p>
              Connectez-vous à votre espace client.
            </p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="login-email">
                  Adresse e-mail
                </label>

                <input
                  type="email"
                  id="login-email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">
                  Mot de passe
                </label>

                <input
                  type="password"
                  id="login-password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
              </div>

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="financing-button"
                disabled={loading}
              >
                {loading
                  ? "Connexion..."
                  : "Se connecter"}
              </button>
            </form>

            <button
              type="button"
              className="auth-link-button"
              onClick={() => {
                resetMessages();
                setMode("register");
              }}
            >
              Créer un compte
            </button>

            <button
              type="button"
              className="auth-link-button"
              onClick={() => {
                resetMessages();
                setMode("forgot");
              }}
            >
              Mot de passe oublié ?
            </button>
          </>
        )}

        {mode === "register" && (
          <>
            <h2>Créer mon compte</h2>

            <p>
              Créez votre compte client M-Motors.
            </p>

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="register-prenom">
                  Prénom
                </label>

                <input
                  type="text"
                  id="register-prenom"
                  name="prenom"
                  value={registerData.prenom}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-nom">
                  Nom
                </label>

                <input
                  type="text"
                  id="register-nom"
                  name="nom"
                  value={registerData.nom}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-email">
                  Adresse e-mail
                </label>

                <input
                  type="email"
                  id="register-email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-password">
                  Mot de passe
                </label>

                <input
                  type="password"
                  id="register-password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  minLength={8}
                  required
                />

                <small>
                  8 caractères minimum.
                </small>
              </div>

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="financing-button"
                disabled={loading}
              >
                {loading
                  ? "Création..."
                  : "Créer mon compte"}
              </button>
            </form>

            <button
              type="button"
              className="auth-link-button"
              onClick={() => {
                resetMessages();
                setMode("login");
              }}
            >
              J'ai déjà un compte
            </button>
          </>
        )}

        {mode === "forgot" && (
          <>
            <h2>Mot de passe oublié</h2>

            <p>
              Saisissez l'adresse e-mail associée à
              votre compte.
            </p>

            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label htmlFor="forgot-email">
                  Adresse e-mail
                </label>

                <input
                  type="email"
                  id="forgot-email"
                  value={forgotEmail}
                  onChange={(event) =>
                    setForgotEmail(event.target.value)
                  }
                  required
                />
              </div>

              {message && (
                <p className="success-message">
                  {message}
                </p>
              )}

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="financing-button"
                disabled={loading}
              >
                {loading
                  ? "Traitement..."
                  : "Réinitialiser mon mot de passe"}
              </button>
            </form>

            <button
              type="button"
              className="auth-link-button"
              onClick={() => {
                resetMessages();
                setMode("login");
              }}
            >
              Retour à la connexion
            </button>
          </>
        )}

        {mode === "reset" && (
          <>
            <h2>Nouveau mot de passe</h2>

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="reset-token">
                  Token de réinitialisation
                </label>

                <input
                  type="text"
                  id="reset-token"
                  name="token"
                  value={resetData.token}
                  onChange={handleResetChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reset-password">
                  Nouveau mot de passe
                </label>

                <input
                  type="password"
                  id="reset-password"
                  name="password"
                  value={resetData.password}
                  onChange={handleResetChange}
                  minLength={8}
                  required
                />
              </div>

              {message && (
                <p className="success-message">
                  {message}
                </p>
              )}

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="financing-button"
                disabled={loading}
              >
                {loading
                  ? "Modification..."
                  : "Définir le nouveau mot de passe"}
              </button>
            </form>

            <button
              type="button"
              className="auth-link-button"
              onClick={() => {
                resetMessages();
                setMode("login");
              }}
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthModal;