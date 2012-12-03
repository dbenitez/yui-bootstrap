(function(){
YAHOO.namespace('bootstrap');
var Dom = YAHOO.util.Dom,
	Util = YAHOO.util,
	Lang = YAHOO.lang,
	Event = YAHOO.util.Event,
	Selector = YAHOO.util.Selector,
	Bootstrap = YAHOO.bootstrap;

var Tab = function(element){
	this.element = Dom.get(element);
	this.element.tab = this;
	this.showEvent = this.createEvent('show');
	this.shownEvent = this.createEvent('shown');
};

Tab.autoRender = function(){
	var nodes = Selector.query('[data-toggle="tab"], [data-toggle="pill"]',document.body);
	Event.addListener(nodes,'click',function(e){
		Event.preventDefault(e);
		var data = this['tab'];
		if(!data) this['tab'] = (data = new Tab(this));
		data.show();
	});
};

Tab.prototype = {
	constructor: Tab,
	show: function(){
		var $this = this.element,
			$ul = Dom.getAncestorByTagName($this,'ul'),
			selector = $this.getAttribute('data-target'),
			previous,
			$target;
		if(Dom.hasClass($ul,'dropdown-menu')){
			for(var i = 0,len=10;i<len;i++){
				$ul = Dom.getAncestorByTagName($ul,'ul');
				if(!Dom.hasClass($ul,'dropdown-menu')) break;
			}
		}
		if(!selector){
			selector = $this.getAttribute('href').replace(/^#/,'');
			selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); //strip for ie7
		}
		var $parentLI = Dom.getAncestorByTagName($this,'li');
		if(Dom.hasClass($parentLI,'active')) return;

		var aActive = Dom.getElementsBy(function(el){
			return (Dom.getAncestorByClassName(el,'active')) ? true : false;
		},'a',$ul);
		previous =  aActive[aActive.length-1];
		this.fireEvent('show');

		$target = Dom.get(selector);

		this.activate($parentLI,$ul);
		this.activate($target,$target.parentNode,function(){
			this.fireEvent('shown',{relatedTarget:previous,target:$this,scope:this});
		});
	},
	activate: function(element,container,callback){
		var oSelf = this,
			$active = Selector.query('> .active',container,true),
			transition = callback && Bootstrap.transition && Dom.hasClass($active,'fade');

		function next() {
			Dom.removeClass($active,'active');
			var nodes = Selector.query('> .dropdown-menu > .active',$active);
			Dom.removeClass(nodes,'active');

			Dom.addClass(element,'active');

			if(transition){
				element.offsetWidth = 0;
				Dom.addClass(element,'in');
			} else {
				Dom.removeClass(element,'fade');
			}

			if(Dom.getAncestorByClassName(element,'dropdown-menu')){
				var node = Dom.getElementsByClassName('dropdown','li',element)[0];
				Dom.addClass(node,'active');
			}
			transition && Event.removeListener($active,Bootstrap.transition.end);
			callback && callback.call(oSelf);
		}

		transition ? Event.addEventListener($active,Bootstrap.transition.end,next) : next();
		Dom.removeClass($active,'in');
	}
};
Lang.augmentProto(Tab,Util.EventProvider);
YAHOO.bootstrap.Tab = Tab;
}());