const createGrid = (size) => {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => (Math.random() < 0.5 ? 0 : 1))
  );
};

const calculateHints = (grid) => {
  const calculateLineHints = (line) => {
    const hints = [];
    let count = 0;

    for (const cell of line) {
      if (cell === 1) {
        count += 1;
      } else if (count > 0) {
        hints.push(count);
        count = 0;
      }
    }

    if (count > 0) hints.push(count);
    return hints.length > 0 ? hints : [0];
  };

  const rowHints = grid.map((row) => calculateLineHints(row));
  const colHints = grid[0].map((_, colIndex) =>
    calculateLineHints(grid.map((row) => row[colIndex]))
  );

  return { rowHints, colHints };
};

module.exports = { createGrid, calculateHints };
