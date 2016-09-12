/**
 * Info Router
 *
 **/

var express = require('express');
var router = express.Router();
var analytics = require('../analytics');
var fs = require('fs');
var q = require('q');


// Load the Queries JSON
var infoQueries = JSON.parse(fs.readFileSync(__dirname + '/../info-queries.json'));

router.get(/.*/, function (req, res, next) {
	//console.log("Info Router");
	
	// TODO: Check for presence of req.path
	
	var viewData = {
		title : req.path,
		metrics : []
	};

	// Queue up all of the reports to generate. Order matters.
	q.allSettled([
		analytics.getReport(infoQueries['users-last7days'], [['pagePath', req.path]]),
		analytics.getReport(infoQueries['users-last30days'], [['pagePath', req.path]]),
		analytics.getReport(infoQueries['pageviews-last7days'], [['pagePath', req.path]]),
		analytics.getReport(infoQueries['pageviews-last30days'], [['pagePath', req.path]]),
		analytics.getReport(infoQueries['avgTimeOnPage-last7days'], [['pagePath', req.path]]),
		analytics.getReport(infoQueries['avgTimeOnPage-last30days'], [['pagePath', req.path]])
	]).then(
		function(results) { // fulfilled
			results.forEach(function (result) {
				if (result.state === "fulfilled") {
					var resValue = result.value || null,
						data = resValue.data || null,
						meta = resValue.meta || null,
						key = resValue.key || null;
										
					if (data && data !== null) {
						/**
						 *
						 *
						 **/
						//console.log(data);
						/**
						 * ^ remove
						 *
						 **/
						var value = data.totalsForAllResults[key];
						
						if (key == 'ga:avgTimeOnPage') {
							var mins = Math.floor(value / 60),
								secs = Math.round(value - mins*60);
							value = mins.toString() + ':' + (secs<10 ? '0':'') + secs.toString();
						}
						// TODO: add transformations for other keys
						

						// Add the metric details to the viewData for rendering later
						viewData.metrics.push({
							title : meta.title,
							value : value,
							period : meta.period
						});
					} else { // rejected
						// Add some sad details to the viewData for rendering later
						viewData.metrics.push({
							title : meta.title,
							value : '(No data returned)',
							period : meta.period
						});
					}
				}
			});
		}
	).done(function(allData) {
		// Remove
		//console.log(viewData);
		// ^ Remove
		
		// Caching config
		var d = new Date(),
			expires = new Date(d-1000).toISOString().replace(/T/, ' ').replace(/\..+/, ''),
			lastMod = new Date(d-5000).toISOString().replace(/T/, ' ').replace(/\..+/, '');
		/*
		new Date().toISOString().
		  replace(/T/, ' ').      // replace T with a space
		  replace(/\..+/, '')     // delete the dot and everything after
		*/
		res.set({
			'Cache-Control' : 'no-cache',
			'Expires' : expires,
			'Last-modified' : lastMod
		});
		
		// Send the captured viewData for rendering
		res.render('info', viewData);
	});
});

module.exports = router;