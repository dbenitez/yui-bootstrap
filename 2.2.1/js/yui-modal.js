(function(){
	YAHOO.namespace('bootstrap');
	var Y = YAHOO,
		Util = Y.util,
		Dom = Util.Dom,
		Lang = Y.lang,
		Event = Util.Event,
		Selector = Util.Selector,
		Connect = Util.Connect;

	var Modal = function(element, options) {
		this.options = options;
		this.$element = Dom.get(element);
		this.form = Selector.query('.modal-body form',this.$element,true) || null;
		Event.on(Selector.query('[data-dismiss="modal"]',this.$element),'click',this.hide,this,true);
		this.options.remote && this.loadRemote();

		this.showEvent = this.createEvent('show');
		this.shownEvent = this.createEvent('shown');
		this.hideEvent = this.createEvent('hide');
		this.hiddenEvent = this.createEvent('hidden');
	};

	Modal.prototype = {
		defaults: {
			backdrop: true,
			keyboard: true,
			show: true
		},
		toggle: function(){
			YAHOO.log('toggle');
			return this[!this.isShown ? 'show' : 'hide']();
		},
		show: function(){
			YAHOO.log('show');
			var that = this;

			this.fireEvent('show');

			if(this.isShown) return;

			Dom.addClass(document.body,'modal-open');

			this.isShown = true;

			this.escape();

			this.backdrop(function() {
				var transition = Y.bootstrap.transition && Dom.hasClass(that.$element,'fade');

				if(!that.$element.parentNode) {
					document.body.appendChild(that.$element);
				}

				that.$element.style.display = '';

				if(transition) {
					that.$element.offsetWidth; // force reflow
				}
				Dom.removeClass(that.$element,'hide');
				Dom.addClass(that.$element,'in');
				that.$element.setAttribute('aria-hidden',false);
				that.$element.focus();

				that.enforceFocus();

				if(that.form) {
					var aIn = Selector.query('input[type="text"]', that.$element, true);
					aIn && aIn.focus();
				}

				transition ?
						Event.on(that.$element,Y.bootstrap.transition.end,function(){
							that.fireEvent('shown');
							Event.removeListener(that.$element,Y.bootstrap.transition.end);
							Event.removeListener(that.$backdrop,Y.bootstrap.transition.end);
						}) :
						that.fireEvent('shown');
			});
		},
		hide: function(e){
			YAHOO.log('hide');
			e && Event.preventDefault(e);
			var that = this;

			this.fireEvent('hide');

			if(!this.isShown) return;

			this.isShown = false;

			Dom.removeClass(document.body,'modal-open');

			this.escape();

			Event.removeListener(document,'focusin');

			Dom.removeClass(this.$element,'in');
			this.$element.setAttribute('aria-hidden',true);

			Y.bootstrap.transition && Dom.hasClass(this.$element,'fade') ?
					this.hideWithTransition() :
					this.hideModal();
		},
		enforceFocus: function() {
			YAHOO.log('enforceFocus');
			var that = this;
			Event.on(document,'focusin',function(e){
				if(that.$element !== e.target && !Dom.isAncestor(that.$element,e.target)) {
					that.$element.focus();
				}
			});
		},
		escape: function() {
			YAHOO.log('escape');
			var that = this;
			if(this.isShown && this.options.keyboard) {
				Event.on(this.$element,'keyup', function(e){
					e.which == 27 && that.hide();
				});
			} else if(!this.isShown) {
				Event.removeListener(this.$element,'keyup');
			}
		},
		hideWithTransition: function() {
			YAHOO.log('hideWithTransition');
			var that = this
			  , timeout = setTimeout(function() {
				  Event.removeListener(that.$element,Y.bootstrap.transition.end);
				  that.hideModal();
			  }, 500);

			Event.on(this.$element,Y.bootstrap.transition.end,function() {
				clearTimeout(timeout);
				that.hideModal();
				Event.removeListener(that.$element,Y.bootstrap.transition.end);
			});
		},
		hideModal: function() {
			YAHOO.log('hideModal');
			this.$element.style.display = 'none';
			this.fireEvent('hidden');

			this.backdrop();
		},
		removeBackdrop: function() {
			YAHOO.log('removeBackdrop');
			if(this.$backdrop){
				var parent = this.$backdrop.parentNode || null;
				parent && parent.removeChild(this.$backdrop);
				this.$backdrop = null;
			}
		},
		backdrop: function(callback) {
			YAHOO.log('backdrop');
			var that = this
			  , animate = Dom.hasClass(this.$element,'fade') ? 'fade' : '';

			if(this.isShown && this.options.backdrop) {
				var doAnimate = Y.bootstrap.transition && animate;

				this.$backdrop = document.createElement('div');
				this.$backdrop.className = 'modal-backdrop '+ animate;
				document.body.appendChild(this.$backdrop);

				if(this.options.backdrop != 'static') {
					Event.on(this.$backdrop,'click',this.hide,this,true);
				}

				if(doAnimate) this.$backdrop.offsetWidth; // forse reflow

				Dom.addClass(this.$backdrop,'in');

				doAnimate ?
						Event.on(this.$backdrop,Y.bootstrap.transition.end, callback) :
						callback();
			} else if (!this.isShown && this.$backdrop) {
				Dom.removeClass(this.$backdrop,'in');

				Y.bootstrap.transition && Dom.hasClass(this.$element,'fade') ?
						Event.on(this.$backdrop,Y.bootstrap.transition.end, this.removeBackdrop, this, true) :
						this.removeBackdrop();
			} else if(callback) {
				callback();
			}
		},
		loadRemote: function() {
			Connect.asyncRequest(
				'GET',
				this.options.remote,
				{
					success: function(o){
						var $body = Dom.getElementsByClassName('modal-body','div',this.self.$element)[0];
						$body.innerHTML = o.responseText;
					},
					cache: false,
					self: this
				}
			);
		}
	};
	Modal.multiple = function(elements,option){
		!Lang.isArray(elements) && (elements = [elements]);
		return Dom.batch(elements,function(el){
			var $this = Dom.get(el)
			  , data = Dom.getData($this,'modal')
			  , options = Lang.merge({},Modal.prototype.defaults, Dom.getData($this), (typeof option == 'object') ? option : {});
			if(!data) Dom.setData($this,'modal',(data = new Modal(el, options)));
			if(typeof option == 'string') data[option]();
			else if (options.show) data.show();
			return data;
		});
	};
	Lang.augmentProto(Modal,Util.EventProvider);
	YAHOO.bootstrap.Modal = Modal;

	Event.onDOMReady(function(){
		var nodes = Selector.query('[data-toggle="modal"]',document.body);
		Event.on(nodes,'click',function(e){
			var $this = Dom.get(this)
			  , href = $this.getAttribute('href')
			  , $target = Selector.query($this.getAttribute('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, '')),document.body,true) //strip for ie7
			  , option = Dom.getData($target,'modal') ? 'toggle' : Lang.merge({remote: !/#/.test(href) && href }, Dom.getData($target) || {}, Dom.getData($this) || {});

			Event.preventDefault(e);

			Modal.multiple($target,option);
			Event.on($target,'hide',function(){
				$this.focus();
			});
		});
	});
}());