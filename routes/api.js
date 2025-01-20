'use strict';
const axios = require('axios');
const crypto = require('crypto');

module.exports = function (app) {

  let stockLikes = {};
  function anonymizeIP(ip) {
    const hash = crypto.createHash('sha256').update(ip).digest('hex');
    return hash;
  }

  async function fetchStockPrice(stock) {
    try {
      const response = await axios.get(
        `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
      );
      return response.data;
    } catch (error) {
      throw new Error('Error fetching stock pricef');
    }
  }

  app.get('/api/stock-prices', async (req, res) => {
    const { stock, like } = req.query;
    let stockData = [];
    let likesData = {};

    if (typeof stock === 'string') {
      stockData.push(stock);
    } else if (Array.isArray(stock)) {
      stockData = stock;
    } else {
      return res.status(400).json({ error: 'Invalid stock symbols' });
    }

    if (Array.isArray(stock)) {
      try {
        for (let i = 0; i < stockData.length; i++) {
          const stockSymbol = stockData[i];
          const stockDetails = await fetchStockPrice(stockSymbol);
    
          // Initialize the response for each stock
          const stockResponse = {
            symbol: stockDetails.symbol,
            price: stockDetails.latestPrice,  // Using latestPrice as the current stock price
            likes: 0  // Default likes count
          };
    
          // Handle "like" logic for each stock
          if (like === 'true') {
            const anonymizedIP = anonymizeIP(req.ip); // Anonymize IP address
            if (!stockLikes[stockSymbol]) {
              stockLikes[stockSymbol] = {};
            }
            if (!stockLikes[stockSymbol][anonymizedIP]) {
              stockLikes[stockSymbol][anonymizedIP] = true;
              stockResponse.likes += 1; // Increment the like count for the stock
            }
          }
    
          likesData[stockSymbol] = stockResponse.likes;
    
          stockData[i] = stockResponse;
        }
    
        if (stockData.length === 2) {
          const likesDifference = Math.abs(likesData[stockData[0].symbol] - likesData[stockData[1].symbol]);

          stockData[0].rel_likes = likesDifference;
          stockData[1].rel_likes = likesDifference;
        }

        return res.json({ stockData });
      } catch (error) {
        return res.status(500).json({ error: 'Error fetching stock data for multiple stocks' });
      }
    }

    if (stock) {
      try {
        const stockData = await fetchStockPrice(stock);
        const stockResponse = {
          symbol: stockData.symbol,
          price: stockData.latestPrice,
          likes: 0
        };
        const stockSymbol = stockData.symbol;

        if (like === 'true') {
          const anonymizedIP = anonymizeIP(req.ip);
          if (!stockLikes[stockSymbol]) {
            stockLikes[stockSymbol] = {};
          }
          if (!stockLikes[stockSymbol][anonymizedIP]) {
            stockLikes[stockSymbol][anonymizedIP] = true;
            stockData.likes += 1;
          }
        }

        return res.json({ stockData: stockResponse });
      } catch (error) {
        return res.status(500).json({ error: 'Error fetching stock data' });
      }
    }

    return res.status(400).json({ error: 'Stock symbol is required' });
  });
};
