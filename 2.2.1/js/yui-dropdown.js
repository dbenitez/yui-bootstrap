YAHOO.namespace('bootstrap.dropdown');
var Dom = YAHOO.util.Dom
  , Event = YAHOO.util.Event
  , Selector = YAHOO.util.Selector
  , Lang = YAHOO.lang
  , ArrayAssert = YAHOO.util.ArrayAssert
  , toggle = '[data-toggle=dropdown]'
  , Dropdown = function(element){
	this.element = Dom.get(element);
	Event.addListener(this.element,'click',this.toggle);
	Event.addListener(window.document,'click',function(){
		Dom.removeClass(this._elParent(this.element),'open');
	}, undefined, this, true);
};

Dropdown.prototype = {
	_elParent: function(element){
		var parents = [];
		if(Lang.isArray(element)){
			for(var i = 0, len = element.length; i<len;i++){
				parents.push(element[i].parentNode);
			};
		} else {
			parents = [element.parentNode];
		}
		return parents;
	},
	constructor: Dropdown,
	toggle: function(e){
		var $this = Dom.get(this)
		  , $parent
		  , isActive;

		if(Dom.hasClass($this,'disabled')) return

		$parent = getParent($this);

		isActive = Dom.hasClass($parent,'open');

		clearMenus();

		if (!isActive) {
			Dom.addClass($parent,'open');
			$this.focus();
		}
		Event.stopEvent(e);
		return false;
	},
	keydown: function(e){
		var $this
		  , $items
		//  , $active
		  , $parent
		  , isActive
		  , index;

		if (!/(38|40|27)/.test(e.keyCode)) return

		$this = Dom.get(this);

		Event.preventDefault(e);
		Event.stopPropagation(e);

		if(Dom.hasClass($this,'disabled')) return;

		$parent = getParent($this);

		isActive = Dom.hasClass($parent,'open');

		if (!isActive || (isActive && e.keyCode == 27)) return $this.click();

		$items = Selector.query('[role=menu] li:not(.divider) a', $parent);

		if(!$items.length) return;
		var focusedItems = Selector.filter($items,':focus');
		index = Dom.index(focusedItems, $items);

		if(e.keyCode == 38 && index > 0) index--;					// up
		if(e.keyCode == 40 && index < $items.length - 1) index++;	// down
		if(!~index) index = 0;

		$items[index].focus();
	}
};
Dropdown.autoLoad = function(){
	if(!Dropdown.autoLoaded) {
		Event.addListener(window.document,'click',clearMenus);
		Event.addListener(window.document,'touchstart',clearMenus);
		var formNodes = Selector.query('.dropdown form',window.document.body);
		Event.addListener(formNodes,'click', function(e){Event.stopPropagation(e);});
		Event.addListener(formNodes,'touchstart', function(e){Event.stopPropagation(e);});
		var nodes = Selector.query(toggle);
		Event.addListener(nodes,'click',Dropdown.prototype.toggle);
		Event.addListener(nodes,'touchstart',Dropdown.prototype.toggle);
		var nodesMenu = Selector.query(toggle + ', [role=menu]');
		Event.addListener(nodesMenu,'keydown',Dropdown.prototype.keydown);
		Event.addListener(nodesMenu,'touchstart',Dropdown.prototype.keydown);
		Dropdown.autoLoaded = true;
	}
};
function clearMenus(){
	Dom.removeClass(getParents(Selector.query(toggle)),'open');
}
function getParents($this){
	var $parents = [];
	if(!Lang.isArray($this)){
		$this = [$this];
	}
	for(var i = 0, len = $this.length;i<len;i++){
		var $parent = getParent($this[i]);
		$parent && $parents.push($parent);
	}
	return $parents;
}
function getParent($this){
	var selector = $this.getAttribute('data-target')
	  , $parent;

	if(!selector) {
		selector = $this.getAttribute('href');
		selector = selector && /#/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); //strip for ie7
	}

	$parent = Selector.query(selector);
	$parent.length || ($parent = $this.parentNode);

	return $parent;
}
YAHOO.bootstrap.Dropdown = Dropdown;