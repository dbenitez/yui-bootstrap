/*!
 * Note: if the fiels has an attribute (data-validation-error="My error") it will use that before the default message
		var valid = new Validation(
			'myForm',
			{
				onSubmit: true,
				stopOnFirst: false,
				immediate: false,
				focusOnError: true,
				useTitles: false,
				beforeFormValidate: function(form) {},
				onFormValidate: function(result, form) {},
				onElementValidate: function(result, elm) {},
				onReset: function(form) {}
			}
		);
 *
 * Options:
 * required
 * validate-number
 * validate-digits
 * validate-alpha
 * validate-alphanum
 * validate-date
 * validate-email
 * validate-url
 * validate-date-au
 * validate-currency-dollar
 * validate-selection 		(Select)			Check the the Select value is not of index 0 or empty value
 * validate-one-required	(Checkbox|Radio)	Place this in the last checkbox or radio
 * validate-regex 			Validates the entered value agains the regex defined by the attibute(regex)
 * validate-equalto 		Check that the value in this field is equal to the field defined by the attribute (data-validation-equalto)
 * */

var Dom = YAHOO.util.Dom,
	Lang = YAHOO.lang,
	Event = YAHOO.util.Event;

/* translation functions from Prototype */
var $break = {},
	K = function(x) {return x;};
function all(arr, iterator, context) {
	iterator = iterator || K;
	var result = true;
	if(Lang.isArray(arr)) {
		for(var index = 0, len = arr.length; index < len; index++){
			var value = arr[index];
			result = result && !!iterator.call(context, value, index);
			if (!result) break;
		}
	} else {
		for(var index in arr){
			var value = {key: index, value: arr[index]};
			result = result && !!iterator.call(context, value, index);
			if (!result) break;
		}
	}
	return result;
}

function any(arr, iterator, context) {
	iterator = iterator || K;
	var result = false;
	for(var index = 0, len = arr.length; index < len; index++){
		var value = arr[index];
		if (result = !!iterator.call(context, value, index)) break;
	};
	return result;
}

function collect(arr, iterator, context) {
	iterator = iterator || K;
	var results = [];
	Dom.batch(arr, function(value, index) {
		results.push(iterator.call(context, value, index));
	});
	return results;
}
/* End prototype */
var Form = {
		getValue: function(element){
			element = Dom.get(element);
			var method = element.tagName.toLowerCase();
			return Form.Serializers[method](element);
		},
		getElements: function(form){
			var elements = form.getElementsByTagName('*'),
				element,
				arr = [];
			for(var i = 0; element = elements[i]; i++){
				if(Form.Serializers[element.tagName.toLowerCase()])
				arr.push(element);
			}
			return arr;
		},
		Serializers: {
			input: function(element, value) {
				switch (element.type.toLowerCase()) {
				case 'checkbox':
				case 'radio':
					return Form.Serializers.inputSelector(element, value);
				default:
					return Form.Serializers.textarea(element, value);
				}
			},
			inputSelector: function(element, value) {
				if(Lang.isUndefined(value)) return element.checked ? element.value : null;
				else element.checked = !!value;
			},
			textarea: function(element, value) {
				if(Lang.isUndefined(value)) return element.value;
				else element.value = value;
			},
			select: function(element, value) {
				if (Lang.isUndefined(value))
					return Form.Serializers[element.type == 'select-one' ? 'selectOne' : 'selectMany'](element);
				else {
					var opt, currentValue, single = Lang.isArray(value);
					for (var i = 0, length = element.length; i < length; i++) {
						opt = element.options[i];
						currentValue = Form.Serializers.optionValue(opt);
						if(single) {
							if(currentValue == value) {
								opt.selected = true;
								return;
							}
						}
						else opt.selected = (value.indexOf(currentValue) > -1)? true:false;
					}
				}
			},
			selectOne: function(element) {
				var index = element.selectedIndex;
				return index >= 0 ? Form.Serializers.optionValue(element.options[index]) : null;
			},
			selectMany: function(element) {
				var values = [],
					length = element.length;
				if(!length) return null;

				for(var i = 0; i < length; i++){
					var opt = element.options[i];
					values = [];
					if (opt.selected) values.push(Form.Serializers.optionValue(opt));
				}
				return values;
			},
			optionValue: function(opt) {
				return opt.hasAttribute('value') ? opt.value : opt.text;
			}
		}
};

