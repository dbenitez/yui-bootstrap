!function(){
	var Dom = YAHOO.util.Dom,
		Event = YAHOO.util.Event,
		Selector = YAHOO.util.Selector,
		Lang = YAHOO.lang,
		DPGlobal = {};

	YAHOO.namespace('bootstrap.Datepicker');

	var Datepicker = function(element,options) {
		options = options || {};
		this.element = Dom.get(element);
		this.format = DPGlobal.parseFormat(options.format || Dom.getData(this.element,'date-format') || 'mm/dd/yyyy');
		this.hideAction = options.hideAction || Dom.getData(this.element,'hide-action') || 'select';
		var oTmp = document.createElement('div');
		oTmp.innerHTML = DPGlobal.template;
		this.picker = Dom.getFirstChild(oTmp);
		document.body.appendChild(this.picker);
		Event.on(this.picker,'click',this.click,this,true);
		Event.on(this.picker,'mousedown',this.mousedown,this,true);
		this.isInput = (this.element.tagName == 'INPUT') ? true : false;
		this.component = Dom.hasClass(this.element,'date') ? Dom.getElementsByClassName(/(add-on|btn)/,null,this.element) : false;
		if(Lang.isArray(this.component)) this.component = this.component[this.component.length-1];

		if(this.isInput) {
			Event.on(this.element,'focus',this.show,this,true);
			Event.on(this.element,'blur',this.hide,this,true);
			Event.on(this.element,'keyup',this.update,this,true);
		} else {
			if(this.component) {
				Event.on(this.component,'click',this.show,this,true);
			} else {
				Event.on(this.element,'click',this.show,this,true);
			}
		}
		this.minViewMode = options.minViewMode || Dom.getData(this.element,'date-minviewmode') || 0;
		if(typeof this.minViewMode === 'string') {
			switch (this.minViewMode) {
			case 'months':
				this.minViewMode = 1;
				break;
			case 'years':
				this.minViewMode = 2;
				break;
			default:
				this.minViewMode = 3;
				break;
			};
		}
		this.viewMode = options.viewMode || Dom.getData(this.element,'date-viewmode') || 0;
		if(typeof this.viewMode === 'string') {
			switch (this.viewMode) {
			case 'months':
				this.viewMode = 1;
				break;
			case 'years':
				this.viewMode = 2;
				break;
			default:
				this.viewMode = 3;
				break;
			};
		}
		this.startViewMode = this.viewMode;
		this.weekStart = options.weekStart || Dom.getData(this.element,'date-weekstart') || 0;
		this.weekEnd = this.weekStart === 0 ? 6 : this.weekStart - 1;
		this.fillDow();
		this.fillMonths();
		this.update();
		this.showMode();
		return this;
	};
	Datepicker.prototype = {
		constructor: Datepicker,
		show: function(e){
			Dom.setStyle(this.picker,'display','block');
			this.height = this.component ? this.component.offsetHeight : this.element.offsetHeight;
			this.place();
			Event.on(window,'resize',this.place,this,true);
			if(e) {
				Event.stopPropagation(e);
				Event.preventDefault(e);
			}
			if(!this.isInput) {
				Event.on(document,'mousedown',this.hide,this,true);
			}
			this.fireEvent('show',{date: this.date});
		},
		hide: function(){
			Dom.setStyle(this.picker,'display','none');
			Event.removeListener(window,'resize',this.place);
			this.viewMode = this.startViewMode;
			this.showMode();
			if (!this.isInput) {
				Event.removeListener(document,'mousedown', this.hide);
			}
			this.set();
			this.fireEvent('hide',{date: this.date});
		},
		set: function(){
			var formated = DPGlobal.formatDate(this.date, this.format);
			if(!this.isInput) {
				if (this.component) {
					Dom.setAttribute(Selector.query('input',this.element),'value',formated);
				}
				Dom.setData(this.element,'date',formated);
			} else {
				Dom.setAttribute(this.element,'value',formated);
			};
		},
		setValue: function(){
			if(typeof newDate === 'string') {
				this.date = DPGlobal.parseDate(newDate, this.format);
			} else {
				this.date = new Date(newDate);
			}
			this.set();
			this.viewDate = new Date(this.date.getFullYear(), this.date.getMonth(),1,0,0,0,0);
			this.fill();
		},
		place: function(){
			var offset = this.component ? Dom.getRegion(this.component) : Dom.getRegion(this.element);
			Dom.setStyle(this.picker,'top',(offset.top+this.height)+"px");
			Dom.setStyle(this.picker,'left',offset.left+"px");
		},
		update:function(newDate){
			this.date = DPGlobal.parseDate(
				typeof newDate === 'string' ? newDate : (this.isInput ? Dom.getAttribute(this.element,'value') : Dom.getData(this.element,'date')),
				this.format
			);
			this.viewDate = new Date(this.date.getFullYear(), this.date.getMonth(), 1, 0, 0, 0, 0);
			this.fill();
		},
		fillDow: function(){
			var dowCnt = this.weekStart;
			var html = '<tr>';
			while (dowCnt < this.weekStart + 7) {
				html += '<th class="dow">'+DPGlobal.dates.daysMin[(dowCnt++)%7]+'</th>';
			}
			html += '</tr>';
			Selector.query('.datepicker-days thead',this.picker,true).innerHTML += html;
		},
		fillMonths: function(){
			var html = '';
			var i = 0;
			while (i < 12) {
				html += '<span class="month">'+DPGlobal.dates.monthsShort[i++]+'</span>';
			}
			Selector.query('.datepicker-months td',this.picker,true).innerHTML += html;
		},
		fill: function(){
			var d = new Date(this.viewDate),
				year = d.getFullYear(),
				month = d.getMonth(),
				currentDate = this.date.valueOf();

			Selector.query('.datepicker-days th',this.picker)[1].innerHTML = DPGlobal.dates.months[month]+' '+year;

			var prevMonth = new Date(year, month-1, 28,0,0,0,0),
				day = DPGlobal.getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());
			prevMonth.setDate(day);
			prevMonth.setDate(day - (prevMonth.getDay() - this.weekStart + 7)%7);
			var nextMonth = new Date(prevMonth);
			nextMonth.setDate(nextMonth.getDate() + 42);
			nextMonth = nextMonth.valueOf();
			html = [];
			var clsName;
			while(prevMonth.valueOf() < nextMonth) {
				if(prevMonth.getDay() === this.weekStart) {
					html.push('<tr>');
				};
				clsName = '';
				if (prevMonth.getFullYear() <= year && prevMonth.getMonth() < month) {
					clsName += ' old';
				} else if (prevMonth.getFullYear() > year || prevMonth.getMonth() > month) {
					clsName += ' new';
				}
				if (prevMonth.valueOf() === currentDate) {
					clsName += ' active';
				};
				html.push('<td class="day'+clsName+'">'+prevMonth.getDate() + '</td>');
				if (prevMonth.getDay() === this.weekEnd) {
					html.push('</tr>');
				}
				prevMonth.setDate(prevMonth.getDate()+1);
			};
			Selector.query('.datepicker-days tbody',this.picker,true).innerHTML = html.join('');
			var currentYear = this.date.getFullYear();

			var dpMonths = Selector.query('.datepicker-months',this.picker,true);
			dpMonths.getElementsByTagName('th')[1].innerHTML = year;
			var months = dpMonths.getElementsByTagName('span');
			Dom.removeClass(months,'active');
			if(currentYear === year) {
				Dom.addClass(months[this.date.getMonth()],'active');
			}

			html = '';
			year = parseInt(year/10, 10) * 10;
			var dpYears = Selector.query('.datepicker-years',this.picker,true);
			dpYears.getElementsByTagName('th')[1].innerHTML = year + '-' + (year + 9);
			var yearCont = dpYears.getElementsByTagName('td');
			year -= 1;
			for (var i = -1; i < 11; i++) {
				html += '<span class="year'+(i === -1 || i === 10 ? ' old' : '')+(currentYear === year ? ' active' : '')+'">'+year+'</span>';
				year += 1;
			}
			yearCont[0].innerHTML = html;
		},
		click: function(e){
			Event.stopPropagation(e);
			Event.preventDefault(e);
			var rgxTarget = /(SPAN|TD|TH)/;
			var target = rgxTarget.test(e.target.tagName.toUpperCase()) ? e.target : Dom.getAncestorBy(e.target,function(el){
				return  el.tagName && el.tagName.toUpperCase().match(rgxTarget);
			});
			if(target) {
				switch(target.nodeName.toLowerCase()) {
				case 'th':
					switch(target.className) {
					case 'switch':
						this.showMode(1);
						break;
					case 'prev':
					case 'next':
						this.viewDate['set'+DPGlobal.modes[this.viewMode].navFnc].call(
								this.viewDate,
								this.viewDate['get'+DPGlobal.modes[this.viewMode].navFnc].call(this.viewDate) +
								DPGlobal.modes[this.viewMode].navStep * (target.className === 'prev' ? -1 : 1)
						);
						this.fill();
						this.set();
						break;
					}
					break;
				case 'span':
					if(Dom.hasClass(target,'month')) {
						var nodes = target.parentNode.getElementsByTagName('span');
						var aSpan = [];
						for(var i = 0, len = nodes.length; i<len;i++) {aSpan.push(nodes[i]);};
						var month = Dom.index(target, aSpan);
						this.viewDate.setMonth(month);
					} else {
						var year = parseInt(target.innerHTML, 10)||0;
						this.viewDate.setFullYear(year);
					}
					if(this.viewMode !== 0){
						this.date = new Date(this.viewDate);
						this.fireEvent('changeDate',{date: this.date, viewMode: DPGlobal.modes[this.viewMode].clsName});
					}
					this.showMode(-1);
					this.fill();
					this.set();
					break;
				case 'td':
					if (Dom.hasClass(target,'day')){
						var day = parseInt(target.innerHTML, 10)||1;
						var month = this.viewDate.getMonth();
						if(Dom.hasClass(target,'old')) {
							month -= 1;
						} else if(Dom.hasClass(target,'new')) {
							month += 1;
						}
						var year = this.viewDate.getFullYear();
						this.date = new Date(year, month, day, 0,0,0,0);
						this.viewDate = new Date(year, month, Math.min(28, day),0,0,0,0);
						this.fill();
						this.set();
						if(this.hideAction == 'select') this.hide();
						this.fireEvent('changeDate',{date: this.date, viewMode: DPGlobal.modes[this.viewMode].clsName});
					}
					break;
				};
			}
		},
		mousedown: function(e){
			Event.stopPropagation(e);
			Event.preventDefault(e);
		},
		showMode: function(dir){
			if(dir) {
				this.viewMode = Math.max(this.minViewMode, Math.min(2, this.viewMode + dir));
			}
			var allDivs = Selector.query('>div',this.picker);
			Dom.setStyle(allDivs,'display','none');
			Dom.setStyle(Selector.filter(allDivs,'.datepicker-'+DPGlobal.modes[this.viewMode].clsName),'display','block');
		}
	};
	Lang.augmentProto(Datepicker, YAHOO.util.EventProvider);
	YAHOO.bootstrap.Datepicker = Datepicker;

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
		dates:{
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
			var date = new Array();
			for (var i=0, cnt = format.parts.length; i < cnt; i++) {
				date.push(val[format.parts[i]]);
			}
			return date.join(format.separator);
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
}();