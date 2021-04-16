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

  for (let i = 0; i < urls.length; i++) {
    console.log(urls[i])
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
    console.log(product)
    products[urls[i]] = product
  }

  fs.writeFile('products.json', JSON.stringify(products, null, 4), (err) => {
    if (err) {
      throw err
    }
    console.log("done")
    process.exit(1)
  })
})()