var Validator = function(className,error,test,options) {
	this.initialize(className,error,test,options);
	return this;
};

Validator.prototype = {
		initialize: function(className, error, test, options) {
			if(typeof test === 'function') {
				this.options = options || {};
				this._test = test;
			} else {
				this.options = test || {};
				this._test = function(){return true;};
			}
			this.error = error || 'Validation failed.';
			this.className = className;
		},
		test: function(v, elm) {
			return (this._test(v, elm) && all(this.options,function(p){
				return Validator.methods[p.key] ? Validator.methods[p.key](v,elm.p.value) : true;
			}));
		}
};

Validator.methods = {
		pattern: function(v,elm,opt) {return Validation.get('IsEmpty').test(v) || opt.test(v);},
		minLength: function(v, elm, opt) {return v.length >= opt;},
		maxLength: function(v, elm, opt) {return v.length <= opt;},
		min: function(v, elm, opt) {return v >= parseFloat(opt);},
		max: function(v, elm, opt) {return v <= parseFloat(opt);},
		notOneOf: function(v, elm, opt) {return all(opt,function(value) {
			return v !== value;
		});},
		oneOf: function(v, elm, opt) {return any(opt,function(value){
			return v === value;
		});},
		'is': function(v, elm, opt) {return v === opt;},
		isNot: function(v, elm, opt) {return v !== opt;},
		equalToField: function(v, elm, opt) {return v === Dom.get(opt).value;},
		notEqualToField: function(v, elm, opt) {return v !== Dom.get(opt).value;},
		include: function(v, elm, opt) {return all(opt,function(value){
			return Validation.get(value).test(v.elm);
		});}
};
/*
 * Creates a new validation instance
 * @constructor
 * @param {String|Object} form Id or reference to the form object
 * @param {Object} options Configuration about the validation
 * @param {Boolean} [options.onSubmit=true] Validates form on submit, this will attach events to the submit trigger. To validate before submiting
 * @param {Boolean} [options.stopOnFirst=false] Stops validation on the first exception found
 * @param {Boolean} [options.immediate=false] Validate the fields onBlur action
 * @param {Boolean} [options.focusOnError=true] Focuses the field with a validation error occurs
 * @param {Boolean} [options.useTitles=false] Uses the title attribute as the error message
 * @param {Function} [options.beforeFormValidate] Executes before the form gets validated
 * @param {Function} [options.onFormValidate] Executes after the form has been validated
 * @param {Function} [options.onElementValidate] Executes after each element validates
 * @param {Function} [options.onReset] Executes after the form gets reseted.
 *
 */
var Validation = function(form, options) {
	this.initialize(form,options);
	return this;
};

