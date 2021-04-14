require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const shortUrlSchema = new mongoose.Schema({
  short_url: Number,
  original_url: String
});

let ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

const saveShortUrl = (url, done) => {
  ShortUrl.count({}, (err, cnt) => {
    const shortUrl = new ShortUrl({
      short_url: cnt + 1,
      original_url: url
    });
    shortUrl.save((err, savedUrl) => {
      if (err) console.error(err);
      done(null, savedUrl);
    });
  });
}

const findUrlByIndex = (idx, done) => {
  ShortUrl.findOne({short_url: Number(idx)}, (err, data) => {
    if (err) console.log(err);
    if (!data) done('Invalid URL!', {});
    done(null, data)
  });
}

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl/new', (req, res) => {
  const originalUrl = req.body.url;
  let urlObj;
  try {
    urlObj = new URL(originalUrl);
    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) throw 'Not http!';
  } catch {
    res.json({error: 'invalid url'});
  }
  dns.lookup(urlObj.hostname, (err) => {
    if (err) res.json({error: 'invalid url'});
    saveShortUrl(originalUrl, (err, savedUrl) => {
      if (err) return console.error(err);
      res.json(savedUrl);
    });
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
