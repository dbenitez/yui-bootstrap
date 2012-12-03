(function(){
	YAHOO.namespace('bootstrap.Toastr');
	var Dom = YAHOO.util.Dom,
		Event = YAHOO.util.Event,
		Lang = YAHOO.lang,
		Transition = YAHOO.bootstrap.transition || null;
	var toastr = (function() {
		var
			defaults = {
				tapToDismiss: true,
				toastClass: 'toast',
				containerId: 'toast-container',
				debug: false,
				fadeIn: 300,
				fadeOut: 1000,
				extendedTimeOut: 1000,
				iconClasses: {
					error: 'toast-error',
					info: 'toast-info',
					success: 'toast-success',
					warning: 'toast-warning'
				},
				iconClass: 'toast-info',
				positionClass: 'toast-top-right',
				timeOut: 5000, // Set timeOut to 0 to make it sticky
				titleClass: 'toast-title',
				messageClass: 'toast-message'
			},
			error = function (message, title, optionsOverride) {
				return notify({
					iconClass: getOptions().iconClasses.error,
					message: message,
					optionsOverride: optionsOverride,
					title: title
				});
			},
			getContainer = function(options) {
				var $container = Dom.get(options.containerId);
				if ($container) return $container;
				$container = document.createElement('div');
				$container.setAttribute('id', options.containerId);
				//Dom.addClass($container,'fade');
				Dom.addClass($container,options.positionClass);
				document.body.appendChild($container);
				return $container;
			},
			getOptions = function(){
				return Lang.merge({}, defaults || {}, toastr.options || {});
			},
			info = function(message, title, optionsOverride) {
				return notify({
					iconClass: getOptions().iconClasses.info,
					message: message,
					optionsOverride: optionsOverride,
					title: title
				});
			},
			append = function(el,content) {
				if(typeof content == 'string') {
					el.innerHTML += content;
				} else {
					el.appendChild(content);
				}
				return el;
			},
			notify = function(map) {
				var
					options = getOptions(),
					iconClass = map.iconClass || options.iconClass;

				if (typeof (map.optionsOverride) !== 'undefined') {
					options = Lang.merge(options, map.optionsOverride);
					iconClass = map.optionsOverride.iconClass || iconClass;
				}

				var intervalId = null,
					$container = getContainer(options),
					$toastElement = document.createElement('div'),
					$titleElement  = document.createElement('div'),
					$messageElement  = document.createElement('div'),
					response = { options: options, map: map};

				if (map.iconClass) {
					Dom.addClass($toastElement,options.toastClass);
					Dom.addClass($toastElement,iconClass);
				}

				if (map.title) {
					append($titleElement,map.title);
					Dom.addClass($titleElement,options.titleClass);
					append($toastElement,$titleElement);
				}

				if (map.message) {
					append($messageElement,map.message);
					Dom.addClass($messageElement,options.messageClass);
					append($toastElement,$messageElement);
				}

				var fadeAway = function () {
					if (Dom.hasFocus($toastElement)) {
						return;
					}
					var fade = function(callback) {
						Dom.removeClass($toastElement,'in');
						(Transition && Transition.end) ? Event.addListener($toastElement, Transition.end, callback, this, true) : callback.call(this, $toastElement);
						return $toastElement;
					};
					var removeToast = function() {
						if (Dom.isVisible($toastElement)) return;
						$toastElement.parentNode.removeChild($toastElement);
						if ($container.childNodes.length === 0) {
							$container.parentNode.removeChild($container);
						}
					};
					fade(removeToast);
				};

				var delayedFadeAway = function() {
					if (options.timeOut > 0 || options.extendedTimeOut > 0) {
						intervalId = setTimeout(fadeAway, options.extendedTimeOut);
					}
				};

				var stickAround = function() {
					clearTimeout(intervalId);
					Dom.addClass($toastElement, 'in');
				};

				Dom.removeClass($toastElement,'in');
				($container.childNodes.length == 0) ? $container.appendChild($toastElement) : Dom.insertBefore($toastElement,Dom.getFirstChild($container));
				Dom.addClass($toastElement,'fade');
				Dom.addClass($toastElement,'in');
				if (options.timeOut > 0) {
					intervalId = setTimeout(fadeAway, options.timeOut);
				}

				Event.addListener($toastElement,'mouseover', stickAround);
				Event.addListener($toastElement,'mouseout', delayedFadeAway);
				if (!options.onclick && options.tabToDismiss) {
					Event.addListener($toastElement,'click',fadeAway);
				}

				if (options.onclick) {
					Event.addListener($toastElement,'click', function() {
						options.onclick() && fadeAway();
					});
				}

				if (options.debug && console) {
					console.log(response);
				}
				return $toastElement;
			},

			success = function (message, title, optionsOverride) {
				return notify({
					iconClass: getOptions().iconClasses.success,
					message: message,
					optionsOverride: optionsOverride,
					title: title
				});
			},

			warning = function (message, title, optionsOverride) {
				return notify({
					iconClass: getOptions().iconClasses.warning,
					message: message,
					optionsOverride: optionsOverride,
					title: title
				});
			},

			clear = function () {
				var options = getOptions();
				var $container = Dom.get(options.containerId);
				if ($container) {
					Dom.removeClass($container, 'in');
					$container.parentNode.removeChild($container);
				}
			};

			return {
	            clear: clear,
	            error: error,
	            info: info,
	            options: {},
	            success: success,
	            version: '1.1.1',
	            warning: warning
	        };
	}) ();
	window['toastr'] = toastr;
	YAHOO.bootstrap.Toastr = toastr;
}());