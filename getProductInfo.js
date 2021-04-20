const puppeteer = require("puppeteer")
const fs = require("fs");

(async () => {
  let products = require('./products.json')
  let urls = fs.readFileSync('testurls.txt','utf8').split('\n')
  let brokenurls = []
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://www.systembolaget.se/')
  await page.click('button.css-1upq44r')
  await page.click('button.css-49r7zy')
  // var product = {}

  for (let i = 0; i < urls.length; i++) { //urls.length
    console.log(i + 1 + " - " + urls[i])
    await page.goto(urls[i])

    var product = await page.evaluate(() => {
      let product = {
        "name": document.getElementsByClassName('css-4zkxez')[0]?.innerText,
        "subtitle": document.getElementsByClassName('css-bk1kgv')[0]?.innerText,
        "alcohol": document.querySelector('.css-1cff46h > div:nth-child(3) > span:nth-child(1)')?.innerText,
        "price": Number(document.querySelector('.css-16ahep3 > div:nth-child(1)')?.innerText.replace(" ","").replace(":-","").replace(":",".")),
        "volume": document.querySelector('.css-1cff46h > div:nth-child(2) > span:nth-child(1)')?.innerText,
        "sugar": document.querySelector('.css-1cff46h > div:nth-child(4) > span:nth-child(1)')?.innerText,
        "country": document.querySelector('.css-x4jkyo > span:nth-child(1)')?.innerText.replace("Tillverkad i ",""),
        "nr": Number(document.querySelector('span.css-epvm6:nth-child(2)')?.innerText.slice(3)),
        "tags": document.getElementsByClassName('css-eakdcs')[0]?.innerText.toLowerCase().split("\n"),
        "image": document.getElementsByClassName('css-77ccha')[0]?.src,
        "pant": document.getElementsByClassName("css-9mcku5")[0]?.innerText.slice(7,-3).replace(",","."),
      }
      return product
    })
    if (product.pant) {
      product.pant = Number(product.pant)
      let apkp = product.alcohol?.split(' ')[0].replace(",",".")*product.volume?.split(' ')[0]/100/(product.price+product.pant)
      product.apkp = Math.round((apkp + Number.EPSILON) * 1000) / 1000
    }
    let apk = product.alcohol?.split(' ')[0].replace(",",".")*product.volume?.split(' ')[0]/100/product.price
    product.apk =  Math.round((apk + Number.EPSILON) * 1000) / 1000

    if (product["nr"] == null) {
      brokenurls.push(urls[i])
    } else {
      products[urls[i]] = product
    }
  }

  let sortOnAPK = []
  for (let url in products) {
    if (products[url]["apk"] !== null) {
      sortOnAPK.push({
        "apk": products[url]["apk"],
        "name": products[url]["name"],
        "subtitle": products[url]["subtitle"],
        "tags": products[url]["tags"],
        "alcohol": products[url]["alcohol"],
        "volume": products[url]["volume"],
        "price": products[url]["price"],
        "url": url.slice(37,-1)
      })
    }
  }

  sortOnAPK = sortOnAPK.sort(function(a, b) {
    var x = a["apk"]; var y = b["apk"]
    return ((x > y) ? -1 : ((x < y) ? 1 : 0))
  })

  console.log(brokenurls)

  if (brokenurls.length > 0) {
    let urls = fs.readFileSync('urls.txt','utf8').replaceAll("\r","").split('\n')

    urls = urls.filter( ( el ) => !brokenurls.includes( el ) )

    let file = fs.createWriteStream('urls.txt')
    file.write(urls.join('\n'))
    file.end()

    let filebrokenurls = fs.createWriteStream('oldurls.txt')
    filebrokenurls.write(brokenurls.join('\n'))
    filebrokenurls.end()
  }

  fs.writeFile('apksort.json', JSON.stringify(sortOnAPK, null, 0), (err) => {
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