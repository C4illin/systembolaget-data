const puppeteer = require("puppeteer")
const fs = require("fs");

(async () => {
  let urls = fs.readFileSync('urls.txt','utf8').split('\n')
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://www.systembolaget.se/')
  await page.click('button.css-1upq44r')
  await page.click('button.css-49r7zy')
  // await page.setDefaultNavigationTimeout(0)
 

  let url = "https://www.systembolaget.se/sok/?page="

  let hrefsFiltered = ["test"]
  let pageCounter = 1
  while (pageCounter > 0) {
    await page.goto(url + pageCounter)
    await page.waitForSelector(".css-1hw29i9").then(() => {
      console.log(pageCounter)
    }).catch(() => {
      console.log('FAIL')
    })
    
    const hrefs = await page.$$eval('a', as => as.map(a => (a.href)))
    hrefsFiltered = hrefs.filter((link) => link.startsWith("https://www.systembolaget.se/produkt/"))

    if (hrefsFiltered.length == 0) {
      await page.screenshot({ path: 'test.png' })
      pageCounter = 0
    } else {
      for (let i = 0; i < hrefsFiltered.length; i++) {
        if (!urls.includes(hrefsFiltered[i])) {
          urls.push(hrefsFiltered[i])
        }
      }
      pageCounter += 1
    } 
  }

  console.log(urls)

  let file = fs.createWriteStream('urls.txt')
  file.write(urls.join('\n'))
  file.end()

  await browser.close()
})()