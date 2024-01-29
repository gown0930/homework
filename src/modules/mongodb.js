// mongoConnection.js
const { MongoClient } = require('mongodb');

const connectToMongo = async () => {
   try {
      const conn = await MongoClient.connect("mongodb://localhost:27017");
      return conn;
   } catch (e) {
      console.error("MongoDB 연결 오류:", e.message);
      console.error(e);
      throw e;
   }
};

module.exports = connectToMongo;


