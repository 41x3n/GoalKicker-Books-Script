// Dependencies
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Global Vars
const url = 'https://books.goalkicker.com/';
let linkList = [];
let dLinkList = [];

// Get links to each book on Goal Kicker
const getWebsiteLinks = async (url) => {
	console.log('Getting GoalKicker download links...');

	try {
		const response = await axios.get(url);
		const $ = cheerio.load(response.data);

		$('div.bookContainer').each(function (i, elem) {
			let link = $(elem).find('a').attr('href');
			linkList.push(url + link);
		});

		console.log(`Found ${linkList.length} downloadable links...`);
	} catch (error) {
		console.error(error);
	}
};

// Get the download link to each book on Goal Kicker
const downloadLinks = async (linkList) => {
	console.log('Downloading GoalKicker link content...');

	let linkListIndex = 0;

	for (const link of linkList) {
		const response = await axios.get(link);
		const $ = cheerio.load(response.data);
		let name = $('.download').attr('onclick');

		name = name.match(/location\.href\s*=\s*['"]([^'"]*)['"]/);
		let dLink = link + name[1];

		dLinkList.push({
			name: name[1],
			dLink: dLink,
		});

		linkListIndex++;
		console.log(
			`Found Download Link (${linkListIndex}/${linkList.length}) ${name[1]}...`
		);
	}
};

// Download the book from Goal Kicker
const downloadFiles = async (dLinkList) => {
	let dir = path.join(`GoalKicker`, `GoalKicker-${Date.now()}/`);

	console.log(`Building directories "${dir}"...`);

	if (!fs.existsSync('GoalKicker')) {
		fs.mkdirSync('GoalKicker');
	}

	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}

	console.log(`Writing GoalKicker content to "${dir}"...`);

	let dLinkListIndex = 0;

	for (const link of dLinkList) {
		let name = `${dir}${link.name}`;
		let url = link.dLink;
		let file = fs.createWriteStream(name);

		const response = await axios({
			url,
			method: 'GET',
			responseType: 'stream',
		});

		const pipe = response.data.pipe(file);

		await new Promise((resolve, reject) =>
			pipe.on('finish', () => {
				resolve();
			})
		);

		dLinkListIndex++;
		console.log(
			`Downloaded File (${dLinkListIndex}/${dLinkList.length}) ${link.name}...`
		);
	}
};

(async () => {
	console.log('Starting... ');
	await getWebsiteLinks(url);
	await downloadLinks(linkList);
	await downloadFiles(dLinkList);
	console.log('DONE!\n');
})();
