import { createInstance } from "orve";
import { App } from "./cases";
import { router } from "./cases/BaseRouter/router";
import { store } from "./cases/Plugin/user";

// Main - простой кейс чата
// import { Main } from "./project/main";
// import { Training } from "./traning/main";
// Training;

const INSTANCE = App;// Main // App

createInstance().use(store).use(router).rootComponent(INSTANCE).mountRoot("#app");
