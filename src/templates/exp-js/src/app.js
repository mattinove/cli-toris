require('dotenv').config();
const cors = require('cors');
const { json } = require('body-parser');
const express = require('express');
const app = express();

app.use(
  cors(),
  json(),
);

app.listen(process.env.PORT, () => {
  console.log(`[${process.env.NODE_ENV}] App is listening at ${process.env.HOST}:${process.env.PORT}`);
});