/**
 * @Private
 **/
var q = require('q');
var google = require('googleapis');
var gAnalytics = google.analytics('v3');
var config = require('./config.js')

// Access to GA account
var	SERVICE_ACCOUNT_EMAIL = config.serviceAccount.email,
	SERVICE_ACCOUNT_KEY_FILE = config.serviceAccount.keyFilePath;

var authClient = new google.auth.JWT(
	SERVICE_ACCOUNT_EMAIL,
	SERVICE_ACCOUNT_KEY_FILE,
	null,
	['https://www.googleapis.com/auth/analytics.readonly']);

var analytics = module.exports = {};

/**
 * @Public
 **/

/**
 * getReport
 *
 **/
analytics.getReport = function (queryData, opt_replaceTokens) {
	var def = q.defer(),
		query = {},
		queryParams = queryData.params;
	
	// Assign the authorization client
	query.auth = authClient;
	
	// TODO: make this an ENV variable for easy transference to other properties.
	query.ids = config.ga.ids.join(',');
	
	query['start-date'] = queryParams['start-date'] || '30daysAgo';
	query['end-date'] = queryParams['end-date'] || 'yesterday';
	query['start-index'] = queryParams['start-index'] || 1;
	query['max-results'] = queryParams['max-results'] || 1000;
	//
	if (queryParams['metrics']) {
		query['metrics'] = queryParams['metrics'].join(',');
	}
	
	if (queryParams['dimensions']) {
		query['dimensions'] = queryParams['dimensions'].join(',');
	}
	
	if (queryParams['filters']) {
		query['filters'] = queryParams['filters'].join(',');
		
		// Do any placeholder token swapping
		for (var i=0, len=opt_replaceTokens.length; i<len; i++) {
			var re = new RegExp('\\%' + opt_replaceTokens[i][0] + '\\%', 'g');
			query['filters'] = query['filters'].replace(re, opt_replaceTokens[i][1] || '');
		}
	}

	authClient.authorize(function (err, tokens) {
		if (err) {
			console.log("err is: " + err);
			return;
		}

		// v3 get
		gAnalytics.data.ga.get(query, function (err, data) {
			if (err){
				console.log(err);
			}
			def.resolve({
				meta : queryData.meta,
				key : queryData.key,
				data : data
			}); //data.rows
		});
	});
	return def.promise;
}

/**
 * getPageReport – Params definition and helper function.
 *
 **/
/*
analytics.getPageReport = function (strPath) {
	var query = info-queries['pageviews-last7days'];

	// Return the promise
	return analytics.getReport(query.params, [['pagePath', strPath]] );
};
*/
