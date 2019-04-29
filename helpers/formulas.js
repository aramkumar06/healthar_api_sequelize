module.exports = {
    getROAS: (revenue, spend) => {
        return revenue / spend
    },
    getCTR: (linkClicks, impressions) => {
        return (linkClicks / impressions) * 100 // x100 to get into percentage form for footer vals
    },
    getCPC: (spend, linkClicks) => {
        return spend / linkClicks
    },
    getCPA: (spend, purchases) => {
        return spend / purchases
    },
    getCPWP: (spend, purchases) => {
        return spend / purchases
    },
    getCPWAC: (spend, addToCarts) => {
        return spend / addToCarts
    },
    getCPM: (spend, impressions) => {
        return spend * (1000/impressions)
    },
    getFrequency: (impressions, reach) => {
        return impressions / reach
    },
    getAOV: (revenue, purchases) => {
        return revenue / purchases
    },
    sumReduce: (accumulator, currentValue) => {
        accumulator + currentValue
    }
}