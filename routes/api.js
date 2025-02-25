// routes/api.js
'use strict';

const crypto = require('crypto');     // For anonymizing IP addresses

// Conceptual Database Interaction (Replace with your actual DB logic)
const db = {
    async findStock(stock) {
        return dbData.find(item => item.stock === stock) || null;
    },
    async createStock(stock, ipHash) {
       const newStock = { stock: stock, likes: ipHash ? [{ ip: ipHash }] : [] }
        dbData.push(newStock)
        return newStock
    },
    async addLike(stockRecord, ipHash) {
       if (!stockRecord.likes.some(like => like.ip === ipHash)) {
            stockRecord.likes.push({ ip: ipHash });
       }

        return stockRecord;
    },
   async resetDB() {
        dbData = []
    }
};
//stores stock data in memory
let dbData = []

// Helper function to anonymize IP addresses (using SHA-256 hashing)
function anonymizeIp(ip) {
    const hash = crypto.createHash('sha256');
    hash.update(ip);
    return hash.digest('hex');
}

module.exports = function (app) {

    app.route('/api/stock-prices')
        .get(async function (req, res) {
            const { stock, like } = req.query;
            const ip = req.ip;
            const ipHash = anonymizeIp(ip);

            if (Array.isArray(stock)) {
                // Handle two stocks
                if (stock.length !== 2) {
                    return res.json({ error: 'Must provide exactly two stocks for comparison.' });
                }

                const stockData = [];

                for (const s of stock) {
                    try {
                        const stockName = s.toUpperCase();
                        const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockName}/quote`); // ADDED /quote
                        const text = await response.text(); // Get response as TEXT first

                        let data;
                        try {
                            data = JSON.parse(text); // Try to parse as JSON
                        } catch (parseError) {
                            console.error("Proxy returned non-JSON response:", text);
                            stockData.push({ stock: stockName, error: "External API error." });
                            continue; // Skip to the next stock
                        }


                        if (data === 'Unknown symbol' || data === "Not found" || !data.latestPrice) {
                            stockData.push({ stock: stockName, error: 'Invalid stock symbol' });
                            continue;
                        }

                        let stockRecord = await db.findStock(stockName);

                        if (!stockRecord) {
                            stockRecord = await db.createStock(stockName, like ? ipHash : null);
                        } else if (like) {
                            stockRecord = await db.addLike(stockRecord, ipHash);
                        }

                        stockData.push({
                            stock: stockName,
                            price: data.latestPrice,
                            likes: stockRecord.likes.length
                        });
                    } catch (error) {
                        console.error("Error fetching stock data:", error);
                        stockData.push({ stock: s.toUpperCase(), error: "External API error." });
                    }
                }

                if (stockData.some(stock => stock.error)) {
                    return res.json({ stockData })
                }


                // Calculate relative likes
                const relLikes0 = stockData[0].likes - stockData[1].likes;
                const relLikes1 = stockData[1].likes - stockData[0].likes;

                stockData[0].rel_likes = relLikes0;
                stockData[1].rel_likes = relLikes1;

                delete stockData[0].likes;
                delete stockData[1].likes;

                res.json({ stockData });


            } else {
                // Handle single stock
                try {
                    const stockName = stock.toUpperCase();
                    const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockName}/quote`); // ADDED /quote
                    const text = await response.text(); // Get response as TEXT first

                    let data;
                    try {
                        data = JSON.parse(text);  // Try to parse as JSON
                    } catch (parseError) {
                        console.error("Proxy returned non-JSON response:", text);
                        return res.status(500).json({ stockData: { error: 'External API error or processing error' } }); // Return error
                    }

                    if (data === 'Unknown symbol' || data === "Not found" || !data.latestPrice) {
                        return res.json({ stockData: { error: 'Invalid stock symbol' } });
                    }


                    let stockRecord = await db.findStock(stockName);
                    if (!stockRecord) {
                        stockRecord = await db.createStock(stockName, like ? ipHash : null);
                    } else if (like) {
                        stockRecord = await db.addLike(stockRecord, ipHash);
                    }


                    res.json({
                        stockData: {
                            stock: stockRecord.stock,
                            price: data.latestPrice,
                            likes: stockRecord.likes.length
                        }
                    });

                } catch (error) {
                    console.error("Error fetching/processing stock data:", error);
                    res.status(500).json({ stockData: { error: 'External API error or processing error' } });
                }
            }
        });
};

