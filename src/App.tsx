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
  type: 'line' | 'rectangle';
  id: number;
  offsetX?: number | undefined;
  offsetY?: number | undefined;
}

interface Point {
  x: number;
  y: number;
}

function createElement(id: number,x1: number, y1: number, x2: number, y2: number, type: string):Element {
  const lineColor = "grey"
  const roughElement = type === "line"
    ? generator.line(x1, y1, x2, y2,{roughness: 0.5,stroke: lineColor })
    : generator.rectangle(x1, y1, x2 - x1, y2 - y1,{roughness: 0.5,stroke: lineColor });
  return {id, x1, y1, x2, y2, roughElement , type: type as 'line'| 'rectangle',offsetX: undefined, offsetY: undefined  };
}

const distance = (a: Point, b: Point) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))

const isWithinElement = (x: number, y: number, element: Element):boolean=>{
  const {type,x1,x2,y1,y2} = element
  if(type === "rectangle"){
    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)
    return x >= minX &&  x <= maxX && y >= minY && y <= maxY
  }else{
    const a = { x:x1, y:y1}
    const b = { x:x2, y:y2}
    const c = { x, y}
    const offset = distance(a,b) - (distance(a,c) + distance(b,c))
    return Math.abs(offset) < 1
  }
}

const getElementAtPosition= (x:number, y:number, elements: Element[]): Element | undefined=>{
  return elements.find(element => isWithinElement(x,y,element))
}

function App() {
  const [elements, setElements] = useState<Element[]>([]);
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState<string>("line");
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'l' || event.key === 'L') {
        setTool('line');
      } else if (event.key === 'r' || event.key === 'R') {
        setTool('rectangle');
      } else if (event.key === 's' || event.key === 'S') {
        setTool('selection');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

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

  const updateElement = (id: number, x1:number, y1:number, clientX:number, clientY:number, type:string) =>{
    const updatedElement = createElement(id, x1, y1, clientX, clientY, type)

    const elementsCopy = [...elements]
    elementsCopy[id] = updatedElement
    setElements(elementsCopy)
  }

  const handleLineButtonClick = () => {
    setTool('line');
  };

  const handleRectangleButtonClick = () => {
    setTool('rectangle');
  };

  const handleSelection = () =>{
    setTool('selection')
  }

  const handleMouseDown = (event: React.MouseEvent | React.TouchEvent) => {
    const { clientX, clientY } = 'touches' in event ? event.touches[0] : (event as React.MouseEvent);
    if(tool === "selection"){
      const element = getElementAtPosition(clientX, clientY, elements)
      if(element){ 
        const offsetX = clientX - element.x1
        const offsetY = clientY - element.y1
        setSelectedElement({...element, offsetX, offsetY})
        setAction("moving") 
      }
    }else{
      const id = elements.length
      const element = createElement(id,clientX, clientY, clientX, clientY, tool);
      setElements(prevState => [...prevState,element])
      setAction("drawing")
    }
    
  };

  const handleMouseMove = (event: React.MouseEvent | React.TouchEvent) => {
    let clientX, clientY;

    if ('touches' in event) {
      const touch = event.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    if (tool === "selection") {
      const target = event.target as HTMLElement;
      target.style.cursor = getElementAtPosition(clientX, clientY, elements) 
      ? "move" : 
      "default";
    } else {
      const target = event.target as HTMLElement;
      target.style.cursor = "default";
    }
    

    if (action === "drawing"){
      const { clientX, clientY } = 'touches' in event ? event.touches[0] : event as React.MouseEvent;
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];
      updateElement(index,x1, y1, clientX, clientY, tool);
    } else if(action === "moving" && selectedElement){
      const {id, x1, x2, y1, y2, type, offsetX = 0, offsetY=0} = selectedElement
      const height = y2 -y1
      const width = x2 -x1
      const newX1 = clientX - offsetX
      const newY1 = clientY - offsetY
      updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type)
    }
  };

  const handleMouseUp = () => {
    setAction("none");
    setSelectedElement(null)
  };

  const toggleDarkMode = () => {
  setDarkMode((prevDarkMode) => {
    const newDarkMode = !prevDarkMode;

    const body = document.body;
    if (newDarkMode) {
      body.style.backgroundColor = "#1a1a1a";
      body.style.color = "#ffffff";
    } else {
      body.style.backgroundColor = "#ffffff";
      body.style.color = "#000000";
    }

    return newDarkMode;
  });
};

  

  return (
    <>
      <div style={{ position: "fixed", bottom: 15, right: 15, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          id="darkMode"
          onClick={toggleDarkMode}
          style={{
            backgroundColor: darkMode ? "grey" : "#757575",
            color: darkMode ? "white" : "#ffffff",
            padding: "5px 10px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          <svg data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"></path>
          </svg>
          
        </button>
        <button 
          id="selection" 
          onClick={handleSelection}
          style={{ backgroundColor: "grey", padding: "5px 10px", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          <svg data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"></path>
          </svg>
        </button>
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
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
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
