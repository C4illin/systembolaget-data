const puppeteer = require("puppeteer")
const fs = require("fs");

(async () => {
  let urls = fs.readFileSync("urls.txt","utf8").replaceAll("\r","").split("\n")
  let startSize = urls.length
  console.log("Start storlek: " + startSize)
  const browser = await puppeteer.launch({
    args: ["--disable-dev-shm-usage","--no-sandbox"]
  })
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
      req.abort()
    }
    else {
      req.continue()
    }
  })
  await page.goto("https://www.systembolaget.se/")
  await page.click("section div div div button") // Age popup
  await page.click("button[type='secondary']") // Cookie popup
  // await page.setDefaultNavigationTimeout(0)
 
  let lastprice = 100
  let endprice = 200
  let productCounter = 0

  let stillRunning = true
  
  while (stillRunning) {
    console.log("From price: " + lastprice)
    let url = `https://www.systembolaget.se/sok/?sortBy=Price&sortDirection=Ascending&priceFrom=${lastprice}`
    await page.goto(url)

    let tooFew = true
    while (tooFew) {
      tooFew = false
      await page.waitForSelector("div[width='1,1,0.75'] > div > div:nth-child(1) h3")
      await page.waitForSelector(".css-6hztd2", {timeout: 5000}).then(async () => {
        // sometimes crashes without delay idk why
        await page.click(".css-6hztd2", {delay: 100})
      }).catch(async () => {
        console.log("Couldn't find more products")
      })
      
      let moreHref = true
      while (moreHref) {
        moreHref = false
        let hrefs = await page.$$eval("a", as => as.map(a => (a.href)))
        let lastHrefLength = hrefsFiltered?.length || 0
        var hrefsFiltered = hrefs.filter((link) => link.startsWith("https://www.systembolaget.se/produkt/"))

        if (hrefsFiltered.length == lastHrefLength && hrefsFiltered.length % 30 == 0) {
          moreHref = true
          await page.waitForTimeout(1000)
          console.log(hrefsFiltered.length)
        }
      }
      
      let prices = await page.$$eval("span", as => as.map(span => span.innerText))
      let pricesFiltered = prices.filter((price) => price.includes(":") && (price.endsWith(":-") || price.endsWith("*")))
      let lastlastprice = lastprice
      lastprice = Math.floor(pricesFiltered.slice(-1)[0].replace(":-", "").replace("*", "").replace(":",".").replaceAll(" ",""))
      

      if (lastprice == lastlastprice) {
        tooFew = true
      }
    }
    let counter = 0
    if (hrefsFiltered.length == 0) {
      await page.screenshot({ path: "test.png" })
      console.log("Something broke")
    } else {
      for (let i = 0; i < hrefsFiltered.length; i++) {
        productCounter += 1
        if (!urls.includes(hrefsFiltered[i])) {
          urls.push(hrefsFiltered[i])
          counter += 1
        }
      }
      if (hrefsFiltered.length < 30 || lastprice > endprice) {
        console.log("End of page")
        stillRunning = false
      }
    }
    console.log("Found: " + counter + " of " + hrefsFiltered.length + " products")
    // console.log(hrefsFiltered)
  }
  console.log("Total: " + productCounter)
  console.log("Slut storlek: " + urls.length)
  console.log("Delta: " + (urls.length - startSize))

  let file = fs.createWriteStream("urls.txt")
  file.write(urls.join("\n"))
  file.end()
  
  await browser.close()
})()