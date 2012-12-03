YUI().add('datepicker',function(Y){
	var DPGlobal = {}
	  , Datepicker = {};
	Datepicker = function(config) {
		Datepicker.superclass.constructor.apply(this, arguments);
	};
	Datepicker.NAME = 'datepicker';
	Datepicker.ATTRS = {
			srcNode: {
				setter: function(node){
					return Y.one(node);
				}
			},
			format: {
				value: null/*{separator: ['/'], parts: ["mm","dd","yyyy"]}*/,
				setter: function(val){
					val =  val || this.get('srcNode').getData('date-format') || 'mm/dd/yyyy';
					return DPGlobal.parseFormat(val);
				}
			},
			isInput: {},
			component: {},
			minViewMode: {
				value: 0,
				setter: function(val) {
					if(typeof val === 'string') {
						switch (val) {
							case 'months':
								val = 1;
								break;
							case 'years':
								val = 2;
								break;
							default:
								val = 0;
								break;
						}
					}
					return val;
				}
			},
			viewMode: {
				value: 0,
				setter: function(val) {
					if(typeof val === 'string') {
						switch (val) {
							case 'months':
								val = 1;
								break;
							case 'years':
								val = 2;
								break;
							default:
								val = 0;
								break;
						}
					}
					return val;
				}
			},
			startViewMode: {},
			date: {},
			viewDate: {},
			height: {value: 0}
	};
	Y.extend(Datepicker, Y.Base, {
		constructor: Datepicker,
		initializer: function(cfg){
			var isInput
			  , component
			  , minViewMode
			  , viewMode;
			var srcNode = this.get('srcNode');
			//this.set('format','mm-dd-yyyy');
			this.picker = Y.Node.create(DPGlobal.template).appendTo(document.body);
			this.picker.on('click',this.click,this);
			this.picker.on('mousedown',this.mousedown,this);

			isInput = srcNode.get('tagName') == 'INPUT' ? true : false;
			this.set('isInput',isInput);
			component = srcNode.hasClass('date') ? srcNode.one('.add-on') : false;
			this.set('component',component);

			if(isInput) {
				srcNode.on('focus', this.show, this);
				srcNode.on('blur', this.hide, this);
				srcNode.on('keyup', this.update, this);
			} else {
				if(component) {
					component.on('click', this.show, this);
				} else {
					srcNode.on('click', this.show, this);
				}
			}
			minViewMode = cfg.minViewMode || srcNode.getData('date-minviewmode') || 0;
			this.set('minViewMode', minViewMode);
			viewMode = cfg.viewMode || srcNode.getData('date-viewmode') || 0;
			this.set('viewMode',viewMode);
			this.set('startViewMode',viewMode);
			weekStart = cfg.weekStart || srcNode.getData('date-weekstart') || 0;
			this.set('weekStart',weekStart);
			this.set('weekEnd', weekStart === 0 ? 6 : weekStart - 1);
			this.fillDow();
			this.fillMonths();
			this.update();
			this.showMode();
		},
		show: function(e){
			var srcNode = this.get('srcNode')
			  , component = this.get('component')
			  , isInput = this.get('isInput')
			  , date = this.get('date');
			this.picker.show();
			this.picker.setStyle('display','block');
			this.set('height', component ? component.get('offsetHeight') : srcNode.get('offsetHeight'));
			this.place();
			Y.one(window).on('resize', this.place, this);
			if(e){
				e.stopPropagation();
				e.preventDefault();
			}
			if(!isInput) {
				Y.one(document).on('mousedown', this.hide, this);
			}
			srcNode.fire('show',{date: date});
		},
		hide: function(){
			this.picker.hide();
			Y.one(window).detach('resize', this.place);
			this.set('viewMode', this.get('startViewMode'));
			this.showMode();
			if(!this.get('isInput')) {
				Y.one(document).detach('mousedown',this.hide);
			}
			this.setValues();
			this.get('srcNode').fire('hide',{date: this.get('date')});
		},
		setValues: function() {
			var srcNode = this.get('srcNode');
			var formated = DPGlobal.formatDate(this.get('date'), this.get('format'));
			if(!this.get('isInput')) {
				if(this.get('component')) {
					srcNode.all('input').set('value',formated);
				}
				srcNode.setData('date', formated);
			} else {
				srcNode.set('value',formated);
			}
		},
		setValue: function(newDate) {
			var date;
			if(typeof newDate === 'string') {
				date = DPGlobal.parseDate(newDate, this.get('format'));
			} else {
				date = new Date(newDate);
			}
			this.set('date',date);
			this.set('viewDate', new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0));
			this.fill();
		},
		place: function(){
			var component = this.get('component')
			  , srcNode = this.get('srcNode')
			  , offset = component ? component.getXY() : srcNode.getXY();
			iTop = offset[1]+this.get('height');
			this.picker.setStyle('top',iTop);
			this.picker.setStyle('left',offset[0]);
		},
		update: function(newDate) {
			var srcNode = this.get('srcNode');
			var date = DPGlobal.parseDate(
				typeof newDate === 'string' ? newDate : (this.get('isInput') ? srcNode.getAttribute('value') : srcNode.getData('date')),
				this.get('format')
			);
			this.set('date', date);
			this.set('viewDate', new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0));
			this.fill();
		},
		fillDow: function(){
			var dowCnt = this.get('weekStart');
			var weekStart = this.get('weekStart');
			var html = '<tr>';
			while(dowCnt < weekStart + 7) {
				html += '<th class="dow">'+DPGlobal.dates.daysMin[(dowCnt++)%7]+'</th>';
			}
			html += '</tr>';
			this.picker.one('.datepicker-days thead').append(html);
		},
		fillMonths: function(){
			var html = '';
			var i = 0;
			while(i < 12) {
				html += '<span class="month">'+DPGlobal.dates.monthsShort[i++]+'</span>';
			}
			this.picker.one('.datepicker-months td').append(html);
		},
		fill: function(){
			var d = new Date(this.get('viewDate'))
			  , year = d.getFullYear()
			  , month = d.getMonth()
			  , date = this.get('date')
			  , currentDate = date.valueOf()
			  , weekStart = this.get('weekStart')
			  , weekEnd = this.get('weekEnd');
			this.picker.all('.datepicker-days th').item(1)
						.set('text',DPGlobal.dates.months[month]+' '+year);
			var prevMonth = new Date(year, month-1, 28,0,0,0,0)
			  , day = DPGlobal.getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());
			prevMonth.setDate(day);
			prevMonth.setDate(day - (prevMonth.getDay() - weekStart + 7)%7);
			var nextMonth = new Date(prevMonth);
			nextMonth.setDate(nextMonth.getDate()+42);
			nextMonth = nextMonth.valueOf();
			html = [];
			var clsName;
			while(prevMonth.valueOf() < nextMonth) {
				if(prevMonth.getDay() === weekStart) {
					html.push('<tr>');
				}
				clsName = '';
				if(prevMonth.getMonth() < month) {
					clsName += ' old';
				} else if (prevMonth.getMonth() > month) {
					clsName += ' new';
				}
				if (prevMonth.valueOf() === currentDate) {
					clsName += ' active';
				}
				html.push('<td class="day'+clsName+'">'+prevMonth.getDate()+'</td>');
				if (prevMonth.getDay() === weekEnd) {
					html.push('</tr>');
				}
				prevMonth.setDate(prevMonth.getDate()+1);
			}
			this.picker.one('.datepicker-days tbody').empty().append(html.join(''));
			var currentYear = date.getFullYear();

			var dpMonths = this.picker.one('.datepicker-months');
			dpMonths.all('th').item(1).set('text',year);
			var months = dpMonths.all('span').removeClass('active');


			if (currentYear === year) {
				months.item(date.getMonth()).addClass('active');
			}

			html = '';
			year = parseInt(year/10, 10) * 10;
			var dpYears = this.picker.one('.datepicker-years');
			dpYears.all('th').item(1).set('text',(year + '-' + (year + 9)));
			var yearCont = dpYears.all('td');
			year -= 1;
			for (var i = -1; i < 11; i++) {
				html += '<span class="year'+(i === -1 || i === 10 ? ' old' : '')+(currentYear === year ? ' active' : '')+'">'+year+'</span>';
				year += 1;
			}
			yearCont.setHTML(html);
		},
		click: function(e) {
			e.stopPropagation();
			e.preventDefault();
			var target = e.target;
			if(target) {
				switch(target.get('nodeName').toLowerCase()) {
					case 'th':
						switch(target.get('className')) {
							case 'switch':
								this.showMode(1);
								break;
							case 'prev':
							case 'next':
								var viewDate = this.get('viewDate');
								var viewMode = this.get('viewMode');
								viewDate['set'+DPGlobal.modes[viewMode].navFnc].call(
										viewDate,
										viewDate['get'+DPGlobal.modes[viewMode].navFnc].call(viewDate)+
										DPGlobal.modes[viewMode].navStep * (target.get('className') === 'prev' ? -1 : 1)
								);
								this.fill();
								this.setValues();
								break;
						}
						break;
					case 'span':
						var viewDate = this.get('viewDate');
						var viewMode = this.get('viewMode');
						var srcNode = this.get('srcNode');
						if(target.hasClass('month')) {
							var month = target.ancestor().all('span').indexOf(target);
							viewDate.setMonth(month);
						} else {
							var year = parseInt(target.get('text'), 10) || 0;
							viewDate.setFullYear(year);
						}
						if(viewMode !== 0) {
							this.set('date', new Date(viewDate));
							var date = this.get('date');
							srcNode.fire(
									'changeDate',{
										date: date,
										viewMode: DPGlobal.modes[viewMode].clsName
									}
							);
						}
						this.showMode(-1);
						this.fill();
						this.setValues();
						break;
					case 'td':
						if(target.hasClass('day')){
							var viewDate = this.get('viewDate');
							var day = parseInt(target.get('text'), 10) || 1;
							var month = viewDate.getMonth();
							if(target.hasClass('old')) {
								month -= 1;
							} else if (target.hasClass('new')) {
								month += 1;
							};
							var year = viewDate.getFullYear();
							var date = new Date(year, month, day, 0,0,0,0);
							this.set('date',date);
							this.set('viewDate', new Date(year, month, Math.min(28, day),0,0,0,0));
							this.fill();
							this.setValues();
							this.get('srcNode').fire(
									'changeDate',{
										date: date,
										viewMode: DPGlobal.modes[this.get('viewMode')].clsName
									}
							);
						}
				}
			}
		},
		mousedown: function(e){
			e.stopPropagation();
			e.preventDefault();
		},
		showMode: function(dir) {
			if (dir) {
				this.set('viewMode', Math.max(this.get('minViewMode'), Math.min(2, this.get('viewMode') + dir)));
			}
			this.picker.all('>div').hide().filter('.datepicker-'+DPGlobal.modes[this.get('viewMode')].clsName).setStyle('display','block');
		}
	});

	var plugin = function(option, val) {
		var $this = Y.one(this),
			data = $this.getData('datepicker'),
			options = typeof option === 'object' && option;
		if(!data) {
			$this.setData('datepicker', (data = new Datepicker(Y.merge({srcNode: this}, options || {}))));
		}
		if(typeof option === 'string') data[option](val);
		return data;
	};

	Y.Node.prototype.datepicker = plugin;
	Y.NodeList.prototype.datepicker = function(option, val) {
		var locPlugin = function(){
			plugin.call(this, option, val);
		};
		return this.each(locPlugin);
	};

	DPGlobal = {
			modes: [
				{
					clsName: 'days',
					navFnc: 'Month',
					navStep: 1
				},
				{
					clsName: 'months',
					navFnc: 'FullYear',
					navStep: 1
				},
				{
					clsName: 'years',
					navFnc: 'FullYear',
					navStep: 10
			}],
			dates: {
				days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
				daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
				daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
				months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
				monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
			},
			isLeapYear: function (year) {
				return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
			},
			getDaysInMonth: function (year, month) {
				return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
			},
			parseFormat: function(format){
				var separator = format.match(/[.\/\-\s].*?/),
					parts = format.split(/\W+/);
				if (!separator || !parts || parts.length === 0){
					throw new Error("Invalid date format.");
				}
				return {separator: separator, parts: parts};
			},
			parseDate: function(date, format) {
				var parts = date.split(format.separator),
					date = new Date(),
					val;
				date.setHours(0);
				date.setMinutes(0);
				date.setSeconds(0);
				date.setMilliseconds(0);
				if (parts.length === format.parts.length) {
					for (var i=0, cnt = format.parts.length; i < cnt; i++) {
						val = parseInt(parts[i], 10)||1;
						switch(format.parts[i]) {
							case 'dd':
							case 'd':
								date.setDate(val);
								break;
							case 'mm':
							case 'm':
								date.setMonth(val - 1);
								break;
							case 'yy':
								date.setFullYear(2000 + val);
								break;
							case 'yyyy':
								date.setFullYear(val);
								break;
						}
					}
				}
				return date;
			},
			formatDate: function(date, format){
				var val = {
					d: date.getDate(),
					m: date.getMonth() + 1,
					yy: date.getFullYear().toString().substring(2),
					yyyy: date.getFullYear()
				};
				val.dd = (val.d < 10 ? '0' : '') + val.d;
				val.mm = (val.m < 10 ? '0' : '') + val.m;
				var aDate = [];
				for (var i=0, cnt = format.parts.length; i < cnt; i++) {
					aDate.push(val[format.parts[i]]);
				}
				return aDate.join(format.separator);
			},
			headTemplate: '<thead>'+
								'<tr>'+
									'<th class="prev">&lsaquo;</th>'+
									'<th colspan="5" class="switch"></th>'+
									'<th class="next">&rsaquo;</th>'+
								'</tr>'+
							'</thead>',
			contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>'
	};
	DPGlobal.template = '<div class="datepicker dropdown-menu">'+
							'<div class="datepicker-days">'+
								'<table class=" table-condensed">'+
									DPGlobal.headTemplate+
									'<tbody></tbody>'+
								'</table>'+
							'</div>'+
							'<div class="datepicker-months">'+
								'<table class="table-condensed">'+
									DPGlobal.headTemplate+
									DPGlobal.contTemplate+
								'</table>'+
							'</div>'+
							'<div class="datepicker-years">'+
								'<table class="table-condensed">'+
									DPGlobal.headTemplate+
									DPGlobal.contTemplate+
								'</table>'+
							'</div>'+
						'</div>';
},'1.0.1',{requires:['base','node','event']});