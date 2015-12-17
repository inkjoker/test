"use strict";

var Constructor = (function() {
    // Request animation frame polyfill
    (function() {
        var lastTime = 0,
            vendors = ['webkit', 'moz'];

        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {

            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];

            window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame) {

            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime(),
                    timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                    id = window.setTimeout(function() { 

                        callback(currTime + timeToCall); 

                    }, timeToCall);

                lastTime = currTime + timeToCall;

                return id;
            };
        };

        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
        };
    }());

    CanvasRenderingContext2D.prototype.clear = CanvasRenderingContext2D.prototype.clear || function (preserveTransform) {

        if (preserveTransform) {

            this.save();
            this.setTransform(1, 0, 0, 1, 0, 0);

        };

        this.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (preserveTransform) {

            this.restore();
        };           
    };

    // Library functions, partially from underscore.
    var breaker = {},
        arrayProto = Array.prototype,
        slice = arrayProto.slice,
        nativeForEach = arrayProto.forEach;

    var each = function(obj, iterator, context) {

        if (obj == null) return;

        if (nativeForEach && obj.forEach === nativeForEach) {

            obj.forEach(iterator, context);

        } else if (obj.length === +obj.length) {

            for (var i = 0, length = obj.length; i < length; i++) {

                if (iterator.call(context, obj[i], i, obj) === breaker) return;

            };

        } else {

            var keys = _.keys(obj);

            for (var i = 0, length = keys.length; i < length; i++) {

                if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;

            };
        };
    };

    var extend = function(obj) {

        each(slice.call(arguments, 1), function(source) {

            if (source) {

                for (var prop in source) {

                    obj[prop] = source[prop];

                };
            };
        });

        return obj;
    };

    var Extendable = function(constructor){

        var obj_extend = function(protoProps, staticProps) {

            var parent = this,
                child;

            if (protoProps && Object.prototype.hasOwnProperty.call(protoProps, 'constructor')) {

                child = protoProps.constructor;

            } else {

                child = function() { 
                    return parent.apply(this, arguments); 
                };
            };

            extend(child, parent, staticProps);

            var Surrogate = function(){ 

                this.constructor = child; 

            };

            Surrogate.prototype = parent.prototype;

            child.prototype = new Surrogate;

            if (protoProps) extend(child.prototype, protoProps);

            child.__super__ = parent.prototype;

            return child;
        };

        constructor.extend = obj_extend;

        return constructor;
    };

    var Events = {

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


    var Controller = function() {

        this.init();

    };

    extend(Controller.prototype, Events, {
        startTime : 0,
        playedTime : 0,
        currentTime : 0,
        isPlayAll : true,
    }, {

        init : function() {

            this.players = [];

            this.state = 'pause';

            this.bindApi();
        },

        create : function(element, options) {

            this.options = options;
            this.options.isPlayAll = typeof options.isPlayAll != 'undefined' ? options.isPlayAll : this.isPlayAll;
            this.playStartTime = this.startTime;
            this.timePlayed = this.playedTime;

            var player = new Player(element, options, this);

            this.players.push(player);

            return player;
        },

        destroy : function(id) {

			for(var i = 0; i < this.players.length; i++){

				if(this.players[i].id == id){

					var player = this.players[i],
						n = i;

					break;
				};
			};

			if(player){

				player.trigger('destroy');
				this.players.splice(n, 1);

			};
        },

        destroyAll : function(soft) {

            if (!soft){

                this.pause();  
            };
        
			each(this.players, function(player) {

				player.trigger('destroy');

			});

			this.players = [];
        },

        playTime: function() {

            if(this.startTime) {

                return Date.now() - this.startTime;

            } else {

                return 0;

            }

        },

        globalTime: function() {
            this.currentTime = this.playTime() + this.playedTime;

            return this.currentTime;    
        },

      	play : function(originPlayer) {

            this.trigger('setState', 'play');

            this.setToAllPlayer(function(id){

                this.trigger('play', id);

            }, originPlayer);
        },

        pause : function(originPlayer) {

            this.trigger('setState', 'pause');

            this.setToAllPlayer(function(id){

                this.trigger('pause', id);

            }, originPlayer);
        },

        drag : function(originPlayer, offset) {

            this.trigger('setState', 'drag');

            this.setToAllPlayer(function(id){

                this.trigger('drag', offset, id);

            }, originPlayer, offset);
        },

        dragStart : function(originPlayer) {

            this.trigger('setState', 'dragStart', this.state);

            this.setToAllPlayer(function(id){

                this.trigger('dragStart', id);

                this.trigger('pause');

            }, originPlayer);
        },

        dragEnd : function(originPlayer) {

            this.state = this.savedState;

            this.setToAllPlayer(function(id){

                this.trigger('dragEnd', id);

                if ( /\b(play)\b/i.test(this.controller.state) ) {

                    this.trigger('play');

                } else {

                    this.trigger('pause');

                };

            }, originPlayer);
        },

        changeType : function(originPlayer, type) {

            this.setToAllPlayer(function() {

                this.trigger('setMedia', type);

            }, originPlayer, type);
        },

        changeSegment : function(originPlayer, segmentType) {

            this.setToAllPlayer(function() {

                this.trigger('changeSegment', segmentType);

            }, originPlayer, segmentType);
        },

        setSize : function(originPlayer, size) {

            this.setToAllPlayer(function() {

                this.trigger('setSize', size);

            }, originPlayer, size);
        },


        setToAllPlayer : function(callback, originPlayer) {


            if (this.options.isPlayAll) {

                var players = this.players;

                each(players, function(player){

                	if (player.id != originPlayer.id) {

                    	callback.call(player, originPlayer.id);

                	} else {

                        return false;

                	};

                });

            } else {

                callback.call(originPlayer, originPlayer.id);

            };
        },

        bindApi : function() {

			this.on('play', function(originPlayer) {

                this.trigger('setState', 'play');

                originPlayer.trigger('play', originPlayer.id);

				this.play(originPlayer);	

			});

			this.on('pause', function(originPlayer) {

                this.trigger('setState', 'pause');

                originPlayer.trigger('pause', originPlayer.id);

                this.pause(originPlayer);    

			});

			this.on('drag', function(originPlayer, offset) {

                this.offset = offset;

                originPlayer.trigger('drag', offset);    

				this.drag(originPlayer, offset);

			});

			this.on('dragStart', function(originPlayer) {

                originPlayer.trigger('dragStart');    

                this.dragStart(originPlayer);

                originPlayer.trigger('pause');
			});

			this.on('dragEnd', function(originPlayer) {

                this.state = this.savedState;

                if ( /\b(play)\b/i.test(this.state) ) {

                    originPlayer.trigger('play');

                } else {

                    originPlayer.trigger('pause');

                };

                originPlayer.trigger('dragEnd');    

                this.dragEnd(originPlayer);

			});

            this.on('setSize', function(originPlayer, e) {

                var originalTarget = e.originalTarget || e.target,
                    size = +originalTarget.getAttribute('data-view-size');

                originPlayer.trigger('setSize', size);

                this.setSize(originPlayer, size)
            });

            this.on('changeSegment', function(originPlayer, e) {


                var originalTarget = e.originalTarget || e.target,
                    segmentType = +originalTarget.getAttribute('data-view-mode');

                originPlayer.trigger('changeSegment', segmentType);

                this.changeSegment(originPlayer, segmentType)

            });

			this.on('source', function(originPlayer, e) {

                var type, format;

                if (typeof e == 'string') {

                    type = e;

                } else {
         
                    var originalTarget = e.originalTarget || e.target;

                    format = originalTarget.getAttribute('data-type');

                    if (/\b(mono)\b/i.test(format)) {

                        if (/\b(sets)\b/i.test(this.options.mediaFormat)) {

                            type = 'sets' 

                        } else {

                            type = 'video' 

                        };

                    } else {

                        type = 'stereo' 

                    };
                };

                originPlayer.trigger('setMedia', type);    

                this.changeType(originPlayer, type);
			});
            

            this.on('destroy', function(id) {

                this.destroy(id);

            });

            this.on('destroyAll', function(soft) {

                this.destroyAll(soft);

            });

            this.on('setState', function(state, savedState) {

                this.state = state;

                this.savedState = savedState || this.savedState;

            });

            this.on('abort', function(){

                each(this.players, function(player){

                    player.trigger('abort');
                });
            });
        }
    });

    var Container = function(element, options) {

        this.defaults = {

            units : ['typeCtrl', 'wrapper', 'infoBlock', 'stateCtrl', 'ctrlBlock', 'overlayBlock', 'loaderBlock'],
            unitsCtrl : ['segmentView', 'playCtrl', 'pauseCtrl', 'sizeCtrl'],
            isSegment : true

        };

        this.render = function() {

            this.options = extend({}, this.defaults, options);

            element = element.jquery ? element[0] : element;

            element.classList.add('jvp');

            for( var i = 0, s = this.options.units.length; i < s; i++) {

                var unit = this.defaults.units[i],
                    ctrl = this[unit]();

                element.appendChild(ctrl);

                this[unit] = ctrl;
            }; 
        };

        this.wrapper = function() {
            var unit = document.createElement('div');

            unit.classList.add('jvp_wrapper');

            return unit;
        };

        this.infoBlock = function() {
            var unit = document.createElement('i');

            unit.classList.add('jvp_info');

            return unit;
        };

        this.overlayBlock = function() {
            var unit = document.createElement('div');

            unit.classList.add('jvp_overlay');

            return unit;
        };

        this.loaderBlock = function() {

            var unit = document.createElement('div'),
                unitOne = document.createElement('div'),
                unitSecond = document.createElement('div'),
                unitThird = document.createElement('div');

            unitOne.classList.add('jvp_loader');
            unitSecond.classList.add('jvp_loader');
            unitThird.classList.add('jvp_loader');
            unit.classList.add('jvp_loader__main');

            unit.appendChild(unitOne);
            unit.appendChild(unitSecond);
            unit.appendChild(unitThird);

            return unit;
        };

        this.ctrlBlock = function() {
            var unit = document.createElement('div');

            if (this.options.insidePlayCtrl ) {

                unit.classList.add('jvp_controls', 'jvp_controls__inside');

            } else {

                unit.classList.add('jvp_controls')

            };

            for( var i = 0, s = this.options.unitsCtrl.length; i < s; i++) {

                var element = this.defaults.unitsCtrl[i],
                    ctrl = this[element]();

                unit.appendChild(ctrl);
            }; 

            return unit;
        };

        this.segmentView = function() {
            var unit = document.createElement('ul');

            unit.classList.add('jvp_segment');

            for( var i = 0; i < 5; i++) {
                var unitElement = document.createElement('li'),
                    textNode = document.createTextNode(this.options.viewMode[i]),
                    elementCtrl = document.createElement('a');

                elementCtrl.classList.add('jvp_segment-' + i);

                elementCtrl.href = "javascript:void(0)";
                elementCtrl.setAttribute('data-view-mode', this.options.viewMode[i]);

                elementCtrl.appendChild(textNode);
                unitElement.appendChild(elementCtrl);
                unit.appendChild(unitElement);
            };

            this.segmentView = unit;

            return unit;
        };

        this.playCtrl = function() {
            var unit = document.createElement('a');

            unit.href = "javascript:void(0)";

            unit.classList.add('jvp_play');

            this.playCtrl = unit;

            return unit;

        };

        this.pauseCtrl = function() {
            var unit = document.createElement('a');

            unit.href = "javascript:void(0)";

            unit.classList.add('jvp_pause');

            this.pauseCtrl = unit;

            return unit;

        };

        this.sizeCtrl = function() {
            var unit = document.createElement('ul'),
                unitWrapper = document.createElement('div'),
                unitCtrl = document.createElement('span');

            this.options.viewSize = typeof this.options.viewSize == 'string' ? this.options.viewSize.split(',') : this.options.viewSize;


            if (this.options.viewSize) {

                unitWrapper.classList.add('jvp_size-menu');
                unitCtrl.classList.add('jvp_size-icon');
                unit.classList.add('jvp_size');

                for( var i = 0, s = this.options.viewSize.length; i < s; i++) {

                    var unitElement = document.createElement('li'),
                        elementCtrl = document.createElement('a');

                    elementCtrl.classList.add('jvp_size-' + i);
                    elementCtrl.setAttribute('data-view-size', this.options.viewSize[i]);
                    elementCtrl.href = "javascript:void(0)";
                    elementCtrl.text = this.options.viewSize[i];

                    unitElement.appendChild(elementCtrl);
                    unit.appendChild(unitElement);
                };

                unitWrapper.appendChild(unit);
                unitWrapper.appendChild(unitCtrl);

                this.sizeCtrl = unit;
                this.sizeUnitCtrl = unitCtrl;

            } else {

            };

            return unitWrapper;
        };

        this.stateCtrl = function() {
            var unit = document.createElement('div'),
                progress = document.createElement('div');

            unit.classList.add('jvp_state');
            progress.classList.add('jvp_progress');

            this.progress = progress;

            unit.appendChild(progress);

            return unit;
        };

        this.typeCtrl = function() {
            var unit = document.createElement('div'),
                textNodeMono = document.createTextNode('2d'),
                textNodeStereo = document.createTextNode('3d'),
                mono = document.createElement('a'),
                stereo = document.createElement('a');

            mono.href = "javascript:void(0)";
            stereo.href = "javascript:void(0)";

            unit.classList.add('jvp_type')
            mono.classList.add('jvp_type', 'jvp_type__mono');
            stereo.classList.add('jvp_type', 'jvp_type__stereo');

            mono.setAttribute('data-type', 'mono');
            stereo.setAttribute('data-type', 'stereo');

            this.mono = mono;
            this.stereo = stereo;

            mono.appendChild(textNodeMono);
            stereo.appendChild(textNodeStereo);

            unit.appendChild(mono);
            unit.appendChild(stereo);

            return unit;
        };
    };

    var Player = function(element, options, controller) {

        this.init(element, options, controller)
    };

    var iterator = 0;

    extend(Player.prototype, Events, {

        defaults: {
            mediaFormat : null,
            segmentType : 1,
            resourceSetsCount : 4,
            viewSize : null,
            viewMode : [1, 0.5, 0.25, 0.75, 0],
            fps : 1,
            mediaType : null,
            fourViews : true,
            messages : {
                connectError : "", //Error on connect.
                loading : "" // Loading
            }
        }

    }, {

        init : function(element, options, controller) {
            this.id = 'id_' + (Date.now());

            this.options = extend({}, this.defaults, options);

            this.mediaFormat = this.options.mediaFormat;

            this.options.mediaSizeHeight = options.mediaSizeHeight ? options.mediaSizeHeight : this.options.mediaSize;

            this.controls = new Container(element, this.options);

            this.options.isStereo = this.options.isStereo || false;
            
            this.controls.render();

            this.delegateEvents(this.events);

            this.medias = {};
            this.controller = controller;

            this.initDragFunction();

            this.bindApi();

            this.setMedia();

            if (this.options.disable3D && !this.options.isStereo || !this.checkFormatSupport()) {

                this.trigger('showControls', {
                    hide : ['mono', 'stereo', 'typeCtrl'], 
                    show : []
                });

            } else {

                this.trigger('showControls', {
                    hide : ['mono'], 
                    show : [ 'stereo']
                });

            };

            if (this.controls.segmentView.classList) {

                if (this.options.fourViews) {


                    this.trigger('showControls', {
                        hide : [], 
                        show : ['segmentView']
                    });

                } else {

                    this.trigger('showControls', {
                        hide : ['segmentView'], 
                        show : []
                    });

                };
            };

            // console.log(navigator.userAgent.match(/IEMobile|IE/i))
        },

        events : {
            'click stereo' : 'changeType',
            'click mono' : 'changeType',
            'click pauseCtrl' : 'pause',
            'click playCtrl' : 'play',
            'click sizeUnitCtrl' : 'openSizeMenu',
            'click segmentView' : 'changeSegment',
            'click sizeCtrl' : 'setSize'
        },

        delegateEvents : function(events) {

            for (var key in events) {
                var ctrl, action, keySplit;

                keySplit =  key.split(' ');

                if (keySplit.length == 2) {

                    ctrl = keySplit[1];
                    action = keySplit[0];

                } else {
                    
                    ctrl = keySplit[2];
                    action = keySplit[0] + ' ' + keySplit[1];

                };

                var elementNodes = this.controls[ctrl],
                    eventFunction = this[ events[key] ].bind(this);

                if (typeof elementNodes !== 'undefined' && typeof elementNodes !== 'function') {

                    if (elementNodes.childNodes[0] && elementNodes.childNodes[0].nodeType == 1) {
                    
                        for (var i = 0, s = elementNodes.childNodes.length; i < s; i++) {

                            elementNodes.childNodes[i].addEventListener(action, eventFunction, false);

                        };

                    } else {

                        elementNodes.addEventListener(action, eventFunction, false);

                    };

                } else {

                };
            };
        },

        destroy : function(id) {

            for (var i = 0, s = this.controller.players.length; i < s; i++) {
                var player = this.controller.players[i];

                if(player.id == id){

                    var options = this.options,
                        element = this.controls.wrapper.parentNode;

                    this.controller.players.splice(i, 1);

                    break;
                };
            };
        },

        destroyAll : function(soft) {

            if (!soft){

                this.pause();  
            };

            this.trigger('destroy', this.id);
        },

        checkFormatSupport : function() {
            var testEl = document.createElement( "video" ),
                mpeg4, h264, ogg, webm;

            if ( testEl.canPlayType ) {
                // Check for MPEG-4 support
                mpeg4 = "" !== testEl.canPlayType( 'video/mp4; codecs="mp4v.20.8"' );

                // Check for h264 support
                h264 = "" !== ( testEl.canPlayType( 'video/mp4; codecs="avc1.42E01E"' )
                || testEl.canPlayType( 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' ) );

                // Check for Ogg support
                ogg = "" !== testEl.canPlayType( 'video/ogg; codecs="theora"' );

                // Check for Webm support
                webm = "" !== testEl.canPlayType( 'video/webm; codecs="vp8, vorbis"' );
            };

            return webm;
        },

        selectMedia : function() {

            if (this.mediaFormat && mediaMap[this.mediaFormat]){

                return  this.mediaFormat;

            } else if (this.options.stereoVideoUrl && this.supportStero()){

                return 'stereo';

            } else if (this.options.resourceHosts){

                return 'sets';

            } else if (this.options.videoUrl){

                return 'video';

            } else {

               this.trigger("message", this.options.messages.connectError);

               return false;

            };
        },

        setMedia: function(format) {

            this.mediaFormat = format || this.options.mediaFormat;

            var mediaName = this.selectMedia();

            if (mediaName) {  

                var MediaClass = mediaMap[mediaName];

                this.media = new MediaClass(this.controls.wrapper, this.options, this.controller, this);

                this.media.render();

            } else {

                return false;

            }
        },

        initDragFunction : function() {
            var scope = this;

            this.dragFunction = function(e) {

                var mouseLeft = e.pageX || e.touches[0] || e.originalEvent.touches[0].pageX || e.originalEvent.changedTouches[0].pageX,
                    offset = scope.mouseClickX - mouseLeft;

                scope.drag(offset);              
            };

            this.dragEndFunction = function(e) {
                e.preventDefault();

                scope.dragEnd();


                document.removeEventListener('mouseup', scope.dragEndFunction);
                document.removeEventListener('touchend', scope.dragEndFunction);

                scope.controls.overlayBlock.removeEventListener('mousemove', scope.dragFunction);
                scope.controls.overlayBlock.removeEventListener("mouseup", scope.dragEndFunction);
                scope.controls.overlayBlock.removeEventListener("mouseout", scope.dragEndFunction);
                scope.controls.overlayBlock.removeEventListener('touchmove', scope.dragFunction);
                scope.controls.overlayBlock.removeEventListener("touchend", scope.dragEndFunction);
            };

            this.controls.overlayBlock.addEventListener('mousedown', function(e) {

                scope.dragStart();

                scope.mouseClickX = e.pageX || e.touches[0] || e.originalEvent.touches[0].pageX || e.originalEvent.changedTouches[0].pageX;

                document.addEventListener('mouseup', scope.dragEndFunction);

                scope.controls.overlayBlock.addEventListener('mousemove', scope.dragFunction);
                scope.controls.overlayBlock.addEventListener("mouseup", scope.dragEndFunction);
                scope.controls.overlayBlock.addEventListener("mouseout", scope.dragEndFunction);
            });

            this.controls.overlayBlock.addEventListener('touchstart', function(e) {

                e.preventDefault();

                scope.dragStart();

                scope.mouseClickX = e.touches[0] || e.originalEvent.touches[0].pageX || e.originalEvent.changedTouches[0].pageX;

                document.addEventListener('touchend', scope.dragEndFunction);

                scope.controls.overlayBlock.addEventListener('touchmove', scope.dragFunction);
                scope.controls.overlayBlock.addEventListener("touchend", scope.dragEndFunction);
            });
        },

        requestState : function(n) {

            var width = (isNaN(+this.controls.progress.style.width.replace(/\%/g, ''))) ? 0 : +this.controls.progress.style.width.replace(/\%/g, '');

            this.controls.progress.style.width =  width + n + '%';
        },

        messagetState : function(text, type) {

            this.trigger('showControls', {
                hide : [], 
                show : ['infoBlock']
            });

            this.controls.infoBlock.innerHTML = text;

            if (/\b(error)\b/i.test(type)) {

                this.trigger('defaultPoster');

                this.destroy(this.id);

            } else if ( /\b(loading)\b/i.test(type) ) {


            } else if ( /\b(loaded)\b/i.test(type) ){


            };
        },

        play : function() {

            this.controller.trigger('play', this);
        },

        pause : function() {

            this.controller.trigger('pause', this);
        },

        drag : function(offset) {

            this.controller.trigger('drag', this, offset);
        },

        dragStart : function() {

            this.controller.trigger('dragStart', this);
        },

        dragEnd : function() {

            this.controller.trigger('dragEnd', this);
        },

        setSize : function(e) {

            this.controller.trigger('setSize', this, e);

        },

        openSizeMenu : function(e) {

            this.controls.sizeCtrl.classList.toggle('jvp_open');
        },

        changeType : function(e) {

            this.controller.trigger('source', this, e);

        },

        changeSegment : function(e) {

            this.controller.trigger('changeSegment', this, e);

        },

        setDefaultPoster : function() {
            var image = document.createElement('img');

            image.src = '/app/img/default_460x460_360.jpg';

            this.controls.wrapper.innerHTML = "";
            this.controls.wrapper.appendChild(image);
        },

        showControls : function(hideShowObject, className) {

            hideShowObject =  hideShowObject || { hide : [],  show : [] };

            className = className || 'jvp_hidden';

            for (var i = 0, s = hideShowObject.hide.length; i < s; i++) {

                if (this.controls[hideShowObject.hide[i]].classList) {

                    this.controls[hideShowObject.hide[i]].classList.add(className);

                };
                
            };

            for (var i = 0, s = hideShowObject.show.length; i < s; i++) {

                if (this.controls[hideShowObject.show[i]].classList) {

                    this.controls[hideShowObject.show[i]].classList.remove(className);
                };
                
            };
        },

        loopPlay : function(step) {

            var from = this.media.frameFrom,
                to = this.media.frameTo,
                index = this.getFrame(from, to, step);

            this.media.frameIndex = index == to ? from : this.media.frameIndex;

            return index = index == to ? from : index;

        },

        swingingPlay : function(step, clockwise) {

            var from = this.media.frameFrom,
                to = this.media.frameTo,
                index = clockwise ? this.getFrame(from, to, step) : this.getFrame(to, from, step);

            return index;
        },

        loopDrag : function(step, clockwise) {

            var from = this.media.frameFrom,
                to = this.media.frameTo,
                index = clockwise ? this.getFrame(from, to, step) : this.getFrame(to, from, step);

            if(clockwise && index == to) {

                this.media.frameIndex = from;

                index = from;

            } else if (!clockwise && (index == from || index < 0) ) {

                this.media.frameIndex = to;

                index = to;

            } else {

                index = index;

            };

            return index;
        },

        swingingDrag : function(step, clockwise) {

            var from = this.media.frameFrom,
                to = this.media.frameTo,
                index = clockwise ? this.getFrame(from, to, step) : this.getFrame(to, from, step);


            if (clockwise && index >= to) {

                this.media.frameIndex = to;

                index = to;

            } else if (!clockwise && (index <= from || index < 0) ) {

                this.media.frameIndex = from;

                index = from;

            } else {

                index = index;

            };

            return index;
        },

        getFrame : function(from, to, step) {

            if ( from < to ) {

                return this.media.frameIndex +=step;

            } else {

                return this.media.frameIndex -=step;

            };
        },

        checkSegmentRange : function(allFrames, rangeIndex) {

            var rangeFrom = rangeIndex == 0 || rangeIndex == 1 ? 0 : rangeIndex - 0.25,
                rangeTo = rangeIndex;

            this.media.frameIndex = rangeIndex == 1 ? this.media.frameIndex : allFrames*rangeIndex;

            return {
                from : allFrames*rangeFrom,
                to : allFrames*rangeIndex,
                centralIndex : this.media.frameIndex
            }
        },

        bindApi : function() {

            this.on('play', function(id) {

                this.state = 'play';

                this.trigger('showControls', {
                    hide : ['playCtrl'], 
                    show : ['pauseCtrl']
                });

                this.media.trigger('play');
            });

            this.on('pause', function(id) {

                this.state = 'pause';

                this.trigger('showControls', {
                    hide : ['pauseCtrl'], 
                    show : ['playCtrl']
                });

                this.media.trigger('pause');
            });

            this.on('drag', function(offset) {

                this.media.trigger('drag', offset);

            });

            this.on('dragStart', function() {

                this.media.trigger('dragStart');

            });

            this.on('dragEnd', function() {

                this.media.trigger('dragEnd');

            });

            this.on('setMedia', function(source) {

                this.setMedia(source);
            });

            this.on('changeSegment', function(segmentType) {

                this.media.trigger('changeSegment', segmentType);
            });


            this.on('setSize', function(size) {

                this.trigger('showControls', {
                    hide : [], 
                    show : ['sizeCtrl']
                });

                this.options.mediaSizeHeight = this.options.mediaSize = size;

                this.controls.wrapper.parentNode.setAttribute('data-size', size);

                this.controls.sizeCtrl.classList.remove('jvp_open');

                this.media.render();

            });

            this.on('destroy', function(id) {

                this.destroy(id);
            });

            this.on('destroyAll', function(soft) {

                this.destroyAll(soft);
            });

            this.on('request', function(n) {    

                this.requestState(n);
            });

            this.on("message", function(text, type) {

                this.messagetState(text, type);
            });

            this.on('stereo', function() {

                this.pause();

            });

            this.on('mono', function() {

                this.pause();
            });

            this.on('defaultPoster', function() {

                this.setDefaultPoster();

            });

            this.on('showControls', function(object, className) {

                this.showControls(object, className);

            });

            this.on('abort', function(){

                this.media.trigger('abort');
            });
        }
    });

    var BaseMedia = Extendable(function(element, options, controller, player) {

        this.init(element, options, controller, player);
    })

    extend(BaseMedia.prototype, Events, {

        init: function(element, options, controller, player) {

            options.baseUrl = options.baseUrl || 'http://cutwise.s3.amazonaws.com';
            options.mediaPath = options.mediaPath || ('/media/video/' + options.mediaType + '/' + options.b2bid+ '/' +options.stoneID.toLowerCase() + '/');

            this.element = element;

            this.element.innerHTML = '';

            this.options = options;

            this.controller = controller;

            this.viplayer = player;

        }
    });

    var Video = BaseMedia.extend({


        render: function() {

            var scope = this,
                controls = this.viplayer.controls,
                video = document.createElement('video'),
                postfix = this.options.mediaSize > 460 ? 'full' : this.options.mediaSize,
                frame0 = this.options.baseUrl + this.options.mediaPath + "frame0_" + postfix +  ".jpg",
                progress = 0;

            this.lunchOnce = true;
            this.segmentState = 'play';   

            video.loop = true;
            video.preload = 'auto';
            video.autobuffer = 'autobuffer';
            // video.controls = 'controls';
            video.width = this.options.mediaSize;
            video.height = this.options.mediaSizeHeight;


            controls.wrapper.innerHTML = "";
                
            controls.wrapper.appendChild(controls.loaderBlock);

            if (/\b(video)\b/i.test(this.viplayer.mediaFormat)) {

                var image = new Image();

                image.src = frame0;
                
                controls.wrapper.appendChild(image);
            };

            this.mediaPlayer = video;
            controls.video = this.mediaPlayer;
            this.controller.currentTime = 0;

            this.frameIndex = 0.083;
            scope.clockwise = true;
            this.segmentIndex = 1;

            if (this.options.disable3D && !this.options.isStereo) {

                this.viplayer.trigger('showControls', {
                    hide : ['mono', 'stereo'], 
                    show : []
                });

            } else {

                if ( /\b(stereo)\b/i.test(this.viplayer.mediaFormat) ) {

                    this.viplayer.trigger('showControls', {
                        hide : ['stereo'], 
                        show : ['mono']
                    });

                } else {

                    this.viplayer.trigger('showControls', {
                        hide : ['mono'], 
                        show : ['stereo']
                    });

                };

            };

            controls.wrapper.style.width = this.options.mediaSize + 'px';
            controls.wrapper.style.height = this.options.mediaSizeHeight + 'px';

            controls.wrapper.parentNode.setAttribute('data-size', this.options.mediaSize);

            controls.wrapper.parentNode.classList.add('jvp__loading');


            this.viplayer.trigger('showControls', {
                hide : ['playCtrl'], 
                show : ['pauseCtrl']
            });

            this.viplayer.trigger('showControls', {
                hide : ['infoBlock', 'ctrlBlock', 'typeCtrl'], 
                show : []
            }, 'jvp_unvisible');

            this.viplayer.controls.progress.classList.remove('jvp_unvisible');

            this.viplayer.controls.progress.style.width = 0;

            this.xhr();

            this.bindApi();
            

            video.addEventListener('progress', function(e) {
                
                var processPercent = parseInt(((++progress / this.duration) * 100));

                scope.viplayer.trigger('request', processPercent);
                scope.viplayer.trigger("message", scope.options.messages.loading);

            }, false);

            video.addEventListener('error', function() {

                scope.viplayer.trigger("message", scope.options.messages.connectError, 'error');

            }, false);

            video.addEventListener('canplaythrough',  function() {

                if (scope.lunchOnce) {

                    controls.wrapper.appendChild(this);

                    scope.lunchOnce = false;

                    this.currentTime = scope.controller.currentTime;

                    if (scope.options.autoPlay || /\b(play)\b/i.test(scope.controller.state) ) {

                        scope.viplayer.play();

                    } else if (/\b(drag|dragStart)\b/i.test(scope.controller.state)) {

                        scope.viplayer.drag(scope.controller.offset);

                    } else {

                        scope.viplayer.pause();

                    };

                    if (image) {

                        image.classList.add('jvp_hidden');

                    };

                    scope.viplayer.trigger('request', 100);

                    scope.viplayer.controls.progress.classList.add('jvp_unvisible');
                    scope.viplayer.controls.wrapper.parentNode.classList.remove('jvp__loading');

                    scope.viplayer.trigger('showControls', {
                        hide : ['infoBlock'], 
                        show : ['ctrlBlock', 'typeCtrl', 'playCtrl']
                    }, 'jvp_unvisible');

                    scope.viplayer.trigger('showControls', {
                        hide : ['stateCtrl', 'loaderBlock'], 
                        show : []
                    });

                    var frame = scope.viplayer.checkSegmentRange(this.duration, 0);

                    scope.frameFrom = frame.from;
                    scope.frameTo = frame.to;

                };
            }, false);

            video.addEventListener('timeupdate', function(e, t) {

                scope.setTime(this.currentTime);

            }, false);
        },

        xhr : function() {

            var scope = this,
                source = document.createElement('source'),
                url = this.getUrl();

            if (url) {

                source.src = url;
                scope.mediaPlayer.appendChild(source);

            } else {

                scope.viplayer.trigger("message", scope.options.messages.connectError, 'error');

            };
        },

        getUrl : function() {

            var o = this.options,
                postfix = this.options.mediaSize > 460 ? 'full' : this.options.mediaSize;

            if ( /\b(video)\b/i.test(this.viplayer.mediaFormat) ) {

                return this.options.baseUrl + this.options.mediaPath + 'mono_' + postfix + '.mp4';

            } else if ( /\b(stereo)\b/i.test(this.viplayer.mediaFormat) ){

                return this.options.baseUrl + this.options.mediaPath + 'stereo_' + postfix + '.webm';

            } else {

                return null;

            };
        },

        play : function() { 
            var scope = this;

            if (this.segmentIndex == 1) {

                this.controller.playStartTime = Date.now();

                this.viplayer.trigger('setState', 'play');

                this.mediaPlayer.play();

            } else {

                this.timeOutId = setTimeout(function(){

                    var fun = scope.play.bind(scope);

                    window.cancelAnimationFrame(scope.animateId);

                    scope.animateId = window.requestAnimationFrame(fun)

                    var frameIndex = scope.viplayer.swingingPlay(0.083, scope.clockwise),
                        frameIndex = Math.abs( +frameIndex.toFixed(7) );

                    if (scope.frameTo <= frameIndex + 0.183) {

                        scope.clockwise = false;

                    } else if (scope.frameFrom >= frameIndex - 0.183) {

                        scope.clockwise = true;

                    };

                    scope.mediaPlayer.currentTime = scope.convertTime( frameIndex * 1000);

                }, 75);

            };
        },

        pause : function() {

            this.controller.startTime = 0;
            this.controller.playedTime +=this.controller.playTime();

            clearTimeout(this.timeOutId);
            window.cancelAnimationFrame(this.animateId);

            this.mediaPlayer.pause();
        },

        setTime : function(time) {

            this.controller.currentTime = time;

        },

        prepareTime: function(time) {

            var time = time/1000,
                movie_time = (isNaN(this.mediaPlayer.duration)) ? 30 : this.mediaPlayer.duration,
                movie_time_ms = movie_time * 1000,
                _1s_ms = 1000;

                if(time > 0){

                time = ((time * _1s_ms) % movie_time_ms)/_1s_ms;

                } else {

                time = (movie_time_ms - ((-time * _1s_ms) % movie_time_ms))/_1s_ms;

                };

                return time = time * 1000;
        },

        convertTime: function(time) {
            var durationMS;

            if (isNaN(this.mediaPlayer.duration)) {

                durationMS = +time;

            }else {

                durationMS = +(this.mediaPlayer.duration * 1000).toFixed();

            };

            return (time % durationMS)/1000;
        },

        timeDelta: function(time) {

            var durationMS = (this.mediaPlayer.duration * 1000).toFixed(),
                currentMS = (this.mediaPlayer.currentTime * 1000).toFixed();

            return Math.abs(currentMS - (time % durationMS))/1000;
        },

        showFrame: function(time) {

            var time = this.prepareTime(time || this.controller.globalTime()),
                localTime = this.convertTime(time),
                timeDelta = this.timeDelta(time);

            if(timeDelta > 0.001 && (this.mediaPlayer.duration - timeDelta) > 0.001 && !this.mediaPlayer.seeking && this.mediaPlayer.readyState != 0){

                this.mediaPlayer.currentTime = localTime;

            };

            this.lastTime = localTime;

            var state = this.controller.state;

            if(state == 'play' && this.mediaPlayer.paused){

                this.mediaPlayer.play();

            }
        },


        drag: function(offset) {

            var param = offset < 0 || this.prevOffset > Math.abs( offset );

            if (this.segmentIndex == 1) {

                var time = this.controller.globalTime();

                this.offset = offset;

                this.showFrame(time + offset*50);

            } else {

                var frameIndex,
                    param = offset < 0 || this.prevOffset > Math.abs( offset );

                this.prevOffset = this.prevOffset || 0;

                frameIndex =  this.viplayer.swingingDrag(0.083, !param);

                this.prevOffset = Math.abs( offset );

                this.mediaPlayer.currentTime = this.convertTime( frameIndex * 1000);
            };
        },

        dragStart: function() {

            this.savedState = this.controller.state;

            this.pause();
        },

        dragEnd: function() {

            this.offset = (this.offset) ? this.offset : 0;

            this.controller.trigger('setState', this.savedState);

            this.controller.playedTime += this.offset*50;

            this.offset = 0;

            if(this.controller.state == 'play'){

                this.play();

            };

        },

        bindApi : function() {

            this.on('play', function(){

                this.controller.startTime = Date.now();

                this.play();

            });

            this.on('pause', function(){

                this.pause();
                
            });

            this.on('drag', function(offset){

                this.drag(offset)
            });

            this.on('dragStart', function(){

                this.dragStart();

            });

            this.on('dragEnd', function(offset){

                this.dragEnd();

            });

            this.on('progress', function(n){

                this.progress(n);
                
            });

            this.on('changeSegment', function(segmentIndex){

                this.segmentIndex = segmentIndex;

                var index = this.mediaPlayer.duration,
                    frame = this.viplayer.checkSegmentRange( index, segmentIndex);

                this.frameFrom = frame.from;
                this.frameTo = frame.to;

                this.mediaPlayer.currentTime = this.mediaPlayer.duration*segmentIndex;

                if ( /\b(play)\b/i.test(this.controller.state) ) {

                    this.trigger('pause');

                    this.trigger('play');

                } else {

                    this.trigger('pause');

                };
            });
        }
    });

    var Sets = BaseMedia.extend({

        render : function() {

            this.frames = [];

            var controls = this.viplayer.controls,
                postfix = this.options.mediaSize > 460 ? 'full' : this.options.mediaSize,
                frame0 = this.options.baseUrl + this.options.mediaPath + "frame0_" + postfix +  ".jpg";

            this.mediaPlayer = this.mediaPlayer || document.createElement('canvas');

            this.mediaPlayer.width = this.options.mediaSize;
            this.mediaPlayer.height = this.options.mediaSizeHeight;

            controls.canvas = this.mediaPlayer;

            controls.wrapper.appendChild(controls.loaderBlock);
            controls.wrapper.appendChild(this.mediaPlayer);
            controls.wrapper.style.width = this.options.mediaSize + 'px';
            controls.wrapper.style.height = this.options.mediaSizeHeight + 'px';

            controls.wrapper.parentNode.setAttribute('data-size', this.options.mediaSize);

            controls.wrapper.parentNode.classList.add('jvp__loading');

            this.context = this.mediaPlayer.getContext("2d");

            this.playDirection = true;

            this.context.clear();

            this.frames = [frame0];

            this.viplayer.trigger('showControls', {
                hide : ['playCtrl'], 
                show : ['pauseCtrl']
            });

            this.viplayer.trigger('showControls', {
                hide : ['infoBlock', 'ctrlBlock', 'typeCtrl'], 
                show : []
            }, 'jvp_unvisible');

            this.viplayer.controls.progress.classList.remove('jvp_unvisible');

            this.viplayer.controls.progress.style.width = 10 + '%';

            this.loadSets();

            this.bindApi();

            this.drawImage(0);

            this.segmentIndex = 1;
            this.frameIndex = 0;
        },

        loadSets: function() {
            this.loadedSets = 4;

            if(this.options.resourceSetsCount){

                for (var i = 0, s = this.options.resourceSetsCount; i < s; i++) {

                    this.xhr(this.getUrl(i), i, this);

                    if (i == 3) {

                        if (this.options.autoPlay || /\b(play)\b/i.test(this.controller.state) ) {

                            this.viplayer.play();

                        } else if ( /\b(drag|dragStart)\b/i.test(this.controller.state) ) {

                            this.viplayer.drag(this.controller.offset);

                        } else {

                            this.viplayer.pause();

                        };
                    };

                };

            } else {

                return false

            };
        },

        xhrUnits : {},

        xhr: function (url, index, scope) {

            if (url) {

                scope.xhrUnits['xhr' + index] = new XMLHttpRequest();

                if (index == 0) {

                    scope.viplayer.trigger('request', 0);

                };

                scope.xhrUnits['xhr' + index].open('GET', url, true);

                scope.xhrUnits['xhr' + index].onreadystatechange = function() {


                    if (this.readyState == 4 && this.status == 200) {

                        scope.viplayer.controls.infoBlock.innerHTML = "";

                        scope.viplayer.trigger('request', 100);

                        --scope.loadedSets;

                        //draw images   
                        var data = JSON.parse(this.response);

                        scope.options.fps = data.d*data.fps;

                        scope.addSet(data);

                        if (scope.loadedSets == 0) {

                            if (data.swinging) {

                                scope.options.isSwinging = true;

                                var centralIndex = Math.round( (scope.frames.length - 1) / 2 );

                                scope.changeFromTo( 0.5 , centralIndex);
                            };

                            scope.viplayer.controls.progress.classList.add('jvp_unvisible');

                            scope.viplayer.trigger('showControls', {
                                hide : ['infoBlock'], 
                                show : ['ctrlBlock', 'typeCtrl', 'playCtrl']
                            }, 'jvp_unvisible');

                            scope.viplayer.trigger('showControls', {
                                hide : ['stateCtrl', 'loaderBlock'], 
                                show : []
                            });
                            
                            if (scope.viplayer.controls.wrapper.parentNode) {

                                scope.viplayer.controls.wrapper.parentNode.classList.remove('jvp__loading');

                            };

                        } else {


                            var frame = scope.viplayer.checkSegmentRange(data.t, 1);

                            scope.frameFrom = Math.round( frame.from );
                            scope.frameTo = Math.round( frame.to );

                            scope.drawImage( Math.round(frame.centralIndex) );

                            scope.frameIndex = Math.round( frame.centralIndex );
                        };

                    } else if (this.status != 200){

                        // scope.viplayer.trigger("message", scope.options.messages.connectError, 'error');
                        
                    } else {

                        scope.viplayer.trigger('request', 1*index);

                    };
                
                };

                scope.xhrUnits['xhr' + index].send();

            } else {

                scope.viplayer.trigger("message", scope.options.messages.connectError, 'error');

            };
        },

        abortXhr : function() {

            for (var key in this.xhrUnits) {

                this.xhrUnits[key].abort()

            };
        },

        getUrl : function(i) {
            var postfix = this.options.mediaSize > 460 ? 'full' : this.options.mediaSize;

            return this.options.baseUrl + this.options.mediaPath + 'set' + i + '_' + postfix + ".json";
        },

        addSet: function(data) {

            var index = parseInt(data.a1);

            if (data.frames.length > 0) {

                // Process data from set to frames array
                for (var i in data.frames) {


                    this.frames[index] = data.frames[i];

                    index = index + parseInt(data.d);
                }
            };
        },

        drawImage : function(index) {
            var scope = this;

            if (this.frames[index]) {

                this.imageBuff = new Image();

                this.imageBuff.onload = function(e) {

                    var x, y,
                        width = scope.options.mediaSize,
                        height = scope.options.mediaSizeHeight;

                    if (this.width == this.height) {


                        if (width == this.width || this.options.isFullVideo) {

                            x = 0;
                            y = 0;

                        } else {

                            y = x = Math.abs( (width - this.width)/2 );

                        }

                    } else {

                        x = Math.abs( (width - this.width)/2 );
                        y = Math.abs( (height - this.height)/2 );

                    };

                    scope.context.clear();

                    scope.context.drawImage(this, x, y, this.width, this.height);
                };  

                this.imageBuff.src = this.frames[index];
           };
        },

        animateFrames : function() {
            var scope = this;

            this.timeOutId = setTimeout(function() {

                // delete prev id. set new id.
                window.cancelAnimationFrame(scope.id);

                var frameIndex,
                    fun = scope.animateFrames.bind(scope);

                if (scope.segmentIndex == 1) {

                    frameIndex = scope.viplayer.loopPlay(1);

                } else {

                    frameIndex = scope.viplayer.swingingPlay(1, scope.clockwise);

                    if (scope.frameTo <= frameIndex) {

                        scope.clockwise = false;

                    } else if (scope.frameFrom >= frameIndex) {

                        scope.clockwise = true;


                    };

                };

                if ( /\b(drag|dragStart|play)\b/i.test(scope.controller.state) ) {

                    //animate function. delete time interval by id
                    scope.id = window.requestAnimationFrame(fun);

                    scope.drawImage(frameIndex);


                } else {

                    return false;

                };

            }, 900 / scope.options.fps);
        }, 

        drag : function(offset) {

            var frameIndex,
                param = offset < 0 || this.prevOffset > Math.abs( offset );

            this.prevOffset = this.prevOffset || 0;

            if (this.segmentIndex == 1) {

                frameIndex =  this.viplayer.loopDrag(1, !param);

            } else {

                frameIndex =  this.viplayer.swingingDrag(1, !param);

            };

            this.prevOffset = Math.abs( offset );

            this.drawImage(frameIndex);
        },

        bindApi : function() {

            this.on('play', function(){

                this.clockwise = true;

                this.animateFrames();

            });

            this.on('pause', function() {

                window.cancelAnimationFrame(this.id);
                clearTimeout(this.timeOutId);

            });

            this.on('drag', function(offset){

                this.drag(offset);

            });

            this.on('changeSegment', function(segmentIndex){

                this.segmentIndex = segmentIndex;

                var frame = this.viplayer.checkSegmentRange(this.frames.length, segmentIndex);

                this.frameFrom = Math.round( frame.from );
                this.frameTo = Math.round( frame.to );

                this.drawImage( Math.round( frame.centralIndex ) );

                this.frameIndex = Math.round( frame.centralIndex );
            });

            this.on('abort', function(){

                this.abortXhr();
            });
        }
    });

    var mediaMap = {
        'video': Video,
        'stereo': Video,
        'sets': Sets
    };

    return Controller;
})();

window.viPlayerConstructor = new Constructor();

window.nativeConstructor = function(elemenId, options) {
    var elemens = document.getElementById(elemenId),
        player =  window.viPlayerConstructor.create(elemens, options);

    return player;
};

try {

    $.fn.viPlayer = function(options) {

        if(this.length){
            var player;

            this.each(function(){

                player = window.viPlayerConstructor.create(this, options);

            });

        };

        return player;
    };

} catch (e) {

    console.log(e);

};