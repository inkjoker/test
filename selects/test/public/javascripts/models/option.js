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
            var key;

            if (typeof arguments[0] == 'object') {
                for (key in arguments[0]) {
                    this.model[key] = arguments[0][key];
                }
            } else {
                this.model[name] = value;
            }

            this.trigger('change', this);

			return this.model[name];
		},
		get: function (name) {
			if (!name) return undefined;

			return this.model[name];
		}
	})
}());