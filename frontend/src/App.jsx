import { useEffect, useState } from "react";
import { Button, Container, Navbar } from "react-bootstrap";

import { fetchCurrentUser } from "./api";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [view, setView] = useState("register");
  const [token, setToken] = useState(() => localStorage.getItem("footballAuthToken"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    fetchCurrentUser(token)
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => {
        localStorage.removeItem("footballAuthToken");
        setToken(null);
      });
  }, [token]);

  function handleAuth(nextToken, nextUser) {
    localStorage.setItem("footballAuthToken", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  function handleLogout() {
    localStorage.removeItem("footballAuthToken");
    setToken(null);
    setUser(null);
    setView("login");
  }

  return (
    <div className="app-shell">
      <Navbar className="app-nav">
        <Container fluid="lg" className="gap-3">
          <Navbar.Brand className="brand-mark">Formation Auth</Navbar.Brand>
          <div className="nav-actions">
            {!user && (
              <>
                <Button
                  variant={view === "register" ? "light" : "outline-light"}
                  size="sm"
                  onClick={() => setView("register")}
                >
                  Register
                </Button>
                <Button
                  variant={view === "login" ? "light" : "outline-light"}
                  size="sm"
                  onClick={() => setView("login")}
                >
                  Sign in
                </Button>
              </>
            )}
            {user && (
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
                Sign out
              </Button>
            )}
          </div>
        </Container>
      </Navbar>

      <main className="app-main">
        <Container fluid="lg">
          {user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : view === "register" ? (
            <Register onAuth={handleAuth} onSwitch={() => setView("login")} />
          ) : (
            <Login onAuth={handleAuth} onSwitch={() => setView("register")} />
          )}
        </Container>
      </main>
    </div>
  );
}

export default App;