Validation.prototype = {
		initialize: function(form, options) {
			this.options = Lang.merge({
				onSubmit: true,
				stopOnFirst: false,
				immediate: false,
				focusOnError: true,
				useTitles: false,
				beforeFormValidate: function(form) {},
				onFormValidate: function(result, form) {},
				onElementValidate: function(result, elm) {},
				onReset: function(form) {}
			}, options || {});
			this.form = Dom.get(form);
			if(this.options.onSubmit) {Event.addListener(this.form,'submit',this.onSubmit,this,true);}
			if(this.options.immediate) {
				var useTitles = this.options.useTitles;
				var callback = this.options.onElementValidate;
				var nodes = Form.getElements(this.form);
				Event.addListener(nodes,'blur',function(ev){
					Validation.validate(this,{useTitle:useTitles,onElementValidate: callback});
				});
			}
		},
		onSubmit: function(ev) {
			if(!this.validate()) {Event.stopEvent(ev);}
		},
		validate: function(){
			var result = false;
			var useTitles = this.options.useTitles;
			var callback = this.options.onElementValidate;
			this.options.beforeFormValidate(this.form);
			if(this.options.stopOnFirst) {
				result = all(Form.getElements(this.form),function(elm) { return Validation.validate(elm,{useTitle: useTitles, onElementValidate: callback});});
			} else {
				result = all(collect(Form.getElements(this.form),function(elm) { return Validation.validate(elm,{useTitle: useTitles, onElementValidate: callback});}));
			}
			if(!result && this.options.focusOnError) {
				Dom.getElementsByClassName('validation-failed',null,this.form)[0].focus();
			}
			var result2 = this.options.onFormValidate(result,this.form);
			if(result2 != null) result = result2;
			return result;
		},
		reset: function() {
			Dom.batch(Form.getElements(this.form),Validation.reset);
			this.options.onReset(this.form);
		}
};
Lang.augmentObject(Validation, {
	validate: function(elm, options) {
		options = Lang.merge({
			useTitle: false,
			onElementValidate: function(result,elm) {}
		}, options || {});
		elm = Dom.get(elm);
		var cn = elm.className.split(/\s+/);
		var result = all(cn,function(value){
			var test = Validation.test(value, elm, options.useTitle);
			options.onElementValidate(test, elm);
			// Added for bootstrap support
			var p = Dom.getAncestorByClassName(elm,'control-group');
			if(p) {
				Dom.removeClass(p, /(warning|error|success)/);
				Dom.addClass(p,(test == true) ? 'success' : 'error');
			}
			return test;
		});
		return result;
	},
	test: function(name, elm, useTitle) {
		var v = Validation.get(name);
		var prop = '__advice'+name.camelize();
		try{
			if(Validation.isVisible(elm) && !v.test(Form.getValue(elm), elm)) {
				if(!elm[prop]) {
					var advice = Validation.getAdvice(name, elm);
					if(advice === null) {
						var errorMsg = useTitle ? ((elm && elm.title) ? elm.title : v.error) : ((elm && elm.getAttribute('data-validation-error')) ? elm.getAttribute('data-validation-error') : v.error);
						/* REPLACED for bootstrap
						 * advice = '<div class="validation-advice fade" id="advice-' + name + '-' + Validation.getElmID(elm) + '" style="display:none">' + errorMsg + '</div>';
						 */
						advice = document.createElement('span');
						advice.className = 'help-inline validation-advice fade';
						advice.id = 'advice-' + name + '-' + Validation.getElmID(elm);
						//advice.style.display = 'none';
						advice.innerHTML = errorMsg;
						switch (elm.type.toLowerCase()) {
						case 'checkbox':
							var p = elm.parentNode;
							if(p) {
								Dom.insertAfter(advice, Dom.getLastChild(p));
							} else {
								Dom.insertAfter(advice, elm);
							}
							break;
						case 'radio':
							var p = elm.parentNode;
							if(p) {
								Dom.insertAfter(advice, Dom.getLastChild(p));
							} else {
								Dom.insertAfter(advice, elm);
							}
							break;
						default:
							if(Dom.hasClass(elm.parentNode,/(input-append|input-prepend)/)){
								Dom.insertAfter(advice, elm.parentNode);
							} else {
								Dom.insertAfter(advice, elm);
							}
						}
						advice = Validation.getAdvice(name, elm);
					}
					Dom.setStyle(advice,'display',Dom.hasClass(advice,'help-inline') ? 'inline-block':'block');
					if(Dom.hasClass(advice, 'fade')){
						Dom.addClass(advice, 'in');
					}
				}
				elm[prop] = true;
				Dom.removeClass(elm,'validation-passed');
				Dom.addClass(elm,'validation-failed');
				// Added for bootstrap support
				/*var p = Dom.getAncestorByClassName(elm,'control-group');
				if(p) {
					Dom.removeClass(p, /(warning|error|success)/);
					Dom.addClass(p,'error');
				}*/
				return false;
			} else {
				var advice = Validation.getAdvice(name, elm);
				if(advice != null) {
					if(Lang.transition && Dom.hasClass(advice,'fade')){
						Event.addListener(advice,Lang.transition.end,function(){
							Dom.setStyle(advice,'display','none');
							Event.removeListener(this,Lang.transition.end);
						});
						Dom.removeClass(advice,'in');
					} else {
						Dom.setStyle(advice,'display','none');
					}
				}
				elm[prop] = '';
				Dom.removeClass(elm,'validation-failed');
				Dom.addClass(elm,'validation-passed');
				// Added for bootstrap support
				/*var p = Dom.getAncestorByClassName(elm,'control-group');
				if(p) {
					Dom.removeClass(p, /(warning|error|success)/);
					Dom.addClass(p,'success');
				}*/
				return true;
			}
		} catch(e){
			throw(e);
		}
	},
	isVisible: function(elm) {
		if(elm.className.indexOf('validate-hidden') == -1) {
			while(elm.tagName != 'BODY') {
				if(!(Dom.get(elm).style.display != 'none')) return false;
				elm = elm.parentNode;
			}
		} else {
			return false;
		}
		return true;
	},
	getAdvice: function(name, elm) {
		return Dom.get('advice-' + name + '-' + Validation.getElmID(elm)) || Dom.get('advice-' + Validation.getElmID(elm));
	},
	getElmID: function(elm) {
		return elm.id ? elm.id : elm.name;
	},
	reset: function(elm) {
		elm = Dom.get(elm);
		var cn = elm.className.split(/\s+/);
		for(var index = 0, len = cn.length; index < len; index++){
			var value = cn[index];
			var prop = '__advice'+value.camelize();
			if(elm[prop]) {
				var advice = Validation.getAdvice(value, elm);
				// Bootstrap
				if(Lang.transition && Dom.hasClass(advice,'fade')) {
					Event.addListener(advice,Lang.transition.end,function(){
						Dom.setStyle(this,'display','none');
						Event.removeListener(this,Lang.transition.end);
					});
					Dom.removeClass(advice,'in');
				} else {
					Dom.setStyle(advice,'display','none');
				}
				elm[prop] = '';
			}
			Dom.removeClass(elm,/(validation-failed|validation-passed)/);
			Dom.removeClass(Dom.getAncestorByClassName(elm,'control-group'),/(warning|error|success)/); // Bootstrap
		}
		Dom.batch(cn,function(value){
		});
	},
	add: function(className, error, test, options) {
		var nv = {};
		nv[className] = new Validator(className, error, test, options);
		Lang.augmentObject(Validation.methods, nv);
	},
	addAllThese: function(validators) {
		var nv = {};
		for(var index = 0, len = validators.length; index < len; index++){
			var value = validators[index];
			nv[value[0]] = new Validator(value[0],value[1], value[2], (value.length > 3 ? value[3] : {}));
		}
		Lang.augmentObject(Validation.methods, nv);
	},
	get: function(name) {
		return Validation.methods[name] ? Validation.methods[name] : Validation.methods['_LikeNoIDIEverSaw_'];
	},
	methods: {
		'_LikeNoIDIEverSaw_' : new Validator('_LikeNoIDIEverSaw_','',{})
	}
});

