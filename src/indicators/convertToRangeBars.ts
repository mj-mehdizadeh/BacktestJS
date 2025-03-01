import {Candle} from "../infra/interfaces";
import {percentage} from "../strategies/tests";

export function convertToRangeBars(ohlcvData: Candle[], rangeSize: number) {
    const rangeBars = [];
    let currentBar = null;

    for (const candle of ohlcvData) {
        const {open, high, low, close, openTime, volume} = candle;
        if (!currentBar) {
            currentBar = {open, high, low, close, openTime, closeTime: openTime, volume};
            continue;
        }
        currentBar.high = Math.max(currentBar.high, high);
        currentBar.low = Math.min(currentBar.low, low);
        currentBar.close = close;
        currentBar.closeTime = openTime;
        currentBar.volume += volume;


        const percent = percentage(currentBar.high, currentBar.low)
        if (percent >= rangeSize) {
            rangeBars.push({...currentBar});
            currentBar = {
                open: currentBar.close,
                high: currentBar.close,
                low: currentBar.close,
                close: currentBar.close,
                openTime: currentBar.closeTime,
                closeTime: currentBar.closeTime,
                volume: 0
            };
        }
    }
    if (currentBar && currentBar.high !== currentBar.low) rangeBars.push({...currentBar});
    return rangeBars;
}
