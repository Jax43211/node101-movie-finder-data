//this is  to help secure my api key
require('dotenv').config();

//declaring variables that will be used in the server
const express = require('express');
const morgan = require('morgan');
const axios = require('axios');

//initializing the app
const app = express();

//use morgan for logging
app.use(morgan('dev'));

//creating an object to use for chaching data, declared using let as it will be updated regularly
let cache = {};

//function to check cache age, will return true or false
const isCacheOld = timestamp => {
    const ONE_DAY = 86400000; //this is one day in milliseconds
    return Date.now() - timestamp > ONE_DAY; //returns true if age is greater than one day, returns false otherwise
};

app.get('/', async (req, res) => {
    const {i, t} = req.query;
    if (!i && !t) {
        return res.status(400).json({ error: 'Please provide a movie id (?i=) or title (?t=).' });
}

const key = i || t;

if (cache[key] && !isCacheOld(cache[key].timestamp)) {
    console.log('Returning cached data');
    return res.json(cache[key].data);
}

try {
    const response = await axios.get('https://www.omdbapi.com/', {
        params: {
            apikey: process.env.API_KEY,
            i,
            t
        }
    });

if (response.data.Response === 'False') {
    return res.status(404).json({error: response.data.Error});
}

cache[key] = {
    data: response.data,
    timestamp: Date.now()
};
console.log('Fetched fresh data from OMDb');
res.json(response.data);
} catch (error) {
    console.error('Error fetching from OMDb:', error.message);
    res.status(500).json({error: 'Failed to fetch data'});
}
});

// When making calls to the OMDB API make sure to append the '&apikey=8730e0e' parameter

module.exports = app;