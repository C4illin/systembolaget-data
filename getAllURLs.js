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
  await page.goto("https://www.systembolaget.se/")
  await page.click("button.css-1upq44r") // Age popup
  await page.click("button[type='secondary']") // Cookie popup
  // await page.setDefaultNavigationTimeout(0)
 

  // let url = "https://www.systembolaget.se/sok/?newArrivalType=Nytt%20senaste%20m%C3%A5naden" + "&page="
  // let url = "https://www.systembolaget.se/sok/?" + "&page="

  // let urlArray = [
  //   "https://www.systembolaget.se/sok/?priceFrom=400",
  //   "https://www.systembolaget.se/sok/?priceFrom=200&priceTo=400",
  //   "https://www.systembolaget.se/sok/?priceFrom=100&priceTo=200",
  //   "https://www.systembolaget.se/sok/?priceTo=100"
  // ]

  let urlArray = [
    "https://www.systembolaget.se/sok/?newArrivalType=Nytt%20senaste%20m%C3%A5naden"
  ]


  // there is a cap at 666 pages (9990 products) but enough products for 1460 pages (21897 prudcts @ 15 per page)
  let productCounter = 0
  for(let urlindex = 0; urlindex < urlArray.length; urlindex++) {
    let url = urlArray[urlindex] + "&page="
    let pageCounter = 1
    while (pageCounter > 0) {
      await page.goto(url + pageCounter)
      await page.waitForSelector(".col-12.col-lg-9 > div > div:nth-child(2) > div").then(() => {
        console.log(pageCounter)
      }).catch(() => {
        console.log("FAIL: " + pageCounter)
        page.screenshot({ path: "testfail.png" })
      })
    
      // hrefs is unnessesary middle step
      let hrefs = await page.$$eval("a", as => as.map(a => (a.href)))
      let hrefsFiltered = hrefs.filter((link) => link.startsWith("https://www.systembolaget.se/produkt/"))

      let counter = 0
      if (hrefsFiltered.length == 0) {
        await page.screenshot({ path: "test.png" })
        pageCounter = 0
      } else {
        for (let i = 0; i < hrefsFiltered.length; i++) {
          productCounter += 1
          if (!urls.includes(hrefsFiltered[i])) {
            urls.push(hrefsFiltered[i])
            counter += 1
          }
        }
        pageCounter += 1
      }
      console.log("Found: " + counter)
    }

    console.log("Pages: " + pageCounter)
    console.log("Total: " + productCounter)
    console.log("Slut storlek: " + urls.length)
    console.log("Delta: " + (urls.length - startSize))

    let file = fs.createWriteStream("urls.txt")
    file.write(urls.join("\n"))
    file.end()
  }
  
  await browser.close()
})()