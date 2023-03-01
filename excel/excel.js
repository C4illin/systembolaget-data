const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");

const fileNameList = [
  "Artikellistan 2022.xlsx",
  "Artikellistan 2021.xlsx",
  "Artikellistan 2020.xlsx",
  "Artikellistan 2019.xlsx",
  "2018_Artikellistan_Ny.xlsx",
  "2017_Artikellistan_Ny.xlsx",
  "2016_Artikellistan.xlsx",
  "2015-Forsaljning-per-artikel_2.xlsx",
  "2014-Forsaljning-per-artikel_.xlsx",
  "2013-Forsaljning-per-artikel_.xlsx",
  "2012-Forsaljning-per-artikel_.xlsx",
  "2011-Forsaljning-per-artikel_.xlsx",
  "2010-Forsaljning-per-artikel_.xlsx",
  "2009-Forsaljning-per-artikel_.xlsx",
];

let products = [];
let item = 0

fs.readFile("../data/products.json", function read(err, data) {
  if (!err && data) {
    console.log("Products.json loaded");
    products = JSON.parse(data);
    processItem(item)
  } else if (err.code == "ENOENT") {
    console.log("Products.json not found, generate it or download it");
  } else {
    console.log("Error with products.json: ", err.code);
  }
});

let processItem = (item) => {
  if (item < fileNameList.length) {

    let fileName = fileNameList[item];
    console.log("Processing:", fileName);
    let newInfoMap = {};

    let year = fileName
      .replace("_2.xls", "")
      .replaceAll("-", " ")
      .replaceAll("_", " ")
      .replaceAll(".", " ")
      .replaceAll("  ", " ")
      .split(" ")
      .sort()[0];

    let changedDate = new Date(parseInt(year) + 1, 0, 1).valueOf();
    
    console.log("Year:", year, "Epoch:", changedDate);

    let artNrIndex = 0;

    if (year < 2013) {
      artNrIndex = 1;
    }

    readXlsxFile(fileName)
      .then((rows) => {
        for (const row of rows) {
          let artNr = row[artNrIndex];
          let price = row[8];
          let sold = row[16];
          newInfoMap[artNr] = { price: price, sold: sold };
        }
      })
      .finally(() => {
        // if (testing) {
        //   fs.writeFile(
        //     "newInfo.json",
        //     JSON.stringify(newInfoMap, null, 2),
        //     (err) => {
        //       if (err) throw err;
        //       console.log("Check newInfo.json!");
        //     }
        //   );
        // } else {
        for (const product of products) {
          if (newInfoMap[product.productNumber]) {
            let toAddPrice = {
              x: changedDate,
              y: newInfoMap[product.productNumber].price,
            };
            let toAddSold = {
              x: changedDate,
              y: newInfoMap[product.productNumber].sold,
            };

            if (product.priceHistory[0].x != changedDate) {
              product.priceHistory.unshift(toAddPrice);
            }

            if (product.soldVolume) {
              if (product.soldVolume[0].x != changedDate) {
                product.soldVolume.unshift(toAddSold);
              }
            } else {
              product.soldVolume = [toAddSold];
            }
          }
        }
        processItem(item + 1)
      });
  } else {
    fs.writeFile(
      "../data/products.json",
      JSON.stringify(products, null, 2),
      (err) => {
        if (err) throw err;
        console.log("Saved new products.json!");
      }
    );
  }
};