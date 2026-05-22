const FORMATION_SIZE = 10;
const PITCH_WIDTH = 720;
const PITCH_HEIGHT = 460;

function validateFormation(formation) {
  if (!Array.isArray(formation) || formation.length !== FORMATION_SIZE) {
    return {
      valid: false,
      message: `Formation must contain exactly ${FORMATION_SIZE} player coordinates.`,
    };
  }

  const invalidIndex = formation.findIndex((point) => {
    const x = Number(point && point.x);
    const y = Number(point && point.y);

    return (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      x > PITCH_WIDTH ||
      y < 0 ||
      y > PITCH_HEIGHT
    );
  });

  if (invalidIndex !== -1) {
    return {
      valid: false,
      message: `Player ${invalidIndex + 1} is outside the pitch coordinate range.`,
    };
  }

  return { valid: true };
}

function normaliseFormation(formation) {
  return formation.map((point) => ({
    x: Math.round(Number(point.x)),
    y: Math.round(Number(point.y)),
  }));
}

function distanceBetween(first, second) {
  return Math.sqrt((first.x - second.x) ** 2 + (first.y - second.y) ** 2);
}

function compareFormations(savedFormation, inputFormation, tolerance = 30) {
  const savedCheck = validateFormation(savedFormation);
  const inputCheck = validateFormation(inputFormation);

  if (!savedCheck.valid || !inputCheck.valid) {
    return false;
  }

  // Each player number is checked against the same player number from registration.
  return savedFormation.every((savedPoint, index) => {
    const inputPoint = inputFormation[index];
    return distanceBetween(savedPoint, inputPoint) <= tolerance;
  });
}

module.exports = {
  FORMATION_SIZE,
  PITCH_HEIGHT,
  PITCH_WIDTH,
  compareFormations,
  normaliseFormation,
  validateFormation,
};
