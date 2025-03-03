// Must Define Params: lowSMA, highSMA

// Define imports
import {getCandles} from "../helpers/prisma-historical-data";
import {indicatorSMA} from "../indicators/moving-averages";
import {json2csv} from 'json-2-csv';
import {ZigZag} from "../indicators/zig-zag";
import { percentage } from "../helpers/percentage";

const fs = require("fs");

// Example 1 SMA Strategy with params
export async function sortHills() {

    const movingAveragePeriod = 180;
    const metaCandles = await getCandles("XRPUSDT-1m")

    if (typeof metaCandles.data === "string") {
        throw Error(metaCandles.data)
    }


    for (let i = movingAveragePeriod; i < metaCandles.data.candles.length; i++) {
        const candle = metaCandles.data.candles[i]
        const SMACandles = metaCandles.data.candles
            .slice(i - movingAveragePeriod, i)
            .map(item => item.close)

        const SMA = (await indicatorSMA(SMACandles, movingAveragePeriod)).pop().toFixed(4)
        const change = ((candle.close - SMA) * 100).toFixed(2)

        console.log("%s, %s, %s, %s, %s", i, new Date(candle.openTime), candle.close, SMA, change)
    }
}

// در این عملیات نسبت ارتفاع کندل ها را در میاوریم
// و نسبت کندل های بالای x درصدی را با sma های y بررسی میکنیم
// کندل های صعودی/نزولی بالایx درصد چه نسبتی با sma های y خود دارند
// این دیتا در فایل candles-height-sma.csv
export async function candlesHeightSma() {
    const metaCandles = await getCandles("XRPUSDT-1h")
    if (typeof metaCandles.data === "string") {
        throw Error(metaCandles.data)
    }

    const list = [];

    const sma = async (from: number, margin: number) => {
        if (typeof metaCandles.data === 'string') {
            throw Error(metaCandles.data);
        }
        const candles = metaCandles.data.candles
            .slice(from - margin, from)
            .map(item => item.close);

        return (await indicatorSMA(candles, margin)).pop()?.toFixed(4) || 0
    }


    for (let i = 72; i < metaCandles.data.candles.length; i++) {
        const candle = metaCandles.data.candles[i]

        const direction = candle.close > candle.open ? "bullish" : "bearish"

        const [up, down] = direction === "bearish" ? [candle.open, candle.close] : [candle.close, candle.open]

        const shadow = Math.max(percentage(candle.high, up), percentage(down, candle.low))

        let sma7 = await sma(i, 7);
        let sma24 = await sma(i, 24);
        let sma72 = await sma(i, 72);

        sma7 = percentage(candle.close, sma7) * (sma7 > candle.close ? -1 : 1);
        sma24 = percentage(candle.close, sma24) * (sma24 > candle.close ? -1 : 1);
        sma72 = percentage(candle.close, sma72) * (sma72 > candle.close ? -1 : 1);


        list.push({
            i,
            up2: percentage(candle.high, candle.low),
            time: candle.openTime,
            date: new Date(candle.openTime).toUTCString(),
            price: candle.close,
            shadow,
            sma7,
            sma24,
            sma72,
            direction,
            volume: candle.volume,
        })
    }

    fs.writeFile("./csv/candles-height-sma.csv", json2csv(list), "utf-8", (err: any) => {
        if (err) console.log(err);
        else console.log("Data saved");
    });
}

export async function marginSides() {
    const margin = 5;
    const metaCandles = await getCandles("XRPUSDT-1m")
    if (typeof metaCandles.data === "string") {
        throw Error(metaCandles.data)
    }

    const list = [];

    for (let i = margin; i < metaCandles.data.candles.length - margin; i++) {
        const candle = metaCandles.data.candles[i]

        const leftCandles = metaCandles.data.candles
            .slice(i - margin, i)
            .map(item => item.close)
        const rightCandles = metaCandles.data.candles
            .slice(i, i + margin)
            .map(item => item.close)

        const leftSMA = (await indicatorSMA(leftCandles, margin)).pop().toFixed(4)
        const rightSMA = (await indicatorSMA(rightCandles, margin)).pop().toFixed(4)


        const leftMargin = +((candle.close - leftSMA) * 100).toFixed(2)
        const rightMargin = +((candle.close - rightSMA) * 100).toFixed(2)

        // if (!(leftMargin <= -1 || leftMargin >= 1)) {continue;}

        list.push({
            i,
            time: candle.openTime,
            date: new Date(candle.openTime).toUTCString(),
            leftMargin,
            leftSMA,
            price: candle.close,
            rightSMA,
            rightMargin
        })
    }

    console.log("#> margin-sides", list)

    fs.writeFile("./margin-sides.csv", json2csv(list), "utf-8", (err: any) => {
        if (err) console.log(err);
        else console.log("Data saved");
    });
}


export async function dayliZigZag() {


    const metaCandles = await getCandles("ETHUSDT-1d")

    if (typeof metaCandles.data === "string") {
        throw new Error(metaCandles.data)
    }

    const instanse = new ZigZag(metaCandles.data.candles, 2.8)
    const list = [];

    for (const trend of instanse.trends) {
        const {id, open, close, openTime, closeTime, volume, direction, candles, height} = trend

        list.push({
            id,
            direction,
            height,
            open, close,
            candles,
            openTime: openTime.toUTCString(),
            closeTime: closeTime.toUTCString(),
            volume,
            prevDir: trend.prev?.direction,
            prevHeight: trend.prev?.height,
            prevVolume: trend.prev?.volume,
            nextDir: trend.next?.direction,
            nextHeight: trend.next?.height,
            nextVolume: trend.next?.volume,
        })
    }

    fs.writeFile("./csv/trends-1d.csv", json2csv(list), "utf-8", (err: any) => {
        if (err) console.log(err);
        else console.log("Data saved");
    });

}