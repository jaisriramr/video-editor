import React, { useState, useEffect } from "react";
// import "./styles.css"; // Assuming you have CSS for styling

const ParentComponent: React.FC = () => {
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const children = [1, 2, 3, 4, 5]; // Example child components

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (!isPaused) {
      interval = setInterval(() => {
        setCursorPosition((prevPosition) => {
          const newPosition = prevPosition + 1;
          return newPosition >= children.length ? 0 : newPosition;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused, cursorPosition, children.length]);

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleRestart = () => {
    setIsPaused(false);
  };

  return (
    <div className="parent">
      {children.map((child, index) => (
        <div
          key={index}
          className="child"
          style={{ width: `${child * 50}px`, position: "relative" }}
        >
          {index === cursorPosition && (
            <div
              className="cursor"
              style={{
                left: `${(child - 1) * 50 + 1}px`, // Adjust position to move over the child div
              }}
            />
          )}
        </div>
      ))}
      <div className="controls">
        <button onClick={handlePause}>Pause</button>
        <button onClick={handleRestart}>Restart</button>
      </div>
    </div>
  );
};

export default ParentComponent;
