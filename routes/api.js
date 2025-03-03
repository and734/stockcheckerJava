'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const stockSchema = new Schema({
  stock: { type: String, required: true },
  likes: [String] // Array of IPs that liked the stock
});

const Stock = mongoose.model('Stock', stockSchema);

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      const stock = req.query.stock;
      let like = req.query.like;

      if (!stock) {
        return res.status(400).json({ error: 'Stock is required' });
      }

      const getStockPrice = async (stockSymbol) => {
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.symbol) {
          return {
            stock: data.symbol,
            price: data.latestPrice
          };
        } else {
          throw new Error('Stock not found');
        }
      };

      const getClientIP = (req) => {
        //Could use request ip package
        return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      };


      if (Array.isArray(stock)) {
        // Handle multiple stocks
        try {
          const stockData = await Promise.all(
            stock.map(async (stockSymbol) => {
              const { stock, price } = await getStockPrice(stockSymbol);
              let stockDoc = await Stock.findOne({ stock: stock });

              if (!stockDoc) {
                stockDoc = new Stock({ stock: stock, likes: [] });
              }

              if (like) {
                const ip = getClientIP(req);
                if (!stockDoc.likes.includes(ip)) {
                  stockDoc.likes.push(ip);
                  await stockDoc.save();
                }
              }

              return {
                stock: stock,
                price: price,
                like: stockDoc.likes.length
              };
            })
          );

          const rel_likes = stockData.map((item, i) => {
            return item.like - stockData[(i+1) % 2].like
          })
          const response = [
            {stock: stockData[0].stock, price: stockData[0].price, rel_likes: rel_likes[0]},
            {stock: stockData[1].stock, price: stockData[1].price, rel_likes: rel_likes[1]}
          ]

          res.json({ stockData: response });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Error fetching stock prices' });
        }
      } else {
        // Handle single stock
        try {
          const { stock: stockName, price } = await getStockPrice(stock);
          let stockDoc = await Stock.findOne({ stock: stockName });

          if (!stockDoc) {
            stockDoc = new Stock({ stock: stockName, likes: [] });
          }

          if (like) {
            like = like.toLowerCase() === 'true';
            const ip = getClientIP(req);
              if (!stockDoc.likes.includes(ip)) {
                stockDoc.likes.push(ip);
                await stockDoc.save();
              }
          }

          res.json({ stockData: {
              stock: stockName,
              price: price,
              likes: stockDoc.likes.length
            } });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Error fetching stock price' });
        }
      }
    });
};
