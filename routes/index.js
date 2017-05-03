var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
mongoose.connect('localhost:27017/test');
var Schema = mongoose.Schema;
var textSearch = require('mongoose-text-search');


var open = { 
  www: [],
  wwwname: [],
	loadtitle: [],
	loadlink: [],
  loadtime: []
	};

var userDataSchema = new Schema({
  name: {type: String, required: true},
  Title: [],
  Link: []
}, {collection: 'user-data'});

var UserData = mongoose.model('UserData', userDataSchema);

/* GET home page. */


var FeedLoad = function (open, www, req, res, next){
  
  var request = require('request'); 
  var FeedParser = require('feedparser');
  var req = request(www)  
  , feedparser = new FeedParser([]);
 // console.log("http://rss.cnn.com/rss/edition_tennis.rss");
  req.on('error', function (error) {  
    console.error(error);  
  });
  req.on('response', function (res) {  
    var stream = this;

    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

    stream.pipe(feedparser);
  });

  feedparser.on('error', function(error) {  
    console.error(error);   
  });

  feedparser.on('readable', function() {  
  var stream = this
    , meta = this.meta 
    , iTEM;

    while (iTEM = stream.read()) {
        var titleLength = iTEM.title.length;
        var itemTitle = iTEM.title;
        if (titleLength < 70) {
        open.loadtime.push(iTEM.date);
        open.loadtitle.push(iTEM.title);
        open.loadlink.push(iTEM.link);
        }
    else {
      var trimmedTitle = itemTitle.substring(0, 70);
      open.loadtime.push(iTEM.date);
 	  open.loadtitle.push(trimmedTitle);
 	  open.loadlink.push(iTEM.link);
    };
  }
  
})
};

router.get('/', function(req, res, next) {
		  
  res.render('index');
});

router.post('/load', function(req, res, next) {

  
   var openlink = req.body.name;
   console.log(openlink);
	setTimeout(function() {
	   	FeedLoad(open,openlink);
    	}, 0 );
	
	setTimeout(function() {
    open.loadtime.splice(1,1);
    	res.render('feedload', open);
	}, 1000 );

	setTimeout(function() {
    	open.loadtitle = [];
    	open.loadlink = [];
      open.loadtime = [];
	}, 1001 );
	
});

router.get('/get-data', function(req, res, next) {
  UserData.find()
      .then(function(doc) {
        res.render('index', {items: doc});
      });
});

router.post('/insert', function(req, res, next) {
  var item = {
    name: req.body.name,
    Title: req.body.Title,
    Link: req.body.Link,
  };

  var data = new UserData(item);
  data.save();
  res.redirect('/');
});

router.post('/update', function(req, res, next) {
  var id = req.body.id;

  UserData.findById(id, function(err, doc) {
    if (err) {
      console.error('error, no entry found');
    }
    doc.Title.push(req.body.Title);
    doc.Link.push(req.body.Link);
    doc.save();
  })
  res.redirect('/');
});

router.post('/delete', function(req, res, next) {
  var id = req.body.id;
  UserData.findByIdAndRemove(id).exec();
  res.redirect('/');
});


router.post('/auth', function(req, res, next) {
   var username= req.body.name;
   UserData.findOne({name: username},function(err, user){
       if (user){

     open.www = user.Link;
     open.wwwname = user.Title;
     res.render('feedload', open);
        } else{
        console.log("new ");
          var item = {
                   name: req.body.name,
                      };
            var data = new UserData(item);
            data.save();
        res.render('feedload', open);
        }
   });
   
});

router.get('/feedload', function(req, res, next) {
   
});


module.exports = router;



