import * as THREE from "three";
import type { KeyDefinition } from "./layout";

function outline(width: number, depth: number, enter: boolean) {
  const w = width / 2,
    d = depth / 2;
  const vertices = enter
    ? [
        [-w, -d],
        [w, -d],
        [w, d],
        [w - 0.9, d],
        [w - 0.9, -d + 1],
        [-w, -d + 1],
      ]
    : [
        [-w, -d],
        [w, -d],
        [w, d],
        [-w, d],
      ];
  const shape = new THREE.Shape();
  const radius = 0.14;
  vertices.forEach((v, i) => {
    const prev = vertices[(i + vertices.length - 1) % vertices.length],
      next = vertices[(i + 1) % vertices.length];
    const a = new THREE.Vector2(prev[0] - v[0], prev[1] - v[1])
      .normalize()
      .multiplyScalar(radius);
    const b = new THREE.Vector2(next[0] - v[0], next[1] - v[1])
      .normalize()
      .multiplyScalar(radius);
    if (i === 0) shape.moveTo(v[0] + a.x, v[1] + a.y);
    else shape.lineTo(v[0] + a.x, v[1] + a.y);
    shape.quadraticCurveTo(v[0], v[1], v[0] + b.x, v[1] + b.y);
  });
  shape.closePath();
  return shape.getPoints(8).slice(0, -1);
}

export function createKeyGeometry(key: KeyDefinition) {
  const width = key.width,
    depth = key.depth ?? 1;
  const perimeter = outline(width, depth, key.shape === "enter");
  const points: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  // Multiple loft rings form the bottom bevel, tapered walls, and rounded shoulder.
  const rings = [
    [0.0, 0.025],
    [0.035, 0],
    [0.1, 0.008],
    [0.6, 0.065],
    [0.7, 0.085],
    [0.755, 0.105],
    [0.775, 0.13],
  ];
  for (const [y, inset] of rings)
    for (const p of perimeter) {
      points.push(
        p.x * (1 - (inset * 2) / width),
        y,
        p.y * (1 - (inset * 2) / depth),
      );
      uvs.push(p.x / width + 0.5, 0.5 - p.y / depth);
    }
  const n = perimeter.length;
  for (let j = 0; j < rings.length - 1; j++)
    for (let i = 0; i < n; i++) {
      const a = j * n + i,
        b = j * n + ((i + 1) % n),
        c = (j + 1) * n + i,
        d = (j + 1) * n + ((i + 1) % n);
      indices.push(a, c, b, b, c, d);
    }
  const sidesCount = indices.length;
  const topWidth = width - 0.26,
    topDepth = depth - 0.26;
  const top = perimeter.map(
    (p) =>
      new THREE.Vector2((p.x * topWidth) / width, (p.y * topDepth) / depth),
  );
  // Triangulate the concave ISO Enter outline; subdivide every triangle for a shallow dish.
  const triangles = THREE.ShapeUtils.triangulateShape(top, []);
  const dish = (x: number, z: number) =>
    0.775 -
    0.035 *
      Math.max(0, 1 - (x / (topWidth / 2)) ** 2) *
      Math.max(0, 1 - (z / (topDepth / 2)) ** 2);
  const add = (p: THREE.Vector2) => {
    const idx = points.length / 3;
    points.push(p.x, dish(p.x, p.y), p.y);
    uvs.push(p.x / topWidth + 0.5, 0.5 - p.y / topDepth);
    return idx;
  };
  const subdivide = (
    a: THREE.Vector2,
    b: THREE.Vector2,
    c: THREE.Vector2,
    level: number,
  ) => {
    if (!level) {
      indices.push(add(a), add(c), add(b));
      return;
    }
    const ab = a.clone().add(b).multiplyScalar(0.5),
      bc = b.clone().add(c).multiplyScalar(0.5),
      ca = c.clone().add(a).multiplyScalar(0.5);
    subdivide(a, ab, ca, level - 1);
    subdivide(ab, b, bc, level - 1);
    subdivide(ca, bc, c, level - 1);
    subdivide(ab, bc, ca, level - 1);
  };
  triangles.forEach(([a, b, c]) => subdivide(top[a], top[b], top[c], 3));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.addGroup(0, sidesCount, 0);
  geometry.addGroup(sidesCount, indices.length - sidesCount, 1);
  return geometry;
}

export function createLegend(key: KeyDefinition) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = key.color;
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.fillStyle = "#29332c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const topWidth = key.width - 0.26,
    topDepth = (key.depth ?? 1) - 0.26;
  ctx.save();
  ctx.translate(512, key.shape === "enter" ? 245 : 485);
  ctx.scale(1 / topWidth, 1 / topDepth);
  ctx.font = `${key.label.length > 1 ? 235 : 340}px Arial, sans-serif`;
  ctx.fillText(key.label, 0, 0);
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createCaseGeometry(
  width: number,
  depth: number,
  height: number,
  radius: number,
) {
  const bevel = Math.min(0.035, height / 4),
    w = width / 2 - bevel,
    d = depth / 2 - bevel,
    r = radius;
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -d);
  shape.lineTo(w - r, -d);
  shape.quadraticCurveTo(w, -d, w, -d + r);
  shape.lineTo(w, d - r);
  shape.quadraticCurveTo(w, d, w - r, d);
  shape.lineTo(-w + r, d);
  shape.quadraticCurveTo(-w, d, -w, d - r);
  shape.lineTo(-w, -d + r);
  shape.quadraticCurveTo(-w, -d, -w + r, -d);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height - 2 * bevel,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geometry.center();
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}
