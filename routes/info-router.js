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
	console.log("Info Router");
	
	// TODO: Check for presence of req.path
	
	var viewData = {
		title : 'Page usage information: '+req.path,
		metrics : []
	};

	// Queue up all of the reports to generate. Order matters.
	q.allSettled([
		analytics.getReport(infoQueries['users-last7days'], [['pagePath', req.path]]),
		analytics.getReport(infoQueries['pageviews-last7days'], [['pagePath', req.path]]),
		analytics.getReport(infoQueries['users-last30days'], [['pagePath', req.path]]),
		analytics.getReport(infoQueries['pageviews-last30days'], [['pagePath', req.path]])
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
						console.log(data);
						/**
						 * ^ remove
						 *
						 **/
						var totalPageviews = data.totalsForAllResults[key];

						// Add the metric details to the viewData for rendering later
						viewData.metrics.push({
							title : meta.title,
							value : totalPageviews,
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
		console.log(viewData);
		// ^ Remove
		
		// Send the captured viewData for rendering
		res.render('info', viewData);
	});
	
	/*
	var query = infoQueries['users-last7days'];
	analytics.getReport(query.params, [['pagePath', req.path]]).then(
		function(data) { //fulfilled
			console.log(data);
			
			var totalPageviews = data.totalsForAllResults[query.key],
				errorMessage = null;

			if (totalPageviews == 0) {
				errorMessage += 'Hmmmmm... Zero results might mean this URL doesn\'t exist. Please check for typos.';
			}
			
			viewData.metrics.push({
				title : query.meta.title,
				value : totalPageviews,
				period : query.meta.period
			});

			
		},
		function(data){ //rejected			
			viewData.metrics.push({
				title : query.meta.title,
				value : 'No data returned',
				period : query.meta.period
			});
		}
	).done(function(allData) {
		console.log(viewData);
		res.render('info', viewData);
	});*/
	

	
	// Get just the number of pageviews for the selected path
	/*
	analytics.getPageReport(req.path).then(
		function(data) { //fulfilled
			console.log('********** Promise Fullfilled');
			console.log(data);
			
			var totalPageviews = data.totalsForAllResults['ga:pageviews'],
				errorMessage = null;

			if (totalPageviews == 0) {
				errorMessage += 'Hmmmmm... Zero results might mean this URL doesn\'t exist. Please check for typos.';
			}
			
			res.render('info', { title: req.path, pageviews: totalPageviews, errorMessage: errorMessage });
		},
		function(data){ //rejected			
			res.render('info', { title: req.path, pageviews: 0, errorMessage: 'Rejected promise' });
		}
	).done();
	*/
});

module.exports = router;