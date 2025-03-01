// Must Define Params: lowSMA, highSMA

// Define imports
import {BTH, Candle} from "../infra/interfaces"
import {getCandles} from "../helpers/prisma-historical-data";

// Example 1 SMA Strategy with params
export async function daily1(bth: BTH) {

    const zigZag = await getZigZagPoints()

    const exists = zigZag?.find(item => item.openTime===bth.currentCandle.openTime)
    if (!exists) {
        return;
    }

    if (exists.type==='HH') {
        if (bth.orderBook.boughtLong) {
            await bth.sell()
        }
        await bth.buy({ position: 'short' })
    } else {
        if (bth.orderBook.boughtShort) await bth.sell()
        await bth.buy()
    }
}

type ZigZap = { price: Candle; type: string; openTime: number; change: number };
let _zigZag: ZigZap[] | null = null ;
export async function getZigZagPoints() {
    if (!_zigZag) {
        const metaCandles = await getCandles("XRPUSDT-1m")

        if (typeof metaCandles.data === 'string') {
            return null
        }

        // const candles = metaCandles.data.candles.filter(item => item.openTime>=1738911600000);

        _zigZag = findZigZagPoints(metaCandles.data.candles, 1)
    }

    return _zigZag;
}

function findZigZagPoints(candles: Candle[], deviation = 1) {
    let pivots = [];
    let lastPivot = candles[0];

    for (let i = 1; i < candles.length; i++) {
        const current = candles[i];
        let change = ((current.close - lastPivot.close) / lastPivot.close) * 100;

        if (change >= deviation) {
            pivots.push({name: new Date(lastPivot.openTime), price: lastPivot, type: "HH", openTime: lastPivot.openTime, change});
            lastPivot = current;
        } else if (change <= -deviation) {
            pivots.push({name: new Date(lastPivot.openTime), price: lastPivot, type: "LL", openTime: lastPivot.openTime, change});
            lastPivot = current;
        }
    }

    const current = candles[candles.length-1];
    let change = ((current.close - lastPivot.close) / lastPivot.close) * 100;

    pivots.push({name: new Date(current.openTime), price: current, type: change >= 0 ? "HH" : "LL", openTime: lastPivot.openTime, change});

    return mergeZigZag(pivots);
}

function mergeZigZag(list: ZigZap[]) {

    const newlist = [];

    let lastPivot = list[0];
    for (let i = 0; i < list.length; i++) {
        const current = list[i];
        if (current.type!==lastPivot.type) {
            newlist.push(lastPivot)
        } else {
            console.log("#>> diff", new Date(current.openTime), current.type, current.type === 'HH' ? current.price.close - lastPivot.price.close : lastPivot.price.close - current.price.close)
        }
        lastPivot = current
    }

    return newlist;
}

