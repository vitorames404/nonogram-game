import React, { useState, useEffect, useRef } from "react";

interface GridProps {
  grid: number[][];
  rowHints: number[][];
  colHints: number[][];
  calculateHints: (grid: number[][]) => { rowHints: number[][]; colHints: number[][] };
  winCallBack: () => void;
}

const Grid: React.FC<GridProps> = ({ grid, rowHints, colHints, calculateHints, winCallBack }) => {
  const [answerGrid, setAnswerGrid] = useState<number[][]>([]);

  // Refs avoid stale closures — always reflect current drag state without re-renders
  const isDragging = useRef(false);
  const visitedCells = useRef<Set<string>>(new Set()); // Cells already touched this drag

  useEffect(() => {
    setAnswerGrid(createEmptyGrid(grid.length));
  }, [grid]);

  // End drag on mouseup anywhere on the page — so briefly leaving the grid doesn't break it
  useEffect(() => {
    const handleGlobalMouseUp = () => endDrag();
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Check win on every grid change — uses latest state, not a stale closure
  useEffect(() => {
    if (answerGrid.length === 0) return;
    const { rowHints: calcRow, colHints: calcCol } = calculateHints(answerGrid);
    if (
      JSON.stringify(calcRow) === JSON.stringify(rowHints) &&
      JSON.stringify(calcCol) === JSON.stringify(colHints)
    ) {
      winCallBack();
    }
  }, [answerGrid]);

  const createEmptyGrid = (size: number): number[][] =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => 0));

  // Each cell cycles based on its own current state when first touched during a drag
  const cycleCell = (rowIndex: number, cellIndex: number) => {
    setAnswerGrid(prev =>
      prev.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (rIdx !== rowIndex || cIdx !== cellIndex) return cell;
          return (cell + 1) % 3;
        })
      )
    );
  };

  const onCellMouseDown = (rowIndex: number, cellIndex: number) => {
    isDragging.current = true;
    visitedCells.current = new Set();
    visitedCells.current.add(`${rowIndex}-${cellIndex}`);
    cycleCell(rowIndex, cellIndex);
  };

  const onCellMouseEnter = (rowIndex: number, cellIndex: number) => {
    if (!isDragging.current) return;
    const key = `${rowIndex}-${cellIndex}`;
    if (visitedCells.current.has(key)) return;
    visitedCells.current.add(key);
    cycleCell(rowIndex, cellIndex);
  };

  const endDrag = () => {
    isDragging.current = false;
    visitedCells.current = new Set();
  };

  const size = grid.length || 5;

  return (
    <div className="font-vt323 mr-[120px] z-1">
      <div>
        {/* Column Hints — dynamic columns, works for any grid size */}
        <div
          className="grid py-3 ml-[110px] z-1 h-[120px]"
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            userSelect: "none",
          }}
        >
          {colHints.map((hint, colIndex) => (
            <div
              key={colIndex}
              className="flex text-2xl flex-col items-center justify-end font-bold text-center text-white"
            >
              {hint.map((num, index) => (
                <span key={index} className="leading-tight">
                  {num}
                </span>
              ))}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Row Hints — dynamic rows */}
          <div
            className="grid text-white mr-4 w-[100px]"
            style={{
              gridTemplateRows: `repeat(${size}, 1fr)`,
              userSelect: "none",
            }}
          >
            {rowHints.map((hint, rowIndex) => (
              <div
                key={rowIndex}
                className="flex text-2xl items-center justify-end text-white font-bold"
              >
                {hint.join(" ")}
              </div>
            ))}
          </div>

          {/* Answer Grid */}
          <div
            className="grid gap-1 w-[50vw] h-[50vw] max-w-[400px] max-h-[400px]"
            style={{
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              gridTemplateRows: `repeat(${size}, 1fr)`,
            }}
          >
            {answerGrid.map((row, rowIndex) =>
              row.map((cell, cellIndex) => (
                <div
                  key={`${rowIndex}-${cellIndex}`}
                  onMouseDown={() => onCellMouseDown(rowIndex, cellIndex)}
                  onMouseEnter={() => onCellMouseEnter(rowIndex, cellIndex)}
                  className={`cursor-pointer w-full h-full border border-gray-700 transition-colors duration-100 ${
                    cell === 0
                      ? "bg-white hover:bg-gray-200"
                      : cell === 1
                      ? "bg-blue-700 cell-filled"
                      : "bg-red-700 cell-blocked"
                  }`}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Grid;
