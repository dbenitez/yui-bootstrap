YUI().add('validation',function(Y){
	Y.Object.every = function(iterator, context) {
		iterator = iterator || function(x){return x;};
		var result = true;
		this.each(function(value, index) {
			result = result && !!iterator.call(context, value, index, this);
			if(!result) throw $break;
		},this);
		return result;
	};
	//Y.NodeList.prototype.every = Y.Object.every;

	var Validator = {},
		Validation = {},
		_formElem = 'input, textarea, select',
		$K = function(x) {return x;},
		$break = {};
	Validator = function(config){
		Validator.superclass.constructor.apply(this, arguments);
	};
	Validator.NAME = 'validator';
	Validator.ATTRS = {

	};
	Y.extend(Validator,Y.Base,{
		constructor: Validator,
		initializer: function(config) {
			this.options = Y.Object(config.options || {});
			if(Y.Lang.isFunction(config.test)) {
				this._test = config.test;
			} else {
				this._test = function() {return true;};
			}
			this.error = config.error || 'Validation failed.';
			this.className = config.className;
		},
		test: function(v, elm) {
			return (this._test(v,elm) && Y.Object.every(this.options, function(obj,key){
				return Validator.methods[key] ? Validator.methods[key](v,elm,opt) : true;
			}));
		}
	});
	Validator.methods = {
		pattern : function(v,elm,opt) {return Validation.getValidator('IsEmpty').test(v) || opt.test(v);},
		minLength : function(v,elm,opt) {return v.length >= opt;},
		maxLength : function(v,elm,opt) {return v.length <= opt;},
		min : function(v,elm,opt) {return v >= parseFloat(opt);},
		max : function(v,elm,opt) {return v <= parseFloat(opt);},
		notOneOf : function(v,elm,opt) {return Y.Array(opt).all(function(value) {
			return v !== value;
		});},
		oneOf : function(v,elm,opt) {return Y.Array(opt).any(function(value) {
			return v === value;
		});},
		'is' : function(v,elm,opt) {return v === opt;},
		isNot : function(v,elm,opt) {return v !== opt;},
		equalToField : function(v,elm,opt) {return v === $F(opt);},
		notEqualToField : function(v,elm,opt) {return v !== $F(opt);},
		include : function(v,elm,opt) {return Y.Array(opt).all(function(value) {
			return Validation.getValidator(value).test(v,elm);
		});
		}
	};
	Y.Validator = Validator;

	Validation = function(config){
		Validation.superclass.constructor.apply(this, arguments);
	};

	Validation.NAME = "validation";

	Validation.ATTRS = {
		node: {
			value: null,
			setter: function(node){
				var n = Y.one(node);
				if(!n) {
					Y.log('Validation: Invalid Node Given: ' + node);
				}
				return n;
			}
		},
		onSubmit: {value: true},
		stopOnFirst: {value: false},
		immediate: {value: false},
		focusOnError: {value: false},
		useTitles: {value: false},
		beforeFormValidate: {value: function(form) {}},
		onFormValidate: {value: function(result, form) {}},
		onElementValidate: {value: function(result, form) {}},
		onReset: {value: function(result, form) {}}
	};

	Y.extend(Validation,Y.Base,{
		initializer: function(config) {
			if(this.get('onSubmit')) {this.get('node').on('submit',this.onSubmit,this);}
			if(this.get('immediate')) {
				var useTitles = this.get('useTitles');
				var callback = this.get('onElementValidate');
				this.get('node').all(_formElem).on('blur',function(e) { Validation.validate(e.currentTarget,{useTitle: useTitles, onElementValidate: callback}); });
			};
		},
		onSubmit: function(e) {
			alert('submitting')
			if(!this.validate()) {e.preventDefault();}
		},
		validate: function() {
			var result = false;
			var useTitles = this.get('useTitles');
			var callback = this.get('onElementValidate');
			var $form = this.get('node');
			if(this.get('stopOnFirst')) {
				result = $form.all(_formElem).every(function(el){ return Validation.validate(elm,{useTitle: useTitles, onElementValidate: callback}); });
			} else {
				result = Y.Array($form.all(_formElem)._nodes).map(function(elm) { return Validation.validate(elm, {useTitle: useTitles, onElementValidate: callback}); });
			}
			if(Y.Lang.isArray(result) && result.length > 0) {
				for(var i = 0; i < result.length; i++){
					if(result[i] == false) {
						result = false;
						break;
					}
				}
				if(result != false) result = true;
			}
			if(!result && this.get('focusOnError')) {
				$form.all('input.validation-failed, textarea.validation-failed, select.validation-failed').item(0).focus();
			}
			this.get('onFormValidate').call(this, result, $form);
			return result;
		},
		reset: function() {
			$form.all(_formElem).each(Validation.reset);
			this.get('onReset').call(this, $form);
		}
	},{
		validate: function(elm, options) {
			options = Y.merge({
				useTitle: false,
				onElementValidate: function(result, elm) {}
			}, options || {});
			elm = Y.one(elm);
			var sCN = elm.get('className');
			var cn = sCN.length > 0 ? Y.Array(elm.get('className').split(/\s+/)) : [];
			var result = cn.every(function(value) {
				var test = Validation.test(value,elm,options.useTitle);
				options.onElementValidate(test, elm);
				// Added for bootstrap support
				var p = elm.ancestor('.control-group');
				if(p) {
					p.removeClass("(warning|error|success)");
					p.addClass((test == true) ? 'success' : 'error');
				};
				return test;
			});
			return result;
		},
		test: function(name, elm, useTitle) {
			var v = Validation.getValidator(name);
			var prop = '__advice'+name.camelize(name);
			if(Validation.isVisible(elm) && !v.test(Y.Form.Element.getValue(elm), elm)) {
				if(!elm.getData(prop)) {
					var advice = Validation.getAdvice(name, elm);
					if(advice === null) {
						var errorMsg = useTitle ? elm.get('title') : (elm.getData('validation-error') || elm.getData('validation-'+name+'-error') || v.error);
						advice = Y.Node.create('<div class="help-inline validation-advice fade" id="advice-' + name + '-' + Validation.getElmID(elm) +'" style="display:none">' + errorMsg + '</div>');
						var p = elm.ancestor();
						switch (elm.getAttribute('type').toLowerCase()) {
							case 'checkbox':
							case 'radio':
								if(p) {
									p.get('children').pop().insert(advice,"after");
								} else {
									elm.insert(advice,"after");
								}
								break;
							default:
								if(p.hasClass("(input-append|input-prepend)")) {
									p.insert(advice,"after");
								} else {
									elm.insert(advice,"after");
								}
						}
						advice = Validation.getAdvice(name, elm);
					}
					advice.setStyle('display',advice.hasClass('help-inline') ? 'inline-block' : 'block');
					if(advice.hasClass('fade')) {
						advice.addClass('in');
					}
				}
				elm.setData(prop, true);
				elm.removeClass('validation-passed');
				elm.addClass('validation-failed');
				return false;
			} else {
				var advice = Validation.getAdvice(name, elm);
				if(advice != null) {
					if(advice.hasClass('fade')) {
						advice.removeClass('in');
						advice.setStyle('display','none');
					} else {
						advice.setStyle('display','none');
					}
				}
				elm.setData(prop,null);
				elm.removeClass('validation-failed');
				elm.addClass('validation-passed');
				return true;
			}
		},
		isVisible: function(elm) {
			while(elm.get('tagName') != 'BODY') {
				if(elm.getComputedStyle('display') == 'none') return false;
				elm = elm.ancestor();
			};
			return true;
		},
		getAdvice: function(name, elm) {
			return Y.one('#advice-' + name + '-' + Validation.getElmID(elm)) || Y.one('#advice-' + Validation.getElmID(elm));
		},
		getElmID: function(elm) {
			return elm.get('id') || elm.get('name');
		},
		reset: function(elm) {
			elm = Y.one(elm);
			var sCN = elm.get('className');
			var cn = sCN.length > 0 ? sCN.split(/\s+/) : [];
			cn.each(function(value){
				var prop = '__advice'+value.camelize();
				if(elm.getData(prop)) {
					var advice = Validation.getAdvice(value, elm);
					advice.hide();
					elm.setData(prop,null);
				}
				elm.removeClass("(validation-failed|validation-passed)");
				elm.ancestor('.control-group').removeClass("(warning|error|success)");
			});
		},
		add: function(config) {
			var nv = {};
			config = Y.merge({options: {}, error: ''}, config);
			nv[config.className] = new Validator(config);
			Y.aggregate(Validation.methods,nv,true);
		},
		addAllThese: function(validators) {
			var nv = {};
			Y.Array(validators).forEach(function(config) {
				config = Y.merge({options: {}, error: ''}, config);
				nv[config.className] = new Validator(config);
			});
			Y.aggregate(Validation.methods,nv);
		},
		getValidator: function(name) {
			return Validation.methods[name] ? Validation.methods[name] : Validation.methods['_LikeNoIDIEverSaw_'];
		},
		methods: {
			'_LikeNoIDIEverSaw_' : new Y.Validator({className:'_LikeNoIDIEverSaw_',error:'',test:{}})
		},
		_all: function(arr,iterator,context) {
			iterator = iterator || $K;
			var result = true;
			Y.Array.every(arr._nodes,function(obj,indx,nodeList) {
				result = result && !!iterator.call(context,obj,indx);
				return result;
			},arr);
			return result;
		},
		_any: function(arr, iterator, context) {
			iterator = iterator || $K;
			var result = true;
			Y.Array.every(arr._nodes,function(obj,indx,nodeList) {
				if(result = !!iterator.call(context,obj,indx)) return false;
				return true;
			});
			return result;
		}
	});

	Validation.add({className: 'IsEmpty',error: '', test: function(v) {
		return ((v == null) || (v.length == 0)); // || /^\s+$/.test(v));
	}});

	Validation.addAllThese(
		[
		 {
			 className: 'required',
			 error: 'This is a required field.',
			 test: function(v,elm) {
				Y.log("Validator(required) = "+ v);
				elm && Y.log(elm);
				return !Validation.getValidator('IsEmpty').test(v);
			}
		 },
		 {
			 className: 'validate-number',
			 error: 'Please enter a valid number in this field.',
			 test: function(v) {
				Y.log("Validator(validate-number) = "+ v);
				return Validation.getValidator('IsEmpty').test(v) || (!isNaN(v) && !/^\s+$/.test(v));
			}
		 },
		 {
			 className: 'validate-digits',
			 error: 'Please use numbers only in this field. please avoid spaces or other characters such as dots or commas.',
			 test: function(v) {
				return Validation.getValidator('IsEmpty').test(v) ||  !/[^\d]/.test(v);
			}
		 },
		 {
			 className: 'validate-alpha',
			 error: 'Please use letters only (a-z) in this field.',
			 test: function(v) {
				 return Validation.getValidator('IsEmpty').test(v) ||  /^[a-zA-Z]+$/.test(v);
			}
		 },
		 {
			 className: 'validate-alphanum',
			 error: 'Please use only letters (a-z) or numbers (0-9) only in this field. No spaces or other characters are allowed.',
			 test: function(v) {
				 return Validation.getValidator('IsEmpty').test(v) ||  !/\W/.test(v);
			}
		 },
		 {
			 className: 'validate-date',
			 error: 'Please enter a valid date.',
			 test: function(v) {
				if(Validation.getValidator('IsEmpty').test(v)) return true;
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
			}
		 },
		 {
			 className: 'validate-email',
			 error: 'Please enter a valid email address. For example fred@domain.com.',
			 test: function(v) {
				 return Validation.getValidator('IsEmpty').test(v) || /\w{1,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/.test(v);
			}
		 },
		 {
			 className: 'validate-url',
			 error: 'Please enter a valid URL.',
			 test: function(v) {
				 return Validation.getValidator('IsEmpty').test(v) || /^(http|https|ftp):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i.test(v);
			}
		 },
		 {
			 className: 'validate-date-au',
			 error: 'Please use this date format: mm/dd/yyyy. For example 03/17/2006 for the 17th of March, 2006.',
			 test: function(v) {
				if(Validation.getValidator('IsEmpty').test(v)) return true;
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
			}
		 },
		 {
			 className: 'validate-currency-dollar',
			 error: 'Please enter a valid $ amount. For example $100.00 .',
			 test: function(v) {
				// [$]1[##][,###]+[.##]
				// [$]1###+[.##]
				// [$]0.##
				// [$].##
				return Validation.getValidator('IsEmpty').test(v) ||  /^\$?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/.test(v);
			}
		 },
		 {
			 className: 'validate-selection',
			 error: 'Please make a selection',
			 test: function(v,elm) {
				return elm.get('options') ? elm.get('selectedIndex') > 0 : !Validation.getValidator('IsEmpty').test(v);
			}
		 },
		 {
			 className: 'validate-one-required',
			 error: 'Please select one of the above options.',
			 test: function(v,elm) {
				var p = elm.ancestor(elm.getData('validation-parent'));
				var options = p.all('input');
				return Validation._any(options,function(oEl,a,b){
					return Y.Form.Element.getValue(oEl);
				});
			}
		 },
		 {
			 className: 'validate-regex',
			 error: 'Please enter a valid value',
			 test: function(v) {
				var r = RegExp(elm.getAttribute('regex'));
				return Validation.getValidator('IsEmpty').test(v) || (r && v.match(r));
			}
		 },
		 {
			 className: 'validate-equalto',
			 error: 'Please enter a valid value',
			 test: function(v) {
				 Y.log('validate: validate-equalto');
				 var otherEl = Dom.get(elm.getAttribute('data-validation-equalto'));
				return Validation.getValidator('IsEmpty').test(v) || (otherEl && otherEl.value == v);
			}
		 },
		]
	);
	Y.Validation = Validation;
},'1.0.1',{requires:['base','node','event','array-extras','form']});