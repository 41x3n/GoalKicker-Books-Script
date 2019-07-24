const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs')

const url = 'https://books.goalkicker.com/'
let linkList = []
let dlinkList = []


const getWebsiteLinks = async (url) => {
  try {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    $('div.bookContainer').each(function (i, elem) {  
      let link = $(elem).find('a').attr('href')
      linkList.push(url+link)
    });
  } catch (error) {
    console.error(error)
  }
}


const downloadLinks = async (linkList) => {
  for (const link of linkList) {
    const response = await axios.get(link)
    const $ = cheerio.load(response.data)
    let name = $('.download').attr("onclick")
    name = name.match(/location\.href\s*=\s*['"]([^'"]*)['"]/)
    let dlink = link + name[1]
    dlinkList.push({
      name: name[1],
      dlink: dlink
    })
  }

}

const downloadFiles = async (dlinkList) => {
  for (const link of dlinkList) {
    let name = link.name + '.pdf'
    let url = link.dlink
    let file = fs.createWriteStream(name)
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    })
    response.data.pipe(file)
  }
}


(async () => {
  await getWebsiteLinks(url)
  await downloadLinks(linkList)
  await downloadFiles(dlinkList)
})()