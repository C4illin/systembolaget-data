const puppeteer = require("puppeteer")
const fs = require("fs");

(async () => {
  let urls = fs.readFileSync('urls.txt','utf8').replaceAll("\r","").split('\n')
  let startSize = urls.length
  console.log("Start storlek: " + startSize)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://www.systembolaget.se/')
  await page.click('button.css-1upq44r') // Age popup
  await page.click('button.css-49r7zy') // Cookie popup
  // await page.setDefaultNavigationTimeout(0)
 

  let url = "https://www.systembolaget.se/sok/?newArrivalType=Nytt%20senaste%20m%C3%A5naden" + "&page="

  // there is a cap at 666 pages (9990 products) but enough products for 1460 pages (21897 prudcts @ 15 per page)

  let productCounter = 0
  let pageCounter = 1
  while (pageCounter > 0) {
    await page.goto(url + pageCounter)
    await page.waitForSelector(".css-1hw29i9").then(() => {
      console.log(pageCounter)
    }).catch(() => {
      console.log('FAIL' + pageCounter)
    })
    
    // hrefs is unnessesary middle step
    let hrefs = await page.$$eval('a', as => as.map(a => (a.href)))
    let hrefsFiltered = hrefs.filter((link) => link.startsWith("https://www.systembolaget.se/produkt/"))

    let counter = 0
    if (hrefsFiltered.length == 0) {
      await page.screenshot({ path: 'test.png' })
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

  console.log("Total: " + productCounter)
  console.log("Slut storlek: " + urls.length)
  console.log("Delta: " + (urls.length - startSize))

  let file = fs.createWriteStream('urls.txt')
  file.write(urls.join('\n'))
  file.end()

  await browser.close()
})()