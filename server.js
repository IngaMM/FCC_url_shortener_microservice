'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns')
var bodyParser = require('body-parser');
const url = require('url'); 

var cors = require('cors');

var app = express();


// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}))

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

const Schema = mongoose.Schema;

const Url = mongoose.model(
  "Url",
  new Schema({
    original_url: { type: String, required: true },
    short_url: { type: Number, required: true }
  }), 'url'
);

function done(err, data) {
if (err) {console.log(err)}
if (data) {console.log(data)}
return};

app.post("/api/shorturl/new", function(req, res){
  let lookUpUrl = req.body.url;
  let parsedLookUpUrl = url.parse(lookUpUrl);
  dns.lookup(parsedLookUpUrl.hostname, function(err, addresses, family){
    if (err) {
      res.json({"error": "invalid URL"})
      return (done(err))
    }
    if (!parsedLookUpUrl.protocol || !parsedLookUpUrl.hostname) {
      res.json({"error": "invalid URL"})
      return (done("invalid URL"))
    }
    let original_url = parsedLookUpUrl.hostname 
    if (parsedLookUpUrl.pathname !== "/"){
      original_url = original_url + parsedLookUpUrl.pathname
    }
    Url
  .findOne()
  .sort('-short_url')  
  .exec(function (err, member_maxshorturl) {
      let new_short_url;
      if (member_maxshorturl){
        new_short_url = member_maxshorturl.short_url+1;
      } else {
        new_short_url = 1;
      }
      let member_url = new Url({original_url: original_url, short_url: new_short_url});
      member_url.save(function(err,member_url){
        if(err) {
          return(done(err))
        }
        res.json({"original_url": original_url, short_url: new_short_url})
      })
  });
  })
})

app.get("/api/shorturl/:short_url_number", function(req,res){
  let short_url = parseInt(req.params.short_url_number);
  let url = Url.findOne({short_url: short_url}, function(err, foundUrl){
    if (err){
      res.send("Invalid short_url")
      return done(err)
    }
    if (foundUrl){
      res.redirect("https://" + foundUrl.original_url)}
    else {
      res.send("Invalid short_url")
      return done("Invalid short_url")
    }
  })
  
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});