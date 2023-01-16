import fetch from 'node-fetch'
import fs from 'fs'

export const getAllProducts = () => {
  let starturl = "https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search?size=30"
  // let products = require('./test.json')
  let products = []
  let toCompare = {}
  const changedDate = (new Date((new Date()).valueOf() - 1000*3600*10)).toISOString().split('T')[0]; // 10 hours ago

  fs.readFile("data/products.json", function read(err, data) {
    if(!err && data) {
      console.log("Products.json found, uploading to AWS")
      const old_products = JSON.parse(data)
      //create a map to make it faster to compare
      for (const product of old_products) {
        let priceChangedDate = changedDate
        if (product.priceChangedDate) {
          priceChangedDate = product.priceChangedDate
        }

        let priceHistory = [{date: priceChangedDate, price: product.price}]
        if (product.priceHistory) {
          priceHistory = product.priceHistory
        }

        toCompare[product.productNumberShort] = [product.price, product.volume, product.alcoholPercentage, priceHistory, priceChangedDate]
      }
    } else if(err.code == "ENOENT") {
      console.log("Products.json not found, don't upload to AWS")
    } else {
      console.log("Error with products.json: ", err.code)
    }
  })

  let options = {
    method: 'GET',
    headers: {
      "accept": "application/json",
      "access-control-allow-origin": "*",
      "ocp-apim-subscription-key": "cfc702aed3094c86b92d6d4ff7a54c84",
      "Referer": "https://www.systembolaget.se/",
    }
  }

  let urlParameters = [
    '&assortmentText=S%C3%A4song',
    '&assortmentText=Tillf%C3%A4lligt%20sortiment',
    '&assortmentText=Webblanseringar',
    '&assortmentText=Fast%20sortiment',
    '&assortmentText=Lokalt%20%26%20Sm%C3%A5skaligt',
    '&assortmentText=Presentartiklar',
    '&assortmentText=Ordervaror&price.max=250',
    '&assortmentText=Ordervaror&price.min=251'
  ];

  (async () => {
    for (const urlParam of urlParameters) {
      let url = starturl + urlParam
      console.log("Starting: " + url)
      for (let i = 1; i < 500; i++) {
        await fetch(url + "&page=" + i, options)
          .then(res => res.json())
          .then(json => {
            if (i > json["metadata"]["nextPage"] && json["metadata"]["nextPage"] > 0) {
              console.log("Aborted, something is wrong...")
              console.log("Last page: " + json["metadata"]["nextPage"])
              i = 10000
            } else if (json["metadata"]["nextPage"] == -1) {
              products = products.concat(json["products"])
              console.log("Done after " + i + " pages")
              i = 10000
            } else {
              products = products.concat(json["products"])
            }
          })
          .catch(error => console.error('Error:', error));
      }
    }
    
    for(const product of products) {
      if (product.productNumberShort in toCompare) {
        product.priceChangedDate = toCompare[product.productNumberShort][4]
        if (product.price == toCompare[product.productNumberShort][0] && product.volume == toCompare[product.productNumberShort][1] && product.alcoholPercentage == toCompare[product.productNumberShort][2] || changedDate == toCompare[product.productNumberShort][4]) {  
          product.priceHistory = toCompare[product.productNumberShort][3]
          continue;
        }
        product.priceHistory = toCompare[product.productNumberShort][3].append({"date": changedDate, "price": product.price})
      } else {
        product["priceHistory"] = [{"date": changedDate, "price": product.price}]
      }
      // console.log("Product: " + product.productNumberShort + " was updated")
      product["priceChangedDate"] = changedDate
    }
    
    fs.writeFile('data/products.json', JSON.stringify(products, null, 2), (err) => {
      if (err) {
        throw err
      }
      console.log("Wrote: " + products.length + " products")
      return products
    })
  })()
}
