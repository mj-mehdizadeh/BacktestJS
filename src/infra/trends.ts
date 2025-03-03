import { percentage } from "../helpers/percentage";
import { Candle } from "./interfaces";

export type Dir = "bullish" | "bearish" | "range";

export class Trend {

    public candles: number = 0;

    public open: number;
    public close: number;
    public volume: number;
    public openTime: Date;
    public closeTime: Date;
    public prev?: Trend|null;
    public next?: Trend|null;
    
    constructor(
        public id: number,
        public direction: Dir,
        candle: Candle,
        prev?: Trend|null,
    ) {
        this.open = direction === "bullish" ? candle.low : candle.high;
        this.openTime = new Date(candle.openTime);
        this.close = direction === "bullish" ? candle.high : candle.low;
        this.volume = candle.volume;
        this.closeTime = new Date(candle.closeTime);
        this.prev = prev;
    }


    public get height() {
        const [high, low] = [Math.max(this.close, this.open), Math.min(this.close, this.open)]
        return percentage(high, low)
    }

    merge(candle: Candle) {
        this.close = this.direction === "bullish" ? candle.high : candle.low;
        this.volume += candle.volume;
        this.closeTime = new Date(candle.closeTime);
        this.candles++;
    }

}