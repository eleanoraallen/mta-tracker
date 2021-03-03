const express = require('express');
const puppeteer = require('puppeteer');
const DomParser = require('dom-parser');
const cors = require('cors');
const parser = new DomParser();
const app = express();
app.use(cors());
const port = 80;

// Server Start Time
let startTime = 1;

// Last Server Update
let lastUpdate = 1

// The list of all accessed MTA lines 
const Lines = ['1', '2', '3', '4', '5', '6', '7',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'L', 'M',
  'N', 'Q', 'R', 'W', 'Z', 'H', 'GS', 'FS', 'SI'];

// True each MTA line is delayed
var delays = {};

// Total delay time of each MTA line
var delayTime = {};

// Initilize Data
Lines.forEach(x => {
  delays[x] = false
  delayTime[x] = 0
});

/**
 * Updates data with latest results from the MTA webpage
 */
async function updateData() {
  try {
    const browser = await puppeteer.launch();
    const [page] = await browser.pages();
    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://new.mta.info/', { waitUntil: 'networkidle0' });
    const pageData = await page.evaluate(() => document.querySelector('*').outerHTML);
    try {
      let delayed = new Set();
      const FetchTime = Date.now();
      if (startTime === 1) {
        startTime = FetchTime;
        lastUpdate = FetchTime;
      }
      parser.parseFromString(pageData).getElementById('status-subway')
        .firstChild.firstChild.childNodes.forEach(x => {
          if (x.firstChild.innerHTML === 'Delays') {
            x.lastChild.childNodes.forEach(y => {
              const line = y.innerHTML.split('Subway Line ')[1].split('"')[0];
              delayed.add(line);
              if (!delays[line]) {
                console.log(`Line ${line} is experiencing delays`)
              }
              delays[line] = true;
              delayTime[line] += (FetchTime - lastUpdate);
            })
          }
        })
      lastUpdate = FetchTime;
      Lines.forEach(line => {
        if (!delayed.has(line)) {
          if (delays[line]) {
            console.log(`Line ${line} is now recovered`);
          }
          delays[line] = false;
        }
      })
    } catch (err) {
      console.log(`Parsing Error: ${err}`)
    }
    await browser.close();
  } catch (err) {
    console.error(`Browser Error: ${err}`);
  }
}
updateData();

// Run loop
setInterval(() => {
  updateData();
}, 10000);


// handle empty queries
app.get('/', (req, res) => {
  res.send('You need to use either the /status or the /uptime endpoints to use this API!')
})

// handle status queries
app.get('/status', (req, res) => {
  const line = req.query.line;
  Lines.includes(line) ? res.send(delays[line]) :
    res.status(404).send('Something went wrong! Maybe try a different input in the form: /status?line=LINE_HERE');
});

// handle uptime queries
app.get('/uptime', (req, res) => {
  const line = req.query.line;
  const getUptime = (x) => {
    if (startTime === lastUpdate) {
      return String(1);
    } else {
      return String(1 - (delayTime[line]/(lastUpdate - startTime)));
    }
  }
  Lines.includes(line) ? res.send(getUptime(line)) :
    res.status(404).send('Something went wrong! Maybe try a different input in the form: /uptime?line=LINE_HERE');
});

// run app
app.listen(port, () =>
  console.log(`Torch MTA Tracker is listening on port ${port}`),
);