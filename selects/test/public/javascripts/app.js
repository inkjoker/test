window.onload = function () {
	var select1 = document.getElementById('female'),
		select2 = document.getElementById('male');
	
	var female = new SelectView(select1),
		male = new SelectView(select2);


    //
    //var mediator = {
    //    unisexNames: function() {
    //        male.on('change', function (selected) {
    //            female.trigger('change', selected);
    //        });
    //    }
    //};
    //
    //mediator.unisexNames();
}