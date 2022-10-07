import express from 'express';
import { CronJob } from 'cron';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getAllProducts } from './getAllProducts.js';
import compression from "compression"
import helmet from "helmet"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(compression())
app.use(helmet())

app.get('/v1/products', (req, res) => {
  res.sendFile(__dirname + '/products.json');
});

app.get('/', (req, res) => {
  res.redirect('v1/products');
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

const updateProducts = new CronJob('0 5 * * *', () => {
  console.log('Updating ALL products')
  getAllProducts();
});
updateProducts.start()