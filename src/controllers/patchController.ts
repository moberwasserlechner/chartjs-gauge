import {ChartComponent, ChartComponentLike, registry} from 'chart.js';

export default function patchController<T, TYPE>(
    type: TYPE,
    config: T,
    controller: ChartComponentLike,
    elements: ChartComponent | ChartComponent[] = [],
    scales: ChartComponent | ChartComponent[] = []
): T & { type: TYPE } {
    registry.addControllers(controller);
    if (Array.isArray(elements)) {
        registry.addElements(...elements);
    } else {
        registry.addElements(elements);
    }
    if (Array.isArray(scales)) {
        registry.addScales(...scales);
    } else {
        registry.addScales(scales);
    }
    const c = config as any;
    c.type = type;
    return c;
}
