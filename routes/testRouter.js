import express from 'express';
var testRouter = express.Router();

testRouter.get('/', function (req, res) {
  res.json('GET route on things.');
});
testRouter.post('/', function (req, res) {
  res.send('POST route on things.');
});

//export this router to use in our index.js
export default testRouter;
