import {ArcElement, registry} from 'chart.js';
import {GaugeController} from "./controllers";

export * from '.';

registry.addControllers(GaugeController);
registry.addElements(ArcElement);
