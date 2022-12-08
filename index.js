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
let products = []

readFile("data/products.json", function read(err, data) {
  if(!err && data) {
    console.log("Products.json found, no need to fetch")
    products = JSON.parse(data)
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

app.get("/v1/product/:id", (req, res) => {
  let data = products.find(product => product.productNumber == req.params.id)
  res.send(data)
});

app.get("/v1/productShort/:id", (req, res) => {
  let data = products.find(product => product.productNumberShort == req.params.id)
  res.send(data)
});

app.get('/', (req, res) => {
  res.redirect('v1/products');
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

const updateProducts = new CronJob('0 3 * * *', () => {
  console.log('Updating ALL products')
  products = getAllProducts();
});
updateProducts.start()