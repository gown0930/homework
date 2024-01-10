const router = require('express').Router();
const connectToMongo = require("../modules/mongodb");
const checkAdmin = require("../middleware/checkAdmin");

router.get("/", checkAdmin, async (req, res, next) => {
   const { userId, api, sortOrder, startTime, endTime } = req.query;
   const result = {
      message: null,
      data: null
   }
   let conn = null;
   try {
      conn = await connectToMongo();

      const query = {};
      if (userId) {
         query.userId = userId;
      }
      if (api) {
         query.api = api;
      }

      if (startTime || endTime) {
         query.timestamp = {};
         if (startTime) {
            query.timestamp.$gte = new Date(startTime);
         }
         if (endTime) {
            query.timestamp.$lt = new Date(endTime);
         }
      }
      const sortDirection = sortOrder === 'desc' ? -1 : 1;
      const data = await conn.db('homework').collection("log").find(query).sort({ timestamp: sortDirection }).toArray();
      result.data = data;

      res.status(200).send(result);

   } catch (err) {
      next(err)
   } finally {
      if (conn) conn.close();
   }
});

module.exports = router;
