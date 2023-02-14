const readXlsxFile = require('read-excel-file/node')

readXlsxFile('Artikellistan 2021.xlsx').then((rows) => {
  for (const row of rows) {
    let artNr = row[0]
    let price = row[8]
    let sold = row[]
  }
})