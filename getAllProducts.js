import fetch from 'node-fetch'
import fs from 'fs'

let url = "https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search?size=30"
// let products = require('./test.json')
let products = []

let options = {
  method: 'GET',
  headers: {
    "accept": "application/json",
    "access-control-allow-origin": "*",
    "ocp-apim-subscription-key": "cfc702aed3094c86b92d6d4ff7a54c84",
    "Referer": "https://www.systembolaget.se/",
  }
}

let urlParameters = ['&assortmentText=S%C3%A4song', '&assortmentText=Tillf%C3%A4lligt%20sortiment', '&assortmentText=Webblanseringar', '&assortmentText=Fast%20sortiment', '&assortmentText=Lokalt%20%26%20Sm%C3%A5skaligt', '&assortmentText=Presentartiklar', '&assortmentText=Ordervaror&price.max=250', '&assortmentText=Ordervaror&price.min=250'];


(async () => {
  url = url + ''
  console.log(url)
  for (let i = 1; i < 10; i++) {
    await fetch(url + "&page=" + i, options)
      .then(res => res.json())
      .then(json => {
        if (i >= json["metadata"]["nextPage"]) {
          console.log("Aborted")
          i = 10000
        } else {
          products = products.concat(json["products"])
        }
        console.log(i)
      })
      .catch(error => console.error('Error:', error));
  }

  fs.writeFile('test.json', JSON.stringify(products, null, 4), (err) => {
    if (err) {
      throw err
    }
    console.log("Wrote: " + products.length + " products")
  })
})()
