const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const scrapeAndStoreData = require('./function.js');
const jwt = require('jsonwebtoken'); // Add this line


const app = express();

app.use(bodyParser.json());


const movieSchema = new mongoose.Schema({
    name: String,
    rating: Number,
    releaseDate: Number,
    duration: String,
    description: String,
    imdbID: String
});

const Movie = mongoose.model('Moviess', movieSchema);

mongoose.connect('mongodb://localhost:27017/moviesDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('Connected to MongoDB.');
        //scrapeAndStoreData()  // uncoment when u want to stored data
    })
    .catch((error) => console.error('Error connecting to MongoDB:', error));



    function authenticate(req, res, next) {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Missing token' });
        }
    
        try {
            const decoded = jwt.verify(token.split(' ')[1], 'secretkey');
            req.user = decoded.user;
            next(); // Continue to the next middleware function
        } catch (error) {
            return res.status(403).json({ error: 'Forbidden: Invalid token' });
        }
    }

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Your authentication logic here (e.g., verify username and password)

    // Dummy user data for demonstration
    const user = {
        id: 1,
        username: 'user1'
    };

    // Assuming authentication is successful, generate JWT token
    jwt.sign({ user }, 'secretkey', { expiresIn: '1h' }, (err, token) => {
        if (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json({ token });
        }
    });
});

//1. get movies detais
app.get('/movies', authenticate, async (req, res) => {
    try {
        const movies = await Movie.find();
        res.status(200).json(movies);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});


//2. Get movie details sorted by name, rating, release date, duration
app.get('/movies/sort/:criteria', authenticate, async (req, res) => {
    try {
        const criteria = req.params.criteria
        const movie = await Movie.find().sort(criteria);
        res.status(200).json(movie);
    } catch (error) {
        res.status(500).send('Internet sever error')
    }
})

//Search movies by name and description  -- test
app.get('/movies/search', authenticate, async (req, res) => {
    const query = req.query.query;
    try {
        const movies = await Movie.find({
            $or: [
                { name: { $regex: query, $options: 'i' } }, // Case-insensitive search by name
                { description: { $regex: query, $options: 'i' } } // Case-insensitive search by description
            ]
        });
        res.json(movies);
    } catch (error) {
        console.error('Error searching movies:', error);
        res.status(500).send('Error searching movies');
    }
});

app.use('/movies', scrapeAndStoreData);

const PORT = process.env.PORT || 3000;

// app.post('/login', (req, res) => {
//     // Dummy user data for demonstration
//     const user = {
//         id: 1,
//         username: 'user1'
//     };

//     jwt.sign({ user }, 'secretkey', { expiresIn: '1h' }, (err, token) => {
//         if (err) {
//             res.status(500).json({ error: 'Internal Server Error' });
//         } else {
//             res.json({ token });
//         }
//     });
// });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = Movie;
