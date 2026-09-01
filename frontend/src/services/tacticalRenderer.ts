/**
 * SENTINEL Tactical Visual Scene & Entity Simulation Renderer
 * Renders rich surveillance environments, terrain, actors, vehicles, drones, and HUD
 * directly to HTML5 Canvas to ensure ZERO blank screens and 60FPS fluid tactical playback.
 */

export interface SimulationEntity {
  track_id: string;
  class_name: 'person' | 'drone' | 'bird' | 'vehicle' | 'animal' | 'object';
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  dwell: number;
  zone: string;
  isOutlier: boolean;
  history: [number, number][];
  extra?: any;
}

export function drawScenarioScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scenarioId: string,
  time: number,
  thermalMode: boolean = false
) {
  ctx.save();

  // Color Palettes
  let skyColor = thermalMode ? '#1e0524' : '#1e293b';
  let groundColor = thermalMode ? '#120a1c' : '#0f172a';

  if (scenarioId === 'checkpoint_patrol') {
    // Night IR Palette
    skyColor = thermalMode ? '#1c0520' : '#091310';
    groundColor = thermalMode ? '#100a18' : '#081a14';
  } else if (scenarioId === 'forest_trail') {
    skyColor = thermalMode ? '#200824' : '#061a12';
    groundColor = thermalMode ? '#140c1c' : '#0a2318';
  }

  // 1. Sky & Horizon
  const horizonY = h * 0.38;
  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, w, horizonY);
  ctx.fillStyle = groundColor;
  ctx.fillRect(0, horizonY, w, h - horizonY);

  // 2. Scenario-Specific Terrain & Infrastructure
  if (scenarioId === 'border_incursion' || scenarioId === 'village_baseline') {
    // Road
    ctx.fillStyle = thermalMode ? '#381630' : '#273549';
    ctx.beginPath();
    ctx.moveTo(w * 0.22, horizonY);
    ctx.lineTo(w * 0.44, horizonY);
    ctx.lineTo(w * 0.52, h);
    ctx.lineTo(w * 0.12, h);
    ctx.closePath();
    ctx.fill();

    // Road dashed line
    ctx.strokeStyle = thermalMode ? '#eab308' : '#64748b';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(w * 0.33, horizonY);
    ctx.lineTo(w * 0.32, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Barbed Wire Fence Line (Restricted Border Perimeter on Right)
    const fenceX = w * 0.72;
    ctx.strokeStyle = thermalMode ? '#dc2626' : '#475569';
    ctx.lineWidth = 2;
    // Fence posts
    for (let x = fenceX; x < w; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, horizonY - 10);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    // Barbed wires
    for (let y = horizonY; y < h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(fenceX, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Border Guard Outpost (Top Right)
    ctx.fillStyle = thermalMode ? '#581c87' : '#1e293b';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;
    ctx.fillRect(w * 0.78, horizonY - 60, 130, 60);
    ctx.strokeRect(w * 0.78, horizonY - 60, 130, 60);
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('OUTPOST POST-04 [BORDER LINE]', w * 0.79, horizonY - 45);

    // Village Huts (Left Side)
    ctx.fillStyle = thermalMode ? '#4c1d95' : '#1e293b';
    ctx.fillRect(20, horizonY + 20, 100, 70);
    ctx.fillRect(140, horizonY + 30, 80, 60);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('VILLAGE PERIMETER', 25, horizonY + 35);
  } else if (scenarioId === 'aerial_contradiction') {
    // Airspace Mountain Ridges
    ctx.fillStyle = thermalMode ? '#3b0764' : '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(w * 0.25, horizonY - 70);
    ctx.lineTo(w * 0.5, horizonY - 30);
    ctx.lineTo(w * 0.75, horizonY - 90);
    ctx.lineTo(w, horizonY - 20);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Radar Scanning Beam Sweep
    const angle = (time * 1.5) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.9);
    ctx.lineTo(w * 0.5 + Math.cos(angle) * 600, h * 0.9 + Math.sin(angle) * 600);
    ctx.stroke();

    // Radar Range Rings
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    for (let r = 80; r < 400; r += 70) {
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.9, r, Math.PI, 0);
      ctx.stroke();
    }
  } else if (scenarioId === 'checkpoint_patrol') {
    // Checkpoint Night Security Road & Gate
    ctx.fillStyle = '#132820';
    ctx.fillRect(w * 0.15, 0, w * 0.5, h);
    // Security Gate Barrier
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.5);
    ctx.lineTo(w * 0.52, h * 0.5);
    ctx.stroke();

    // Guard Post & Fuel Depot
    ctx.fillStyle = '#1e3a2f';
    ctx.fillRect(w * 0.55, h * 0.4, 120, 90);
    ctx.strokeRect(w * 0.55, h * 0.4, 120, 90);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('GUARD CHECKPOINT 02', w * 0.56, h * 0.43);

    // Restricted Depot (Top Right)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.strokeStyle = '#ef4444';
    ctx.fillRect(w * 0.70, 20, 180, 140);
    ctx.strokeRect(w * 0.70, 20, 180, 140);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('RESTRICTED ASSET DEPOT', w * 0.72, 40);
  } else if (scenarioId === 'forest_trail') {
    // Forest Trail & Trees
    ctx.fillStyle = '#0f2d1e';
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h);
    ctx.lineTo(w * 0.45, 0);
    ctx.lineTo(w * 0.65, 0);
    ctx.lineTo(w * 0.35, h);
    ctx.closePath();
    ctx.fill();

    // Forest Tree Canopy Clustered
    for (const [tx, ty, r] of [[w * 0.08, h * 0.3, 45], [w * 0.78, h * 0.25, 60], [w * 0.85, h * 0.65, 55], [w * 0.22, h * 0.75, 40]]) {
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Grid scanlines
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
  ctx.lineWidth = 1;
  for (let gy = 0; gy < h; gy += 35) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Computes active entity positions, trajectories, and bounding boxes for any timestamp.
 */
export function getScenarioEntities(
  scenarioId: string,
  time: number,
  w: number = 960,
  h: number = 540
): SimulationEntity[] {
  const entities: SimulationEntity[] = [];
  const loopT = time % 14;

  if (scenarioId === 'border_incursion') {
    // Normal Civilians P01, P02, P03 along road
    for (let i = 0; i < 3; i++) {
      const speed = 1.0 + i * 0.25;
      const progress = ((loopT * speed * 22 + i * 85) % 280) / 280;
      const py = h * 0.42 + progress * (h * 0.52);
      const px = w * 0.28 + (py - h * 0.42) * 0.20 + (i % 2) * 20;

      entities.push({
        track_id: `P0${i + 1}`,
        class_name: 'person',
        x: px,
        y: py,
        vx: 1.2,
        vy: 2.5,
        width: 24,
        height: 52,
        dwell: 1.2,
        zone: 'Road Corridor',
        isOutlier: false,
        history: [[px - 10, py - 20], [px - 5, py - 10], [px, py]]
      });
    }

    // Outlier P07: Deviates toward fence, drops bag, retreats
    let p7x = w * 0.35;
    let p7y = h * 0.50;
    let p7zone = 'Road Corridor';
    let p7dwell = 0.5;

    if (loopT < 3.5) {
      // Phase 1: Transit along road
      p7x = w * 0.32 + loopT * 15;
      p7y = h * 0.44 + loopT * 20;
      p7zone = 'Road Corridor';
    } else if (loopT < 7.5) {
      // Phase 2: Route deviation into Agricultural Buffer
      const devT = loopT - 3.5;
      p7x = w * 0.38 + devT * 65;
      p7y = h * 0.52 + devT * 5;
      p7zone = 'Agricultural Buffer';
      p7dwell = 2.4;
    } else if (loopT < 11.5) {
      // Phase 3: Breach restricted fence & Long Dwell (Dropping Baggage)
      const dwellT = loopT - 7.5;
      p7x = w * 0.64 + Math.sin(dwellT * 2) * 6;
      p7y = h * 0.54;
      p7zone = 'Restricted Fence Line';
      p7dwell = 4.0 + dwellT * 3.5;
    } else {
      // Phase 4: Retreating
      const retT = loopT - 11.5;
      p7x = w * 0.64 - retT * 50;
      p7y = h * 0.54 + retT * 10;
      p7zone = 'Agricultural Buffer';
      p7dwell = 18.2;
    }

    entities.push({
      track_id: 'P07',
      class_name: 'person',
      x: p7x,
      y: p7y,
      vx: 3.5,
      vy: 1.1,
      width: 26,
      height: 54,
      dwell: p7dwell,
      zone: p7zone,
      isOutlier: true,
      history: [
        [w * 0.32, h * 0.44],
        [w * 0.38, h * 0.52],
        [w * 0.55, h * 0.53],
        [p7x, p7y]
      ]
    });

    // Unattended Baggage Object OBJ-01 (dropped after T > 7.5s)
    if (loopT >= 8.0) {
      entities.push({
        track_id: 'OBJ-01',
        class_name: 'object',
        x: w * 0.65,
        y: h * 0.56,
        vx: 0,
        vy: 0,
        width: 20,
        height: 18,
        dwell: (loopT - 8.0) * 3,
        zone: 'Restricted Fence Line',
        isOutlier: true,
        history: [[w * 0.65, h * 0.56]]
      });
    }
  } else if (scenarioId === 'aerial_contradiction') {
    // Biological Bird B01 (sinusoidal flapping flight)
    const b1x = (w * 0.05 + loopT * 65) % w;
    const b1y = h * 0.22 + Math.sin(loopT * 3.5) * 22;
    entities.push({
      track_id: 'B01',
      class_name: 'bird',
      x: b1x,
      y: b1y,
      vx: 6.5,
      vy: 2.1,
      width: 32,
      height: 16,
      dwell: 1.0,
      zone: 'Open Airspace',
      isOutlier: false,
      history: [[b1x - 30, b1y - 10], [b1x - 15, b1y + 5], [b1x, b1y]]
    });

    // Camouflaged Target B04 (Linear synthetic trajectory, 68°C motor)
    const d2x = (w * 0.02 + loopT * 85) % w;
    const d2y = h * 0.14;
    entities.push({
      track_id: 'B04',
      class_name: 'drone',
      x: d2x,
      y: d2y,
      vx: 12.5,
      vy: 0.1,
      width: 38,
      height: 18,
      dwell: 3.2,
      zone: 'Airspace Buffer',
      isOutlier: true,
      history: [[d2x - 60, d2y], [d2x - 30, d2y], [d2x, d2y]],
      extra: { motorTemp: 68.4, rpm: 3400 }
    });
  } else if (scenarioId === 'checkpoint_patrol') {
    // Civilian Vehicle approaching checkpost
    const vy = Math.min(h * 0.52, h * 0.10 + loopT * 35);
    entities.push({
      track_id: 'VEH-01',
      class_name: 'vehicle',
      x: w * 0.35,
      y: vy,
      vx: 0,
      vy: 3.5,
      width: 70,
      height: 45,
      dwell: vy >= h * 0.50 ? (loopT - 4) * 2 : 1.0,
      zone: 'Inspection Corridor',
      isOutlier: false,
      history: [[w * 0.35, vy - 40], [w * 0.35, vy]]
    });

    // Infiltrator P09 sneaking to Restricted Depot
    const p9progress = Math.min(1.0, loopT / 12);
    const p9x = w * 0.60 + p9progress * (w * 0.22) + Math.sin(loopT * 2) * 10;
    const p9y = h * 0.75 - p9progress * (h * 0.55);
    entities.push({
      track_id: 'P09',
      class_name: 'person',
      x: p9x,
      y: p9y,
      vx: 4.2,
      vy: 3.8,
      width: 24,
      height: 52,
      dwell: p9progress > 0.6 ? 14.5 : 2.0,
      zone: p9progress > 0.5 ? 'Restricted Fuel Depot' : 'Perimeter Fence',
      isOutlier: true,
      history: [
        [w * 0.60, h * 0.75],
        [w * 0.68, h * 0.50],
        [p9x, p9y]
      ]
    });
  } else if (scenarioId === 'forest_trail') {
    // Animal Grazing slowly
    const ax = w * 0.75 + Math.sin(loopT * 0.8) * 15;
    const ay = h * 0.45 + (loopT * 2) % 30;
    entities.push({
      track_id: 'ANIMAL-01',
      class_name: 'animal',
      x: ax,
      y: ay,
      vx: 0.4,
      vy: 0.2,
      width: 38,
      height: 24,
      dwell: 8.5,
      zone: 'Wildlife Corridor',
      isOutlier: false,
      history: [[ax - 10, ay], [ax, ay]]
    });

    // Infiltrator P14 sprinting at 3.2x speed
    const p14x = (w * 0.10 + loopT * 110) % w;
    const p14y = h * 0.82 - (loopT * 60) % (h * 0.70);
    entities.push({
      track_id: 'P14',
      class_name: 'person',
      x: p14x,
      y: p14y,
      vx: 11.2,
      vy: 6.5,
      width: 24,
      height: 50,
      dwell: 0.8,
      zone: 'Restricted Border Trail',
      isOutlier: true,
      history: [[p14x - 60, p14y + 30], [p14x - 30, p14y + 15], [p14x, p14y]]
    });
  } else {
    // Village Nominal Flow P01 - P05
    for (let i = 0; i < 5; i++) {
      const speed = 0.9 + i * 0.2;
      const progress = ((loopT * speed * 20 + i * 60) % 260) / 260;
      const py = h * 0.44 + progress * (h * 0.50);
      const px = w * 0.26 + (py - h * 0.44) * 0.22 + (i % 2) * 22;

      entities.push({
        track_id: `P0${i + 1}`,
        class_name: 'person',
        x: px,
        y: py,
        vx: 1.1,
        vy: 2.2,
        width: 22,
        height: 48,
        dwell: 1.4,
        zone: 'Village Transit Road',
        isOutlier: false,
        history: [[px - 5, py - 10], [px, py]]
      });
    }
  }

  return entities;
}

export function drawEntityVisual(
  ctx: CanvasRenderingContext2D,
  ent: SimulationEntity,
  isSelected: boolean = false,
  thermalMode: boolean = false
) {
  const { x, y, width, height, class_name, track_id, isOutlier, dwell } = ent;
  const hx = width / 2;
  const hy = height / 2;

  ctx.save();

  // 1. Draw Body Shape
  if (class_name === 'person') {
    // Head
    ctx.fillStyle = thermalMode ? '#f59e0b' : (isOutlier ? '#ef4444' : '#06b6d4');
    ctx.beginPath();
    ctx.arc(x, y - hy + 8, 7, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = thermalMode ? '#ef4444' : (isOutlier ? '#b91c1c' : '#0284c7');
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 9, hy - 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (class_name === 'drone') {
    // Drone Crossframe & Rotors
    ctx.fillStyle = thermalMode ? '#dc2626' : '#a855f7';
    ctx.fillRect(x - hx, y - 4, width, 8);
    ctx.fillRect(x - 4, y - hy, 8, height);

    // Rotors spinning
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - hx - 2, y - hy - 2, 10, 6);
    ctx.strokeRect(x + hx - 8, y - hy - 2, 10, 6);
    ctx.strokeRect(x - hx - 2, y + hy - 4, 10, 6);
    ctx.strokeRect(x + hx - 8, y + hy - 4, 10, 6);

    // Flashing thermal hotspot
    if (ent.extra?.motorTemp) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (class_name === 'bird') {
    // Avian Silhouette
    ctx.fillStyle = thermalMode ? '#fbbf24' : '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(x, y, hx, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wings
    ctx.beginPath();
    ctx.moveTo(x - hx, y);
    ctx.quadraticCurveTo(x, y - 16, x + hx, y);
    ctx.stroke();
  } else if (class_name === 'vehicle') {
    ctx.fillStyle = thermalMode ? '#d97706' : '#3b82f6';
    ctx.fillRect(x - hx, y - hy, width, height);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x - hx + 8, y - hy + 6, width - 16, height - 12);
  } else if (class_name === 'object') {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x - hx, y - hy, width, height);
    ctx.strokeStyle = '#fef08a';
    ctx.strokeRect(x - hx, y - hy, width, height);
  } else {
    // Animal
    ctx.fillStyle = thermalMode ? '#ca8a04' : '#10b981';
    ctx.beginPath();
    ctx.ellipse(x, y, hx, hy, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Tactical Bounding Box & HUD Labels
  const boxColor = isOutlier ? '#ef4444' : (isSelected ? '#06b6d4' : '#38bdf8');
  ctx.strokeStyle = boxColor;
  ctx.lineWidth = isSelected || isOutlier ? 2.5 : 1.5;
  ctx.strokeRect(x - hx - 4, y - hy - 4, width + 8, height + 8);

  // Corner tactical brackets
  const cLen = 7;
  const bx = x - hx - 4;
  const by = y - hy - 4;
  const bw = width + 8;
  const bh = height + 8;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bx, by + cLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cLen, by); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + bw - cLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cLen); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx, by + bh - cLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cLen, by + bh); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + bw - cLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cLen); ctx.stroke();

  // Header Badge
  const badgeText = `${track_id} • ${class_name.toUpperCase()}`;
  ctx.font = 'bold 10px monospace';
  const textWidth = ctx.measureText(badgeText).width;
  ctx.fillStyle = boxColor;
  ctx.fillRect(bx, Math.max(0, by - 16), textWidth + 10, 16);
  ctx.fillStyle = '#000000';
  ctx.fillText(badgeText, bx + 5, Math.max(12, by - 4));

  // Dwell Subtext
  if (dwell > 1.0) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(bx, by + bh + 2, 75, 13);
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px monospace';
    ctx.fillText(`DWELL: ${dwell.toFixed(1)}s`, bx + 3, by + bh + 11);
  }

  ctx.restore();
}
