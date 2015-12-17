window.onload = function () {
	var select1 = document.getElementById('job-pilot'),
		select2 = document.getElementById('job-plumber');
	
	var pilot = new SelectView(select1),
		plumber = new SelectView(select2);

		console.log(pilot)
		console.log(plumber)
}