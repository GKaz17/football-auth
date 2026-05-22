import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button } from "react-bootstrap";

import FORMATION_TEMPLATES from "../data/formationTemplates";
import Dot from "./Dot";

const PLAYER_COUNT = 10;
const PITCH_WIDTH = 720;
const PITCH_HEIGHT = 460;

function emptyFormation() {
  return Array.from({ length: PLAYER_COUNT }, () => null);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function FormationGrid({ value, onChange }) {
  const pitchRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const positions = value || emptyFormation();
  const placedCount = positions.filter(Boolean).length;
  const selectedTemplateName =
    FORMATION_TEMPLATES.find((template) => template.id === selectedTemplate)?.name || "";

  const pointFromEvent = useCallback((event) => {
    const rect = pitchRef.current.getBoundingClientRect();

    return {
      x: Math.round(clamp(((event.clientX - rect.left) / rect.width) * PITCH_WIDTH, 0, PITCH_WIDTH)),
      y: Math.round(clamp(((event.clientY - rect.top) / rect.height) * PITCH_HEIGHT, 0, PITCH_HEIGHT)),
    };
  }, []);

  const placePlayer = useCallback(
    (index, point) => {
      const nextPositions = positions.map((position, currentIndex) =>
        currentIndex === index ? point : position
      );
      onChange(nextPositions);
    },
    [onChange, positions]
  );

  useEffect(() => {
    if (activeIndex === null) {
      return undefined;
    }

    function handleMove(event) {
      event.preventDefault();
      placePlayer(activeIndex, pointFromEvent(event));
    }

    function handleUp() {
      setActiveIndex(null);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [activeIndex, placePlayer, pointFromEvent]);

  function handlePointerDown(index, event) {
    event.preventDefault();
    setSelectedTemplate("custom");
    setActiveIndex(index);
    placePlayer(index, pointFromEvent(event));
  }

  function handlePitchClick(event) {
    if (event.target.closest(".player-dot")) {
      return;
    }

    const nextIndex = positions.findIndex((position) => !position);
    if (nextIndex === -1) {
      return;
    }

    setSelectedTemplate("custom");
    placePlayer(nextIndex, pointFromEvent(event));
  }

  function resetFormation() {
    setSelectedTemplate("");
    onChange(emptyFormation());
  }

  function applyTemplate(template) {
    // Templates fill the 10 outfield player positions for quick testing.
    setSelectedTemplate(template.id);
    onChange(template.points.map((point) => ({ ...point })));
  }

  return (
    <div className="formation-grid">
      <div className="formation-toolbar">
        <div className="formation-status">
          <Badge bg={placedCount === PLAYER_COUNT ? "success" : "secondary"}>{placedCount}/10</Badge>
          <span>{selectedTemplate === "custom" ? "Custom" : selectedTemplateName || "No template"}</span>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={resetFormation}>
          Reset
        </Button>
      </div>

      <div className="template-row">
        {FORMATION_TEMPLATES.map((template) => (
          <Button
            key={template.id}
            type="button"
            size="sm"
            variant={selectedTemplate === template.id ? "success" : "outline-success"}
            onClick={() => applyTemplate(template)}
          >
            {template.name}
          </Button>
        ))}
      </div>

      <div className="pitch" ref={pitchRef} onClick={handlePitchClick}>
        <div className="pitch-line pitch-line--half" />
        <div className="pitch-circle" />
        <div className="pitch-box pitch-box--left" />
        <div className="pitch-box pitch-box--right" />
        <div className="pitch-goal pitch-goal--left" />
        <div className="pitch-goal pitch-goal--right" />
        <div className="player-dot player-dot--placed player-dot--goalkeeper" title="Goalkeeper">
          1
        </div>

        {positions.map((position, index) =>
          position ? (
            <Dot
              key={index}
              index={index}
              placed
              position={position}
              onPointerDown={handlePointerDown}
            />
          ) : null
        )}
      </div>

      <div className="player-tray" aria-label="Unplaced players">
        {positions.map((position, index) =>
          position ? null : (
            <Dot key={index} index={index} placed={false} onPointerDown={handlePointerDown} />
          )
        )}
      </div>
    </div>
  );
}

export { PLAYER_COUNT };
export default FormationGrid;
