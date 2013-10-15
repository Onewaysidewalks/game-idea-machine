/**
 * game idea machine
 * a twitter bot which tweets random game ideas
 */
var Twit = require('twit');
var fs  = require('fs');
var path = require('path');
var generator = require('./generator.js');
var secrets = require('./secrets.js');
var data = require('./data.js');

var Twitter = new Twit(secrets);

handleArguments();

/**
 * decide what to do based on what commands were passed in
 */
function handleArguments() {

	var count = 1,
		type = null;

	switch(process.argv[2]) {

		// generate some stuff
		case 'gen' :

			// how many?
			if(process.argv[3]) {
				count = parseInt(process.argv[3]);
			}

			// specific type?
			if(process.argv[4]) {
				type = 	process.argv[4];
			}

			// spit them out
			while(count--) {
				console.log( generator.generateSafe(type) );
			}

			break;

		// send a tweet
		case 'tweet':

			tweet();
			break;

		// listen for commands
		case 'monitor':

			monitor();
			break;

	}
}

/**
 * watch the gameideamachine user stream
 * look for tweets at it
 */
function monitor() {

	var stream = Twitter.stream('user');

	stream.on('tweet', function (tweet) {

		var message = tweet.text;
		var command = message.replace('@gameideamachine','').trim().toLowerCase();

		if(command === 'idea') {
			reply(tweet, generator.generateSafe(null, tweet.user.screen_name));
		} else if(data[command]) {
			reply(tweet, generator.generateSafe(command, tweet.user.screen_name));
		} else {
			// unknown request- log somewhere?
			return;
		}

	});
}

function reply(tweet, message) {

	var status = '@' + tweet.user.screen_name + ' ' + message;

	Twitter.post('statuses/update', {
		status: status,
		in_reply_to_status_id : tweet.id_str
	}, function(err, reply) {});
}

function tweet() {

	var file = path.resolve(__dirname, 'queue.txt');

	fs.readFile(file, function(err, contents) {

		var queue = contents.toString().split('\n');
		var status = queue.shift();

		if(!status) {
			status = generator.generateSafe();
		}

		Twitter.post('statuses/update', { status: status }, function(err, reply) {

			// drop the empty last element
			queue.pop();

			// add a replacement to the queue
			queue.push(generator.generateSafe());

			fs.writeFile(file, queue.join('\n'), function (err) { });

			if(err) { console.log(err); }

		});
	});
}
