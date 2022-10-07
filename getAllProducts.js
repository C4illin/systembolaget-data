import fetch from 'node-fetch'
import fs from 'fs'

export const getAllProducts = () => {
  let starturl = "https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search?size=30"
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

    fs.writeFile('products.json', JSON.stringify(products, null, 2), (err) => {
      if (err) {
        throw err
      }
      console.log("Wrote: " + products.length + " products")
    })
  })()
}
