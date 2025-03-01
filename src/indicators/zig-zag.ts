import {Candle} from "../infra/interfaces";
import {percentage} from "../strategies/tests";

type Dir = "bullish" | "bearish" | "range";

interface Trend {
    id: number;
    direction: Dir;
    open: number;
    close: number;
    candles: number;
    volume: number;
    openTime: Date;
    closeTime: Date;
    next?: number;
    prev?: number;
}

const MIN_TREND_SIZE = 3.8; // Example threshold


export const trendPercent = (trend: Trend) => {
    const [high, low] = [Math.max(trend.close, trend.open), Math.min(trend.close, trend.open)]
    return percentage(high, low)
}

export class ZigZag {

    public activeTrend: Trend | null = null;
    public trends: Trend[] = [];

    constructor(candles: Candle[]) {
        for (let i = 1; i < candles.length; i++) {

            const candle = candles[i];
            const prevCandle = candles[i - 1];

            const direction: Dir = candle.close > candle.open ||
            (candle.close > prevCandle?.close || candle.close > prevCandle?.open) ? "bullish" : "bearish";
            this.updateTrend(direction, candle);
        }
    }


    updateTrend(direction: Dir, candle: Candle) {
        const {open, close, volume, openTime, closeTime} = candle;

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
            const prevId = this.activeTrend?.id;

            if (this.activeTrend) {
                this.activeTrend.next = id;
            }

            this.activeTrend = {
                id,
                direction,
                open,
                close,
                volume,
                prev: prevId,
                openTime: new Date(openTime),
                closeTime: new Date(closeTime),
                candles: 1
            };
            this.trends.push(this.activeTrend);
        } else {
            // Extend the active trend
            this.activeTrend.close = close;
            this.activeTrend.closeTime = new Date(closeTime);
            this.activeTrend.volume += volume;
            this.activeTrend.candles++;
        }
    }

    isSignificant(trend: Trend): boolean {
        return trendPercent(trend) >= MIN_TREND_SIZE;
    }

// Merges a noise trend into the last significant trend if it resumes the same direction
    mergeWithPreviousSignificantTrend(noiseTrend: Trend, newClose: number, newVolume: number, candles: number) {
        const prevIndex = noiseTrend.prev;
        if (prevIndex === undefined) return false;

        const prevTrend = this.trends[prevIndex];

        // Only merge if the previous trend has the same direction as the new trend
        if (prevTrend && prevTrend.direction === "range") {
            prevTrend.close = newClose;
            prevTrend.volume += newVolume;
            prevTrend.candles += candles;
            prevTrend.next = noiseTrend.next;

            // Remove the noise trend from the list
            this.trends.pop();

            // Ensure `activeTrend` references the extended previous trend
            this.activeTrend = prevTrend;

            return true;
        }

        return false
    }

}

