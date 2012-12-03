(function() {
	YAHOO.namespace('bootstrap');
	var Transition = (function() {
		var transitionEnd = (function() {

			var el = document.createElement('bootstrap'),
				transEndEventNames = {
					'WebkitTransition' : 'webkitTransitionEnd',
					'MozTransition' : 'transitionend',
					'OTransition' : 'oTransitionEnd otransitionend',
					'transition' : 'transitionend'
				}
				, name = "";

			for (name in transEndEventNames) {
				if (el.style[name] !== undefined) {
					return transEndEventNames[name];
				}
			}
		}());

		return transitionEnd && {
			end: transitionEnd
		};
	})();
	YAHOO.bootstrap.transition = Transition;
}());