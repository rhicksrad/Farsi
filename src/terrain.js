import Matter from "matter-js";
import { carveCrater, createTerrainProfile } from "./terrain-model.js";

const { Bodies, Body, Composite, Engine } = Matter;
const ROCK_COLORS = ["#6e664d", "#7b7355", "#575b46", "#8b7a57", "#4b5140"];

export function setupTerrain(arena) {
  const canvas = arena.querySelector("[data-ground]");
  const context = canvas.getContext("2d");
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1.05;
  engine.gravity.scale = 0.001;

  let width = 1;
  let height = 1;
  let profile = createTerrainProfile(width, height);
  let terrainBodies = [];
  let debris = [];
  let frameId = 0;
  let previousTime = performance.now();

  function resize() {
    width = Math.max(1, arena.clientWidth);
    height = Math.max(1, arena.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    reset();
  }

  function reset() {
    for (const fragment of debris) Composite.remove(engine.world, fragment.body);
    debris = [];
    profile = createTerrainProfile(width, height);
    rebuildCollision();
  }

  function getSurfaceY(x) {
    const clampedX = Math.max(0, Math.min(profile.length - 1, x));
    const left = Math.floor(clampedX);
    const right = Math.min(profile.length - 1, left + 1);
    const progress = clampedX - left;
    return profile[left] + (profile[right] - profile[left]) * progress;
  }

  function explode(x, y, radius = 34) {
    const surfaceY = getSurfaceY(x);
    if (Math.abs(y - surfaceY) > radius * 1.35) return false;

    const changed = carveCrater(profile, x, Math.max(y, surfaceY - radius * 0.16), radius, height);
    if (!changed) return false;

    rebuildCollision();
    spawnDebris(x, Math.min(y, surfaceY), radius);
    return true;
  }

  function rebuildCollision() {
    for (const body of terrainBodies) Composite.remove(engine.world, body);
    terrainBodies = [];

    const segmentWidth = Math.max(10, Math.round(width / 72));
    for (let x = 0; x < width; x += segmentWidth) {
      const endX = Math.min(width, x + segmentWidth);
      const top = Math.min(getSurfaceY(x), getSurfaceY((x + endX) / 2), getSurfaceY(endX));
      const bodyHeight = height - top + 60;
      const body = Bodies.rectangle(
        (x + endX) / 2,
        top + bodyHeight / 2,
        endX - x + 2,
        bodyHeight,
        { isStatic: true, friction: 0.82, restitution: 0.08, label: "terrain" },
      );
      terrainBodies.push(body);
    }
    Composite.add(engine.world, terrainBodies);
  }

  function spawnDebris(x, y, radius) {
    const fragmentCount = Math.min(24, Math.max(12, Math.round(radius * 0.42)));
    const now = performance.now();

    for (let index = 0; index < fragmentCount; index += 1) {
      const angle = Math.PI + Math.random() * Math.PI;
      const distance = Math.random() * radius * 0.42;
      const size = 2.8 + Math.random() * Math.min(7, radius * 0.11);
      const sides = 3 + Math.floor(Math.random() * 3);
      const body = Bodies.polygon(
        x + Math.cos(angle) * distance,
        y - 2 - Math.random() * radius * 0.24,
        sides,
        size,
        {
          density: 0.0025,
          friction: 0.76,
          frictionAir: 0.008,
          restitution: 0.28,
          label: "debris",
        },
      );
      const horizontalVelocity = (Math.random() - 0.5) * (radius / 8.5);
      const upwardVelocity = -(2.7 + Math.random() * radius / 8.5);
      Body.setVelocity(body, { x: horizontalVelocity, y: upwardVelocity });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.34);
      const fragment = {
        body,
        bornAt: now,
        color: ROCK_COLORS[Math.floor(Math.random() * ROCK_COLORS.length)],
      };
      debris.push(fragment);
      Composite.add(engine.world, body);
    }
  }

  function drawTerrain() {
    context.clearRect(0, 0, width, height);
    context.save();

    const terrainGradient = context.createLinearGradient(0, height * 0.26, 0, height);
    terrainGradient.addColorStop(0, "#65795a");
    terrainGradient.addColorStop(0.18, "#4b644b");
    terrainGradient.addColorStop(0.62, "#354938");
    terrainGradient.addColorStop(1, "#26362e");

    traceSurface(0);
    context.lineTo(width, height);
    context.lineTo(0, height);
    context.closePath();
    context.fillStyle = terrainGradient;
    context.fill();

    context.globalAlpha = 0.18;
    context.strokeStyle = "#d5b873";
    context.lineWidth = 8;
    for (const depth of [48, 106, 174]) {
      traceSurface(depth);
      context.stroke();
    }

    context.globalAlpha = 1;
    traceSurface(0);
    context.strokeStyle = "#93a36c";
    context.lineWidth = 3;
    context.stroke();

    for (const fragment of debris) drawFragment(fragment);
    context.restore();
  }

  function traceSurface(offset) {
    context.beginPath();
    context.moveTo(0, Math.min(height, profile[0] + offset));
    for (let x = 2; x < profile.length; x += 2) {
      context.lineTo(x, Math.min(height, profile[x] + offset));
    }
  }

  function drawFragment(fragment) {
    const { body } = fragment;
    context.beginPath();
    context.moveTo(body.vertices[0].x, body.vertices[0].y);
    for (let index = 1; index < body.vertices.length; index += 1) {
      context.lineTo(body.vertices[index].x, body.vertices[index].y);
    }
    context.closePath();
    context.fillStyle = fragment.color;
    context.fill();
    context.strokeStyle = "rgb(222 201 143 / 28%)";
    context.lineWidth = 0.75;
    context.stroke();
  }

  function tick(now) {
    const delta = Math.min(32, now - previousTime);
    previousTime = now;
    Engine.update(engine, delta);

    debris = debris.filter((fragment) => {
      const expired = now - fragment.bornAt > 11000;
      const outOfBounds = fragment.body.position.y > height + 100;
      if (expired || outOfBounds) Composite.remove(engine.world, fragment.body);
      return !expired && !outOfBounds;
    });

    drawTerrain();
    frameId = requestAnimationFrame(tick);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(arena);
  resize();
  frameId = requestAnimationFrame(tick);

  return {
    destroy() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      Composite.clear(engine.world, false);
    },
    explode,
    getSurfaceY,
    reset,
  };
}
