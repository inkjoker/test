var OptionModel = (function () {

	return Class.create(EventsClass, {
		model: {
			id: null,
			name: null,
			value: null,
			selected: false,
			disabled: false,
			innerText: null
		},
		initialize: function ($super, data) {
			if (!data) return false;

			this.bindApi();

			this.model = Object.extend(Object.extend({}, this.model), data);
		},
		set: function (name, value) {
			if (!name && !value) return false;

			this.model[name] = value;

			return this.model[name];
		},
		get: function (name) {
			if (!name) return undefined;

			return this.model[name];
		},
		bindApi: function () {
			this.on('change', function (name, value) {
				console.log('model id - [' + this.get('id') + '] name - [' + name + '] : has been updated. value: [' + value + ']');
				return {
					name: name,
					value: value
				}
			});
		}
	})
}());