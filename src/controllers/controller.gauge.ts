import type {
  ArcProps,
  DoughnutControllerDatasetOptions,
  DoughnutDataPoint,
  DoughnutMetaExtensions,
  Element,
  ScriptableAndArrayOptions,
  ScriptableContext,
  UpdateMode,
} from 'chart.js';
import {
  ArcElement,
  Chart,
  DoughnutController,
} from 'chart.js';
import {
  addRoundedRectPath, renderText, toFont, toPercentage, toRadians, toTRBLCorners,
} from 'chart.js/helpers';

import type {
    GaugeControllerChartOptions,
    GaugeControllerOptions,
    NeedleOptions,
    ValueLabelOptions
} from "../options/options.gauge";
import type {DeepPartial} from "chart.js/dist/types/utils";

const needleDefaults: Partial<NeedleOptions> = {
  radius: '10%',
  width: '15%',
  length: '80%',
};

const valueLabelDefaults: Partial<ValueLabelOptions> = {
  display: true,
  font: undefined,
  formatter: Math.round,
  // color: Chart.defaults.color as any,
  color: (() => '#FFF') as any,
  backgroundColor: Chart.defaults.backgroundColor as any,
  borderColor: Chart.defaults.borderColor as any,
  borderWidth: 0,
  borderRadius: 5,
  padding: {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
  },
  offsetX: 0,
  offsetY: 0,
};


const defaults: DeepPartial<GaugeControllerChartOptions> = {
  needle: needleDefaults,
  valueLabel: valueLabelDefaults,
  animation: {
    animateRotate: true,
    animateScale: false,
  },
  cutout: '50%',
  rotation: -90, // -Math.PI
  circumference: 180, // 2 * Math.PI,
  value: 0,
  minValue: 0,
};

/**
 * [DoughnutControllerDatasetOptions](https://www.chartjs.org/docs/3.6.0/api/interfaces/DoughnutControllerDatasetOptions.html)
 */
export interface GaugeControllerDatasetOptions extends DoughnutControllerDatasetOptions {
  needle: ScriptableAndArrayOptions<NeedleOptions, ScriptableContext<'gauge'>>;
  valueLabel: ScriptableAndArrayOptions<ValueLabelOptions, ScriptableContext<'gauge'>>;

  /**
   * Value used for the needle.
   * @default 0
   */
  value: number;

  /**
    * Used to offset the start value.
    * @default 0
    */
  minValue: number;
}

export type GaugeDataPoint = DoughnutDataPoint;

/**
 * @private
 */
export interface GaugeMetaExtensions extends DoughnutMetaExtensions {
  // DoughnutMetaExtensions private member
  _parsed: number[];
}

export class GaugeController extends DoughnutController {
  static readonly id = 'gauge';

  /** @internal */
  static readonly defaults = defaults;

  /** @internal */
  static readonly descriptors = {
    _scriptable: (name: string) => name !== 'formatter',
    // needle: {
    //   _scriptable: true,
    // },
    // valueLabel: {
    //   _scriptable: true,
    // },
  };

