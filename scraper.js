/* scraper.js:
 *
 * Scrapes event listings on wegottickets.com and prints event data 
 * out to the console in JSON format.
 */

 
/*** MAIN BODY ***/

// Pull in dependencies
const axios = require('axios');
const cheerio = require('cheerio');

// Initialise our events array (this will store all the data in JSON format)
const events = [];

// Change the constant below to control number of search pages to scrape
const noOfPages = 1;

const scrapeUrls = getScrapeUrls(noOfPages);

// Now make the requests
axios.all(scrapeUrls.map(url => axios.get(url)))
    .then(axios.spread(function (...searchRes) {

        // Loop through responses
        for (let i=0; i<searchRes.length; i++) {
            const html = searchRes[i].data;

            const $ = cheerio.load(html);

            // Get array of search results
            const searchResults = $('.content.block-group:has(h2)');
            const eventUrls = [];

            // Add each event page URL to an array
            searchResults.each(function () {
                const eventUrl = $(this).find('h2 > a').attr('href');

                eventUrls.push(eventUrl);
            });

            // Now scrape each individual event page
            axios.all(eventUrls.map(url => axios.get(url)))
                .then(axios.spread(function (...eventRes) {

                    // Iterate through the events and store their details in the events array
                    for (let i=0; i<eventRes.length; i++) {
                        const html = eventRes[i].data;

                        const eventDetails = getEventDetails(html);

                        events.push(eventDetails);
                    }

                    // Output events array to console
                    console.log(events);

                }));

        }

    }))
    .catch(console.error);


/*** HELPER FUNCTIONS ***/

/* getScrapeUrls:
 * Returns an array of URLs of search pages to scrape
 */
function getScrapeUrls(noOfPages) {

    // Initialise array with first results page (from task brief)
    const urls = ['https://www.wegottickets.com/searchresults/all'];

    if (noOfPages > 1) {

        for (let i=0; i<noOfPages; i++) {

            // Push subsequent results pages to urls array
            urls.push(
                `https://www.wegottickets.com/searchresults/page/${i}/all`
            );
        
        }

    }
    
    return urls;
    
}

/* getEventDetails:
 * Returns an object containing information about an event
 */
function getEventDetails(html) {

    const $ = cheerio.load(html);

    const artist = $('.event-information h1').text();

    const city = $('table.venue-details > tbody > tr:first-child > td:nth-child(2) a:first-child')
        .text()
        .split(':')[0]
        .trim();

    const venue = $('table.venue-details > tbody > tr:first-child > td:nth-child(2) a:first-child')
        .text()
        .split(':')[1]
        .trim();

    const date = $('table.venue-details > tbody > tr:nth-child(2) > td:nth-child(2)')
        .text();

    const price = $('.BuyBox.block:first-child .price strong')
        .text();

    return {
        artist,
        city,
        venue,
        date,
        price
    };

}