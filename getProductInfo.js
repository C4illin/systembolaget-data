const puppeteer = require("puppeteer")
const fs = require("fs");

(async () => {
  let products = require('./products.json')
  let urls = fs.readFileSync('urls.txt','utf8').replaceAll("\r","").split('\n')
  let brokenurls = fs.readFileSync('oldurls.txt','utf8').replaceAll("\r","").split('\n')
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://www.systembolaget.se/')
  await page.click('button.css-1upq44r')
  await page.click('button[type="secondary"]')
  await page.screenshot({ path: 'test.png' })

  for (let i = 0; i < urls.length; i++) { //urls.length
    console.log(i + 1 + " - " + urls[i])
    await page.goto(urls[i])

    let product = await page.evaluate(() => {
      let main = document.querySelector(".col-md-7.offset-md-1")?.children
      let product = {"nr":null}
      
      if (main) {
        let offset = 0
        if (main.length == 5) {
          offset = 1
        }
        product = {
          "name": main[offset]?.firstChild?.children[1]?.firstChild?.firstChild?.innerText,
          "subtitle": main[offset]?.firstChild?.children[1]?.firstChild?.children[1]?.innerText,
          "alcohol": main[2+offset]?.firstChild?.firstChild?.children[2]?.children[0]?.innerText,
          "price": Number(main[2+offset]?.children[1]?.firstChild?.innerText.replace(" ","").replace(":-","").replace(":",".")),
          "volume": main[2+offset]?.firstChild?.firstChild?.children[1]?.children[0]?.innerText,
          "sugar": main[2+offset]?.firstChild?.firstChild?.children[3]?.children[0]?.innerText,
          "country": main[offset]?.firstChild?.children[1]?.children[1]?.innerText.replace("Tillverkad i ",""),
          "nr": Number(main[2+offset]?.firstChild?.firstChild?.firstChild?.children[1]?.innerText.slice(3)),
          "tags": main[offset]?.firstChild?.firstChild?.innerText.toLowerCase().split("\n"),
          "image": document.querySelector("div.col-md-4")?.firstChild?.firstChild?.firstChild?.src,
          "pant": main[2+offset]?.children[1]?.children[2]?.children[1]?.innerText.slice(7,-3).replace(",","."),
        }

        if (main[2+offset]?.firstChild?.children[1]?.firstChild?.textContent == "Ordervara, längre leveranstid") {
          product.tags.push("ordervara")
        }

        if (!product["image"]) {
          product["image"] = document.querySelector("div.col-md-4").firstChild.firstChild?.src
        }
      }
      
      return product
    })
    // console.log(product)
    if (product.pant) {
      product.pant = Number(product.pant)
      let apkp = product.alcohol?.split(' ')[0].replace(",",".")*product.volume?.split(' ')[0]/100/(product.price+product.pant)
      product.apkp = Math.round((apkp + Number.EPSILON) * 1000) / 1000
    }
    let apk = product.alcohol?.split(' ')[0].replace(",",".")*product.volume?.split(' ')[0]/100/product.price
    product.apk =  Math.round((apk + Number.EPSILON) * 1000) / 1000

    if (product["nr"] == null) {
      if (!brokenurls.includes(urls[i])){
        brokenurls.push(urls[i])
      }
      delete products[urls[i]]
      console.log("BROKEN: " + urls[i])
    } else {
      products[urls[i]] = product
    }
  }

  let sortOnAPK = []
  for (let url in products) {
    if (products[url]["apk"] || products[url]["apk"] === 0) {
      sortOnAPK.push({
        "apk": products[url]["apk"],
        "name": products[url]["name"],
        "subtitle": products[url]["subtitle"],
        "tags": products[url]["tags"],
        "alcohol": products[url]["alcohol"],
        "volume": products[url]["volume"],
        "price": products[url]["price"],
        "url": url.slice(37,-1),
      })
    }
  }

  sortOnAPK = sortOnAPK.sort(function(a, b) {
    var x = a["apk"]
    var y = b["apk"]
    // if(x === null && y === null) {
    //   return 0
    // }
    // if(y === null) {
    //   return -1
    // }
    // if(x === null) {
    //   return 1
    // }

    return ((x > y) ? -1 : ((x < y) ? 1 : 0))
  })

  // console.log(brokenurls)

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