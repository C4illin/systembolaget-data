import express from 'express';
import { CronJob } from 'cron';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getAllProducts } from './getAllProducts.js';
import compression from "compression"
import helmet from "helmet"
import cors from "cors"
import { readFile } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

readFile("data/products.json", function read(err, data) {
  if(!err && data) {
    console.log("Products.json found, no need to fetch")
  } else if(err.code == "ENOENT") {
    console.log("Products.json not found, fetching")
    getAllProducts();
  } else {
    console.log("Error with products.json: ", err.code)
  }
})

const app = express();
const port = process.env.PORT || 3000;

app.use(compression())
app.use(helmet())
app.use(cors())

app.get('/v1/products', (req, res) => {
  res.sendFile(__dirname + '/data/products.json');
});

app.get('/', (req, res) => {
  res.redirect('v1/products');
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

const updateProducts = new CronJob('0 3 * * *', () => {
  console.log('Updating ALL products')
  getAllProducts();
});
updateProducts.start()