Validation.add('IsEmpty', '', function(v) {
				return  ((v == null) || (v.length == 0)); // || /^\s+$/.test(v));
			});

Validation.addAllThese([
	['required', 'This is a required field.', function(v) {
				return !Validation.get('IsEmpty').test(v);
			}],
	['validate-number', 'Please enter a valid number in this field.', function(v) {
				return Validation.get('IsEmpty').test(v) || (!isNaN(v) && !/^\s+$/.test(v));
			}],
	['validate-digits', 'Please use numbers only in this field. please avoid spaces or other characters such as dots or commas.', function(v) {
				return Validation.get('IsEmpty').test(v) ||  !/[^\d]/.test(v);
			}],
	['validate-alpha', 'Please use letters only (a-z) in this field.', function (v) {
				return Validation.get('IsEmpty').test(v) ||  /^[a-zA-Z]+$/.test(v);
			}],
	['validate-alphanum', 'Please use only letters (a-z) or numbers (0-9) only in this field. No spaces or other characters are allowed.', function(v) {
				return Validation.get('IsEmpty').test(v) ||  !/\W/.test(v);
			}],
	['validate-date', 'Please enter a valid date.', function(v) {
				//var test = new Date(v);
				//return Validation.get('IsEmpty').test(v) || !isNaN(test);
				if(Validation.get('IsEmpty').test(v)) return true;
				var regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
				var regex2 = /^(\d{4})-(\d{2})-(\d{2})$/;
				if(regex.test(v)) {
					var d = new Date(v);
					return  (parseInt(RegExp.$1, 10) == (1+d.getMonth())) &&
							(parseInt(RegExp.$2, 10) == d.getDate()) &&
							(parseInt(RegExp.$3, 10) == d.getFullYear());
				} else if(regex2.test(v)){
					var d = new Date(v.replace(regex2,'$2/$3/$1'));
					return  (parseInt(RegExp.$2, 10) == (1+d.getMonth())) &&
							(parseInt(RegExp.$3, 10) == d.getDate()) &&
							(parseInt(RegExp.$1, 10) == d.getFullYear());
				} else {
					return false;
				};
			}],
	['validate-email', 'Please enter a valid email address. For example fred@domain.com.', function (v) {
				return Validation.get('IsEmpty').test(v) || /\w{1,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/.test(v);
			}],
	['validate-url', 'Please enter a valid URL.', function (v) {
				return Validation.get('IsEmpty').test(v) || /^(http|https|ftp):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i.test(v);
			}],
	['validate-date-au', 'Please use this date format: mm/dd/yyyy. For example 03/17/2006 for the 17th of March, 2006.', function(v) {
				if(Validation.get('IsEmpty').test(v)) return true;
				var regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
				var regex2 = /^(\d{4})-(\d{2})-(\d{2})$/;
				if(regex.test(v)) {
					var d = new Date(v.replace(regex, '$1/$2/$3'));
					return ( parseInt(RegExp.$1, 10) == (1+d.getMonth()) ) &&
								(parseInt(RegExp.$2, 10) == d.getDate()) &&
								(parseInt(RegExp.$3, 10) == d.getFullYear() );
				} else if(regex2.test(v)) {
					var d = new Date(v.replace(regex2,'$2/$3/$1'));
					return ( parseInt(RegExp.$2, 10) == (1+d.getMonth()) ) &&
						(parseInt(RegExp.$3, 10) == d.getDate()) &&
						(parseInt(RegExp.$1, 10) == d.getFullYear() );
				} else {
					return false;
				}
			}],
	['validate-currency-dollar', 'Please enter a valid $ amount. For example $100.00 .', function(v) {
				// [$]1[##][,###]+[.##]
				// [$]1###+[.##]
				// [$]0.##
				// [$].##
				return Validation.get('IsEmpty').test(v) ||  /^\$?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/.test(v);
			}],
	['validate-selection', 'Please make a selection', function(v,elm){
				return elm.options ? elm.selectedIndex > 0 : !Validation.get('IsEmpty').test(v);
			}],
	['validate-one-required', 'Please select one of the above options.', function (v,elm) {
				var p = elm.parentNode;
				if(p.tagName == "LABEL") p = p.parentNode;
				var options = p.getElementsByTagName('INPUT');
				return any(options,function(elm){
					return Form.getValue(elm);
				});
				/*return $A(options).any(function(elm) {
					return $F(elm);
				});*/
			}],
	['validate-regex', 'Please enter a valid value', function(v,elm){
				var r = RegExp(elm.getAttribute('regex'));
				return Validation.get('IsEmpty').test(v) || (r && v.match(r));
			}],
	['validate-equalto', 'The entered value is not equal', function(v,elm){
				var otherEl = Dom.get(elm.getAttribute('data-validation-equalto'));
				return Validation.get('IsEmpty').test(v) || (otherEl && otherEl.value == v);
			}]
]);