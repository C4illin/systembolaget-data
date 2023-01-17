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
let productIdMap = {};

const idMap = (products) => {
  for (const product of products) {
    productIdMap[product.productNumber] = product
  }
  console.log("IdMap created")
}

readFile("data/products.json", function read(err, data) {
  if(!err && data) {
    console.log("Products.json found, no need to fetch")
    idMap(JSON.parse(data))
  } else if(err.code == "ENOENT") {
    console.log("Products.json not found, fetching...")
    idMap(getAllProducts())
  } else {
    console.log("Error with products.json: ", err.code)
  }
})

const app = express();
const port = process.env.PORT || 3000;

app.use(compression())
app.use(helmet())
app.use(cors())

app.get('/v1/products', (_req, res) => {
  res.sendFile(__dirname + '/data/products.json');
});

app.get("/v1/product/:id", (req, res) => {
  const result = productIdMap[req.params.id]
  if (result) {
    res.json(result)
  } else {
    res.status(404).json({"error": "404, product not found"})
  }
  // res.json(productIdMap[req.params.id] || { "error": "Product not found"})
});

app.get('/', (_req, res) => {
  res.redirect('v1/products');
})

app.get('*', function(req, res){
  res.status(404).send("404, page not found. See <a href='https://github.com/C4illin/systembolaget-data'>https://github.com/C4illin/systembolaget-data</a> for documentation.");
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

const updateProducts = new CronJob('0 3 * * *', () => {
  console.log('Updating ALL products')
  idMap(getAllProducts())
});
updateProducts.start()

// getAllProducts();