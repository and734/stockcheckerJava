//tests/2_functional-tests.js

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const db = require('../routes/api.js').db //for resetting DB

chai.use(chaiHttp);

suite('Functional Tests', function() {
    // Setup to run before each test. Clears any previous likes in DB.
    this.beforeEach(async () => {
        await db.resetDB()
    })
    suite('GET /api/stock-prices => stockData object', function() {

      test('Viewing one stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'GOOG'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isObject(res.body, 'Response should be an object');
          assert.property(res.body, 'stockData', 'Response should have stockData property');
          assert.isObject(res.body.stockData, 'stockData should be an object');
          assert.property(res.body.stockData, 'stock', 'stockData should have stock property');
          assert.property(res.body.stockData, 'price', 'stockData should have price property');
          assert.property(res.body.stockData, 'likes', 'stockData should have likes property');
          assert.equal(res.body.stockData.stock, 'GOOG', 'Stock should be GOOG');
          assert.isNumber(res.body.stockData.price, 'Price should be a number');
          assert.isNumber(res.body.stockData.likes, 'Likes should be a number');
          assert.equal(res.body.stockData.likes, 0, "Likes should be zero initially");
          done();
        });
      });

      test('Viewing one stock and liking it', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({stock: 'MSFT', like: true})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isObject(res.body.stockData);
            assert.equal(res.body.stockData.stock, 'MSFT');
            assert.isNumber(res.body.stockData.price);
            assert.equal(res.body.stockData.likes, 1);
            done();
          });
      });

      test('Viewing the same stock and liking it again', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({stock: 'MSFT', like: true})
          .end(function(err, res) {
            chai.request(server)
            .get('/api/stock-prices')
            .query({stock: 'MSFT', like: true})
            .end(function(err, res){
                assert.equal(res.status, 200);
                assert.isObject(res.body.stockData);
                assert.equal(res.body.stockData.stock, 'MSFT');
                assert.isNumber(res.body.stockData.price);
                assert.equal(res.body.stockData.likes, 1); // Stays at 1
              done();
            });
          })
      });

      test('Viewing two stocks', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({stock: ['GOOG', 'MSFT']})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isArray(res.body.stockData);
            assert.equal(res.body.stockData.length, 2);
            assert.property(res.body.stockData[0], 'stock');
            assert.property(res.body.stockData[0], 'price');
            assert.property(res.body.stockData[0], 'rel_likes');
            assert.property(res.body.stockData[1], 'stock');
            assert.property(res.body.stockData[1], 'price');
            assert.property(res.body.stockData[1], 'rel_likes');
            done();
          });
      });

      test('Viewing two stocks and liking them', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({stock: ['GOOG', 'MSFT'], like: true})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isArray(res.body.stockData);
            assert.equal(res.body.stockData.length, 2);
            assert.oneOf(res.body.stockData[0].rel_likes, [-1, 0, 1]);
            assert.oneOf(res.body.stockData[1].rel_likes, [-1, 0, 1]);
            done();
          });
      });

        test('Invalid Stock Symbol', function (done) {
          chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: 'INVALID' })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.isObject(res.body, 'Response should be an object');
              assert.property(res.body, 'stockData', 'Response should have a stockData property');
              assert.isObject(res.body.stockData, 'stockData should be an object');
              assert.property(res.body.stockData, 'error', 'stockData should have an error property');
              assert.equal(res.body.stockData.error, 'Invalid stock symbol', 'Error message should be correct');
              done();
            });
      });
      
      test('Two Stocks, One Invalid', function (done) {
          chai.request(server)
            .get('/api/stock-prices?stock=GOOG&stock=INVALID')
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.isObject(res.body, 'Response should be an object');
               assert.property(res.body, 'stockData', 'Response should have a stockData property');
              assert.isArray(res.body.stockData, 'stockData should be an array');
              assert.equal(res.body.stockData.length, 2, 'stockData should contain two elements');
              assert.property(res.body.stockData[0], 'stock', 'First element should have stock property');
              assert.property(res.body.stockData[0], 'price', 'First element should have price property');
              assert.property(res.body.stockData[0], 'likes', 'First element should have likes property');
              assert.equal(res.body.stockData[0].stock, 'GOOG', 'First stock should be GOOG');
              assert.isNumber(res.body.stockData[0].price, 'Price should be a number');
              assert.isNumber(res.body.stockData[0].likes, 'Likes should be a number');
              assert.property(res.body.stockData[1], 'stock', 'Second element should have stock property');
              assert.property(res.body.stockData[1], 'error', 'Second element should have error property');
              assert.equal(res.body.stockData[1].stock, 'INVALID', 'Second stock should be INVALID');
              assert.equal(res.body.stockData[1].error, 'Invalid stock symbol', 'Error message should be correct');
              
              done();
            });
});
    });

});

