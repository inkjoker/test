var SelectModel = (function () {

	return Class.create(EventsClass, {
		collection: [],
		model: {
			id: null,
			name: null,
			value: null,
			disabled: false,
			selected: null,
			previous: null
		},
		initialize: function ($super, data, array) {			
			if (!data) return false;

			var i, s;
			this.bindApi();

			this.model = Object.extend(Object.extend({}, this.model), data);

			if (!array || !array.length || !OptionModel) return false;

			s = array.length;
			this.collection = new Array(s);

			for (i = 0; i < s; i++) {
				this.collection[i] = new OptionModel(array[i]);

				if (data.value == this.collection[i].get('value')) {
					this.model.selected = this.collection[i];
				}
			}
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
		findWhere: function (name, value) {
			var i, s;
			s = this.collection.length;
			for (i = 0; i < s; i++) {
				if (value == this.collection[i].get(name)) return this.collection[i];
			}
		},
		bindApi: function () {
			this.on('change', function (name, value) {

				this.model.previous = this.findWhere('selected', true);
				this.model.selected = this.findWhere(name, value);

				this.model.previous.trigger('change', 'selected', false);
				this.model.selected.trigger('change', 'selected', true);

				this.set('value', value);

				return {
					name: name,
					value: value
				}
			});
		}
	})
}());