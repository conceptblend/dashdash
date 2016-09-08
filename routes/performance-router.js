/**
 * Performance Router
 *
 **/

var express = require('express');
var router = express.Router();
var analytics = require('../analytics');

router.get(/.*/, function (req, res, next) {
	console.log("Performance Router");
	var responseText = '<h1>'+req.path+'</h1>';
	
	res.type('html');
	res.send('<p>TODO: Implement</p>');

});

module.exports = router;