var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
  	title: 'Express2',
  	selected: {
        'female': 'Jain',
        'mail': 'Mike'
  	},
  	sex: ['female', 'male'],
  	repeation: {
        'female': ['Jain', 'Lina', 'Sara', 'Mishel', 'Alex', 'Kris'],
        'male': ['Mike', 'Alex', 'Kris', 'Antony', 'Poul']
    }
  });
});

module.exports = router;
