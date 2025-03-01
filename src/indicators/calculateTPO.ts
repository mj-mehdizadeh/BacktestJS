import {Candle} from "../infra/interfaces";

export function calculateTPO(ohlcvData: Candle[], timeFrame = 'daily') {
    const priceVolume: { [k: string]: number } = {};
    for (const candle of ohlcvData) {
        const price = Math.round(candle.close); // ساده‌سازی
        priceVolume[price] = (priceVolume[price] || 0) + candle.volume;
    }

    const sortedPrices = Object.entries(priceVolume).sort((a, b) => b[1] - a[1]);
    const totalVolume = Object.values(priceVolume).reduce((sum, v) => sum + v, 0);
    let cumulativeVolume = 0;
    const valueArea = [];
    for (const [price, volume] of sortedPrices) {
        cumulativeVolume += volume;
        valueArea.push(parseInt(price));
        if (cumulativeVolume >= totalVolume * 0.7) break; // 70% حجم
    }
    return {valueAreaMin: Math.min(...valueArea), valueAreaMax: Math.max(...valueArea)};
}
