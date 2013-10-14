/**
 * game idea machine
 * a twitter bot which tweets random game ideas
 */
var Twit = require('twit');
var fs  = require('fs');
var path = require('path');
var IdeaMachine = require('./IdeaMachine.js');
var secrets = require('./secrets.js');
var data = require('./data.js');

var Twitter = new Twit(secrets);

handleArguments();

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
				console.log( IdeaMachine.generateSafe(type) );
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

function monitor() {

	var stream = Twitter.stream('user');

	stream.on('tweet', function (tweet) {

		var message = tweet.text;
		var command = message.replace('@gameideamachine','').trim();

		if(command === 'idea') {
			reply(tweet, IdeaMachine.generateSafe(null, tweet.user.screen_name));
		} else if(data[command]) {
			reply(tweet, IdeaMachine.generateSafe(command, tweet.user.screen_name));
		} else {
			return;
		}

	});

}

function reply(tweet, message) {

	var status = '@' + tweet.user.screen_name + ' ' + message;

	Twitter.post('statuses/update', { status: status, in_reply_to_status_id : tweet.id_str }, function(err, reply) {	});

}

function tweet() {

	var file = path.resolve(__dirname, 'queue.txt');

	fs.readFile(file, function(err, contents) {

		var queue = contents.toString().split('\n');
		var status = queue.shift();

		if(!status) {
			status = IdeaMachine.generateSafe();
		}

		Twitter.post('statuses/update', { status: status }, function(err, reply) {

			// drop the empty last element
			queue.pop();

			// add a replacement to the queue
			queue.push(IdeaMachine.generateSafe());

			fs.writeFile(file, queue.join('\n'), function (err) { });

			if(err) { console.log(err); }

		});
	});
}
