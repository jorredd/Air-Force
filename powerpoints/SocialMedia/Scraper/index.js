const puppeteer = require('puppeteer');
const express = require('express');
const $ = require("jquery");
var bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.post('/', function (req, res) {
  let data = req.body.requestData;
  var result = {};
  var foundData;
  (async (res) => {
    let eventLog = '';
    function log(msg) {
      eventLog += msg + '\r\n';
    }
    let requestData = '';
    try {
      //('Launching puppeteer');
      const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      //('Opening new page');
      const page = await browser.newPage();

      // They got smart and started blocking headless browsers but we got smarter. From here to line 70 is the solution to past all of the tests
      // Pass the User-Agent Test.
      const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
      await page.setUserAgent(userAgent);
      // Pass the Webdriver Test.
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });
     
      // Pass the Chrome Test.
      await page.evaluateOnNewDocument(() => {
        // We can mock this in as much depth as we need for the test.
        window.navigator.chrome = {
          runtime: {},
          // etc.
        };
      });
      // Pass the Permissions Test.
      await page.evaluateOnNewDocument(() => {
        const originalQuery = window.navigator.permissions.query;
        return window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });
      // Pass the Plugins Length Test.
      await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'plugins', {
          // This just needs to have `length > 0` for the current test,
          // but we could mock the plugins too if necessary.
          get: () => [1, 2, 3, 4, 5],
        });
      });
      // Pass the Languages Test.
      await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      });
      //End of tests
      //('Set timeout');
      page.setDefaultNavigationTimeout(20000);
      //Account For New Tabs
      await page.evaluateOnNewDocument(() => {
        window.open = (url) => {
          top.location = url
        }
      })
      log('Parsing RequestData');
      try {
        requestData = data;
      } catch (e) {
        result = {
          success: false,
          error: 'Could not parse the request data. ' + e.message + '\n\r' + process.argv[3],
          eventlog: eventLog
        };
        await browser.close();
        res.json(result);
        return;
      }
      try {
        log('Starting scrape');
        await page.goto('https://www.instagram.com/accounts/login/?source=auth_switcher', { waitUntil: 'networkidle0' });
        // Generates a PDF with 'screen' media type.
        let username = 'input[name*="username"]';
        let password = 'input[name*="password"]';
        const user = "234testeesons";
        const pass = "spacecowboys";

        await page.addScriptTag({ path: require.resolve('jquery') });

        await page.type(username, user);
        await page.type(password, pass);
        await page.evaluate(() => $("button").eq(1).click());

        await page.waitFor(3000);

        await page.addScriptTag({ path: require.resolve('jquery')});
      try{
        // await page.evaluate(() => {
        //   const lastLink = document.querySelectorAll('h3 > a')[2];
        //   const topPos = lastLink.offsetTop;

        //   const parentDiv = document.querySelector('div[class*="eo2As"]');
        //   parentDiv.scrollTop = topPos;
        // });
        await page.click("body > div.RnEpo.Yx5HN > div > div > div.mt3GC > button.aOOlW.HoLwm");
        var link = await page.evaluate(() => $("h2 a").eq(1).attr("href")); // If this fails switch to using this in eval body $("body > div.RnEpo.Yx5HN > div > div > div.mt3GC > button.aOOlW.HoLwm").click();
        await page.goto('https://www.instagram.com' + link , {waitUntil: "domcontentloaded"});
        await page.emulateMedia('screen');
        await page.screenshot({ path: 'page.jpg' });

        await page.addScriptTag({ path: require.resolve('jquery') });
        await page.waitFor(3000);
        foundData = await page.evaluate(() => $("span").text().trim() );
        var target = await page.evaluate(() => {
          return $("h1").eq(0).text();
        });
        // await page.waitFor(100000);
        result.targetUser = target;
        result.foundData = foundData;
        result.success = true;
        result.TAKEAWAY = "Protect Your PII";
        await browser.close();
        res.json(result);
        return;
      }catch(e)
      {
        var msg = e.message;
      }
        return result;
      } catch (e) {
        result = {
          success: false,
          error: e.message,
          eventlog: eventLog
        };
        await browser.close();
        res.json(result);
        return;
      }
    } catch (e) {
      result = {
        success: false,
        error: 'Error in outer class' + e.message,
        eventlog: eventLog
      };
      res.json(result);
      return;
    }
  })(res); //End of async
}); //End of app.post

app.listen(process.env.port || 7000, () => console.log('app listening on port ' + (process.env.port || 7000)));

function delay(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}