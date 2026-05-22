import { useState } from "react";
import { Alert, Button, Col, Form, Row, Spinner } from "react-bootstrap";

import { loginUser } from "../api";
import FormationGrid, { PLAYER_COUNT } from "../components/FormationGrid";

const initialFormation = Array.from({ length: PLAYER_COUNT }, () => null);

function Login({ onAuth, onSwitch }) {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [formation, setFormation] = useState(initialFormation);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hasCompleteFormation = formation.every(Boolean);
  const canSubmit = Boolean(form.identifier.trim() && form.password && hasCompleteFormation);
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

    if (!form.identifier.trim() || !form.password) {
      setError("Enter your username/email and password first.");
      return;
    }

    if (!hasCompleteFormation) {
      setError(`Choose the same template or place all 10 outfield players. Current progress: ${placedCount}/10.`);
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser({
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
        <p className="eyebrow">Sign in</p>
        <h1>Recreate your formation</h1>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row className="g-3">
          <Col md={6}>
            <Form.Label>Username or email</Form.Label>
            <Form.Control
              name="identifier"
              value={form.identifier}
              onChange={updateField}
              required
            />
          </Col>
          <Col md={6}>
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
            {loading ? <Spinner animation="border" size="sm" /> : "Sign in"}
          </Button>
          <span className={canSubmit ? "ready-note ready-note--ok" : "ready-note"}>
            {canSubmit ? "Ready to submit" : `Formation progress: ${placedCount}/10`}
          </span>
          <Button type="button" variant="link" onClick={onSwitch}>
            Create account
          </Button>
        </div>
      </Form>
    </section>
  );
}

export default Login;
