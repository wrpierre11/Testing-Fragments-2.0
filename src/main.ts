import './style.css'
import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import { StatsModule } from "./StatsModule";
import * as FRAGS from "@thatopen/fragments";

// ======================
// 1. INITIALIZE COMPONENTS
// ======================

const components = new OBC.Components();

const worlds = components.get(OBC.Worlds);
const world = worlds.create<
  OBC.SimpleScene,
  OBC.SimpleCamera,
  OBC.SimpleRenderer
>();

world.scene = new OBC.SimpleScene(components);
world.scene.setup();
world.scene.three.background = null;

const container = document.getElementById("container")!;
world.renderer = new OBC.SimpleRenderer(components, container);

world.camera = new OBC.SimpleCamera(components);
world.camera.controls.setLookAt(74, 16, 0.2, 30, -4, 27); // convenient position for the model we will load

components.init();

const grids = components.get(OBC.Grids);
grids.create(world);
const statsModule = new StatsModule();
statsModule.attachToRenderer(world.renderer);

// ======================
// 2. FRAGMENTS 2.0 SETUP
// ======================

// Initialize the serializer
const serializer = new FRAGS.IfcImporter();
serializer.wasm = {
  absolute: true,
  path: "https://unpkg.com/web-ifc@0.0.68/" 
};

let fragments: FRAGS.FragmentsModels;

async function setupFragments() {
  // Load the worker file
  const workerUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
  const fetchedWorker = await fetch(workerUrl);
  const workerText = await fetchedWorker.text();
  const workerFile = new File([new Blob([workerText]), "worker.mjs"], "worker.mjs", { type: "text/javascript",
  });
  const url = URL.createObjectURL(workerFile);

  // Create Fragments instance
  fragments = new FRAGS.FragmentsModels(url);

  // Set up camera updates
  world.camera.controls.addEventListener("rest", () => 
    fragments.update(true));
  world.camera.controls.addEventListener("update", () =>
    fragments.update());
}

await setupFragments();

// ======================
// 3. LOAD LOCAL IFC FILE
// ======================

async function loadLocalIfcFile (file: File) {
  try {
    // Convert IFC to Fragment format
    const ifcBuffer = await file.arrayBuffer();
    const ifcBytes = new Uint8Array(ifcBuffer);
    const fragmentBytes = await serializer.process({ bytes: ifcBytes });

    // Load the converted model
    const modelId = `model-${Date.now()}`; // Unique ID for each model
    const model = await fragments.load(fragmentBytes, { modelId });

    // Set up the model in the scene
    model.useCamera(world.camera.three);
    world.scene.three.add(model.object);
    await fragments.update(true);
    
    return modelId;
  } catch (error) {
    console.error("Error loading IFC file:", error);
    throw error;
  }
}

// ======================
// 4. REMOVE MODEL
// ======================

async function removeModel(modelId: string) {
  try {
    await fragments.disposeModel(modelId);
    fragments.update(true);
  } catch (error) {
    console.error("Error removing model:", error);
  }
}

// Event Listener
const ifcFileInput = document.getElementById('ifc-file-input');
if (ifcFileInput) {
  ifcFileInput.addEventListener('change', async (event) => {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      try {
        const modelId = await loadLocalIfcFile(file);
        console.log(`Model loaded with ID: ${modelId}`);
      } catch (error) {
        alert("Failed to load IFC file");
      }
    }
  });
}