import { useLayoutEffect, useState,useEffect } from "react";
import rough from 'roughjs';
import { Drawable } from "roughjs/bin/core";

const generator = rough.generator();

interface Element {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  roughElement: Drawable;
}

function createElement(x1: number, y1: number, x2: number, y2: number, type: string):Element {
  const roughElement = type === "line"
    ? generator.line(x1, y1, x2, y2,{roughness: 0.5})
    : generator.rectangle(x1, y1, x2 - x1, y2 - y1,{roughness: 0.5});
  return { x1, y1, x2, y2, roughElement };
}

function App() {
  const [elements, setElements] = useState<Element[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [elementType, setElementType] = useState<string>("line");


  useEffect(() => {
    // Add event listener for keydown to toggle between 'line' and 'rectangle' tools
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'l' || event.key === 'L') {
        setElementType('line');
      } else if (event.key === 'r' || event.key === 'R') {
        setElementType('rectangle');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [])

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      console.error("Canvas not found");
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      console.error("2d context not supported");
      return;
    }

    context?.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);
    elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
  }, [elements]);

  const handleLineButtonClick = () => {
    setElementType('line');
  };

  const handleRectangleButtonClick = () => {
    setElementType('rectangle');
  };

  const handleMouseDown = (event: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);

    const { clientX, clientY } = 'touches' in event ? event.touches[0] : (event as React.MouseEvent);


    const element = createElement(clientX, clientY, clientX, clientY, elementType);
    setElements(prevState => [...prevState,element])
  };

  const handleMouseMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;

    const { clientX, clientY } = 'touches' in event ? event.touches[0] : event as React.MouseEvent;
    const index = elements.length - 1;
    const { x1, y1 } = elements[index];
    const updatedElement = createElement(x1, y1, clientX, clientY, elementType);

    const elementsCopy = [...elements];
    elementsCopy[index] = updatedElement;
    setElements(elementsCopy);
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  return (
    <>
      <div style={{ position: "fixed", bottom: 15, right: 15, display: "flex", flexDirection: "column", gap: 10 }}>
        <button 
          id="line" 
          onClick={handleLineButtonClick}
          style={{ backgroundColor: "grey", padding: "5px 10px", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          L
        </button>
        <button 
          id="rectangle" 
          onClick={handleRectangleButtonClick}
          style={{ backgroundColor: "grey", padding: "5px 10px", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          R
        </button>
      </div>
      <canvas
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        Canvas
      </canvas>
    </>
  );
}

export default App;
