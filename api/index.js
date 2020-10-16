const { Telegraf } = require('telegraf')
const config = require('../config.json')

const ssh = require('ssh2').Client

var conn = new ssh();

const bot = new Telegraf(config.telegramToken)

function exec(command){ //copypasted from the example and added a promise
	return new Promise( (resolve, reject) => {
		var mesg = ''
		var conn = new ssh()
			conn.on('ready', () => { 
				conn.exec(command, function(err, stream) {
					if (err) throw err;
					stream.on('close', function(code, signal) {
						resolve(mesg)
						conn.end();
					}).on('data', (data) => {
						mesg += data.toString('utf8')
					}).stderr.on('data', function(data) {
						console.log('STDERR: ' + data);
						reject(data)
					});
				});
			}).connect({
				host: config.sshConnectionConfig.host,
				port: config.sshConnectionConfig.port,
				username: config.sshConnectionConfig.username,
				privateKey: require('fs').readFileSync(config.sshConnectionConfig.privateKeyPath)
			}) 	// config object is a bit spaghetti, but I didn't yet try to find a better way to securely join a private ssh key here
				// in my case it is ../ssh/id_rsa from current file, but it is not included in git for obvious security reasons
	} ) 
}

bot.hears('/status', (ctx) => {

	var mesg = '';

	exec('wget -q 127.0.0.1/custom/custom.asp -O -')
		.then( data => {
			data = JSON.parse('['+data+']') // cuz router sends array, separated by comma, just like plaintext and only brackets are not enough to make it valid json
			mesg += 'На данный момент активно ' + data.length + ' соединений\n\n'
			mesg += 
				data.map( (elem) => ({
					hostname: elem[2],
					ip: elem[0],
					mac: elem[1],
				})
			)
			.sort( (d1, d2) => { 
				if ( parseInt(d1.ip.split('.')[3]) > parseInt(d2.ip.split('.')[3]) )  return 1;
				else return -1;
			}) // gotta beautify it later, now it's a true-chaining,
			.map( device => `Hostname: ${device.hostname}\nIP: ${device.ip}\nMac: ${device.mac}\n`)
			.join('\n')
			ctx.reply(mesg)
		} )

			
} )

bot.hears('/wakepeka', (ctx) => {

	exec('./wakepeka.sh')
		.then( data => {
			ctx.reply('Peka is about to wake up!')
		} )

})

bot.launch()
