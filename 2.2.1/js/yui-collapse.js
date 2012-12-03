(function(){
	YAHOO.namespace('bootstrap');
	var Util = YAHOO.util,
		Lang = YAHOO.lang,
		Dom = YAHOO.util.Dom,
		Event = YAHOO.util.Event,
		Selector = YAHOO.util.Selector,
		Bootstrap = YAHOO.bootstrap;

	var Collapse = function(element,options) {
		this.$element = Dom.get(element);
		this.options = Lang.merge({},this.defaults, options || {});

		if (this.options.parent) {
			this.$parent = Selector.query(this.options.parent)[0];
		}

		this.options.toggle && this.toggle();
	};

	Collapse.prototype = {
		constructor: Collapse,
		defaults: {
			toggle: true
		},
		dimension: function() {
			var hasWidth = Dom.hasClass(this.$element,'width');
			return hasWidth ? 'width' : 'height';
		},
		show: function() {
			var dimension
			  , scroll
			  , scrollHeight
			  , actives
			  , hasData;

			//if(this.transitioning) return

			dimension = this.dimension();
			scroll = ['scroll',dimension].join('-').camelCase();
			actives = this.$parent && Selector.query('> .accordion-group > .in',this.$parent);

			if(actives && actives.length) { //TODO: Hide All Siblings
				hasData = Dom.getData(actives[0],'collapse');
				if(hasData && hasData.transitioning) return;
				Collapse.multiple(actives,'hide');
				hasData || Dom.setData(actives,'collapse',null);
			}

			Dom.setStyle(this.$element,dimension,'0px');
			this.transition('addClass',{type:'show'}, 'shown');
			scrollHeight = this.$element[scroll];
			Bootstrap.transition && Dom.setStyle(this.$element,dimension,typeof scrollHeight == 'number' ? scrollHeight+'px': scrollHeight);
		},
		hide: function() {
			var dimension;
			if(this.transitioning) return;
			dimension = this.dimension();
			this.reset(Dom.getStyle(this.$element,dimension));
			this.transition('removeClass',{type:'hide'},'hidden');
			Dom.setStyle(this.$element,dimension,'0px');
		},
		reset: function(size) {
			var dimension = this.dimension();

			Dom.removeClass(this.$element,'collapse');
			Dom.setStyle(this.$element,dimension,size || 'auto');
			this.$element.offsetWidth;

			Dom[size !== null ? 'addClass' : 'removeClass'](this.$element,'collapse');

			return this;
		},
		transition: function(method, startEvent, completeEvent) {
			var that = this
			  , defaultPrevented
			  , complete = function() {
				if(startEvent.type == 'show') that.reset();
				that.transitioning = 0;
				Bootstrap.transition && Event.removeListener(that.$element,Bootstrap.transition.end);
				that.fireEvent(completeEvent);
			};

			defaultPrevented = that.fireEvent(startEvent); // TODO: Custom Event

			//if(!defaultPrevented) return;

			this.transitioning = 1;

			Dom[method](this.$element,'in');

			Bootstrap.transition && Dom.hasClass(this.$element,'collapse') ?
					Event.on(this.$element,Bootstrap.transition.end, complete) :
					complete();
		},
		toggle: function() {
			this[Dom.hasClass(this.$element,'in') ? 'hide' : 'show']();
		}
	};

	Collapse.multiple = function(elements,option) {
		return Dom.batch(elements, function(el){
			var $this = Dom.get(el)
			  , data = Dom.getData($this,'collapse')
			  , options = typeof option == 'object' && option;
			if(!data) Dom.setData($this,'collapse',(data = new Collapse($this, options || {})));
			if(typeof option == 'string') data[option]();
		});
	};
	Lang.augmentProto(Collapse, Util.EventProvider);
	YAHOO.bootstrap.Collapse = Collapse;
	Event.onDOMReady(function(){
		var nodes = Selector.query('[data-toggle=collapse]',document.body);
		Event.on(nodes,'click', function(e) {
			var $this = Dom.get(this), href
			  , target = $this.getAttribute('data-target')
			    || e.preventDefault()
			    || (href = $this.getAttribute('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
			  , option;
			target = Selector.query(target)[0] || Dom.get(target);
			option = Dom.getData(target,'collapse') ? 'toggle' : Dom.getData($this);
			Dom.hasClass(target,'in') ? Dom.addClass($this,'collapsed') : Dom.removeClass($this,'collapsed');
			Collapse.multiple([target],option);
			//Dom.get(target,'collapse')(option);
		});
	});
}());