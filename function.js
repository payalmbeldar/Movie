const axios = require('axios');
const mongoose = require('mongoose');
const cheerio = require('cheerio');
const Movie = require('./server.js');


console.log("im here--->",Movie)
async function scrapeAndStoreData() {
    try {
        console.log("Scraping data...");

        
        const response = await axios.get('https://www.imdb.com/chart/top/?ref_=nv_mv_250', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const movies = [];

        $('.caNpAE').each(function (i, element) {
            const href = $(element).find('.ipc-title-link-wrapper').attr('href');
            const imdbID = href.match(/title\/(.*)\//)[1];
            const releaseDateandDuration = $(element).find('.fcCUPU').text(); 
            const firstFourDigits = parseFloat(releaseDateandDuration.substring(0, 4))
            const indexOfM =  releaseDateandDuration.indexOf('m');
            const substringTillM = releaseDateandDuration.substring(4, indexOfM + 1);
                movies.push({
                    imdbID: imdbID,
                    releaseYear: firstFourDigits,
                    duration: substringTillM
                });
            })
            //console.log("movies--------->",movies)
        const result = await getMovieDetails(movies);
        // console.log("Movie",Movie)
        // console.log("result",result)
        insertDataChunkWise(result);
       // await Movie.insertMany(result);
      //  console.log("Inserted movie details:", movieDetails.length);


    } catch (error) {
        console.error('Error scraping and storing data:', error);
        return [];
    }
}
// Function to insert data chunk-wise
async function insertDataChunkWise(data) {
    const chunkSize = 20; // Set the chunk size as per your preference
    const Movie = mongoose.model('Moviess');
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        try {
            await Movie.insertMany(chunk);
            console.log(`Inserted ${chunk.length} movie details.`);
        } catch (error) {
            console.error('Error inserting data:', error);
        }
    }
    console.log(`Finish insertinng`);
}

async function getMovieDetails(movies) {
    //console.log("movies--------------->", movies) 
    const movieDetails = [];

    for (const title of movies) {
        try {
            const response = await axios.get(`https://www.imdb.com/title/${title.imdbID}/?ref_=chttp_t_1`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                }
            });
         //   const movieDetails = [];

            let $ = cheerio.load(response.data);
            $('.eGWcuq').each(function (i, element) {

                const name = $(element).find('.hero__primary-text').text();
                const des = $(element).find('.fOUpWp').text();
                const rating = $(element).find('.cdQqzc').text();
                const trimmedString = rating.substring(0, rating.indexOf('/'));

                //const imdbID = href.match(/title\/(.*)\//)[1];

                movieDetails.push({
                    imdbID: title.imdbID,
                    name: name,
                    rating: parseFloat(trimmedString),
                    releaseDate: title.releaseYear,
                    duration: title.duration,
                    description: des,
                });
                console.log("object ready for : ",movieDetails.length)
            });
        
            // await Movie.insertMany(movieDetails);
            // console.log("Inserted movie details:", movieDetails.length);
        } catch (error) {
            console.error('Error fetching movie details for', title, ':', error);
        }
        
    };
    console.log("movieDetails---->,",movieDetails.length)

    return movieDetails;
}

module.exports = scrapeAndStoreData;
