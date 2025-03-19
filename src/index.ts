import {type CartesianScaleTypeRegistry, Chart} from 'chart.js';

import GaugeController, {
    GaugeControllerDatasetOptions,
    GaugeDataPoint,
    GaugeMetaExtensions
} from './controllers/controller.gauge';
import type {GaugeControllerChartOptions} from "./options/options.gauge";

console.log("Gauge Controller registered in Chart.js");
declare module 'chart.js' {
    interface ChartTypeRegistry {
        gauge: {
            chartOptions: GaugeControllerChartOptions;
            datasetOptions: GaugeControllerDatasetOptions;
            defaultDataPoint: GaugeDataPoint;
            metaExtensions: GaugeMetaExtensions;
            parsedDataType: number;
            scales: keyof CartesianScaleTypeRegistry;
        };
    }
}

Chart.register(GaugeController);


