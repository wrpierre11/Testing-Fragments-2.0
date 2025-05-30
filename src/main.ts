import './style.css'
import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import { StatsModule } from "./StatsModule";
import * as FRAG from "@thatopen/fragments";

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