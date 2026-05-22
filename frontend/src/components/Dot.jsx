function Dot({ index, placed, position, onPointerDown }) {
  const playerNumber = index + 2;
  const style =
    placed && position
      ? {
          left: `${(position.x / 720) * 100}%`,
          top: `${(position.y / 460) * 100}%`,
        }
      : undefined;

  return (
    <button
      type="button"
      className={`player-dot ${placed ? "player-dot--placed" : "player-dot--bench"}`}
      style={style}
      title={`Player ${playerNumber}`}
      aria-label={`Player ${playerNumber}`}
      onPointerDown={(event) => onPointerDown(index, event)}
    >
      {playerNumber}
    </button>
  );
}

export default Dot;
