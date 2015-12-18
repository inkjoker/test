var SelectView = (function () {
	var Private = {
		_collectOptions: function (options) {

			if (!options || !options.length) return false;

			var i, s, array, item;

			s = options.length;
			array = new Array(s);

			for (i = 0; i < s; i++) {
				item = options[i];
				array[i] = {
					id: i,
					name: 'name-' + i,
					value: item.value,
					selected: item.selected,
					disabled: item.disabled,
					innerText: item.text
				}
			}

			return array;
		}
	};
	return Class.create(EventsClass, {
		options: {
			wrapper: 'div',
			wrapperClass: 'custom-select',
			selected: 'h3',
			selectedClass: 'selected',
			options: 'ul',
			optionsClass: 'options',
			option: 'li',
			optionClass: 'option'
		},
		initialize: function ($super, select) {

			if (!select || !SelectModel) return false;
			
			this.select = new SelectModel({
				id: select.id,
				name: select.name,
				value: select.value,
				disabled: select.disabled
			}, Private._collectOptions(select.options));

			this.render();
			this.bindApi();
		},
		render: function () {
			var options = this.options,
				model = this.select.model;

			this.wrapper = this.renderWrapper(Object.extend( Object.extend({}, model), {
				className:options.wrapperClass
			}));

			this.selected = this.renderSelected(Object.extend( Object.extend({}, model), {
				innerText: model.value,
				className: options.selectedClass
			}));

			this.options = this.renderOptions(this.select.collection, {
				className: options.optionsClass				
			});

            this.selected.observe('click', function () {
                this.up(0).toggleClassName('-open');
            });

			this.wrapper.appendChild(this.selected);
			this.wrapper.appendChild(this.options);

			$(this.select.get('id')).insert({
				before: this.wrapper
			});
		},
		renderUnit: function (name, attributes) {
			var unit = document.createElement(name),
				key;

			for (key in attributes) {
				if (key != 'id') {
                    unit[key] = attributes[key];
                    unit.setAttribute(key, attributes[key]);
				} else {
					unit.setAttribute('data-id', attributes[key]);
				}
			}

			return unit;
		},
		renderWrapper: function (attributes) {
			return this.renderUnit(this.options.wrapper, attributes);
		},
		renderSelected: function (attributes) {
			return this.renderUnit(this.options.selected, attributes);
		},
		renderOption: function (attributes) {
			return this.renderUnit(this.options.option, attributes);
		},
		renderOptions: function (options, attributes) {
			var wrapper = this.renderUnit(this.options.options, attributes),
				s = options.length,
				scope = this,
				i;

			this.option = new Array(s);

			for (i = 0; i < s; i++) {
				this.option[i] = this.renderOption(Object.extend( Object.extend({}, options[i].model), {
					className: this.options.optionClass
				}));

				$(this.option[i]).observe('click', function () {
					scope.trigger('change', this);
				});

				wrapper.appendChild(this.option[i]);
			}

			return wrapper;
		},
		bindApi: function () {
			var scope = this;

			this.on('change', function (selected) {
				var name = selected.getAttribute('name'),
                    value = selected.getAttribute('value'),
                    model = this.select.findWhere('name', name),
                    modelPrev = this.select.get('selected');

                modelPrev.set('selected', false);
                this.select.set('previous', modelPrev);
                model.set('selected', true);

                $(scope.select.get('id')).value  = value;
                scope.trigger('change.selected', value);
			});
            this.on('change.selected', function (value) {
                scope.selected.innerText = value;
                scope.selected.up(0).removeClassName('-open');
            });
            this.select.on('change', function (name) {
                console.log('Select has changed. Trigger was called in view file.');
            });
		}
	})
}());