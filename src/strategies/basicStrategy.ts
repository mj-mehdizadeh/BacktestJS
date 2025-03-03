// Must Define Params: entryPrice, exitPrice

// Define imports
import { BTH } from "../infra/interfaces"

// Example Basic Strategy with params
export async function trendStrategy(bth: BTH) {
    // Get entry and exit prices from params
    const entryPrice = bth.params.entryPrice
    const exitPrice = bth.params.exitPrice

    // Buy if price is below entry price
    if (bth.currentCandle.close < entryPrice) {
        await bth.buy()
    }

    // Sell if price is above exit price
    if (bth.currentCandle.close > exitPrice) {
        await bth.sell()
    }
} 