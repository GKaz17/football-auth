import { Badge, Button } from "react-bootstrap";

function Dashboard({ user, onLogout }) {
  return (
    <section className="dashboard">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Access granted</p>
          <h1>Welcome, {user.username}</h1>
          <p className="dashboard-copy">
            Your credentials and formation password were verified successfully.
          </p>
        </div>
        <Badge bg="success" className="verified-badge">
          Verified
        </Badge>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-tile">
          <span>Signed in as</span>
          <strong>{user.email}</strong>
        </div>
        <div className="dashboard-tile">
          <span>Authentication</span>
          <strong>JWT session active</strong>
        </div>
        <div className="dashboard-tile">
          <span>Visual password</span>
          <strong>10 outfield players matched</strong>
        </div>
      </div>

      <Button variant="outline-light" onClick={onLogout}>
        Sign out and test login
      </Button>
    </section>
  );
}

export default Dashboard;

