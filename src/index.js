import * as THREE from "three";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

import MyTexture from "./assets/max_rgbd.png";

let mesh;
let material;
let image_ar;

const settings = {
  metalness: 0.0,
  roughness: 1.0,
  ambientIntensity: 0.75,
  displacementScale: 5,
  displacementBias: -6,
};

// init
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
camera.position.z = 3;

const scene = new THREE.Scene();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.5);
pointLight.position.z = 2500;
scene.add(pointLight);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);
//renderer.xr.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// animation
function animation(time) {
  //mesh.rotation.x = time / 2000;
  //mesh.rotation.y = time / 1000;

  renderer.render(scene, camera);
}

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);

// convert mouse coordinates to 3D space
function getMousePosition(event, domElement) {
  const rect = domElement.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
  return { x, y };
}

// event listener
renderer.domElement.addEventListener("mousemove", (event) => {
  const mousePosition = getMousePosition(event, renderer.domElement);
  const vector = new THREE.Vector3(mousePosition.x, mousePosition.y, -0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const newPos = camera.position.clone().add(dir.multiplyScalar(distance));

  camera.position.x += (newPos.x - camera.position.x) * 0.05;
  camera.position.y += (newPos.y - camera.position.y) * 0.05;
  camera.lookAt(scene.position);
});

// orbit controls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableZoom = true;
// controls.enableDamping = true;

const image = new Image();
image.onload = function () {
  if (mesh) {
    mesh.geometry.dispose();
    mesh.material.dispose();
    scene.remove(mesh);
  }

  image_ar = image.width / image.height / 2;

  const ctx = document.createElement("canvas").getContext("2d");
  ctx.canvas.width = image.width / 2;
  ctx.canvas.height = image.height;
  ctx.drawImage(
    image,
    0,
    0,
    image.width / 2,
    image.height,
    0,
    0,
    image.width / 2,
    image.height
  );
  const myrgbmap = new THREE.CanvasTexture(ctx.canvas);

  const ctx2 = document.createElement("canvas").getContext("2d");
  ctx2.canvas.width = image.width / 2;
  ctx2.canvas.height = image.height;
  ctx2.drawImage(
    image,
    image.width / 2,
    0,
    image.width / 2,
    image.height,
    0,
    0,
    image.width / 2,
    image.height
  );
  const mydepthmap = new THREE.CanvasTexture(ctx2.canvas);

  // material
  material = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    roughness: settings.roughness,
    metalness: settings.metalness,

    map: myrgbmap,

    displacementMap: mydepthmap,
    displacementScale: settings.displacementScale,
    displacementBias: settings.displacementBias,

    side: THREE.DoubleSide,
  });

  // generating geometry and add mesh to scene
  const geometry = new THREE.PlaneGeometry(10, 10, 512, 512);
  mesh = new THREE.Mesh(geometry, material);
  mesh.scale.y = 1.0 / image_ar;
  mesh.scale.multiplyScalar(0.23);
  scene.add(mesh);
};
image.src = MyTexture;

// setup gui
// const gui = new GUI();
// gui
//   .add(settings, "metalness")
//   .min(0)
//   .max(1)
//   .onChange(function (value) {
//     material.metalness = value;
//   });
// gui
//   .add(settings, "roughness")
//   .min(0)
//   .max(1)
//   .onChange(function (value) {
//     material.roughness = value;
//   });
// gui
//   .add(settings, "ambientIntensity")
//   .min(0)
//   .max(1)
//   .onChange(function (value) {
//     ambientLight.intensity = value;
//   });
// gui
//   .add(settings, "displacementScale")
//   .min(0)
//   .max(30.0)
//   .onChange(function (value) {
//     material.displacementScale = value;
//   });
// gui
//   .add(settings, "displacementBias")
//   .min(-10)
//   .max(10)
//   .onChange(function (value) {
//     material.displacementBias = value;
//   });

// setup drop zone
var dropZone = document.getElementById("dropzone");

function showDropZone() {
  dropZone.style.display = "block";
}
function hideDropZone() {
  dropZone.style.display = "none";
}

function allowDrag(e) {
  if (true) {
    // Test that the item being dragged is a valid one
    e.dataTransfer.dropEffect = "copy";
    e.preventDefault();
  }
}

function handleDrop(e) {
  e.preventDefault();
  hideDropZone();
  const fileList = event.dataTransfer.files;
  if (fileList.length > 0) {
    readImage(fileList[0]);
  }
}

function readImage(file) {
  const reader = new FileReader();
  reader.addEventListener("load", (event) => {
    image.src = event.target.result;
  });
  reader.readAsDataURL(file);
}

window.addEventListener("dragenter", function (e) {
  showDropZone();
});
dropZone.addEventListener("dragenter", allowDrag);
dropZone.addEventListener("dragover", allowDrag);
dropZone.addEventListener("dragleave", function (e) {
  console.log("dragleave");
  hideDropZone();
});
dropZone.addEventListener("drop", handleDrop);

// listen for messages
window.addEventListener("message", function (e) {
  if (e.data?.imagedata) {
    image.src = e.data.imagedata;
  }
});
