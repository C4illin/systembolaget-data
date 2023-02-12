import fetch from "node-fetch";
import fs from "fs";
// import { putItem } from './libs/ddbPut.js'

export const getAllProducts = async (productIdMap) => {
  let starturl =
    "https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search?size=30";
  // let products = require('./test.json')
  let products = [];
  // let toCompare = {}
  let changedDate = new Date(new Date().valueOf() - 1000 * 3600 * 10)
    .setHours(0, 0, 0, 0)
    .valueOf(); // yesterday if less then 10 hours ago

  let options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "access-control-allow-origin": "*",
      "ocp-apim-subscription-key": "cfc702aed3094c86b92d6d4ff7a54c84",
      Referer: "https://www.systembolaget.se/",
    },
  };

  let urlParameters = [
    "&assortmentText=S%C3%A4song",
    "&assortmentText=Tillf%C3%A4lligt%20sortiment",
    "&assortmentText=Webblanseringar",
    "&assortmentText=Fast%20sortiment",
    "&assortmentText=Lokalt%20%26%20Sm%C3%A5skaligt",
    "&assortmentText=Presentartiklar",
    "&assortmentText=Ordervaror&price.max=250",
    "&assortmentText=Ordervaror&price.min=251",
  ];

  for (const urlParam of urlParameters) {
    let url = starturl + urlParam;
    console.log("Starting: " + url);
    for (let i = 1; i < 500; i++) {
      await fetch(url + "&page=" + i, options)
        .then((res) => res.json())
        .then((json) => {
          if (
            i > json["metadata"]["nextPage"] &&
            json["metadata"]["nextPage"] > 0
          ) {
            console.log("Aborted, something is wrong...");
            console.log("Last page: " + json["metadata"]["nextPage"]);
            i = 10000;
          } else if (json["metadata"]["nextPage"] == -1) {
            products = products.concat(json["products"]);
            console.log("Done after " + i + " pages");
            i = 10000;
          } else {
            products = products.concat(json["products"]);
          }
        })
        .catch((error) => console.error("Error:", error));
    }
  }
  const newProductNum = products.length

  let dupCount = 0;
  let updatedProducts = [];

  let foundIDs = [];
  for (let i = products.length - 1; i >= 0; i--) {
    let product = products[i]
    if (foundIDs.includes(product.productNumber)) {
      products.splice(i, 1)
      dupCount++
      continue;
    } else {
      foundIDs.push(product.productNumber);
    }

    if (product.productNumber in productIdMap && productIdMap[product.productNumber].changedDate) {
      // add old data
      product["changedDate"] = productIdMap[product.productNumber].changedDate;
      product["priceHistory"] =
        productIdMap[product.productNumber].priceHistory;
      product["alcoholHistory"] =
        productIdMap[product.productNumber].alcoholHistory;

      // add new data
      let updated = false;
      if (product.price != productIdMap[product.productNumber].price) {
        product.priceHistory.push({ x: changedDate, y: product.price });
        updated = true;
      }
      if (product.alcoholPercentage != productIdMap[product.productNumber].alcoholPercentage) {
        product.alcoholHistory.push({
          x: changedDate,
          y: product.alcoholPercentage || 0,
        });
        updated = true;
      }
      if (updated) {
        product["changedDate"] = changedDate;
        updatedProducts.push(product.productNumber);
      }
    } else {
      product["changedDate"] = changedDate;
      product["priceHistory"] = [{ x: changedDate, y: product.price }];
      product["alcoholHistory"] = [
        { x: changedDate, y: product.alcoholPercentage || 0 },
      ];
    }
  }

  let delCount = 0;
  for (const id of Object.keys(productIdMap)) {
    if (!foundIDs.includes(id)) {
      // console.log("Product not found: " + id);
      if (productIdMap[id].lastFound) {
        if (
          productIdMap[id].lastFound + 1000 * 60 * 60 * 24 * 7 <
          changedDate
        ) {
          // product not found for a week, remove it
          console.log("Product removed: " + id);
          delCount++
          continue;
        }
      } else {
        productIdMap[id]["lastFound"] = changedDate;
        productIdMap[id]["isTemporaryOutOfStock"] = true; //high chance it is
      }
      products.push(productIdMap[id]);
    }
  }
  console.log("Found: " + newProductNum + " products")
  console.log("Delta: " + (foundIDs.length - Object.keys(productIdMap).length) + " products");
  console.log("Duplicates: " + dupCount + " products");
  console.log("Deleted: " + delCount + " products");

  // fs.rename("data/products.json", "data/products_old.json", (err) => { if (err) console.error(err); })
  fs.writeFile(
    "data/products.json",
    JSON.stringify(products, null, 2), (err) => { if (err) { throw err; } }
  );
  console.log("Wrote: " + products.length + " products");
  fs.writeFile("data/updatedProducts.json", JSON.stringify(updatedProducts, null, 2), (err) => { if (err) { throw err; } })
  return products;
};
