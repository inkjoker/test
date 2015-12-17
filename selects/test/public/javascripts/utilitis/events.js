var Events = (function () {
   var breaker = {},
    arrayProto = Array.prototype,
    slice = arrayProto.slice,
    nativeForEach = arrayProto.forEach;    

    var triggerEvents = function(events, args) {

        var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];

        switch (args.length) {

            case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
            case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
            case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
            case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
            default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
        };
    }; 
    return {

        on: function(name, callback, context) {

            this._events || (this._events = {});

            var events = this._events[name] || (this._events[name] = []);

            events.push({callback: callback, context: context, ctx: context || this});

            return this;
        },

        off: function(name, callback) {
            var retain, ev, events, names, i, l, j, k;

            if (!this._events) return this;

            if (!name && !callback && !context) {

                this._events = {};

                return this;
            };

            var names = name ? [name] : _.keys(this._events);

            for (i = 0, l = names.length; i < l; i++) {

                name = names[i];

                if (events = this._events[name]) {

                    this._events[name] = retain = [];

                    if (callback || context) {

                        for (j = 0, k = events.length; j < k; j++) {

                            ev = events[j];

                            if ((callback && callback !== ev.callback && callback !== ev.callback._callback) || (context && context !== ev.context)) {

                                retain.push(ev);

                            };
                        };
                    };

                    if (!retain.length) delete this._events[name];
                };
            };
        },

        trigger: function(name) {

            if (!this._events) return this;

            var args = slice.call(arguments, 1);

            var events = this._events[name];

            if (events) triggerEvents(events, args);

            return this;
        }
    };
}())

var EventsClass = Class.create(Object.extend({
    initialize: function () {
        this.bindApi();
    },
    bindApi: function () {
        this.on('init', function () {
            console.info('events handler is ready');
        });        
    }
}, Events));