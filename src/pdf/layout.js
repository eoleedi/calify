export function groupRows(items, yTolerance = 2) {
  const rows = [];

  for (const item of [...items]
    .filter((item) => typeof item.text === "string" && item.text.trim() !== "")
    .sort((a, b) => b.y - a.y)) {
    const row = rows.at(-1);
    if (!row || Math.abs(item.y - row[0].y) > yTolerance) {
      rows.push([item]);
    } else {
      row.push(item);
    }
  }

  return rows.map((row) => row.sort((a, b) => a.x - b.x));
}

export function assignColumns(row, anchors, tolerance = 30) {
  const columns = anchors.map(() => []);

  for (const item of row) {
    let nearest = -1;
    let nearestDistance = Infinity;
    anchors.forEach((anchor, index) => {
      const distance = Math.abs(item.x - anchor);
      if (distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    });
    if (nearest !== -1 && nearestDistance <= tolerance) {
      columns[nearest].push(item.text.trim());
    }
  }

  return columns.map((column) => column.join(" ").trim());
}