  /** @internal */
  static readonly overrides = {
    aspectRatio: false,

    layout: {
      padding: {
        top: 10,
        bottom: 80,
      },
    },

    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  /** @internal */
  center: ArcElement;

  /** @internal */
  values: number[];

  /** @internal */
  valuePercent: number;

  /** @internal */
  previous: number;

  /** @internal */
  current: number;

  constructor(chart: Chart, datasetIndex: number) {
    super(chart, datasetIndex);
    // center for needle.
    this.center = new ArcElement({});
    this.values = [];
    this.valuePercent = 0;
    this.previous = 0;
    this.current = 0;
  }

  /** @internal */
  _updateMeta() {
    const meta: GaugeMetaExtensions = this._cachedMeta as any;
    const data = meta._parsed;
    this.values = [];
    this.valuePercent = 0;
    if (data.length === 0) {
      return meta;
    }

    const options: GaugeControllerOptions = (this as any).options as any;
    const { value = 0, minValue = 0 } = options;
    const maxValue = data.length > 0 ? data[data.length - 1] : minValue + 1;

    data.reduce((prev, curr) => {
      this.values.push(curr - prev);
      return curr;
    }, minValue);
    const length = maxValue - minValue;
    this.valuePercent = value / length;

    return meta;
  }

  /** @internal */
  _getTranslation() {
    const zero = this._cachedMeta.data[0];
    if (zero == null) {
      return { dx: 0, dy: 0 };
    }
    return { dx: zero.x, dy: zero.y };
  }

  /** @internal */
  _getAngle(valuePercent: number) {
    // NOTE options is private member......
    const options: GaugeControllerOptions = (this as any).options as any;
    const { rotation, circumference } = options;
    return toRadians(rotation + (circumference * valuePercent));
  }

  /** @internal */
  _getSize(value: string | number) {
    return toPercentage(value, this.outerRadius) * this.outerRadius;
  }

  /* TODO set min padding, not applied until chart.update() (also chartArea must have been set)
  setBottomPadding(chart) {
    const needleRadius = this.getNeedleRadius(chart);
    const padding = this.chart.config.options.layout.padding;
    if (needleRadius > padding.bottom) {
      padding.bottom = needleRadius;
      return true;
    }
    return false;
  },
  */

  drawNeedle() {
    // NOTE options is private member......
    const options: GaugeControllerOptions = (this as any).options as any;
    const { ctx } = this.chart;
    const { needle } = options;
    const {
      radius, width, length,
    } = needle;
    const { color } = needle;

    const needleRadius = this._getSize(radius);
    const needleWidth = this._getSize(width);
    const needleLength = this._getSize(length);

    // center
    const { dx, dy } = this._getTranslation();
    // interpolate
    const angle = this._getAngle((this.center as any as ArcProps).endAngle);

    // draw
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(angle);
    ctx.fillStyle = color;

    // draw circle
    ctx.beginPath();
    ctx.ellipse(0, 0, needleRadius, needleRadius, 0, 0, 2 * Math.PI);
    ctx.fill();

    // draw needle
    ctx.beginPath();
    ctx.moveTo(-needleWidth / 2, 0);
    ctx.lineTo(0, -needleLength);
    ctx.lineTo(needleWidth / 2, 0);
    ctx.fill();

    ctx.restore();
  }

  drawValueLabel() {
    // NOTE options is private member......
    const options: GaugeControllerOptions = (this as any).options as any;
    const { valueLabel } = options;
    if (!valueLabel.display) {
      return;
    }
    const { ctx } = this.chart;
    const {
      color,
      formatter,
      backgroundColor,
      borderColor,
      borderWidth,
      borderRadius,
      padding,
      offsetX,
      offsetY,
    } = valueLabel;
    const font = toFont(valueLabel.font);

    const { value } = options;
    const valueText = (formatter ? formatter(value) : value).toString();

    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = font.string;

    // const { width: textWidth, actualBoundingBoxAscent, actualBoundingBoxDescent } = ctx.measureText(valueText);
    // const textHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
    const { width: textWidth } = ctx.measureText(valueText);
    const { lineHeight } = font;
    const textHeight = (lineHeight as any) * 1;

    const x = -(padding.left + textWidth / 2) - borderWidth;
    const y = -(padding.top + textHeight / 2) - borderWidth;
    const w = (padding.left + textWidth + padding.right) + 2 * borderWidth;
    const h = (padding.top + textHeight + padding.bottom) + 2 * borderWidth;

    // center
    let { dx, dy } = this._getTranslation();
    dx += this._getSize(offsetX);
    dy += this._getSize(offsetY);

    // draw
    ctx.translate(dx, dy);

    // draw background
    ctx.fillStyle = backgroundColor;
    ctx.beginPath();
    addRoundedRectPath(ctx, {
      x, y, w, h, radius: toTRBLCorners(borderRadius),
    });
    ctx.closePath();
    ctx.fill();
    if (borderWidth) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();
    }

    // draw value text
    const magicNumber = 0.075; // manual testing
    renderText(ctx, valueText, 0, textHeight * magicNumber, font, {
      textAlign: 'center',
      textBaseline: 'middle',
      color,
    });
    ctx.restore();
  }

  // overrides
  update(mode: UpdateMode) {
    const reset = mode === 'reset';

    const meta = this._updateMeta();

    // animations on will call update(reset) before update()
    if (reset) {
      this.previous = 0;
      this.current = 0;
    } else {
      this.previous = this.current || 0;
      this.current = this.valuePercent;
    }

    const parsed = meta._parsed;
    meta._parsed = this.values;
    super.update(mode);
    meta._parsed = parsed;
  }

  // overrides
  updateElements(elements: Element[], start: number, count: number, mode: UpdateMode): void {
    const meta: GaugeMetaExtensions = this._cachedMeta as any;

    const parsed = meta._parsed;
    meta._parsed = this.values;
    super.updateElements(elements, start, count, mode);
    meta._parsed = parsed;

    if (elements.length === 0) {
      return;
    }
    const zero = elements[0];
    // NOTE center:ArcElement as any.
    super.updateElement(this.center as any, undefined, {
      x: zero.x,
      y: zero.y,
      startAngle: this.previous,
      endAngle: this.current,
      circumference: 0,
      outerRadius: 100,
      innerRadius: 0,
      options: {},
    }, mode);
  }

  draw() {
    super.draw();

    if (this.values.length === 0) {
      return;
    }
    this.drawNeedle();
    this.drawValueLabel();
  }
}

export default GaugeController;
