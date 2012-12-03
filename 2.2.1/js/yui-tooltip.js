(function(){
	var Dom = YAHOO.util.Dom,
		Lang = YAHOO.lang,
		Event = YAHOO.util.Event,
		Selector = YAHOO.util.Selector,
		Tooltip = function(element, options) {
			this.init('tooltip', element, options);
			Dom.setData(this.$element,this.type,this);
		};

	Tooltip.prototype = {
		constructor: Tooltip,
		defaults: {
			animation: true,
			placement: 'top',
			selector: false,
			template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
			trigger: 'hover',
			title: '',
			delay: 0,
			html: true
		},
		init: function(type, element, options) {
			var eventIn,
				eventOut;

			this.type = type;
			this.$element = Dom.get(element);
			this.options = this.getOptions(options);
			this.enabled = true;

			if(this.options.trigger == 'click') {
				var nodes = Selector.query(this.options.selector, this.$element);
				if(!nodes.length) nodes = this.$element;
				Event.addListener(nodes,'click', this.toggle, this, true);
			} else if (this.options.trigger != 'manual') {
				eventIn = this.options.trigger == 'hover' ? 'mouseenter' : 'focus';
				eventOut = this.options.trigger == 'hover' ? 'mouseleave' : 'blur';
				var nodes = Selector.query(this.options.selector,this.$element);
				if(!nodes.length) nodes = this.$element;
				Event.addListener(nodes,eventIn, this.enter, this, true);
				Event.addListener(nodes,eventOut, this.leave, this, true);
			};

			this.options.selector ?
				(this._options = Lang.merge({},this.options,{ trigger: 'manual', selector: ''})) :
				this.fixTitle();
		},
		getOptions: function(options) {
			options = Lang.merge({},this.defaults, options || {}, Dom.getData(this.$element));

			if(options.delay && typeof options.delay == 'number') {
				options.delay = {
					show: options.delay,
					hide: options.delay
				};
			}
			return options;
		},
		enter: function(e) {
			var self = Dom.getData(e.currentTarget,this.type);
			var module = this.type.charAt(0).toUpperCase()+this.type.substr(1);
			if(!self) self = new YAHOO.bootstrap[module](e.currentTarget, this._options);

			if(!self.options.delay || !self.options.delay.show) return self.show();
			clearTimeout(this.timeout);
			self.hoverState = 'in';
			this.timeout = setTimeout(function() {
				if (self.hoverState == 'in') self.show();
			}, self.options.delay.show);
		},
		leave: function(e) {
			var self = Dom.getData(e.currentTarget,this.type);
			if(!self) self = new YAHOO.bootstrap[this.type.charAt(0).toUpperCase()+this.type.substr(1)](this._options);

			if(this.timeout) clearTimeout(this.timeout);
			if(!self.options.delay || !self.options.delay.hide) return self.hide();

			self.hoverState = 'out';
			this.timeout = setTimeout(function() {
				if(self.hoverState == 'out') self.hide();
			}, self.options.delay.hide);
		},
		show: function() {
			var $tip
			  , inside
			  , pos
			  , actualWidth
			  , actualHeight
			  , placement
			  , tp = {top: 0, left: 0};

			if(this.hasContent() && this.enabled) {
				$tip = this.tip();
				this.setContent();

				if(this.options.animation) {
					Dom.addClass($tip,'fade');
				}

				placement = typeof this.options.placement == 'function' ?
						this.options.placement.call(this, $tip, this.$element) :
						this.options.placement;

				inside = /in/.test(placement);

				this._remove($tip);
				Dom.setStyle($tip,'top',0);
				Dom.setStyle($tip,'left',0);
				Dom.setStyle($tip,'display','block');
				inside ? this.$element.appendChild($tip) : document.body.appendChild($tip);

				pos = this.getPosition(inside);

				actualWidth = $tip.offsetWidth;
				actualHeight = $tip.offsetHeight;

				switch (inside ? placement.split(' ')[1]:placement) {
				case 'bottom':
					tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2};
					break;
				case 'top':
					tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2};
					break;
				case 'left':
					tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth};
					break;
				case 'right':
					tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width};
					break;
				}

				Dom.setXY($tip,[tp.left,tp.top]);
				Dom.addClass($tip,placement);
				Dom.addClass($tip,'in');
			}
		},
		setContent: function() {
			var $tip = this.tip()
			  , title = this.getTitle()
			  , $tipInner;

			$tipInner = Dom.getElementsByClassName('tooltip-inner','div',$tip);
			$tipInner[0][this.options.html ? 'innerHTML' : 'text'] = title;
			Dom.removeClass($tip,/(fade|in|top|bottom|left|right)/);
		},
		hide: function() {
			var that = this
			  , $tip = this.tip();

			Dom.removeClass($tip,'in');

			function removeWithAnimation() {
				var timeout = setTimeout(function() {
					Event.removeListener($tip,YAHOO.bootstrap.transition.end);
					that._remove($tip);
				});

				Event.on($tip,YAHOO.bootstrap.transition.end, function() {
					clearTimeout(timeout);
					this._remove($tip);
				},this,true);
			}

			YAHOO.bootstrap.transition && Dom.hasClass(this.$tip,'fade') ?
					removeWithAnimation() :
					this._remove($tip);

			return this;
		},
		fixTitle: function() {
			var $e = this.$element;
			if($e.getAttribute('title') || typeof($e.getAttribute('data-original-title')) != 'string') {
				$e.setAttribute('data-original-title',$e.getAttribute('title') ||  '');
				$e.removeAttribute('title');
			}
		},
		hasContent: function() {
			return this.getTitle();
		},
		getPosition: function(inside) {
			var XY = Dom.getXY(this.$element);
			return Lang.merge({}, (inside ? {top: 0, left: 0} : {top:XY[1],left:XY[0]}), {
			  width: this.$element.offsetWidth
			, height: this.$element.offsetHeight
			});
		},
		getTitle: function() {
			var title
			  , $e = this.$element
			  , o = this.options;

			title = $e.getAttribute('data-original-title')
				|| (typeof o.title == 'function' ? o.title.call($e) : o.title);

			return title;
		},
		tip: function() {
			return this.$tip = this.$tip || this._renderTemplate(this.options.template);
		},
		validate: function() {
			if(!this.$element.parentNode){
				this.hide();
				this.$element = null;
				this.options = null;
			}
		},
		enable: function() {
			this.enabled = true;
		},
		disable: function() {
			this.enabled = false;
		},
		toggleEnabled: function() {
			this.enabled = !this.enabled;
		},
		toggle: function() {
			this[Dom.hasClass(this.tip(),'in') ? 'hide' : 'show']();
		},
		destroy: function() {
			var eventIn,
				eventOut;

			this.hide();

			if(this.options.trigger == 'click') {
				Event.removeListener(this.$element,'click');
			} else if (this.options.trigger != 'manual') {
				eventIn = this.options.trigger == 'hover' ? 'mouseenter' : 'focus';
				eventOut = this.options.trigger == 'hover' ? 'mouseleave' : 'blur';
				Event.removeListener(this.$element,eventIn);
				Event.removeListener(this.$element,eventOut);
			};

			Dom.removeData(this.$element,this.type);
		},
		_remove: function(el) {
			if(el.parentNode) {
				el.parentNode.removeChild(el);
			}
		},
		_renderTemplate: function(tpl){
			var div = document.createElement('div');
			div.innerHTML = tpl;
			return div.firstChild;
		}
	};
	YAHOO.bootstrap.Tooltip = Tooltip;
}());