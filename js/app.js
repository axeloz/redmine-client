const {app} = require('electron').remote
const settings = require('electron').remote.getGlobal('settings')


$(document).ready(function() {
	console.log('Ready to rock')
	console.log(settings)
})