require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const shortUrlSchema = new mongoose.Schema({
  url: String
});

let ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

const saveShortUrl = (url, done) => {
  const idx = ShortUrl.count() + 1;
  const shortUrl = new ShortUrl({
    short_url: idx,
    original_url: url
  });
  shortUrl.save((err, savedUrl) => {
    if (err) return console.error(err);
    done(null, savedUrl);
  });
}

const findUrlByIndex = (idx, done) => {
  return ShortUrl.find({short_url: idx}, (err, data) => {
    if (err) return console.log(err);
    done(null, data)
  });
}

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(morgan('dev'));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl/new', (req, res, next) => {
  console.log(req);
  const originalUrl = req.body.url;
  try {
    new URL(originalUrl);
  } catch {
    res.json({error: 'invalid url'});
  }
  saveShortUrl(originalUrl, (err, savedUrl) => {
    if (err) return console.error(err);
    res.json(savedUrl);
  });
});

app.get('/api/shorturl/:shortUrl', (req, res, next) => {
  findUrlByIndex(req.params.shortUrl, (err, data) => {
    if (err) return console.log(error);
    res.redirect(data.original_url);
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
