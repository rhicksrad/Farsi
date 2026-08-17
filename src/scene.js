import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const CANNON_URL = "./assets/models/low-poly-cannon.glb";
const VILLAGE_URL = "./assets/models/low-poly-desert-village.glb";

export async function setupArtilleryScene(arena) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.domElement.className = "scene-canvas";
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  arena.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 4.8, 15);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xfff1cf, 0x315241, 2.2));
  const sunlight = new THREE.DirectionalLight(0xffe1a0, 3.2);
  sunlight.position.set(-4, 9, 8);
  sunlight.castShadow = true;
  scene.add(sunlight);

  const loader = new GLTFLoader();
  const [cannonGltf, villageGltf] = await Promise.all([
    loader.loadAsync(CANNON_URL),
    loader.loadAsync(VILLAGE_URL),
  ]);

  const playerCannon = cannonGltf.scene;
  prepareModel(playerCannon, 1.55);
  playerCannon.position.set(-4.35, 0.25, 0.3);
  playerCannon.rotation.y = 0.42;
  scene.add(playerCannon);

  const enemyCannon = playerCannon.clone(true);
  enemyCannon.position.set(4.35, 0.75, 0.1);
  enemyCannon.rotation.y = Math.PI - 0.42;
  tintModel(enemyCannon, new THREE.Color(0xb85545));
  scene.add(enemyCannon);

  const village = villageGltf.scene;
  village.traverse((node) => {
    if (/plane001/i.test(node.name)) node.visible = false;
  });
  prepareModel(village, 5.8);
  village.position.set(0.7, -1.72, -4.2);
  village.rotation.y = -0.18;
  village.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = false;
      node.receiveShadow = true;
    }
  });
  scene.add(village);

  const resize = () => {
    const width = arena.clientWidth;
    const height = arena.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(arena);
  resize();

  let frameId;
  const render = () => {
    frameId = requestAnimationFrame(render);
    renderer.render(scene, camera);
  };
  render();
  document.documentElement.classList.add("has-3d-scene");

  return {
    destroy() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

function prepareModel(model, targetSize) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = targetSize / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(scale);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const center = scaledBox.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -scaledBox.min.y, -center.z);

  model.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
}

function tintModel(model, tint) {
  model.traverse((node) => {
    if (!node.isMesh || !node.material) return;
    node.material = node.material.clone();
    if (node.material.color) node.material.color.lerp(tint, 0.35);
  });
}
