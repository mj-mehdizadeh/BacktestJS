import {Candle} from "../infra/interfaces";
import { Trend, Dir } from "../infra/trends";


const MIN_TREND_SIZE = 3.8; // Example threshold


export class ZigZag {

    public activeTrend: Trend | null = null;
    public trends: Trend[] = [];

    constructor(candles: Candle[]) {
        for (let i = 1; i < candles.length; i++) {

            const candle = candles[i];
            const prevCandle = candles[i - 1];

            const direction: Dir =
                candle.close > candle.open ||
                    (candle.close > prevCandle?.close || candle.close > prevCandle?.open)
                    ? "bullish" : "bearish";

            this.updateTrend(direction, candle);
        }
    }


    updateTrend(direction: Dir, candle: Candle) {
        const isNewTrend =
            !this.activeTrend ||
            direction !== this.activeTrend.direction;

        if (!this.activeTrend || isNewTrend) {
            // Check if the last trend was insignificant and the new trend resumes the previous significant trend
            if (this.activeTrend && !this.isSignificant(this.activeTrend)) {
                this.activeTrend.direction = 'range'
                // const shouldbreak = this.mergeWithPreviousSignificantTrend(this.activeTrend, close, volume, this.activeTrend.candles);
                // if (shouldbreak) {
                //     return;
                // }
            }

            const id = this.trends.length;
            const trend = new Trend(id, direction, candle, this.activeTrend);

            if (this.activeTrend) {
                this.activeTrend.next = trend;
            }
            this.trends.push(trend);
            this.activeTrend = trend;
        } else {
            this.activeTrend.merge(candle);
        }
    }

    isSignificant(trend: Trend): boolean {
        return trend.height >= MIN_TREND_SIZE;
    }
}

