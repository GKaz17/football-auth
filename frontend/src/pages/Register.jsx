import { useState } from "react";
import { Alert, Button, Col, Form, Row, Spinner } from "react-bootstrap";

import { registerUser } from "../api";
import FormationGrid, { PLAYER_COUNT } from "../components/FormationGrid";

const initialFormation = Array.from({ length: PLAYER_COUNT }, () => null);

function Register({ onAuth, onSwitch }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [formation, setFormation] = useState(initialFormation);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hasCompleteProfile = form.username.trim() && form.email.trim() && form.password;
  const hasCompleteFormation = formation.every(Boolean);
  const canSubmit = Boolean(hasCompleteProfile && hasCompleteFormation);
  const placedCount = formation.filter(Boolean).length;

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError("Fill in username, email, and password first.");
      return;
    }

    if (!hasCompleteFormation) {
      setError(`Choose a template or place all 10 outfield players. Current progress: ${placedCount}/10.`);
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        ...form,
        formation,
      });
      onAuth(response.token, response.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-panel">
      <div className="panel-heading">
        <p className="eyebrow">Register</p>
        <h1>Create your formation password</h1>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row className="g-3">
          <Col md={4}>
            <Form.Label>Username</Form.Label>
            <Form.Control
              name="username"
              value={form.username}
              onChange={updateField}
              minLength={3}
              required
            />
          </Col>
          <Col md={4}>
            <Form.Label>Email</Form.Label>
            <Form.Control
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </Col>
          <Col md={4}>
            <Form.Label>Password</Form.Label>
            <Form.Control
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              required
            />
          </Col>
        </Row>

        <FormationGrid value={formation} onChange={setFormation} />

        <div className="panel-actions">
          <Button type="submit" disabled={loading} className={canSubmit ? "" : "btn-ready-soon"}>
            {loading ? <Spinner animation="border" size="sm" /> : "Create account"}
          </Button>
          <span className={canSubmit ? "ready-note ready-note--ok" : "ready-note"}>
            {canSubmit ? "Ready to submit" : `Formation progress: ${placedCount}/10`}
          </span>
          <Button type="button" variant="link" onClick={onSwitch}>
            Sign in instead
          </Button>
        </div>
      </Form>
    </section>
  );
}

export default Register;
