const puppeteer = require("puppeteer")
const fs = require("fs")
const bluebird = require("bluebird")

const withBrowser = async (fn) => {
  const browser = await puppeteer.launch({
    args: ["--disable-dev-shm-usage","--no-sandbox"]
  })
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

const withPage = (browser) => async (fn) => {
  const page = await browser.newPage()
  try {
    return await fn(page)
  } finally {
    await page.close()
  }
}

(async () => {
  let products = require('../products.json')
  const urls = fs.readFileSync('urls.txt','utf8').replaceAll("\r","").split('\n').slice(20000)
  console.log("Num of urls: " + urls.length)
  let brokenurls = []
  let counter = 1

  await withBrowser(async browser => {
    console.log("Browser is online")
    await withPage(browser)(async page => {
      console.log("Page is online")
      await page.setRequestInterception(true)
      page.on('request', (req) => {
        if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
          req.abort()
        }
        else {
          req.continue()
        }
      })
      console.log("Oh oh cookie prompt")
      await page.goto('https://www.systembolaget.se/')
      await page.click("section div div div button")
      await page.click('button[type="secondary"]')
      console.log("Passed cookie prompt")
    })
  })

  await withBrowser(async (browser) => {
    return bluebird.map(urls, async (url) => {
      return withPage(browser)(async (page) => {
        console.log(counter + " - " + url)
        counter += 1
        await page.goto(url, {timeout: 0})
        let product = await page.evaluate(() => {
          let main = document.querySelector(".e3nstog6.css-13scvr.eu83ww70")?.children
          let product = {"nr":null}
        
          if (main) {
            let offset = 0

            if (main[2+offset]?.children[1]?.firstChild?.innerText == null) {
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
              "image": document.querySelector("div > img")?.src,
              "pant": main[2+offset]?.children[1]?.children[2]?.children[1]?.innerText.slice(5,-3).replace(",","."),
            }

            if (product["alcohol"] == null) {
              product["alcohol"] = "0 %"
            }

            if (product["alcohol"]?.endsWith("g/l")) {
              product["sugar"] = product["alcohol"]
              product["alcohol"] = "0 %"
            }

            if (main[2+offset]?.firstChild?.children[1]?.firstChild?.textContent == "Ordervara, längre leveranstid") {
              product.tags.push("ordervara")
            }
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
          let pagetitle = await page.title()
          if (pagetitle == "404 - sidan kan inte hittas | Systembolaget") {
            if (!brokenurls.includes(url)){
              brokenurls.push(url)
            }
            delete products[url]
            console.log("BROKEN: " + url)
          } else {
            console.log("TEMPBROKEN: " + url)
          }
        } else {
          if(!products[url] || products[url]["apk"] != product["apk"]) {
            product["changed"] = Date.now()
          } else if (products[url]["changed"]) {
            product["changed"] == products[url]["changed"]
          }
          products[url] = product
        }
      })
    }, {concurrency: 50})
  })


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
    return ((x > y) ? -1 : ((x < y) ? 1 : 0))
  })

  console.log("Broken: " + brokenurls.length)

  if (brokenurls.length > 0) {
    let urls = fs.readFileSync('urls.txt','utf8').replaceAll("\r","").split('\n')

    urls = urls.filter( ( el ) => !brokenurls.includes( el ) )

    let file = fs.createWriteStream('urls.txt')
    file.write(urls.join('\n'))
    file.end()
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