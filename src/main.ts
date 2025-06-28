import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { Timer } from "three/examples/jsm/Addons.js";
// import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import GUI from "lil-gui";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import wobbleVertexShader from "./shaders/wobble/vertex.glsl";
import wobbleFragmentShader from "./shaders/wobble/fragment.glsl";

/**
 * Set up Gui
 */

const gui = new GUI({ width: 340 });

const debugObject = {
  clearColor: "#29191f",
  primaryColor: "#0000ff",
  secondaryColor: "#ff0000",
};

/**
 * Set up scene
 */

const scene = new THREE.Scene();

/**
 * Set up loaders
 */

const rgbeLoader = new RGBELoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Environment map
 */
rgbeLoader.load("./urban_alley_01_1k.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = environmentMap;
  scene.environment = environmentMap;
});

/**
 * Wobble
 */
// Material

const uniforms = {
  uTime: new THREE.Uniform(0),

  uPositionFrequency: new THREE.Uniform(0.5),
  uTimeFrequency: new THREE.Uniform(0.4),
  uStrength: new THREE.Uniform(0.3),

  uWarpPositionFrequency: new THREE.Uniform(0.38),
  uWarpTimeFrequency: new THREE.Uniform(0.12),
  uWarpStrength: new THREE.Uniform(1.7),

  uPrimaryColor: new THREE.Uniform(new THREE.Color(debugObject.primaryColor)),
  uSecondaryColor: new THREE.Uniform(
    new THREE.Color(debugObject.secondaryColor)
  ),
};

const material = new CustomShaderMaterial<typeof THREE.MeshPhysicalMaterial>({
  // CSM
  baseMaterial: THREE.MeshPhysicalMaterial,
  vertexShader: wobbleVertexShader,
  fragmentShader: wobbleFragmentShader,
  uniforms,

  // MeshPhysicsMaterial
  metalness: 0,
  roughness: 0.5,
  color: "#ffffff",
  transmission: 0,
  ior: 1.5,
  thickness: 1.5,
  transparent: true,
  wireframe: false,
});

const depthMaterial = new CustomShaderMaterial<typeof THREE.MeshDepthMaterial>({
  // CSM
  baseMaterial: THREE.MeshDepthMaterial,
  vertexShader: wobbleVertexShader,
  uniforms,

  // MeshDepthMaterial
  depthPacking: THREE.RGBADepthPacking,
});

// Tweaks
gui
  .add(uniforms.uPositionFrequency, "value", 0, 1, 0.001)
  .name("uPositionFrequency");
gui.add(uniforms.uTimeFrequency, "value", 0, 1, 0.001).name("uTimeFrequency");
gui.add(uniforms.uStrength, "value", 0, 1, 0.001).name("uStrength");
gui
  .add(uniforms.uWarpPositionFrequency, "value", 0, 1, 0.001)
  .name("uWarpPositionFrequency");
gui
  .add(uniforms.uWarpTimeFrequency, "value", 0, 1, 0.001)
  .name("uWarpTimeFrequency");
gui.add(uniforms.uWarpStrength, "value", 0, 1, 0.001).name("uWarpStrength");

gui.addColor(debugObject, "primaryColor").onChange((color: string) => {
  uniforms.uPrimaryColor.value.set(color);
});
gui.addColor(debugObject, "secondaryColor").onChange((color: string) => {
  uniforms.uSecondaryColor.value.set(color);
});

gui.add(material as any, "metalness", 0, 1, 0.001);
gui.add(material as any, "roughness", 0, 1, 0.001);
gui.add(material as any, "transmission", 0, 1, 0.001);
gui.add(material as any, "ior", 0, 10, 0.001);
gui.add(material as any, "thickness", 0, 10, 0.001);

// // Geometry
// const baseGeometry = new THREE.IcosahedronGeometry(2.5, 50);
// const geometry = mergeVertices(baseGeometry);
// geometry.computeTangents();

// // Mesh
// const wobble = new THREE.Mesh(geometry, material);
// wobble.customDepthMaterial = depthMaterial;
// wobble.receiveShadow = true;
// wobble.castShadow = true;
// scene.add(wobble);

gltfLoader.load("/suzanne.glb", (gltf) => {

  const wobble = gltf.scene.children[0] as THREE.Mesh;
  wobble.material = material;
  wobble.customDepthMaterial = depthMaterial;
  wobble.castShadow = true;
  wobble.receiveShadow = true;

  scene.add(wobble);

});

/**
 * Plane
 */
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(15, 15, 15),
  new THREE.MeshStandardMaterial()
);
plane.receiveShadow = true;
plane.rotation.y = Math.PI;
plane.position.y = -5;
plane.position.z = 5;
scene.add(plane);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 2, -2.25);
scene.add(directionalLight);

/**
 * Set up canvas
 */

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

/**
 * Camera
 */

// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(4.5, 4, 16);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;

/**
 * Renderer
 */

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

renderer.setClearColor(debugObject.clearColor);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/**
 * Animation loop
 */

const timer = new Timer();

const tick = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();
  // const deltaTime = timer.getDelta();

  // update controls to enable damping
  controls.update();

  // animations

  // update uniforms
  uniforms.uTime.value = elapsedTime;

  // render
  renderer.render(scene, camera);

  // request next frame
  window.requestAnimationFrame(tick);
};

tick();

/**
 * Handle window resize
 */

function handleResize() {
  // Update sizes
  const visualViewport = window.visualViewport!;
  const width = visualViewport.width;
  const height = visualViewport.height;

  canvas.width = width;
  canvas.height = height;

  sizes.width = width;
  sizes.height = height;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Update camera
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

/**
 * Usar el evento 'resize' de visualViewport para móviles
 */

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleResize);
} else {
  window.addEventListener("resize", handleResize);
}
