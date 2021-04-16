const puppeteer = require("puppeteer")
const fs = require("fs");

(async () => {
  let products = require('./products.json')
  let urls = fs.readFileSync('urls.txt','utf8').split('\n')
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://www.systembolaget.se/')
  await page.click('button.css-1upq44r')
  await page.click('button.css-49r7zy')
  // var product = {}

  for (let i = 0; i < 100; i++) { //urls.length
    console.log(i + 1 + " - " + urls[i])
    await page.goto(urls[i])

    var product = await page.evaluate(() => {
      let product = {
        "name": document.getElementsByClassName('css-4zkxez')[0]?.innerText,
        "subtitle": document.getElementsByClassName('css-bk1kgv')[0]?.innerText,
        "alcohol": document.querySelector('.css-1cff46h > div:nth-child(3) > span:nth-child(1)')?.innerText,
        "price": Number(document.querySelector('.css-16ahep3 > div:nth-child(1)')?.innerText.replace(":-","").replace(":",".")),
        "volume": document.querySelector('.css-1cff46h > div:nth-child(2) > span:nth-child(1)')?.innerText,
        "sugar": document.querySelector('.css-1cff46h > div:nth-child(4) > span:nth-child(1)')?.innerText,
        "country": document.querySelector('.css-x4jkyo > span:nth-child(1)')?.innerText.replace("Tillverkad i ",""),
        "nr": Number(document.querySelector('span.css-epvm6:nth-child(2)')?.innerText.slice(3)),
        "tags": document.getElementsByClassName('css-eakdcs')[0]?.innerText.toLowerCase().split("\n"),
        "image": document.getElementsByClassName('css-77ccha')[0]?.src,
      }
      return product
    })
    let apk = product.alcohol?.split(' ')[0].replace(",",".")*product.volume?.split(' ')[0]/100/product.price
    product.apk =  Math.round((apk + Number.EPSILON) * 100) / 100
    product.url = urls[i]
    // console.log(product)
    products[urls[i]] = product
  }

  let sortOnAPK = []
  for (let url in products) {
    sortOnAPK.push(products[url])
  }

  sortOnAPK = sortOnAPK.sort(function(a, b) {
    var x = a["apk"]; var y = b["apk"]
    return ((x > y) ? -1 : ((x < y) ? 1 : 0))
  })

  console.log(sortOnAPK)

  fs.writeFile('apksort.json', JSON.stringify(sortOnAPK, null, 4), (err) => {
    if (err) {
      throw err
    }
    console.log("apk done")
  })

  fs.writeFile('products.json', JSON.stringify(products, null, 4), (err) => {
    if (err) {
      throw err
    }
    console.log("done")
    process.exit(1)
  })
})()