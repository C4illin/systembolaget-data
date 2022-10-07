import express from 'express';
import { CronJob } from 'cron';
import getAllProducts from './getAllProducts.js';

const app = express();
const port = process.env.PORT || 3000;

app.get('/v1/products', (req, res) => {
  res.sendFile(__dirname + '/products.json');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

const updateProducts = new CronJob('0 3 * * *', () => {
  console.log('Updating products')
  getAllProducts();
  console.log('Product update done')
});