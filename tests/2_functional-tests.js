// const chaiHttp = require('chai-http');
// const chai = require('chai');
// const server = require('../server');

// chai.use(chaiHttp);

// suite('Functional Tests', function() {
//     describe('Stock Price Checker Functional Tests', function () {
//         let stockSymbol = 'MSFT';
//         let stockSymbol2 = 'GOOG';
      
//         it('should view one stock', function (done) {
//           chai.request(server)
//             .get('/api/stock-prices')
//             .query({ stock: stockSymbol })
//             .end(function (err, res) {
//               res.should.have.status(200);
//               res.body.should.have.property('symbol').eql(stockSymbol);
//               res.body.should.have.property('price');
//               res.body.should.have.property('likes');
//               done();
//             });
//         });
      
//         // Test for viewing one stock and liking it
//         it('should view one stock and like it', function (done) {
//           chai.request(server)
//             .get('/api/stock-prices')
//             .query({ stock: stockSymbol, like: true })
//             .end(function (err, res) {
//               res.should.have.status(200);
//               res.body.should.have.property('symbol').eql(stockSymbol);
//               res.body.should.have.property('price');
//               res.body.should.have.property('likes').eql(1); // First like
//               done();
//             });
//         });
      
//         // Test for viewing the same stock and liking it again (should be denied)
//         it('should not allow liking the same stock again from the same IP', function (done) {
//           chai.request(server)
//             .get('/api/stock-prices')
//             .query({ stock: stockSymbol, like: true })
//             .end(function (err, res) {
//               res.should.have.status(400); // Should return 400 as it's already liked from this IP
//               res.body.should.have.property('error').eql('You have already liked this item.');
//               done();
//             });
//         });
      
//         it('should view two stocks', function (done) {
//           chai.request(server)
//             .get('/api/stock-prices')
//             .query({ stock: [stockSymbol, stockSymbol2] })
//             .end(function (err, res) {
//               res.should.have.status(200);
//               res.body.should.be.an('array').that.has.lengthOf(2);
//               res.body[0].should.have.property('symbol').eql(stockSymbol);
//               res.body[1].should.have.property('symbol').eql(stockSymbol2);
//               done();
//             });
//         });
      
//         it('should view two stocks and like them', function (done) {
//           chai.request(server)
//             .get('/api/stock-prices')
//             .query({ stock: [stockSymbol, stockSymbol2], like: true })
//             .end(function (err, res) {
//               res.should.have.status(200);
//               res.body.should.be.an('array').that.has.lengthOf(2);
      
//               // Ensure the likes are applied
//               res.body[0].should.have.property('symbol').eql(stockSymbol);
//               res.body[0].should.have.property('likes').eql(1); // First like for the first stock
      
//               res.body[1].should.have.property('symbol').eql(stockSymbol2);
//               res.body[1].should.have.property('likes').eql(1); // First like for the second stock
//               done();
//             });
//         });
//       });
// });







const chaiHttp = require('chai-http');
const chai = require('chai');
const server = require('../server');
const should = chai.should();

chai.use(chaiHttp);

suite('Functional Tests', function() {
    describe('Stock Price Checker Functional Tests', function () {
        let stockSymbol = 'MSFT';
        let stockSymbol2 = 'GOOG';

        it('should view one stock', function (done) {
            chai.request(server)
                .get('/api/stock-prices')
                .query({ stock: stockSymbol })
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.have.property('stockData').that.is.an('array').with.lengthOf(1);
                    res.body.stockData[0].should.have.property('symbol').eql(stockSymbol);
                    res.body.stockData[0].should.have.property('price');
                    res.body.stockData[0].should.have.property('likes');
                    done();
                });
        });

        // Test for viewing one stock and liking it
        it('should view one stock and like it', function (done) {
            chai.request(server)
                .get('/api/stock-prices')
                .query({ stock: stockSymbol, like: 'true' }) // Like is passed as a string 'true'
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.have.property('stockData').that.is.an('array').with.lengthOf(1);
                    res.body.stockData[0].should.have.property('symbol').eql(stockSymbol);
                    res.body.stockData[0].should.have.property('price');
                    res.body.stockData[0].should.have.property('likes').eql(1); // First like
                    done();
                });
        });

        // Test for viewing the same stock and liking it again (should be denied)
        it('should not allow liking the same stock again from the same IP', function (done) {
            chai.request(server)
                .get('/api/stock-prices')
                .query({ stock: stockSymbol, like: 'true' }) // Try to like again
                .end(function (err, res) {
                    res.should.have.status(400); // Should return 400 as it's already liked from this IP
                    res.body.should.have.property('error').eql('You have already liked this item.');
                    done();
                });
        });

        it('should view two stocks', function (done) {
            chai.request(server)
                .get('/api/stock-prices')
                .query({ stock: [stockSymbol, stockSymbol2] })
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.have.property('stockData').that.is.an('array').with.lengthOf(2);
                    res.body.stockData[0].should.have.property('symbol').eql(stockSymbol);
                    res.body.stockData[1].should.have.property('symbol').eql(stockSymbol2);
                    done();
                });
        });

        it('should view two stocks and like them', function (done) {
            chai.request(server)
                .get('/api/stock-prices')
                .query({ stock: [stockSymbol, stockSymbol2], like: 'true' }) // Like is passed as 'true'
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.have.property('stockData').that.is.an('array').with.lengthOf(2);

                    // Ensure the likes are applied
                    res.body.stockData[0].should.have.property('symbol').eql(stockSymbol);
                    res.body.stockData[0].should.have.property('likes').eql(1); // First like for the first stock

                    res.body.stockData[1].should.have.property('symbol').eql(stockSymbol2);
                    res.body.stockData[1].should.have.property('likes').eql(1); // First like for the second stock
                    done();
                });
        });
    });
});