(function(){
	var Lang = YAHOO.lang,
		Dom = YAHOO.util.Dom;
	var Popover = function(element, options) {
		this.init('popover', element, options);
		Dom.setData(this.$element,this.type,this);
	};

	Popover.prototype = Lang.merge({},YAHOO.bootstrap.Tooltip.prototype, {
		constructor: Popover,
		setContent: function() {
			var $tip = this.tip()
			  , title = this.getTitle()
			  , content = this.getContent();

			Dom.getElementsByClassName('popover-title','h3',$tip)[0][this.options.html ? 'innerHTML':'text'] = title;
			Dom.getFirstChild(Dom.getElementsByClassName('popover-content','div',$tip)[0])[this.options.html ? 'innerHTML':'text'] = content;

			Dom.removeClass($tip,/(fade|top|bottom|left|right|in)/);
		},
		hasContent: function(){
			return this.getTitle() || this.getContent();
		},
		getContent: function(){
			var content
			  , $e = this.$element
			  , o = this.options;

			content = $e.getAttribute('data-content')
				|| (typeof o.content == 'function' ? o.content.call($e) : o.content);

			return content;
		},
		tip: function() {
			if(!this.$tip) {
				this.$tip = this._renderTemplate(this.options.template);
			}
			return this.$tip;
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
		}
	});

	Popover.prototype.defaults = Lang.merge({},YAHOO.bootstrap.Tooltip.prototype.defaults, {
		placement: 'right',
		trigger: 'click',
		content: '',
		template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
	});

	YAHOO.bootstrap.Popover = Popover;
}());