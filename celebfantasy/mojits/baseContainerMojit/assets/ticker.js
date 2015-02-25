/*
    jQuery News Ticker is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, version 2 of the License.
 
    jQuery News Ticker is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with jQuery News Ticker.  If not, see <http://www.gnu.org/licenses/>.
*/
(function($){  
	$.fn.ticker = function(options) { 
		// Extend our default options with those provided.
		// Note that the first arg to extend is an empty object -
		// this is to keep from overriding our "defaults" object.
		var opts = $.extend({}, $.fn.ticker.defaults, options); 

		// check that the passed element is actually in the DOM
		if ($(this).length == 0) {
			if (window.console && window.console.log) {
				window.console.log('Element does not exist in DOM!');
			}
			else {
				alert('Element does not exist in DOM!');		
			}
			return false;
		}
		
		/* Get the id of the UL to get our news content from */
		var newsID = '#' + $(this).attr('id');

		/* Get the tag type - we will check this later to makde sure it is a UL tag */
		var tagType = $(this).get(0).tagName; 	

		return this.each(function() { 
			// get a unique id for this ticker
			var uniqID = getUniqID();
			
			/* Internal vars */
			var settings = {				
				position: 0,
				time: 0,
				distance: 0,
				newsArr: {},
				play: true,
				paused: false,
				contentLoaded: false,
				dom: {
					contentID: '#ticker-content-' + uniqID,
					titleID: '#ticker-title-' + uniqID,
					titleElem: '#ticker-title-' + uniqID + ' SPAN',
					tickerID : '#ticker-' + uniqID,
					wrapperID: '#ticker-wrapper-' + uniqID,
					revealID: '#ticker-swipe-' + uniqID,
					revealElem: '#ticker-swipe-' + uniqID + ' SPAN',
					controlsID: '#ticker-controls-' + uniqID,
					prevID: '#prev-' + uniqID,
					nextID: '#next-' + uniqID,
					playPauseID: '#play-pause-' + uniqID
				}
			};

			// if we are not using a UL, display an error message and stop any further execution
			if (tagType != 'UL' && tagType != 'OL' && opts.htmlFeed === true) {
				debugError('Cannot use <' + tagType.toLowerCase() + '> type of element for this plugin - must of type <ul> or <ol>');
				return false;
			}

			// set the ticker direction
			opts.direction == 'rtl' ? opts.direction = 'right' : opts.direction = 'left';
			
			// lets go...
			initialisePage();
			/* Function to get the size of an Object*/
			function countSize(obj) {
			    var size = 0, key;
			    for (key in obj) {
			        if (obj.hasOwnProperty(key)) size++;
			    }
			    return size;
			};

			function getUniqID() {
				var newDate = new Date;
				return newDate.getTime();			
			}
			
			/* Function for handling debug and error messages */ 
			function debugError(obj) {
				if (opts.debugMode) {
					if (window.console && window.console.log) {
						window.console.log(obj);
					}
					else {
						alert(obj);			
					}
				}
			}

			/* Function to setup the page */
			function initialisePage() {
				// process the content for this ticker
				processContent();
				
				// add our HTML structure for the ticker to the DOM
				$(newsID).wrap('<div id="' + settings.dom.wrapperID.replace('#', '') + '"></div>');
				
				// remove any current content inside this ticker
				$(settings.dom.wrapperID).children().remove();
				
				$(settings.dom.wrapperID).append('<div id="' + settings.dom.tickerID.replace('#', '') + '" class="ticker"><div id="' + settings.dom.titleID.replace('#', '') + '" class="ticker-title"><span><!-- --></span></div><p id="' + settings.dom.contentID.replace('#', '') + '" class="ticker-content"></p><div id="' + settings.dom.revealID.replace('#', '') + '" class="ticker-swipe"><span><!-- --></span></div></div>');
				$(settings.dom.wrapperID).removeClass('no-js').addClass('ticker-wrapper has-js ' + opts.direction);
				// hide the ticker
				$(settings.dom.tickerElem + ',' + settings.dom.contentID).hide();
				// add the controls to the DOM if required
				if (opts.controls) {
					// add related events - set functions to run on given event
					$(settings.dom.controlsID).live('click mouseover mousedown mouseout mouseup', function (e) {
						var button = e.target.id;
						if (e.type == 'click') {	
							switch (button) {
								case settings.dom.prevID.replace('#', ''):
									// show previous item
									settings.paused = true;
									$(settings.dom.playPauseID).addClass('paused');
									manualChangeContent('prev');
									break;
								case settings.dom.nextID.replace('#', ''):
									// show next item
									settings.paused = true;
									$(settings.dom.playPauseID).addClass('paused');
									manualChangeContent('next');
									break;
								case settings.dom.playPauseID.replace('#', ''):
									// play or pause the ticker
									if (settings.play == true) {
										settings.paused = true;
										$(settings.dom.playPauseID).addClass('paused');
										pauseTicker();
									}
									else {
										settings.paused = false;
										$(settings.dom.playPauseID).removeClass('paused');
										restartTicker();
									}
									break;
							}	
						}
						else if (e.type == 'mouseover' && $('#' + button).hasClass('controls')) {
							$('#' + button).addClass('over');
						}
						else if (e.type == 'mousedown' && $('#' + button).hasClass('controls')) {
							$('#' + button).addClass('down');
						}
						else if (e.type == 'mouseup' && $('#' + button).hasClass('controls')) {
							$('#' + button).removeClass('down');
						}
						else if (e.type == 'mouseout' && $('#' + button).hasClass('controls')) {
							$('#' + button).removeClass('over');
						}
					});
					// add controls HTML to DOM
					$(settings.dom.wrapperID).append('<ul id="' + settings.dom.controlsID.replace('#', '') + '" class="ticker-controls"><li id="' + settings.dom.playPauseID.replace('#', '') + '" class="jnt-play-pause controls"><a href=""><!-- --></a></li><li id="' + settings.dom.prevID.replace('#', '') + '" class="jnt-prev controls"><a href=""><!-- --></a></li><li id="' + settings.dom.nextID.replace('#', '') + '" class="jnt-next controls"><a href=""><!-- --></a></li></ul>');
				}
				if (opts.displayType != 'fade') {
                	// add mouse over on the content
               		$(settings.dom.contentID).mouseover(function () {
               			if (settings.paused == false) {
               				pauseTicker();
               			}
               		}).mouseout(function () {
               			if (settings.paused == false) {
               				restartTicker();
               			}
               		});
				}
				// we may have to wait for the ajax call to finish here
				if (!opts.ajaxFeed) {
					setupContentAndTriggerDisplay();
				}
			}

			/* Start to process the content for this ticker */
			function processContent() {
				// check to see if we need to load content
				if (settings.contentLoaded == false) {
					// construct content
					if (opts.ajaxFeed) {
						if (opts.feedType == 'xml') {							
							$.ajax({
								url: opts.feedUrl,
								cache: false,
								dataType: opts.feedType,
								async: true,
								success: function(data){
									count = 0;	
									// get the 'root' node
									for (var a = 0; a < data.childNodes.length; a++) {
										if (data.childNodes[a].nodeName == 'rss') {
											xmlContent = data.childNodes[a];
										}
									}
									// find the channel node
									for (var i = 0; i < xmlContent.childNodes.length; i++) {
										if (xmlContent.childNodes[i].nodeName == 'channel') {
											xmlChannel = xmlContent.childNodes[i];
										}		
									}
									// for each item create a link and add the article title as the link text
									for (var x = 0; x < xmlChannel.childNodes.length; x++) {
										if (xmlChannel.childNodes[x].nodeName == 'item') {
											xmlItems = xmlChannel.childNodes[x];
											var title, link = false;
											for (var y = 0; y < xmlItems.childNodes.length; y++) {
												if (xmlItems.childNodes[y].nodeName == 'title') {      												    
													title = xmlItems.childNodes[y].lastChild.nodeValue;
												}
												else if (xmlItems.childNodes[y].nodeName == 'link') {												    
													link = xmlItems.childNodes[y].lastChild.nodeValue; 
												}
												if ((title !== false && title != '') && link !== false) {
												    settings.newsArr['item-' + count] = { type: opts.titleText, content: '<a href="' + link + '">' + title + '</a>' };												    count++;												    title = false;												    link = false;
												}
											}	
										}		
									}			
									// quick check here to see if we actually have any content - log error if not
									if (countSize(settings.newsArr < 1)) {
										debugError('Couldn\'t find any content from the XML feed for the ticker to use!');
										return false;
									}
									settings.contentLoaded = true;
									setupContentAndTriggerDisplay();
								}
							});							
						}
						else {
							debugError('Code Me!');	
						}						
					}
					else if (opts.htmlFeed) { 
						if($(newsID + ' LI').length > 0) {
							$(newsID + ' LI').each(function (i) {
								// maybe this could be one whole object and not an array of objects?
								settings.newsArr['item-' + i] = { type: opts.titleText, content: $(this).html()};
							});		
						}	
						else {
							debugError('Couldn\'t find HTML any content for the ticker to use!');
							return false;
						}
					}
					else {
						debugError('The ticker is set to not use any types of content! Check the settings for the ticker.');
						return false;
					}					
				}			
			}

			function setupContentAndTriggerDisplay() {

				settings.contentLoaded = true;

				// update the ticker content with the correct item
				// insert news content into DOM
				$(settings.dom.titleElem).html(settings.newsArr['item-' + settings.position].type);
				$(settings.dom.contentID).html(settings.newsArr['item-' + settings.position].content);

				// set the next content item to be used - loop round if we are at the end of the content
				if (settings.position == (countSize(settings.newsArr) -1)) {
					settings.position = 0;
				}
				else {		
					settings.position++;
				}			

				// get the values of content and set the time of the reveal (so all reveals have the same speed regardless of content size)
				distance = $(settings.dom.contentID).width();
				time = distance / opts.speed;

				// start the ticker animation						
				revealContent();		
			}

			// slide back cover or fade in content
			function revealContent() {
				$(settings.dom.contentID).css('opacity', '1');
				if(settings.play) {	
					// get the width of the title element to offset the content and reveal	
					var offset = $(settings.dom.titleID).width() + 20;
	
					$(settings.dom.revealID).css(opts.direction, offset + 'px');
					// show the reveal element and start the animation
					if (opts.displayType == 'fade') {
						// fade in effect ticker
						$(settings.dom.revealID).hide(0, function () {
							$(settings.dom.contentID).css(opts.direction, offset + 'px').fadeIn(opts.fadeInSpeed, postReveal);
						});						
					}
					else if (opts.displayType == 'scroll') {
						// to code
					}
					else {
						// default bbc scroll effect
						$(settings.dom.revealElem).show(0, function () {
							$(settings.dom.contentID).css(opts.direction, offset + 'px').show();
							// set our animation direction
							animationAction = opts.direction == 'right' ? { marginRight: distance + 'px'} : { marginLeft: distance + 'px' };
							$(settings.dom.revealID).css('margin-' + opts.direction, '0px').delay(20).animate(animationAction, time, 'linear', postReveal);
						});		
					}
				}
				else {
					return false;					
				}
			};

			// here we hide the current content and reset the ticker elements to a default state ready for the next ticker item
			function postReveal() {				
				if(settings.play) {		
					// we have to separately fade the content out here to get around an IE bug - needs further investigation
					$(settings.dom.contentID).delay(opts.pauseOnItems).fadeOut(opts.fadeOutSpeed);
					// deal with the rest of the content, prepare the DOM and trigger the next ticker
					if (opts.displayType == 'fade') {
						$(settings.dom.contentID).fadeOut(opts.fadeOutSpeed, function () {
							$(settings.dom.wrapperID)
								.find(settings.dom.revealElem + ',' + settings.dom.contentID)
									.hide()
								.end().find(settings.dom.tickerID + ',' + settings.dom.revealID)
									.show()
								.end().find(settings.dom.tickerID + ',' + settings.dom.revealID)
									.removeAttr('style');								
							setupContentAndTriggerDisplay();						
						});
					}
					else {
						$(settings.dom.revealID).hide(0, function () {
							$(settings.dom.contentID).fadeOut(opts.fadeOutSpeed, function () {
								$(settings.dom.wrapperID)
									.find(settings.dom.revealElem + ',' + settings.dom.contentID)
										.hide()
									.end().find(settings.dom.tickerID + ',' + settings.dom.revealID)
										.show()
									.end().find(settings.dom.tickerID + ',' + settings.dom.revealID)
										.removeAttr('style');								
								setupContentAndTriggerDisplay();						
							});
						});	
					}
				}
				else {
					$(settings.dom.revealElem).hide();
				}
			}

			// pause ticker
			function pauseTicker() {				
				settings.play = false;
				// stop animation and show content - must pass "true, true" to the stop function, or we can get some funky behaviour
				$(settings.dom.tickerID + ',' + settings.dom.revealID + ',' + settings.dom.titleID + ',' + settings.dom.titleElem + ',' + settings.dom.revealElem + ',' + settings.dom.contentID).stop(true, true);
				$(settings.dom.revealID + ',' + settings.dom.revealElem).hide();
				$(settings.dom.wrapperID)
					.find(settings.dom.titleID + ',' + settings.dom.titleElem).show()
						.end().find(settings.dom.contentID).show();
			}

			// play ticker
			function restartTicker() {				
				settings.play = true;
				settings.paused = false;
				// start the ticker again
				postReveal();	
			}

			// change the content on user input
			function manualChangeContent(direction) {
				pauseTicker();
				switch (direction) {
					case 'prev':
						if (settings.position == 0) {
							settings.position = countSize(settings.newsArr) -2;
						}
						else if (settings.position == 1) {
							settings.position = countSize(settings.newsArr) -1;
						}
						else {
							settings.position = settings.position - 2;
						}
						$(settings.dom.titleElem).html(settings.newsArr['item-' + settings.position].type);
						$(settings.dom.contentID).html(settings.newsArr['item-' + settings.position].content);						
						break;
					case 'next':
						$(settings.dom.titleElem).html(settings.newsArr['item-' + settings.position].type);
						$(settings.dom.contentID).html(settings.newsArr['item-' + settings.position].content);
						break;
				}
				// set the next content item to be used - loop round if we are at the end of the content
				if (settings.position == (countSize(settings.newsArr) -1)) {
					settings.position = 0;
				}
				else {		
					settings.position++;
				}	
			}
		});  
	};  

	// plugin defaults - added as a property on our plugin function
	$.fn.ticker.defaults = {
		speed: 0.10,			
		ajaxFeed: false,
		feedUrl: '',
		feedType: 'xml',
		displayType: 'reveal',
		htmlFeed: true,
		debugMode: true,
		controls: true,
		titleText: 'Latest',	
		direction: 'ltr',	
		pauseOnItems: 3000,
		fadeInSpeed: 600,
		fadeOutSpeed: 300
	};	
})(jQuery);

(function(a){a.jqx=a.jqx||{};a.jqx.define=function(b,c,d){b[c]=function(){if(this.baseType){this.base=new b[this.baseType]();this.base.defineInstance()}this.defineInstance()};b[c].prototype.defineInstance=function(){};b[c].prototype.base=null;b[c].prototype.baseType=undefined;if(d&&b[d]){b[c].prototype.baseType=d}};a.jqx.invoke=function(e,d){if(d.length==0){return}var f=typeof(d)==Array||d.length>0?d[0]:d;var c=typeof(d)==Array||d.length>1?Array.prototype.slice.call(d,1):a({}).toArray();while(e[f]==undefined&&e.base!=null){e=e.base}if(e[f]!=undefined&&a.isFunction(e[f])){return e[f].apply(e,c)}if(typeof f=="string"){var b=f.toLowerCase();return e[b].apply(e,c)}return};a.jqx.hasFunction=function(e,d){if(d.length==0){return false}if(e==undefined){return false}var f=typeof(d)==Array||d.length>0?d[0]:d;var c=typeof(d)==Array||d.length>1?Array.prototype.slice.call(d,1):{};while(e[f]==undefined&&e.base!=null){e=e.base}if(e[f]&&a.isFunction(e[f])){return true}if(typeof f=="string"){var b=f.toLowerCase();if(e[b]&&a.isFunction(e[b])){return true}}return false};a.jqx.isPropertySetter=function(b){if(b.length==2){return true}return b.length==1&&typeof(b[0])=="object"};a.jqx.set=function(c,b){if(b.length==1&&typeof(b[0])=="object"){a.each(b[0],function(d,e){var f=c;while(f[d]==undefined&&f.base!=null){f=f.base}if(f[d]!=undefined||f[d]==null){a.jqx.setvalueraiseevent(f,d,e)}})}else{if(b.length==2){while(c[b[0]]==undefined&&c.base){c=c.base}if(c[b[0]]!=undefined||c[b[0]]==null){a.jqx.setvalueraiseevent(c,b[0],b[1])}}}};a.jqx.setvalueraiseevent=function(c,d,e){var b=c[d];c[d]=e;if(!c.isInitialized){return}if(c.propertyChangedHandler!=undefined){c.propertyChangedHandler(c,d,b,e)}if(c.propertyChangeMap!=undefined&&c.propertyChangeMap[d]!=undefined){c.propertyChangeMap[d](c,d,b,e)}};a.jqx.get=function(c,b){if(b==undefined||b==null){return undefined}if(c[b]!=undefined){return c[b]}if(b.length!=1){return undefined}while(c[b[0]]==undefined&&c.base){c=c.base}if(c[b[0]]!=undefined){return c[b[0]]}};a.jqx.jqxWidgetProxy=function(g,c,b){var d=a(c);var f=a.data(c,g);if(f==undefined){return undefined}var e=f.instance;if(a.jqx.hasFunction(e,b)){return a.jqx.invoke(e,b)}if(a.jqx.isPropertySetter(b)){a.jqx.set(e,b);return undefined}else{if(typeof(b)=="object"&&b.length==0){return}else{if(typeof(b)=="object"&&b.length>0){return a.jqx.get(e,b[0])}else{if(typeof(b)=="string"){return a.jqx.get(e,b)}}}}throw"jqxCore: Property or method does not exist.";return undefined};a.jqx.jqxWidget=function(b,d,i){var c=false;try{jqxArgs=Array.prototype.slice.call(i,0)}catch(h){jqxArgs=""}try{c=window.MSApp!=undefined}catch(h){}var g=b;var f="";if(d){f="_"+d}a.jqx.define(a.jqx,"_"+g,f);a.fn[g]=function(){var e=Array.prototype.slice.call(arguments,0);var k=null;if(e.length==0||(e.length==1&&typeof(e[0])=="object")){return this.each(function(){var o=a(this);var n=this;var q=a.data(n,g);if(q==null){q={};q.element=n;q.host=o;q.instance=new a.jqx["_"+g]();if(n.id==""){n.id=a.jqx.utilities.createId()}q.instance.get=q.instance.set=q.instance.call=function(){var r=Array.prototype.slice.call(arguments,0);return a.jqx.jqxWidgetProxy(g,n,r)};a.data(n,g,q);a.data(n,"jqxWidget",q.instance);var p=new Array();var l=q.instance;while(l){l.isInitialized=false;p.push(l);l=l.base}p.reverse();p[0].theme="";a.jqx.jqxWidgetProxy(g,this,e);for(var m in p){l=p[m];if(m==0){l.host=o;l.element=n;l.WinJS=c}if(l!=undefined){if(l.createInstance!=null){if(c){MSApp.execUnsafeLocalFunction(function(){l.createInstance(e)})}else{l.createInstance(e)}}}}for(var m in p){if(p[m]!=undefined){p[m].isInitialized=true}}if(c){MSApp.execUnsafeLocalFunction(function(){q.instance.refresh(true)})}else{q.instance.refresh(true)}k=this}else{a.jqx.jqxWidgetProxy(g,this,e)}})}else{this.each(function(){var l=a.jqx.jqxWidgetProxy(g,this,e);if(k==null){k=l}})}return k};try{a.extend(a.jqx["_"+g].prototype,Array.prototype.slice.call(i,0)[0])}catch(h){}a.extend(a.jqx["_"+g].prototype,{toThemeProperty:function(e,k){if(this.theme==""){return e}if(k!=null&&k){return e+"-"+this.theme}return e+" "+e+"-"+this.theme}});a.jqx["_"+g].prototype.refresh=function(){if(this.base){this.base.refresh()}};a.jqx["_"+g].prototype.createInstance=function(){};a.jqx["_"+g].prototype.propertyChangeMap={};a.jqx["_"+g].prototype.addHandler=function(m,k,e,l){switch(k){case"mousewheel":if(window.addEventListener){if(a.jqx.browser.mozilla){m[0].addEventListener("DOMMouseScroll",e,false)}else{m[0].addEventListener("mousewheel",e,false)}return false}break;case"mousemove":if(window.addEventListener&&!l){m[0].addEventListener("mousemove",e,false);return false}break}if(l==undefined||l==null){m.on(k,e)}else{m.on(k,l,e)}};a.jqx["_"+g].prototype.removeHandler=function(l,k,e){switch(k){case"mousewheel":if(window.removeEventListener){if(a.jqx.browser.mozilla){l[0].removeEventListener("DOMMouseScroll",e,false)}else{l[0].removeEventListener("mousewheel",e,false)}return false}break;case"mousemove":if(a.jqx.browser.msie&&a.jqx.browser.version>=9){if(window.removeEventListener){l[0].removeEventListener("mousemove",e,false)}}break}if(k==undefined){l.off();return}if(e==undefined){l.off(k)}else{l.off(k,e)}}};a.jqx.utilities=a.jqx.utilities||{};a.extend(a.jqx.utilities,{createId:function(){var b=function(){return(((1+Math.random())*65536)|0).toString(16).substring(1)};return"jqxWidget"+b()+b()+b()},setTheme:function(f,g,e){if(typeof e==="undefined"){return}var h=e[0].className.split(" "),b=[],k=[],d=e.children();for(var c=0;c<h.length;c+=1){if(h[c].indexOf(f)>=0){if(f.length>0){b.push(h[c]);k.push(h[c].replace(f,g))}else{k.push(h[c]+"-"+g)}}}this._removeOldClasses(b,e);this._addNewClasses(k,e);for(var c=0;c<d.length;c+=1){this.setTheme(f,g,a(d[c]))}},_removeOldClasses:function(d,c){for(var b=0;b<d.length;b+=1){c.removeClass(d[b])}},_addNewClasses:function(d,c){for(var b=0;b<d.length;b+=1){c.addClass(d[b])}},getOffset:function(b){var d=a.jqx.mobile.getLeftPos(b[0]);var c=a.jqx.mobile.getTopPos(b[0]);return{top:c,left:d}},html:function(b,c){return jQuery.access(b,function(s){var d=b[0]||{},m=0,h=b.length;if(s===undefined){return d.nodeType===1?d.innerHTML.replace(rinlinejQuery,""):undefined}var r=/<(?:script|style|link)/i,n="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",g=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,p=/<([\w:]+)/,f=/<(?:script|object|embed|option|style)/i,k=new RegExp("<(?:"+n+")[\\s/>]","i"),q=/^\s+/,t={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]};if(typeof s==="string"&&!r.test(s)&&(jQuery.support.htmlSerialize||!k.test(s))&&(jQuery.support.leadingWhitespace||!q.test(s))&&!t[(p.exec(s)||["",""])[1].toLowerCase()]){s=s.replace(g,"<$1></$2>");try{for(;m<h;m++){d=this[m]||{};if(d.nodeType===1){jQuery.cleanData(d.getElementsByTagName("*"));d.innerHTML=s}}d=0}catch(o){}}if(d){b.empty().append(s)}},null,c,arguments.length)},hasTransform:function(d){var c="";c=d.css("transform");if(c==""||c=="none"){c=d.parents().css("transform");if(c==""||c=="none"){var b=a.jqx.utilities.getBrowser();if(b.browser=="msie"){c=d.css("-ms-transform");if(c==""||c=="none"){c=d.parents().css("-ms-transform")}}else{if(b.browser=="chrome"){c=d.css("-webkit-transform");if(c==""||c=="none"){c=d.parents().css("-webkit-transform")}}else{if(b.browser=="opera"){c=d.css("-o-transform");if(c==""||c=="none"){c=d.parents().css("-o-transform")}}else{if(b.browser=="mozilla"){c=d.css("-moz-transform");if(c==""||c=="none"){c=d.parents().css("-moz-transform")}}}}}}else{return c!=""&&c!="none"}}if(c==""||c=="none"){c=a(document.body).css("transform")}return c!=""&&c!="none"&&c!=null},getBrowser:function(){var c=navigator.userAgent.toLowerCase();var b=/(chrome)[ \/]([\w.]+)/.exec(c)||/(webkit)[ \/]([\w.]+)/.exec(c)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(c)||/(msie) ([\w.]+)/.exec(c)||c.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(c)||[];var d={browser:b[1]||"",version:b[2]||"0"};d[b[1]]=b[1];return d}});a.jqx.browser=a.jqx.utilities.getBrowser();if(!Array.prototype.indexOf){Array.prototype.indexOf=function(c){var b=this.length;var d=Number(arguments[1])||0;d=(d<0)?Math.ceil(d):Math.floor(d);if(d<0){d+=b}for(;d<b;d++){if(d in this&&this[d]===c){return d}}return -1}}a.jqx.mobile=a.jqx.mobile||{};a.jqx.position=function(b){var e=parseInt(b.pageX);var d=parseInt(b.pageY);if(a.jqx.mobile.isTouchDevice()){var c=a.jqx.mobile.getTouches(b);var f=c[0];e=parseInt(f.pageX);d=parseInt(f.pageY)}return{left:e,top:d}};a.extend(a.jqx.mobile,{_touchListener:function(h,f){var b=function(i,l){var k=document.createEvent("MouseEvents");k.initMouseEvent(i,l.bubbles,l.cancelable,l.view,l.detail,l.screenX,l.screenY,l.clientX,l.clientY,l.ctrlKey,l.altKey,l.shiftKey,l.metaKey,l.button,l.relatedTarget);k._pageX=l.pageX;k._pageY=l.pageY;return k};var g={mousedown:"touchstart",mouseup:"touchend",mousemove:"touchmove"};var d=b(g[h.type],h);h.target.dispatchEvent(d);var c=h.target["on"+g[h.type]];if(typeof c==="function"){c(h)}},setMobileSimulator:function(c,e){if(this.isTouchDevice()){return}this.simulatetouches=true;if(e==false){this.simulatetouches=false}var d={mousedown:"touchstart",mouseup:"touchend",mousemove:"touchmove"};var b=this;if(window.addEventListener){var f=function(){for(var g in d){if(c.addEventListener){c.removeEventListener(g,b._touchListener);c.addEventListener(g,b._touchListener,false)}}};if(a.jqx.browser.msie){f()}else{window.addEventListener("load",function(){f()},false)}}},isTouchDevice:function(){if(this.touchDevice!=undefined){return this.touchDevice}var b="Browser CodeName: "+navigator.appCodeName+"";b+="Browser Name: "+navigator.appName+"";b+="Browser Version: "+navigator.appVersion+"";b+="Platform: "+navigator.platform+"";b+="User-agent header: "+navigator.userAgent+"";if(b.indexOf("Android")!=-1){return true}if(b.indexOf("IEMobile")!=-1){return true}if(b.indexOf("Windows Phone OS")!=-1){return true}if(b.indexOf("Windows Phone 6.5")!=-1){return true}if(b.indexOf("BlackBerry")!=-1&&b.indexOf("Mobile Safari")!=-1){return true}if(b.indexOf("ipod")!=-1){return true}if(b.indexOf("nokia")!=-1||b.indexOf("Nokia")!=-1){return true}if(b.indexOf("Chrome/17")!=-1){return false}if(b.indexOf("Opera")!=-1&&b.indexOf("Mobi")==-1&&b.indexOf("Mini")==-1&&b.indexOf("Platform: Win")!=-1){return false}try{if(this.touchDevice!=undefined){return this.touchDevice}this.touchDevice=true;document.createEvent("TouchEvent");return true}catch(c){this.touchDevice=false;return false}},getLeftPos:function(b){var c=b.offsetLeft;while((b=b.offsetParent)!=null){if(b.tagName!="HTML"){c+=b.offsetLeft;if(document.all){c+=b.clientLeft}}}return c},getTopPos:function(b){var c=b.offsetTop;while((b=b.offsetParent)!=null){if(b.tagName!="HTML"){c+=(b.offsetTop-b.scrollTop);if(document.all){c+=b.clientTop}}}if(this.isSafariMobileBrowser()){if(this.isSafari4MobileBrowser()&&this.isIPadSafariMobileBrowser()){return c}c=c+a(window).scrollTop()}return c},isChromeMobileBrowser:function(){var c=navigator.userAgent.toLowerCase();var b=c.indexOf("android")!=-1;return b},isOperaMiniMobileBrowser:function(){var c=navigator.userAgent.toLowerCase();var b=c.indexOf("opera mini")!=-1||c.indexOf("opera mobi")!=-1;return b},isOperaMiniBrowser:function(){var c=navigator.userAgent.toLowerCase();var b=c.indexOf("opera mini")!=-1;return b},isNewSafariMobileBrowser:function(){var c=navigator.userAgent.toLowerCase();var b=c.indexOf("ipad")!=-1||c.indexOf("iphone")!=-1||c.indexOf("ipod")!=-1;b=b&&(c.indexOf("version/5")!=-1);return b},isSafari4MobileBrowser:function(){var c=navigator.userAgent.toLowerCase();var b=c.indexOf("ipad")!=-1||c.indexOf("iphone")!=-1||c.indexOf("ipod")!=-1;b=b&&(c.indexOf("version/4")!=-1);return b},isWindowsPhone:function(){var c=navigator.userAgent.toLowerCase();var b=(c.indexOf("msie 11")!=-1||c.indexOf("msie 10")!=-1)&&c.indexOf("touch")!=-1;return b},isSafariMobileBrowser:function(){var c=navigator.userAgent.toLowerCase();var b=c.indexOf("ipad")!=-1||c.indexOf("iphone")!=-1||c.indexOf("ipod")!=-1;return b},isIPhoneSafariMobileBrowser:function(){var c=navigator.userAgent.toLowerCase();var b=c.indexOf("iphone")!=-1;return b},isIPadSafariMobileBrowser:function(){var c=navigator.userAgent.toLowerCase();var b=c.indexOf("ipad")!=-1;return b},isMobileBrowser:function(){var c=navigator.userAgent.toLowerCase();var b=c.indexOf("ipad")!=-1||c.indexOf("iphone")!=-1||c.indexOf("android")!=-1;return b},getTouches:function(b){if(b.originalEvent){if(b.originalEvent.touches&&b.originalEvent.touches.length){return b.originalEvent.touches}else{if(b.originalEvent.changedTouches&&b.originalEvent.changedTouches.length){return b.originalEvent.changedTouches}}}if(!b.touches){b.touches=new Array();b.touches[0]=b.originalEvent!=undefined?b.originalEvent:b;if(b.originalEvent!=undefined&&b.pageX){b.touches[0]=b}if(b.type=="mousemove"){b.touches[0]=b}}return b.touches},getTouchEventName:function(b){if(this.isWindowsPhone()){if(b.toLowerCase().indexOf("start")!=-1){return"MSPointerDown"}if(b.toLowerCase().indexOf("move")!=-1){return"MSPointerMove"}if(b.toLowerCase().indexOf("end")!=-1){return"MSPointerUp"}}else{return b}},dispatchMouseEvent:function(b,f,d){if(this.simulatetouches){return}var c=document.createEvent("MouseEvent");c.initMouseEvent(b,true,true,f.view,1,f.screenX,f.screenY,f.clientX,f.clientY,false,false,false,false,0,null);if(d!=null){d.dispatchEvent(c)}},getRootNode:function(b){while(b.nodeType!==1){b=b.parentNode}return b},setTouchScroll:function(b,c){if(!this.enableScrolling){this.enableScrolling=[]}this.enableScrolling[c]=b},touchScroll:function(c,r,e,v){if(c==null){return}var t=this;var o=0;var g=0;var h=0;var p=0;var i=0;var k=0;if(!this.scrolling){this.scrolling=[]}this.scrolling[v]=false;var f=false;var m=a(c);var q=["select","input","textarea"];var b=0;var d=0;if(!this.enableScrolling){this.enableScrolling=[]}this.enableScrolling[v]=true;var v=v;var u=this.getTouchEventName("touchstart")+".touchScroll";var l=this.getTouchEventName("touchend")+".touchScroll";var s=this.getTouchEventName("touchmove")+".touchScroll";m.on(u,function(w){if(!t.enableScrolling[v]){return true}if(a.inArray(w.target.tagName.toLowerCase(),q)!==-1){return}var x=t.getTouches(w);var y=x[0];if(x.length==1){t.dispatchMouseEvent("mousedown",y,t.getRootNode(y.target))}f=false;g=y.pageY;i=y.pageX;if(t.simulatetouches){g=y._pageY;i=y._pageX}t.scrolling[v]=true;o=0;p=0;return true});m.on(s,function(A){if(!t.enableScrolling[v]){return true}if(!t.scrolling[v]){return true}var B=t.getTouches(A);if(B.length>1){return true}var y=B[0].pageY;var z=B[0].pageX;if(t.simulatetouches){y=B[0]._pageY;z=B[0]._pageX}var w=y-g;var x=z-i;d=y;touchHorizontalEnd=z;h=w-o;k=x-p;f=true;o=w;p=x;e(-k*3,-h*3,x,w,A);A.preventDefault();A.stopPropagation();if(A.preventManipulation){A.preventManipulation()}return false});if(this.simulatetouches){a(window).on("mouseup.touchScroll",function(w){t.scrolling[v]=false});if(window.frameElement){if(window.top!=null){var n=function(w){t.scrolling[v]=false};if(window.top.document.addEventListener){window.top.document.removeEventListener("mouseup",n,false);window.top.document.addEventListener("mouseup",n,false)}else{if(window.top.document.attachEvent){window.top.document.attachEvent("onmouseup",n)}}}}a(document).on("touchend",function(w){if(!t.scrolling[v]){return true}t.scrolling[v]=false;var y=t.getTouches(w)[0],x=t.getRootNode(y.target);t.dispatchMouseEvent("mouseup",y,x);t.dispatchMouseEvent("click",y,x)})}m.on(l+" touchcancel.touchScroll",function(w){if(!t.enableScrolling[v]){return true}var y=t.getTouches(w)[0];if(!t.scrolling[v]){return true}t.scrolling[v]=false;if(f){t.dispatchMouseEvent("mouseup",y,x)}else{var y=t.getTouches(w)[0],x=t.getRootNode(y.target);t.dispatchMouseEvent("mouseup",y,x);t.dispatchMouseEvent("click",y,x);return true}})}});a.jqx.cookie=a.jqx.cookie||{};a.extend(a.jqx.cookie,{cookie:function(e,f,c){if(arguments.length>1&&String(f)!=="[object Object]"){c=jQuery.extend({},c);if(f===null||f===undefined){c.expires=-1}if(typeof c.expires==="number"){var h=c.expires,d=c.expires=new Date();d.setDate(d.getDate()+h)}f=String(f);return(document.cookie=[encodeURIComponent(e),"=",c.raw?f:encodeURIComponent(f),c.expires?"; expires="+c.expires.toUTCString():"",c.path?"; path="+c.path:"",c.domain?"; domain="+c.domain:"",c.secure?"; secure":""].join(""))}c=f||{};var b,g=c.raw?function(i){return i}:decodeURIComponent;return(b=new RegExp("(?:^|; )"+encodeURIComponent(e)+"=([^;]*)").exec(document.cookie))?g(b[1]):null}});a.jqx.string=a.jqx.string||{};a.extend(a.jqx.string,{contains:function(b,c){if(b==null||c==null){return false}return b.indexOf(c)!=-1},containsIgnoreCase:function(b,c){if(b==null||c==null){return false}return b.toUpperCase().indexOf(c.toUpperCase())!=-1},equals:function(b,c){if(b==null||c==null){return false}b=this.normalize(b);if(c.length==b.length){return b.slice(0,c.length)==c}return false},equalsIgnoreCase:function(b,c){if(b==null||c==null){return false}b=this.normalize(b);if(c.length==b.length){return b.toUpperCase().slice(0,c.length)==c.toUpperCase()}return false},startsWith:function(b,c){if(b==null||c==null){return false}return b.slice(0,c.length)==c},startsWithIgnoreCase:function(b,c){if(b==null||c==null){return false}return b.toUpperCase().slice(0,c.length)==c.toUpperCase()},normalize:function(b){if(b.charCodeAt(b.length-1)==65279){b=b.substring(0,b.length-1)}return b},endsWith:function(b,c){if(b==null||c==null){return false}b=this.normalize(b);return b.slice(-c.length)==c},endsWithIgnoreCase:function(b,c){if(b==null||c==null){return false}b=this.normalize(b);return b.toUpperCase().slice(-c.length)==c.toUpperCase()}});a.extend(jQuery.easing,{easeOutBack:function(f,g,e,k,i,h){if(h==undefined){h=1.70158}return k*((g=g/i-1)*g*((h+1)*g+h)+1)+e},easeInQuad:function(f,g,e,i,h){return i*(g/=h)*g+e},easeInOutCirc:function(f,g,e,i,h){if((g/=h/2)<1){return -i/2*(Math.sqrt(1-g*g)-1)+e}return i/2*(Math.sqrt(1-(g-=2)*g)+1)+e},easeInOutSine:function(f,g,e,i,h){return -i/2*(Math.cos(Math.PI*g/h)-1)+e},easeInCubic:function(f,g,e,i,h){return i*(g/=h)*g*g+e},easeOutCubic:function(f,g,e,i,h){return i*((g=g/h-1)*g*g+1)+e},easeInOutCubic:function(f,g,e,i,h){if((g/=h/2)<1){return i/2*g*g*g+e}return i/2*((g-=2)*g*g+2)+e},easeInSine:function(f,g,e,i,h){return -i*Math.cos(g/h*(Math.PI/2))+i+e},easeOutSine:function(f,g,e,i,h){return i*Math.sin(g/h*(Math.PI/2))+e},easeInOutSine:function(f,g,e,i,h){return -i/2*(Math.cos(Math.PI*g/h)-1)+e}})})(jQuery);(function(a){a.fn.extend({ischildof:function(c){var b=a(this).parents().get();for(j=0;j<b.length;j++){if(a(b[j]).is(c)){return true}}return false}})})(jQuery);
    (function(a){a.jqx.dataAdapter=function(e,b){this._source=e;this._options=b||{};this.records=new Array();this._downloadComplete=new Array();this._bindingUpdate=new Array();if(e!=undefined&&e.localdata!=null&&typeof e.localdata=="function"){var d=e.localdata();if(d!=null){e._localdata=e.localdata;var c=this;if(e._localdata.subscribe){c._oldlocaldata=[];e._localdata.subscribe(function(f){var g=function(h){if(jQuery.isArray(h)){return jQuery.makeArray(g(a(h)))}return jQuery.extend(true,{},h)};c._oldlocaldata=g(f)},e._localdata,"beforeChange");e._localdata.subscribe(function(g){if(c.suspendKO==false||c.suspendKO==undefined){var f="";c._oldrecords=c.records;if(c._oldlocaldata.length==0){e.localdata=e._localdata()}if(c._oldlocaldata.length==0){f="change"}else{if(c._oldlocaldata.length==g.length){f="update"}if(c._oldlocaldata.length>g.length){f="remove"}if(c._oldlocaldata.length<g.length){f="add"}}c.dataBind(null,f)}},e._localdata,"change");c._knockoutdatasource=true}e.localdata=d}}if(this._options.autoBind==true){this.dataBind()}};a.jqx.dataAdapter.prototype={getrecords:function(){return this.records},beginUpdate:function(){this.isUpdating=true},endUpdate:function(b){this.isUpdating=false;if(b!=false){this.dataBind(null,"")}},formatDate:function(c,e,d){var b=a.jqx.dataFormat.formatdate(c,e,d);return b},formatNumber:function(c,e,d){var b=a.jqx.dataFormat.formatnumber(c,e,d);return b},dataBind:function(m,r){if(this.isUpdating==true){return}var o=this._source;if(!o){return}if(o.dataFields!=null){o.datafields=o.dataFields}if(o.recordstartindex==undefined){o.recordstartindex=0}if(o.recordendindex==undefined){o.recordendindex=0}if(o.loadallrecords==undefined){o.loadallrecords=true}if(o.sort!=undefined){this.sort=o.sort}if(o.filter!=undefined){this.filter=o.filter}else{this.filter=null}if(o.sortcolumn!=undefined){this.sortcolumn=o.sortcolumn}if(o.sortdirection!=undefined){this.sortdirection=o.sortdirection}if(o.sortcomparer!=undefined){this.sortcomparer=o.sortcomparer}this.records=new Array();var f=this._options||{};this.virtualmode=f.virtualmode!=undefined?f.virtualmode:false;this.totalrecords=f.totalrecords!=undefined?f.totalrecords:0;this.pageable=f.pageable!=undefined?f.pageable:false;this.pagesize=f.pagesize!=undefined?f.pagesize:0;this.pagenum=f.pagenum!=undefined?f.pagenum:0;this.cachedrecords=f.cachedrecords!=undefined?f.cachedrecords:new Array();this.originaldata=new Array();this.recordids=new Array();this.updaterow=f.updaterow!=undefined?f.updaterow:null;this.addrow=f.addrow!=undefined?f.addrow:null;this.deleterow=f.deleterow!=undefined?f.deleterow:null;this.cache=f.cache!=undefined?f.cache:true;this.unboundmode=false;if(o.mapchar!=undefined){this.mapChar=o.mapchar?o.mapchar:">"}else{this.mapChar=f.mapChar?f.mapChar:">"}if(f.unboundmode||o.unboundmode){this.unboundmode=f.unboundmode||o.unboundmode}if(o.cache!=undefined){this.cache=o.cache}if(this.koSubscriptions){for(var t=0;t<this.koSubscriptions.length;t++){this.koSubscriptions[t].dispose()}}this.koSubscriptions=new Array();if(this.pagenum<0){this.pagenum=0}var y=this;var l=o.datatype;if(o.datatype==="csv"||o.datatype==="tab"||o.datatype=="text"){l="text"}var h=f.async!=undefined?f.async:true;if(o.async!=undefined){h=o.async}switch(l){case"local":case"array":case"observablearray":default:if(o.localdata==undefined&&o.length){o.localdata=new Array();for(var q=0;q<o.length;q++){o.localdata[o.localdata.length]=o[q]}}var g=o.localdata.length;this.totalrecords=this.virtualmode?(o.totalrecords||g):g;if(this.unboundmode){this.totalrecords=this.unboundmode?(o.totalrecords||g):g;var u=o.datafields?o.datafields.length:0;if(u>0){for(var q=0;q<this.totalrecords;q++){var d={};for(var p=0;p<u;p++){d[o.datafields[p].name]=""}o.localdata[o.localdata.length]=d}}}if(this.totalrecords==undefined){this.totalrecords=0}var u=o.datafields?o.datafields.length:0;var c=function(D,F){var E={};for(var B=0;B<F;B++){var A=o.datafields[B];var G="";if(undefined==A||A==null){continue}if(A.map){var i=A.map.split(y.mapChar);if(i.length>0){var C=D;for(var z=0;z<i.length;z++){C=C[i[z]]}G=C}else{G=D[A.map]}if(G!=undefined&&G!=null){G=G.toString()}else{G=""}}if(G==""){G=D[A.name];if(G!=undefined&&G!=null){if(o._localdata&&G.subscribe){G=G()}else{G=G.toString()}}else{G=""}}G=y.getvaluebytype(G,A);if(A.displayname!=undefined){E[A.displayname]=G}else{E[A.name]=G}}return E};if(o._localdata){this._changedrecords=[];this.records=new Array();var x=o._localdata();a.each(x,function(I,N){if(typeof N==="string"){y.records.push(N)}else{var K={};var L=0;for(var H in this){var B=null;var M="string";if(u>0){var O=false;for(var F=0;F<u;F++){var E=o.datafields[F];if(E!=undefined&&E.name==H){O=true;B=E.map;M=E.type;break}}if(!O){continue}}var D=a.isFunction(this[H]);if(D){var N=this[H]();if(M!="string"){N=y.getvaluebytype(N,{type:M})}K[H]=N;if(this[H].subscribe){y.koSubscriptions[y.koSubscriptions.length]=this[H].subscribe(function(i){y.dataBind(null,null);return false})}}else{var N=this[H];if(B!=null){var A=B.split(y.mapChar);if(A.length>0){var J=this;for(var C=0;C<A.length;C++){J=J[A[C]]}N=J}else{N=this[B]}}if(M!="string"){N=y.getvaluebytype(N,{type:M})}K[H]=N;if(K[H]!=undefined){L+=K[H].toString().length+K[H].toString().substr(0,1)}}}y.records.push(K);K._koindex=L;if(y._oldrecords){var G=y.records.length-1;if(r=="update"){if(y._oldrecords[G]._koindex!=L){var z={index:G,oldrecord:y._oldrecords[G],record:K};y._changedrecords.push(z)}}}}});if(r=="add"){var g=y.records.length;for(var q=0;q<g;q++){var d=y.records[q];if(!y._oldrecords[q]){y._changedrecords.push({index:q,oldrecord:null,record:d})}else{if(y._oldrecords[q]._koindex!=d._koindex){y._changedrecords.push({index:q,oldrecord:null,record:d})}}}}else{if(r=="remove"){var g=y._oldrecords.length;for(var q=0;q<g;q++){var k=y._oldrecords[q];if(!y.records[q]){y._changedrecords.push({index:q,oldrecord:k,record:null})}else{if(y.records[q]._koindex!=k._koindex){y._changedrecords.push({index:q,oldrecord:k,record:null})}}}}}}else{if(!a.isArray(o.localdata)){this.records=new Array();a.each(o.localdata,function(z){if(u>0){var j=this;var A=c(j,u);y.records[y.records.length]=A}else{y.records[y.records.length]=this}})}else{if(u==0){this.records=o.localdata}else{a.each(o.localdata,function(z){var j=this;var A=c(j,u);y.records[y.records.length]=A})}}}this.originaldata=o.localdata;this.cachedrecords=this.records;this.addForeignValues(o);if(f.uniqueDataFields){var n=this.getUniqueRecords(this.records,f.uniqueDataFields);this.records=n;this.cachedrecords=n}if(f.beforeLoadComplete){var v=f.beforeLoadComplete(y.records,this.originaldata);if(v!=undefined){y.records=v;y.cachedrecords=v}}if(a.isFunction(f.loadComplete)){f.loadComplete(o.localdata)}break;case"json":case"jsonp":case"xml":case"xhtml":case"script":case"text":if(o.localdata!=null){if(a.isFunction(o.beforeprocessing)){o.beforeprocessing(o.localdata)}if(o.datatype==="xml"){y.loadxml(o.localdata,o.localdata,o)}else{if(l==="text"){y.loadtext(o.localdata,o)}else{y.loadjson(o.localdata,o.localdata,o)}}y.addForeignValues(o);if(f.uniqueDataFields){var n=y.getUniqueRecords(y.records,f.uniqueDataFields);y.records=n;y.cachedrecords=n}if(a.isFunction(f.loadComplete)){f.loadComplete(o.localdata)}return}var w=f.data!=undefined?f.data:{};if(o.processdata){o.processdata(w)}if(a.isFunction(f.processData)){f.processData(w)}if(a.isFunction(f.formatData)){var b=f.formatData(w);if(b!=undefined){w=b}}var s="application/x-www-form-urlencoded";if(f.contentType){s=f.contentType}var e="GET";if(o.type){e=o.type}if(f.type){e=f.type}if(o.url&&o.url.length>0){if(a.isFunction(f.loadServerData)){y._requestData(w,o,f)}else{this.xhr=a.ajax({dataType:l,cache:this.cache,type:e,url:o.url,async:h,contentType:s,data:w,success:function(A,i,D){if(a.isFunction(o.beforeprocessing)){var C=o.beforeprocessing(A,i,D);if(C!=undefined){A=C}}if(a.isFunction(f.downloadComplete)){var C=f.downloadComplete(A,i,D);if(C!=undefined){A=C}}if(A==null){y.records=new Array();y.cachedrecords=new Array();y.originaldata=new Array();y.callDownloadComplete();if(a.isFunction(f.loadComplete)){f.loadComplete(new Array())}return}var j=A;if(A.records){j=A.records}if(A.totalrecords!=undefined){o.totalrecords=A.totalrecords}if(o.datatype==="xml"){y.loadxml(null,j,o)}else{if(l==="text"){y.loadtext(j,o)}else{y.loadjson(null,j,o)}}y.addForeignValues(o);if(f.uniqueDataFields){var z=y.getUniqueRecords(y.records,f.uniqueDataFields);y.records=z;y.cachedrecords=z}if(f.beforeLoadComplete){var B=f.beforeLoadComplete(y.records,A);if(B!=undefined){y.records=B;y.cachedrecords=B}}y.callDownloadComplete();if(a.isFunction(f.loadComplete)){f.loadComplete(A)}},error:function(z,i,j){if(a.isFunction(o.loaderror)){o.loaderror(z,i,j)}if(a.isFunction(f.loadError)){f.loadError(z,i,j)}z=null;y.callDownloadComplete()},beforeSend:function(j,i){if(a.isFunction(f.beforeSend)){f.beforeSend(j,i)}if(a.isFunction(o.beforesend)){o.beforesend(j,i)}}})}}else{y.callDownloadComplete();if(a.isFunction(f.loadComplete)){f.loadComplete(data)}}break}this.callBindingUpdate(r)},addForeignValues:function(c){var k=this;var p=c.datafields?c.datafields.length:0;for(var f=0;f<p;f++){var e=c.datafields[f];if(e!=undefined){if(e.values!=undefined){if(e.value==undefined){e.value=e.name}if(e.values.value==undefined){e.values.value=e.value}var n=new Array();for(var g=0;g<k.records.length;g++){var h=k.records[g];var d=e.name;var o=h[e.value];if(n[o]!=undefined){h[d]=n[o]}else{for(var f=0;f<e.values.source.length;f++){var m=e.values.source[f];var b=m[e.values.value];if(b==undefined){b=m.uid}if(b==o){var l=m[e.values.name];h[d]=l;n[o]=l;break}}}}}else{if(e.value!=undefined){for(var g=0;g<k.records.length;g++){var h=k.records[g];h[e.name]=h[e.value]}}}}}},abort:function(){if(this.xhr&&this.xhr.readyState!=4){this.xhr.abort()}},_requestData:function(c,e,b){var d=this;var f=function(g){if(g.totalrecords){e.totalrecords=g.totalrecords;d.totalrecords=g.totalrecords}if(g.records){d.records=g.records;d.cachedrecords=g.records}if(a.isFunction(b.loadComplete)){b.loadComplete(data)}d.callDownloadComplete()};b.loadServerData(c,e,f)},getUniqueRecords:function(d,g){if(d&&g){var b=d.length;var l=g.length;var i=new Array();var j=new Array();for(var k=0;k<b;k++){var h=d[k];var e="";if(h==undefined){continue}for(var f=0;f<l;f++){var c=g[f];e+=h[c]+"_"}if(!j[e]){i[i.length]=h}j[e]=true}}return i},getAggregatedData:function(n,h,f){var e=f;if(!e){e=this.records}var k={};var d=e.length;if(d==0){return}if(d==undefined){return}for(var l=0;l<d;l++){var m=e[l];for(var g=0;g<n.length;g++){var c=n[g];var p=m[c.name];if(c.aggregates){k[c.name]=k[c.name]||{};var b=function(i){for(obj in i){var j=k[c.name][obj];if(j==null){k[c.name][obj]=0;j=0}if(a.isFunction(i[obj])){j=i[obj](j,p,c.name,m)}k[c.name][obj]=j}};var o=parseFloat(p);if(isNaN(o)){o=false}else{o=true}if(o){p=parseFloat(p)}if(typeof p==="number"&&isFinite(p)){a.each(c.aggregates,function(){var i=k[c.name][this];if(i==null){i=0;if(this=="min"){i=9999999999999}}if(this=="sum"||this=="avg"||this=="stdev"||this=="stdevp"||this=="var"||this=="varp"){i+=parseFloat(p)}else{if(this=="product"){if(l==0){i=parseFloat(p)}else{i*=parseFloat(p)}}else{if(this=="min"){i=Math.min(i,parseFloat(p))}else{if(this=="max"){i=Math.max(i,parseFloat(p))}else{if(this=="count"){i++}else{if(typeof(this)=="object"){b(this);return}}}}}}k[c.name][this]=i})}else{a.each(c.aggregates,function(){if(this=="min"||this=="max"||this=="count"||this=="product"||this=="sum"||this=="avg"||this=="stdev"||this=="stdevp"||this=="var"||this=="varp"){k[c.name][this]=0;return true}if(typeof(this)=="object"){b(this)}})}}}}for(var g=0;g<n.length;g++){var c=n[g];if(k[c.name]["avg"]!=undefined){var p=k[c.name]["avg"];k[c.name]["avg"]=p/e.length}else{if(k[c.name]["count"]!=undefined){k[c.name]["count"]=d}}if(k[c.name]["stdev"]||k[c.name]["stdevp"]||k[c.name]["var"]||k[c.name]["varp"]){a.each(c.aggregates,function(v){if(this=="stdev"||this=="var"||this=="varp"||this=="stdevp"){var w=k[c.name][this];var u=d;var j=(w/d);var r=0;for(var s=0;s<d;s++){var t=e[s];var x=t[c.name];r+=(x-j)*(x-j)}var q=(this=="stdevp"||this=="varp")?u:u-1;if(q==0){q=1}if(this=="var"||this=="varp"){k[c.name][this]=r/q}else{if(this=="stdevp"||this=="stdev"){k[c.name][this]=Math.sqrt(r/q)}}}})}if(c.formatStrings){a.each(c.aggregates,function(j){var i=c.formatStrings[j];if(i){if(this=="min"||this=="max"||this=="count"||this=="product"||this=="sum"||this=="avg"||this=="stdev"||this=="stdevp"||this=="var"||this=="varp"){var q=k[c.name][this];k[c.name][this]=a.jqx.dataFormat.formatnumber(q,i,h)}else{if(typeof this=="object"){for(obj in this){var q=k[c.name][obj];k[c.name][obj]=a.jqx.dataFormat.formatnumber(q,i,h)}}}}})}}return k},bindDownloadComplete:function(c,b){this._downloadComplete[this._downloadComplete.length]={id:c,func:b}},unbindDownloadComplete:function(c){for(var b=0;b<this._downloadComplete.length;b++){if(this._downloadComplete[b].id==c){this._downloadComplete[b].func=null;this._downloadComplete.splice(b,1);break}}},callDownloadComplete:function(){for(var b=0;b<this._downloadComplete.length;b++){var c=this._downloadComplete[b];if(c.func!=null){c.func()}}},setSource:function(b){this._source=b},generatekey:function(){var b=function(){return(((1+Math.random())*65536)|0).toString(16).substring(1)};return(b()+b()+"-"+b()+"-"+b()+"-"+b()+"-"+b()+b()+b())},getGroupedRecords:function(C,F,p,x,D,v){var z=0;var u=this;var d=new Array();for(var h=0;h<C.length;h++){d[h]=u.generatekey()}if(!F){F="items"}if(!p){p="group"}if(!D){D="record"}if(!v){v="value"}var l=new Array();var f=0;var e=new Array();var k=C.length;var E=new Array();var G=this.records;var i=G.length;var y=function(q){var H=q;if(x){a.each(x,function(){if(this.name&&this.map){H[this.map]=H[this.name]}})}return H};for(var o=0;o<i;o++){var B=y(G[o]);id=B[u.uniqueId];var c=new Array();var r=0;for(h=0;h<k;h++){var j=C[h];var w=B[j];if(null==w){continue}c[r++]={value:w,hash:d[h]}}if(c.length!=k){break}var s=null;var m="";var b=-1;for(var t=0;t<c.length;t++){b++;var A=c[t].value;var g=c[t].hash;m=m+"_"+g+"_"+A;if(e[m]!=undefined&&e[m]!=null){s=e[m];continue}if(s==null){s={level:0};s[p]=A;s[D]=B;s[v]=B[v];s[F]=new Array();l[f++]=s}else{var n={parentItem:s,level:s.level+1};n[p]=A;n[F]=new Array();n[D]=B;n[v]=B[v];s[F][s[F].length]=n;s=n}e[m]=s}if(s!=null){B.parentItem=s;B.level=s.level+1;s[F][s[F].length]=B}}return l},getRecordsHierarchy:function(f,d,t,o){var b=new Array();var c=this.records;if(this.records.length==0){return null}var r=t!=null?t:"items";var l=[];var u=c;var j=u.length;var p=function(i){var v=i;if(o){a.each(o,function(){if(this.name&&this.map){v[this.map]=v[this.name]}})}return v};for(var q=0;q<j;q++){var s=a.extend({},u[q]);var n=s[d];var m=s[f];l[m]={parentid:n,item:s}}for(var q=0;q<j;q++){var s=a.extend({},u[q]);var n=s[d];var m=s[f];if(l[n]!=undefined){var s={parentid:n,item:l[m].item};var k=l[n].item;if(!k[r]){k[r]=[]}var g=k[r].length;var e=s.item;var h=p(e);k[r][g]=h;l[n].item=k;l[m]=s}else{var e=l[m].item;var h=p(e);b[b.length]=h}}return b},bindBindingUpdate:function(c,b){this._bindingUpdate[this._bindingUpdate.length]={id:c,func:b}},unbindBindingUpdate:function(c){for(var b=0;b<this._bindingUpdate.length;b++){if(this._bindingUpdate[b].id==c){this._bindingUpdate[b].func=null;this._bindingUpdate.splice(b,1);break}}},callBindingUpdate:function(b){for(var d=0;d<this._bindingUpdate.length;d++){var c=this._bindingUpdate[d];if(c.func!=null){c.func(b)}}},getid:function(e,c,d){if(a(e,c).length>0){return a(e,c).text()}if(e){if(e.toString().length>0){var b=a(c).attr(e);if(b!=null&&b.toString().length>0){return b}}}return d},loadjson:function(C,D,o){if(typeof(C)=="string"){C=a.parseJSON(C)}if(o.root==undefined){o.root=""}if(o.record==undefined){o.record=""}var C=C||D;if(!C){C=[]}var B=this;if(o.root!=""){if(C[o.root]!=undefined){C=C[o.root]}else{a.each(C,function(j){var d=this;if(this==o.root){C=this;return false}else{if(this[o.root]!=undefined){C=this[o.root]}}})}if(!C){var g=o.root.split(B.mapChar);if(g.length>0){var y=C;for(var n=0;n<g.length;n++){if(y!=undefined){y=y[g[n]]}}C=y}}}else{if(!C.length){for(obj in C){if(a.isArray(C[obj])){C=C[obj];break}}}}if(C!=null&&C.length==undefined){C=a.makeArray(C)}if(C==null||C.length==undefined){alert("JSON Parse error.");return}if(C.length==0){this.totalrecords=0;return}var f=C.length;this.totalrecords=this.virtualmode?(o.totalrecords||f):f;this.records=new Array();this.originaldata=new Array();var u=this.records;var r=!this.pageable?o.recordstartindex:this.pagesize*this.pagenum;this.recordids=new Array();if(o.loadallrecords){r=0;f=this.totalrecords}var m=0;if(this.virtualmode){r=!this.pageable?o.recordstartindex:this.pagesize*this.pagenum;m=r;r=0;f=this.totalrecords}var w=o.datafields?o.datafields.length:0;if(w==0){var b=C[0];var z=new Array();for(obj in b){var c=obj;z[z.length]={name:c}}o.datafields=z;w=z.length}var k=r;for(var t=r;t<f;t++){var e=C[t];if(e==undefined){break}if(o.record&&o.record!=""){e=e[o.record];if(e==undefined){continue}}var A=this.getid(o.id,e,t);if(typeof(A)==="object"){A=t}if(!this.recordids[A]){this.recordids[A]=e;var h={};for(var s=0;s<w;s++){var l=o.datafields[s];var q="";if(undefined==l||l==null){continue}if(l.map){var g=l.map.split(B.mapChar);if(g.length>0){var x=e;for(var n=0;n<g.length;n++){if(x!=undefined){x=x[g[n]]}}q=x}else{q=e[l.map]}if(q!=undefined&&q!=null){q=q.toString()}else{q=""}}if(q==""){q=e[l.name];if(q==undefined||q==null){q=""}if(l.value!=undefined){var v=q[l.value];if(v!=undefined){q=v}}}q=this.getvaluebytype(q,l);if(l.displayname!=undefined){h[l.displayname]=q}else{h[l.name]=q}}if(o.recordendindex<=0||r<o.recordendindex){u[m+k]=a.extend({},h);u[m+k].uid=A;this.originaldata[m+k]=a.extend({},u[t]);k++}}}this.records=u;this.cachedrecords=this.records},loadxml:function(f,x,m){if(typeof(f)=="string"){f=x=a(a.parseXML(f))}if(m.root==undefined){m.root=""}if(m.record==undefined){m.record=""}var f;if(a.jqx.browser.msie&&x){if(x.xml!=undefined){f=a(m.root+" "+m.record,a.parseXML(x.xml))}else{f=f||a(m.root+" "+m.record,x)}}else{f=f||a(m.root+" "+m.record,x)}if(!f){f=[]}var e=f.length;if(f.length==0){return}this.totalrecords=this.virtualmode?(m.totalrecords||e):e;this.records=new Array();this.originaldata=new Array();var t=this.records;var q=!this.pageable?m.recordstartindex:this.pagesize*this.pagenum;this.recordids=new Array();if(m.loadallrecords){q=0;e=this.totalrecords}var k=0;if(this.virtualmode){q=!this.pageable?m.recordstartindex:this.pagesize*this.pagenum;k=q;q=0;e=this.totalrecords}var u=m.datafields?m.datafields.length:0;if(u==0){var b=f[0];var v=new Array();for(obj in b){var c=obj;v[v.length]={name:c}}m.datafields=v;u=v.length}var l=q;for(var s=q;s<e;s++){var d=f[s];if(d==undefined){break}var w=this.getid(m.id,d,s);if(!this.recordids[w]){this.recordids[w]=d;var g={};for(var r=0;r<u;r++){var h=m.datafields[r];var o="";if(undefined==h||h==null){continue}if(h.map){o=a(h.map,d).text()}if(o==""){o=a(h.name,d).text()}var n=o;o=this.getvaluebytype(o,h);if(h.displayname!=undefined){g[h.displayname]=o}else{g[h.name]=o}}if(m.recordendindex<=0||q<m.recordendindex){t[k+l]=a.extend({},g);t[k+l].uid=w;this.originaldata[k+l]=a.extend({},t[s]);l++}}}this.records=t;this.cachedrecords=this.records},loadtext:function(u,m){if(u==null){return}var b=m.rowDelimiter||this.rowDelimiter||"\n";var g=u.split(b);var e=g.length;this.totalrecords=this.virtualmode?(m.totalrecords||e):e;this.records=new Array();this.originaldata=new Array();var r=this.records;var o=!this.pageable?m.recordstartindex:this.pagesize*this.pagenum;this.recordids=new Array();if(m.loadallrecords){o=0;e=this.totalrecords}var k=0;if(this.virtualmode){o=!this.pageable?m.recordstartindex:this.pagesize*this.pagenum;k=o;o=0;e=this.totalrecords}var s=m.datafields.length;var l=m.columnDelimiter||this.columnDelimiter;if(!l){l=(m.datatype==="tab")?"\t":","}for(var q=o;q<e;q++){var d=g[q];var t=this.getid(m.id,d,q);if(!this.recordids[t]){this.recordids[t]=d;var f={};var c=g[q].split(l);for(var p=0;p<s;p++){if(p>=c.length){continue}var h=m.datafields[p];var n=c[p];if(h.type){n=this.getvaluebytype(n,h)}var v=h.map||h.name||p.toString();f[v]=n}r[k+q]=a.extend({},f);r[k+q].uid=t;this.originaldata[k+q]=a.extend({},r[q])}}this.records=r;this.cachedrecords=this.records},getvaluebytype:function(f,c){var d=f;if(c.type=="date"){var e=new Date(f);if(typeof f=="string"){if(c.format){var b=a.jqx.dataFormat.parsedate(f,c.format);if(b!=null){e=b}}}if(e.toString()=="NaN"||e.toString()=="Invalid Date"){if(a.jqx.dataFormat){f=a.jqx.dataFormat.tryparsedate(f)}else{f=e}}else{f=e}if(f==null){f=d}}else{if(c.type=="float"||c.type=="number"||c.type=="decimal"){if(f=="NaN"){f=""}else{var f=parseFloat(f);if(isNaN(f)){f=d}}}else{if(c.type=="int"||c.type=="integer"){var f=parseInt(f);if(isNaN(f)){f=d}}else{if(c.type=="bool"||c.type=="boolean"){if(f!=null){if(f.toLowerCase!=undefined){if(f.toLowerCase()=="false"){f=false}else{if(f.toLowerCase()=="true"){f=true}}}}if(f==1){f=true}else{if(f==0&&f!==""){f=false}else{f=""}}}}}}return f}};a.jqx.dataFormat={};a.extend(a.jqx.dataFormat,{regexTrim:/^\s+|\s+$/g,regexInfinity:/^[+-]?infinity$/i,regexHex:/^0x[a-f0-9]+$/i,regexParseFloat:/^[+-]?\d*\.?\d*(e[+-]?\d+)?$/,toString:Object.prototype.toString,isBoolean:function(b){return typeof b==="boolean"},isObject:function(b){return(b&&(typeof b==="object"||a.isFunction(b)))||false},isDate:function(b){return b instanceof Date},arrayIndexOf:function(e,d){if(e.indexOf){return e.indexOf(d)}for(var b=0,c=e.length;b<c;b++){if(e[b]===d){return b}}return -1},isString:function(b){return typeof b==="string"},isNumber:function(b){return typeof b==="number"&&isFinite(b)},isNull:function(b){return b===null},isUndefined:function(b){return typeof b==="undefined"},isValue:function(b){return(this.isObject(b)||this.isString(b)||this.isNumber(b)||this.isBoolean(b))},isEmpty:function(b){if(!this.isString(b)&&this.isValue(b)){return false}else{if(!this.isValue(b)){return true}}b=a.trim(b).replace(/\&nbsp\;/ig,"").replace(/\&#160\;/ig,"");return b===""},startsWith:function(c,b){return c.indexOf(b)===0},endsWith:function(c,b){return c.substr(c.length-b.length)===b},trim:function(b){return(b+"").replace(this.regexTrim,"")},isArray:function(b){return this.toString.call(b)==="[object Array]"},defaultcalendar:function(){var b={"/":"/",":":":",firstDay:0,days:{names:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],namesAbbr:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],namesShort:["Su","Mo","Tu","We","Th","Fr","Sa"]},months:{names:["January","February","March","April","May","June","July","August","September","October","November","December",""],namesAbbr:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",""]},AM:["AM","am","AM"],PM:["PM","pm","PM"],eras:[{name:"A.D.",start:null,offset:0}],twoDigitYearMax:2029,patterns:{d:"M/d/yyyy",D:"dddd, MMMM dd, yyyy",t:"h:mm tt",T:"h:mm:ss tt",f:"dddd, MMMM dd, yyyy h:mm tt",F:"dddd, MMMM dd, yyyy h:mm:ss tt",M:"MMMM dd",Y:"yyyy MMMM",S:"yyyy\u0027-\u0027MM\u0027-\u0027dd\u0027T\u0027HH\u0027:\u0027mm\u0027:\u0027ss",ISO:"yyyy-MM-dd hh:mm:ss",ISO2:"yyyy-MM-dd HH:mm:ss",d1:"dd.MM.yyyy",d2:"dd-MM-yyyy",zone1:"yyyy-MM-ddTHH:mm:ss-HH:mm",zone2:"yyyy-MM-ddTHH:mm:ss+HH:mm"},percentsymbol:"%",currencysymbol:"$",currencysymbolposition:"before",decimalseparator:".",thousandsseparator:","};return b},expandFormat:function(f,e){e=e||"F";var d,c=f.patterns,b=e.length;if(b===1){d=c[e];if(!d){throw"Invalid date format string '"+e+"'."}e=d}else{if(b===2&&e.charAt(0)==="%"){e=e.charAt(1)}}return e},getEra:function(d,c){if(!c){return 0}if(typeof d==="string"){return 0}var g,f=d.getTime();for(var e=0,b=c.length;e<b;e++){g=c[e].start;if(g===null||f>=g){return e}}return 0},toUpper:function(b){return b.split("\u00A0").join(" ").toUpperCase()},toUpperArray:function(b){var e=[];for(var d=0,c=b.length;d<c;d++){e[d]=this.toUpper(b[d])}return e},getEraYear:function(c,e,b,f){var d=c.getFullYear();if(!f&&e.eras){d-=e.eras[b].offset}return d},getDayIndex:function(f,e,c){var b,g=f.days,d=f._upperDays;if(!d){f._upperDays=d=[this.toUpperArray(g.names),this.toUpperArray(g.namesAbbr),this.toUpperArray(g.namesShort)]}e=toUpper(e);if(c){b=this.arrayIndexOf(d[1],e);if(b===-1){b=this.arrayIndexOf(d[2],e)}}else{b=this.arrayIndexOf(d[0],e)}return b},getMonthIndex:function(j,h,d){var b=j.months,c=j.monthsGenitive||j.months,f=j._upperMonths,g=j._upperMonthsGen;if(!f){j._upperMonths=f=[this.toUpperArray(b.names),this.toUpperArray(b.namesAbbr)];j._upperMonthsGen=g=[this.toUpperArray(c.names),this.toUpperArray(c.namesAbbr)]}h=this.toUpper(h);var e=this.arrayIndexOf(d?f[1]:f[0],h);if(e<0){e=this.arrayIndexOf(d?g[1]:g[0],h)}return e},appendPreOrPostMatch:function(f,b){var e=0,h=false;for(var g=0,d=f.length;g<d;g++){var j=f.charAt(g);switch(j){case"'":if(h){b.push("'")}else{e++}h=false;break;case"\\":if(h){b.push("\\")}h=!h;break;default:b.push(j);h=false;break}}return e},getTokenRegExp:function(){return/\/|dddd|ddd|dd|d|MMMM|MMM|MM|M|yyyy|yy|y|hh|h|HH|H|mm|m|ss|s|tt|t|fff|ff|f|zzz|zz|z|gg|g/g},formatlink:function(b,d){var c="";if(d&&d.target){c="target="+d.target}if(c!=""){return"<a "+c+' href="'+b+'">'+b+"</a>"}return'<a href="'+b+'">'+b+"</a>"},formatemail:function(b){return'<a href="mailto:'+b+'">'+b+"</a>"},formatnumber:function(p,o,k){if(k==undefined||k==null||k==""){k=this.defaultcalendar()}if(!this.isNumber(p)){p*=1}var l;if(o.length>1){l=parseInt(o.slice(1),10)}var r={};var m=o.charAt(0).toUpperCase();r.thousandsSeparator=k.thousandsseparator;r.decimalSeparator=k.decimalseparator;switch(m){case"D":case"d":case"F":case"f":r.decimalPlaces=l;break;case"N":case"n":r.decimalPlaces=0;break;case"C":case"c":r.decimalPlaces=l;if(k.currencysymbolposition=="before"){r.prefix=k.currencysymbol}else{r.suffix=k.currencysymbol}break;case"P":case"p":r.suffix=k.percentsymbol;r.decimalPlaces=l;break;default:throw"Bad number format specifier: "+m}if(this.isNumber(p)){var f=(p<0);var d=p+"";var n=(r.decimalSeparator)?r.decimalSeparator:".";var b;if(this.isNumber(r.decimalPlaces)){var g=r.decimalPlaces;var j=Math.pow(10,g);d=Math.round(p*j)/j+"";b=d.lastIndexOf(".");if(g>0){if(b<0){d+=n;b=d.length-1}else{if(n!=="."){d=d.replace(".",n)}}while((d.length-1-b)<g){d+="0"}}}if(r.thousandsSeparator){var q=r.thousandsSeparator;b=d.lastIndexOf(n);b=(b>-1)?b:d.length;var e=d.substring(b);var c=-1;for(var h=b;h>0;h--){c++;if((c%3===0)&&(h!==b)&&(!f||(h>1))){e=q+e}e=d.charAt(h-1)+e}d=e}d=(r.prefix)?r.prefix+d:d;d=(r.suffix)?d+r.suffix:d;return d}else{return p}},tryparsedate:function(p,h){if(h==undefined||h==null){h=this.defaultcalendar()}var l=this;if(p==""){return null}if(p!=null&&!p.substring){p=p.toString()}if(p!=null&&p.substring(0,6)=="/Date("){var n=/^\/Date\((-?\d+)(\+|-)?(\d+)?\)\/$/;var e=new Date(+p.replace(/\/Date\((\d+)\)\//,"$1"));if(e=="Invalid Date"){var f=p.match(/^\/Date\((\d+)([-+]\d\d)(\d\d)\)\/$/);var e=null;if(f){e=new Date(1*f[1]+3600000*f[2]+60000*f[3])}}if(e==null||e=="Invalid Date"||isNaN(e)){var i=n.exec(p);if(i){var q=new Date(parseInt(i[1]));if(i[2]){var b=parseInt(i[3]);if(i[2]==="-"){b=-b}var k=q.getUTCMinutes();q.setUTCMinutes(k-b)}if(!isNaN(q.valueOf())){return q}}}return e}patterns=h.patterns;for(prop in patterns){e=l.parsedate(p,patterns[prop],h);if(e){return e}}if(p!=null){var d=null;var o=[":","/","-"];var j=true;for(var c=0;c<o.length;c++){if(p.indexOf(o[c])!=-1){j=false}}if(j){var g=new Number(p);if(!isNaN(g)){return new Date(g)}}}return null},getparseregexp:function(b,n){var p=b._parseRegExp;if(!p){b._parseRegExp=p={}}else{var f=p[n];if(f){return f}}var l=this.expandFormat(b,n).replace(/([\^\$\.\*\+\?\|\[\]\(\)\{\}])/g,"\\\\$1"),j=["^"],c=[],i=0,e=0,s=this.getTokenRegExp(),g;while((g=s.exec(l))!==null){var r=l.slice(i,g.index);i=s.lastIndex;e+=this.appendPreOrPostMatch(r,j);if(e%2){j.push(g[0]);continue}var d=g[0],h=d.length,o;switch(d){case"dddd":case"ddd":case"MMMM":case"MMM":case"gg":case"g":o="(\\D+)";break;case"tt":case"t":o="(\\D*)";break;case"yyyy":case"fff":case"ff":case"f":o="(\\d{"+h+"})";break;case"dd":case"d":case"MM":case"M":case"yy":case"y":case"HH":case"H":case"hh":case"h":case"mm":case"m":case"ss":case"s":o="(\\d\\d?)";break;case"zzz":o="([+-]?\\d\\d?:\\d{2})";break;case"zz":case"z":o="([+-]?\\d\\d?)";break;case"/":o="(\\"+b["/"]+")";break;default:throw"Invalid date format pattern '"+d+"'.";break}if(o){j.push(o)}c.push(g[0])}this.appendPreOrPostMatch(l.slice(i),j);j.push("$");var q=j.join("").replace(/\s+/g,"\\s+"),k={regExp:q,groups:c};return p[n]=k},outOfRange:function(d,b,c){return d<b||d>c},expandYear:function(g,e){var c=new Date(),b=getEra(c);if(e<100){var d=g.twoDigitYearMax;d=typeof d==="string"?new Date().getFullYear()%100+parseInt(d,10):d;var f=this.getEraYear(c,g,b);e+=f-(f%100);if(e>d){e-=100}}return e},parsedate:function(z,G,u){if(u==undefined||u==null){u=this.defaultcalendar()}z=this.trim(z);var r=u,L=this.getparseregexp(r,G),k=new RegExp(L.regExp).exec(z);if(k===null){return null}var H=L.groups,x=null,p=null,K=null,J=null,q=null,g=0,C,B=0,I=0,b=0,d=null,s=false;for(var D=0,F=H.length;D<F;D++){var c=k[D+1];if(c){var y=H[D],f=y.length,h=parseInt(c,10);switch(y){case"dd":case"d":J=h;if(this.outOfRange(J,1,31)){return null}break;case"MMM":case"MMMM":K=this.getMonthIndex(r,c,f===3);if(this.outOfRange(K,0,11)){return null}break;case"M":case"MM":K=h-1;if(this.outOfRange(K,0,11)){return null}break;case"y":case"yy":case"yyyy":p=f<4?this.expandYear(r,h):h;if(this.outOfRange(p,0,9999)){return null}break;case"h":case"hh":g=h;if(g===12){g=0}if(this.outOfRange(g,0,11)){return null}break;case"H":case"HH":g=h;if(this.outOfRange(g,0,23)){return null}break;case"m":case"mm":B=h;if(this.outOfRange(B,0,59)){return null}break;case"s":case"ss":I=h;if(this.outOfRange(I,0,59)){return null}break;case"tt":case"t":s=r.PM&&(c===r.PM[0]||c===r.PM[1]||c===r.PM[2]);if(!s&&(!r.AM||(c!==r.AM[0]&&c!==r.AM[1]&&c!==r.AM[2]))){return null}break;case"f":case"ff":case"fff":b=h*Math.pow(10,3-f);if(this.outOfRange(b,0,999)){return null}break;case"ddd":case"dddd":q=this.getDayIndex(r,c,f===3);if(this.outOfRange(q,0,6)){return null}break;case"zzz":var e=c.split(/:/);if(e.length!==2){return null}C=parseInt(e[0],10);if(this.outOfRange(C,-12,13)){return null}var n=parseInt(e[1],10);if(this.outOfRange(n,0,59)){return null}d=(C*60)+(startsWith(c,"-")?-n:n);break;case"z":case"zz":C=h;if(this.outOfRange(C,-12,13)){return null}d=C*60;break;case"g":case"gg":var t=c;if(!t||!r.eras){return null}t=trim(t.toLowerCase());for(var E=0,A=r.eras.length;E<A;E++){if(t===r.eras[E].name.toLowerCase()){x=E;break}}if(x===null){return null}break}}}var o=new Date(),w,m=r.convert;w=o.getFullYear();if(p===null){p=w}else{if(r.eras){p+=r.eras[(x||0)].offset}}if(K===null){K=0}if(J===null){J=1}if(m){o=m.toGregorian(p,K,J);if(o===null){return null}}else{o.setFullYear(p,K,J);if(o.getDate()!==J){return null}if(q!==null&&o.getDay()!==q){return null}}if(s&&g<12){g+=12}o.setHours(g,B,I,b);if(d!==null){var v=o.getMinutes()-(d+o.getTimezoneOffset());o.setHours(o.getHours()+parseInt(v/60,10),v%60)}return o},cleardatescache:function(){this.datescache=new Array()},formatdate:function(u,y,p){if(p==undefined||p==null){p=this.defaultcalendar()}if(typeof u==="string"){return u}var e=u.toString()+"_"+y;if(this.datescache&&this.datescache[e]){return this.datescache[e]}if(!y||!y.length||y==="i"){var A;A=this.formatDate(u,p.patterns.F,culture);return A}var v=p.eras,c=y==="s";y=this.expandFormat(p,y);A=[];var h,w=["0","00","000"],l,m,b=/([^d]|^)(d|dd)([^d]|$)/g,z=0,r=this.getTokenRegExp(),d;function j(B,E){var D,C=B+"";if(E>1&&C.length<E){D=(w[E-2]+C);return D.substr(D.length-E,E)}else{D=C}return D}function x(){if(l||m){return l}l=b.test(y);m=true;return l}function f(C,B){if(d){return d[B]}if(C.getMonth!=undefined){switch(B){case 0:return C.getFullYear();case 1:return C.getMonth();case 2:return C.getDate()}}}for(;;){var i=r.lastIndex,q=r.exec(y);var n=y.slice(i,q?q.index:y.length);z+=this.appendPreOrPostMatch(n,A);if(!q){break}if(z%2){A.push(q[0]);continue}var s=q[0],g=s.length;switch(s){case"ddd":case"dddd":var o=(g===3)?p.days.namesAbbr:p.days.names;A.push(o[u.getDay()]);break;case"d":case"dd":l=true;A.push(j(f(u,2),g));break;case"MMM":case"MMMM":var t=f(u,1);A.push(p.months[g===3?"namesAbbr":"names"][t]);break;case"M":case"MM":A.push(j(f(u,1)+1,g));break;case"y":case"yy":case"yyyy":t=this.getEraYear(u,p,this.getEra(u,v),c);if(g<4){t=t%100}A.push(j(t,g));break;case"h":case"hh":h=u.getHours()%12;if(h===0){h=12}A.push(j(h,g));break;case"H":case"HH":A.push(j(u.getHours(),g));break;case"m":case"mm":A.push(j(u.getMinutes(),g));break;case"s":case"ss":A.push(j(u.getSeconds(),g));break;case"t":case"tt":t=u.getHours()<12?(p.AM?p.AM[0]:" "):(p.PM?p.PM[0]:" ");A.push(g===1?t.charAt(0):t);break;case"f":case"ff":case"fff":A.push(j(u.getMilliseconds(),3).substr(0,g));break;case"z":case"zz":h=u.getTimezoneOffset()/60;A.push((h<=0?"+":"-")+j(Math.floor(Math.abs(h)),g));break;case"zzz":h=u.getTimezoneOffset()/60;A.push((h<=0?"+":"-")+j(Math.floor(Math.abs(h)),2)+":"+j(Math.abs(u.getTimezoneOffset()%60),2));break;case"g":case"gg":if(p.eras){A.push(p.eras[getEra(u,v)].name)}break;case"/":A.push(p["/"]);break;default:throw"Invalid date format pattern '"+s+"'.";break}}var k=A.join("");if(!this.datescache){this.datescache=new Array()}this.datescache[e]=k;return k}})})(jQuery);
    (function(a){a.jqx.jqxWidget("jqxChart","",{});a.extend(a.jqx._jqxChart.prototype,{createInstance:function(d){if(!a.jqx.dataAdapter){throw"jqxdata.js is not loaded";return}this._refreshOnDownloadComlete();var c=this;this.host.on("mousemove",function(f){if(c.enabled==false){return}f.preventDefault();var e=f.pageX||f.clientX||f.screenX;var h=f.pageY||f.clientY||f.screenY;var g=c.host.offset();e-=g.left;h-=g.top;c.onmousemove(e,h)});this.host.on("mouseleave",function(e){if(c.enabled==false){return}c._cancelTooltipTimer();c._hideToolTip()});this.host.on("click",function(f){if(c.enabled==false){return}c._cancelTooltipTimer();c._hideToolTip();if(c._pointMarker&&c._pointMarker.element){var g=c.seriesGroups[c._pointMarker.gidx];var e=g.series[c._pointMarker.sidx];c._raiseEvent("click",g,e,c._pointMarker.iidx)}});if(this.element.style){var b=false;if(this.element.style.width!=null){b|=this.element.style.width.toString().indexOf("%")!=-1}if(this.element.style.height!=null){b|=this.element.style.height.toString().indexOf("%")!=-1}if(b){a(window).resize(function(){if(c.timer){clearTimeout(c.timer)}var e=a.jqx.browser.msie?200:1;c.timer=setTimeout(function(){var f=c.enableAnimations;c.enableAnimations=false;c.refresh();c.enableAnimations=f},e)})}}},_refreshOnDownloadComlete:function(){if(this.source instanceof a.jqx.dataAdapter){var c=this;var d=this.source._options;if(d==undefined||(d!=undefined&&!d.autoBind)){this.source.autoSync=false;this.source.dataBind()}if(this.source.records.length==0){var b=function(){if(c.ready){c.ready()}c.refresh()};this.source.unbindDownloadComplete(this.element.id);this.source.bindDownloadComplete(this.element.id,b)}else{if(c.ready){c.ready()}}this.source.unbindBindingUpdate(this.element.id);this.source.bindBindingUpdate(this.element.id,function(){c.refresh()})}},defineInstance:function(){this.source=new Array();this.seriesGroups=new Array();this.categoryAxis={}},propertyChangedHandler:function(b,c,e,d){if(this.isInitialized==undefined||this.isInitialized==false){return}if(c=="source"){this._refreshOnDownloadComlete()}this.refresh()},_internalRefresh:function(){this._stopAnimations();this.host.empty();this._renderData=new Array();var c=null;if(document.createElementNS&&(this.renderEngine=="SVG"||this.renderEngine==undefined)){c=new a.jqx.svgRenderer();if(!c.init(this.host)){if(this.renderEngine=="SVG"){throw"Your browser does not support SVG"}return}}if(c==null&&this.renderEngine!="HTML5"){c=new a.jqx.vmlRenderer();if(!c.init(this.host)){if(this.renderEngine=="VML"){throw"Your browser does not support VML"}return}this._isVML=true}if(c==null&&(this.renderEngine=="HTML5"||this.renderEngine==undefined)){c=new a.jqx.HTML5Renderer();if(!c.init(this.host)){throw"Your browser does not support HTML5 Canvas"}}this.renderer=c;var b=this.renderer.getRect();this._render({x:1,y:1,width:b.width,height:b.height});if(this.renderer instanceof a.jqx.HTML5Renderer){this.renderer.refresh()}},saveAsPNG:function(c,b){return this._saveAsImage("png",c,b)},saveAsJPEG:function(c,b){return this._saveAsImage("jpeg",c,b)},_saveAsImage:function(j,g,l){if(g==undefined||g==""){g="chart."+j}if(l==undefined||l==""){l="http://www.jqwidgets.com/export_server/export.php"}var k=this.rendererEngine;var f=this.enableAnimations;this.enableAnimations=false;this.renderEngine="HTML5";if(this.renderEngine!=k){try{this.refresh()}catch(i){this.renderEngine=k;this.refresh();this.enableAnimations=f}}try{var d=this.renderer.getContainer()[0];if(d){var h=d.toDataURL("image/"+j);h=h.replace("data:image/"+j+";base64,","");var c=document.createElement("form");c.method="POST";c.action=l;c.style.display="none";document.body.appendChild(c);var m=document.createElement("input");m.name="fname";m.value=g;m.style.display="none";var b=document.createElement("input");b.name="content";b.value=h;b.style.display="none";c.appendChild(m);c.appendChild(b);c.submit();document.body.removeChild(c)}}catch(i){}if(this.renderEngine!=k){this.renderEngine=k;this.refresh();this.enableAnimations=f}return true},refresh:function(){this._internalRefresh()},_seriesTypes:["line","stackedline","stackedline100","spline","stackedspline","stackedspline100","stepline","stackedstepline","stackedstepline100","area","stackedarea","stackedarea100","splinearea","stackedsplinearea","stackedsplinearea100","steparea","stackedsteparea","stackedsteparea100","column","stackedcolumn","stackedcolumn100","pie","donut","scatter","bubble"],_render:function(z){this.renderer.clear();var k=this.backgroundImage;if(k==undefined||k==""){this.host.css({"background-image":""})}else{this.host.css({"background-image":(k.indexOf("(")!=-1?k:"url('"+k+"')")})}this._buildStats();var M=this.padding||{left:5,top:5,right:5,bottom:5};var U=this.renderer.rect(z.x,z.y,z.width-1,z.height-1);var E=this.renderer.beginGroup();var n=this.renderer.createClipRect(z);this.renderer.setClip(E,n);if(k==undefined||k==""){this.renderer.attr(U,{fill:this.background||this.backgroundColor||"white"})}else{this.renderer.attr(U,{fill:"transparent"})}if(this.showBorderLine!=false){var B=this.borderLineColor==undefined?this.borderColor:this.borderLineColor;if(B==undefined){B="#888888"}var l=this.borderLineWidth;if(isNaN(l)||l<0.5||l>10){l=1}this.renderer.attr(U,{"stroke-width":l,stroke:B})}var K={x:M.left,y:M.top,width:z.width-M.left-M.right,height:z.height-M.top-M.bottom};this._paddedRect=K;var e=this.titlePadding||{left:2,top:2,right:2,bottom:2};if(this.title&&this.title.length>0){var I=this.toThemeProperty("jqx-chart-title-text",null);var j=this.renderer.measureText(this.title,0,{"class":I});this.renderer.text(this.title,K.x+e.left,K.y+e.top,K.width-(e.left+e.right),j.height,0,{"class":I},true,"center","center");K.y+=j.height;K.height-=j.height}if(this.description&&this.description.length>0){var J=this.toThemeProperty("jqx-chart-title-description",null);var j=this.renderer.measureText(this.description,0,{"class":J});this.renderer.text(this.description,K.x+e.left,K.y+e.top,K.width-(e.left+e.right),j.height,0,{"class":J},true,"center","center");K.y+=j.height;K.height-=j.height}if(this.title||this.description){K.y+=(e.bottom+e.top);K.height-=(e.bottom+e.top)}var b={x:K.x,y:K.y,width:K.width,height:K.height};var C=this._isPieOnlySeries();var s={};for(var N=0;N<this.seriesGroups.length&&!C;N++){if(this.seriesGroups[N].type=="pie"||this.seriesGroups[N].type=="donut"){continue}var A=this.seriesGroups[N].orientation=="horizontal";var t=this.seriesGroups[N].valueAxis;if(!t){throw"seriesGroup["+N+"] is missing "+(A?"categoryAxis":"valueAxis")+" definition"}var d=this._getCategoryAxis(N);if(!d){throw"seriesGroup["+N+"] is missing "+(!A?"categoryAxis":"valueAxis")+" definition"}var r=d==this.categoryAxis?-1:N;s[r]=0}var o=0;var m=[];for(var N=0;N<this.seriesGroups.length;N++){if(this.seriesGroups[N].type=="pie"||this.seriesGroups[N].type=="donut"){m.push(0);continue}var A=this.seriesGroups[N].orientation=="horizontal";var r=this._getCategoryAxis(N)==this.categoryAxis?-1:N;var H=t.axisSize;var f={x:0,y:b.y,width:b.width,height:b.height};if(!H||H=="auto"){if(A){H=this._renderCategoryAxis(N,f,true,b).width;if((s[r]&1)==1){H=0}else{s[r]|=1}}else{H=this._renderValueAxis(N,f,true,b).width}}if(N>0&&H>0){o+=5}m.push(H);o+=H}var Q=0;var L=[];for(var N=0;N<this.seriesGroups.length;N++){if(this.seriesGroups[N].type=="pie"||this.seriesGroups[N].type=="donut"){L.push(0);continue}var A=this.seriesGroups[N].orientation=="horizontal";var d=this._getCategoryAxis(N);var r=d==this.categoryAxis?-1:N;var P=d.axisSize;if(!P||P=="auto"){if(A){P=this._renderValueAxis(N,{x:0,y:0,width:10000000,height:0},true,b).height}else{P=this._renderCategoryAxis(N,{x:0,y:0,width:10000000,height:0},true).height;if((s[r]&2)==2){P=0}else{s[r]|=2}}}L.push(P+5);Q+=P+5}this._plotRect=b;var q=(this.showLegend!=false);var u=!q||this.legendLayout?{width:0,height:0}:this._renderLegend(K,true);if(K.height<Q+u.height||K.width<o){return}b.height-=Q+u.height;if(!this.rtl){b.x+=o}b.width-=o;if(!C){var S=this.categoryAxis.tickMarksColor||"#888888";if(o==0){var G=a.jqx._ptrnd(b.x)}var P=0;for(var N=0;N<this.seriesGroups.length;N++){var A=this.seriesGroups[N].orientation=="horizontal";var r=this._getCategoryAxis(N)==this.categoryAxis?-1:N;var f={x:b.x,y:b.y+b.height+P,width:b.width,height:L[N]-5};if(A){this._renderValueAxis(N,f,false,b)}else{if((s[r]&4)==4){continue}this._renderCategoryAxis(N,f,false,b);s[r]|=4}P+=L[N]}}if(q){var G=b.x+a.jqx._ptrnd((b.width-u.width)/2);var F=b.y+b.height+Q;var H=b.width;var P=u.height;if(this.legendLayout){G=this.legendLayout.left||G;F=this.legendLayout.top||F;H=this.legendLayout.width||H;P=this.legendLayout.height||P}if(G+H>K.x+K.width){H=K.x+K.width-G}if(F+P>K.y+K.height){P=K.y+K.height-F}this._renderLegend({x:G,y:F,width:H,height:P})}this._hasHorizontalLines=false;if(!C){var v=b.x-o;for(var N=0;N<this.seriesGroups.length;N++){var A=this.seriesGroups[N].orientation=="horizontal";var H=m[N];if(N>0&&H>0){v+=5}var f={x:v,y:b.y,width:H,height:b.height};if(A){if((s[this._getCategoryAxis(N)]&8)==8){continue}this._renderCategoryAxis(N,f,false,b);s[this._getCategoryAxis(N)]|=8}else{this._renderValueAxis(N,f,false,b)}v+=H}}if(b.width<=0||b.height<=0){return}this._plotRect={x:b.x,y:b.y,width:b.width,height:b.height};var R=this.renderer.beginGroup();var D=this.renderer.createClipRect({x:b.x,y:b.y,width:b.width,height:b.height});this.renderer.setClip(R,D);this._createAnimationGroup("series");for(var N=0;N<this.seriesGroups.length;N++){var p=this.seriesGroups[N];var c=false;for(var T in this._seriesTypes){if(this._seriesTypes[T]==p.type){c=true;break}}if(!c){throw'jqxChart: invalid series type "'+p.type+'"';continue}if(p.type.indexOf("column")!=-1){this._renderColumnSeries(N,b)}else{if(p.type.indexOf("pie")!=-1||p.type.indexOf("donut")!=-1){this._renderPieSeries(N,b)}else{if(p.type.indexOf("line")!=-1||p.type.indexOf("area")!=-1){this._renderLineSeries(N,b)}else{if(p.type=="scatter"||p.type=="bubble"){this._renderScatterSeries(N,b)}}}}}this._startAnimation("series");this.renderer.endGroup();if(this.enabled==false){var O=this.renderer.rect(z.x,z.y,z.width,z.height);this.renderer.attr(O,{fill:"#777777",opacity:0.5,stroke:"#00FFFFFF"})}this.renderer.endGroup()},_isPieOnlySeries:function(){if(this.seriesGroups.length==0){return false}for(var b=0;b<this.seriesGroups.length;b++){if(this.seriesGroups[b].type!="pie"&&this.seriesGroups[b].type!="donut"){return false}}return true},_renderChartLegend:function(v,c,d,e){var n={x:c.x+3,y:c.y+3,width:c.width-6,height:c.height-6};var j={width:n.width,height:0};var h=0,g=0;var f=20;var b=0;var o=10;var u=10;var s=0;for(var q=0;q<v.length;q++){var k=v[q].css;if(!k){k=this.toThemeProperty("jqx-chart-legend-text",null)}var l=v[q].text;var m=this.renderer.measureText(l,0,{"class":k});if(m.height>f){f=m.height}if(m.width>s){s=m.width}if(e){if(q!=0){g+=f}if(g>n.height){g=0;h+=s+u;s=m.width;j.width=h+s}}else{if(h!=0){h+=u}if(h+2*o+m.width>n.width&&m.width<n.width){h=0;g+=f;f=20;b=n.width;j.heigh=g+f}}if(!d){var p=v[q].color;var t=this.renderer.rect(n.x+h,n.y+g+o/2,o,o);this.renderer.attr(t,{fill:p,stroke:p,"stroke-width":1});this.renderer.text(l,n.x+h+1.5*o,n.y+g,m.width,f,0,{"class":k},false,"center","center")}if(e){}else{h+=m.width+2*o;if(b<h){b=h}}}if(d){j.height=a.jqx._ptrnd(g+f);j.width=a.jqx._ptrnd(b);return j}},_renderLegend:function(n,l){var b=[];for(var r=0;r<this.seriesGroups.length;r++){var j=this.seriesGroups[r];if(j.showLegend==false){continue}var h=this._getCategoryAxis(r);var p=h.toolTipFormatSettings||h.formatSettings;var e=h.toolTipFormatFunction||h.formatFunction;for(var o=0;o<j.series.length;o++){var t=j.series[o];if(t.showLegend==false){continue}if(j.type=="pie"||j.type=="donut"){var m=t.colorScheme||j.colorScheme||this.colorScheme;var c=this._getDataLen(r);for(var f=0;f<c;f++){var k=this._getDataValue(f,t.displayText,r);k=this._formatValue(k,p,e);var d=this._getColor(m,o*c+f,r,o);b.push({groupIndex:r,seriesIndex:o,itemIndex:f,text:k,css:t.displayTextClass,color:d})}continue}var q=t.displayText||t.dataField||"";var d=this._getSeriesColor(r,o);b.push({groupIndex:r,seriesIndex:o,text:q,css:t.displayTextClass,color:d})}}return this._renderChartLegend(b,n,l,(this.legendLayout&&this.legendLayout.flow=="vertical"))},_renderCategoryAxis:function(j,f,h,k){var g=this._getCategoryAxis(j);var d=this.seriesGroups[j].orientation=="horizontal";var s={width:0,height:0};if(!g||g.visible==false){return s}var u=g.text;var D={visible:(g.showGridLines!=false),color:(g.gridLinesColor||"#888888"),unitInterval:(g.gridLinesInterval||g.unitInterval)};var q={visible:(g.showTickMarks!=false),color:(g.tickMarksColor||"#888888"),unitInterval:(g.tickMarksInterval||g.unitInterval)};var E=g.textRotationAngle||0;var G=f;if(d){G={x:f.x,y:f.y,width:f.height,height:f.width}}var n=this._calculateXOffsets(j,G);var z=g.unitInterval;if(isNaN(z)){z=1}var F=g.horizontalTextAlignment;var p=this._alignValuesWithTicks(j);var m=this.renderer.getRect();var c=m.width-f.x-f.width;var C=this._getDataLen(j);var w=[];if(g.type!="date"){var A=n.customRange!=false;var o=z;for(var B=n.min;B<=n.max;B+=o){if(A||g.dataField==undefined||g.dataField==""){value=B}else{var v=Math.round(B);value=this._getDataValue(v,g.dataField)}var u=this._formatValue(value,g.formatSettings,g.formatFunction);if(u==undefined){u=!A?value.toString():(B).toString()}w.push(u);if(B+o>n.max){o=n.max-B;if(o<=z/2){break}}}}else{var e=this._getDatesArray(n.min,n.max,g.baseUnit,p);for(var B=0;B<e.length;B+=z){w.push(this._formatValue(e[B],g.formatSettings,g.formatFunction))}}if(g.flip==true||this.rtl){w.reverse()}var l=g.descriptionClass;if(!l){l=this.toThemeProperty("jqx-chart-axis-description",null)}var t=g["class"];if(!t){t=this.toThemeProperty("jqx-chart-axis-text",null)}if(d){E-=90}var r={text:g.description,style:l,halign:g.horizontalDescriptionAlignment||"center",valign:g.verticalDescriptionAlignment||"center",textRotationAngle:d?-90:0};var b={textRotationAngle:E,style:t,halign:F,valign:g.verticalTextAlignment||"center"};return this._renderAxis(d,r,b,{x:f.x,y:f.y,width:f.width,height:f.height},k,z,false,p,w,n,D,q,h)},_renderAxis:function(F,P,l,u,c,D,k,Q,q,s,d,v,O){var m=v.visible?4:0;var L=2;var E={width:0,height:0};var o={width:0,height:0};if(F){E.height=o.height=u.height}else{E.width=o.width=u.width}if(P.text!=undefined&&P!=""){var p=P.textRotationAngle;var f=this.renderer.measureText(P.text,p,{"class":P.style});o.width=f.width;o.height=f.height;if(!O){this.renderer.text(P.text,u.x+(F?(!this.rtl?L:3*L+u.width+o.width+m):0),u.y+(!F?u.height-L-o.height:0),F?o.width:u.width,!F?o.height:u.height,p,{"class":P.style},true,P.halign,P.valign)}}var K=0;var r=Q?-s.itemWidth/2:0;if(Q&&!F){l.halign="center"}var N=0;var J=0;var b=s.itemWidth;for(var M=0;M<q.length;M++,K+=b){var t=q[M];var z=l.textRotationAngle;var f=this.renderer.measureText(t,z,{"class":l.style});if(f.width>J){J=f.width}if(f.height>N){N=f.height}if(!O&&(!f||(!F&&K+f.width+r<u.x+u.width)||(F&&K+f.height+r<c.y+c.height))){var H=u.x+K+r;var G=u.y+(Q?m:m/4);if(F){H=u.x+L+(o.width>0?(o.width+L):0)+(this.rtl?u.width-o.width:0);G=u.y+K+r}if(!k||(k&&(M%D)==0)){this.renderer.text(t,H,G,!F?b:u.width-2*L-m-((o.width>0)?o.width+L:0),F?b:u.height-2*L-m-((o.height>0)?o.height+L:0),z,{"class":l.style},true,l.halign,l.valign)}}}E.width+=2*L+m+o.width+J+(F&&o.width>0?L:0);E.height+=2*L+m+o.height+N+(!F&&o.height>0?L:0);var B={};if(!O){var G=a.jqx._ptrnd(u.y);if(F){this.renderer.line(a.jqx._ptrnd(u.x+u.width),u.y,a.jqx._ptrnd(u.x+u.width),u.y+u.height,{stroke:d.color,"stroke-width":1})}else{this.renderer.line(a.jqx._ptrnd(u.x),G,a.jqx._ptrnd(u.x+u.width+1),G,{stroke:d.color,"stroke-width":1})}}if(!O&&d.visible!=false){var j=d.unitInterval;if(isNaN(j)||j<=0){j=D}var n=k?q.length:s.rangeLength;var A=k?1:j;var C=k?b:(F?u.height:u.width)/s.rangeLength;var M=0;while(M<=n){if(k&&(M%j)!=0){M+=A;continue}var g=0;if(F){g=a.jqx._ptrnd(u.y+M*C);if(g>u.y+u.height){break}}else{g=a.jqx._ptrnd(u.x+M*C);if(g>u.x+u.width){break}}if(F){this.renderer.line(a.jqx._ptrnd(c.x),g,a.jqx._ptrnd(c.x+c.width),g,{stroke:d.color,"stroke-width":1})}else{this.renderer.line(g,a.jqx._ptrnd(c.y),g,a.jqx._ptrnd(c.y+c.height),{stroke:d.color,"stroke-width":1})}B[g]=true;M+=A;if(M>n&&M!=n+A){M=n}}}if(!O&&v.visible){var I=v.unitInterval;if(isNaN(I)||I<=0){I=D}var n=k?q.length:s.rangeLength+I;var A=k?1:I;var C=k?b:(F?u.height:u.width)/s.rangeLength;for(var M=0;M<=n;M+=A){if(k&&(M%I/D)!=0){continue}var g=a.jqx._ptrnd((F?u.y:u.x)+M*C);if(B[g-1]){g--}else{if(B[g+1]){g++}}if(F){if(g>u.y+u.height){break}}else{if(g>u.x+u.width){break}}if(F){var e=!this.rtl?-m:m;this.renderer.line(u.x+u.width,g,u.x+u.width+e,g,{stroke:d.color,"stroke-width":1})}else{this.renderer.line(g,u.y,g,u.y+m,{stroke:d.color,"stroke-width":1})}}}E.width=a.jqx._rup(E.width);E.height=a.jqx._rup(E.height);return E},_renderValueAxis:function(m,f,k,n){var J=this.seriesGroups[m];var c=J.orientation=="horizontal";var j=J.valueAxis;if(!j){throw"SeriesGroup "+m+" is missing valueAxis definition"}var w={width:0,height:0};if(this._isPieOnlySeries()){if(k){return w}return}var u=this._stats.seriesGroups[m];if(!u||!u.isValid||false==j.displayValueAxis||false==j.visible){if(k){return w}return}var o=j.descriptionClass;if(!o){o=this.toThemeProperty("jqx-chart-axis-description",null)}var v={text:j.description,style:o,halign:j.horizontalDescriptionAlignment||"center",valign:j.verticalDescriptionAlignment||"center",textRotationAngle:c?0:(!this.rtl?-90:90)};var z=j.itemsClass;if(!z){z=this.toThemeProperty("jqx-chart-axis-text",null)}var b={style:z,halign:j.horizontalTextAlignment||"center",valign:j.verticalTextAlignment||"center",textRotationAngle:j.textRotationAngle||0};var q=j.valuesOnTicks!=false;var e=j.dataField;var B=u.intervals;var G=u.min;var E=u.mu;var I=j.formatSettings;var h=J.type.indexOf("stacked")!=-1&&J.type.indexOf("100")!=-1;if(h&&!I){I={sufix:"%"}}if(!q){B=Math.max(B-1,1)}var d=j.logarithmicScale==true;var l=j.logarithmicScaleBase||10;if(d){E=!isNaN(j.unitInterval)?j.unitInterval:1}var D=(c?f.width:f.height)/B;var t=f.y+f.height-D;var C=[];var p={};p.data=[];p.itemWidth=D;for(var H=0;H<=B;H++){var F=0;if(d){if(h){F=u.max/Math.pow(l,B-H)}else{F=G*Math.pow(l,H)}}else{F=q?G+H*E:G+(H+0.5)*E}var A=(j.formatFunction)?j.formatFunction(F):this._formatNumber(F,I);C.push(A);p.data.push(t+D/2);t-=D}p.rangeLength=d&&!h?u.intervals:(u.intervals)*E;if(J.valueAxis.flip!=true){p.data=p.data.reverse();C=C.reverse()}var L=j.gridLinesInterval||j.unitInterval;if(isNaN(L)||(d&&L<E)){L=E}var K={visible:(j.showGridLines!=false),color:(j.gridLinesColor||"#888888"),unitInterval:L};var s=j.tickMarksInterval||j.unitInterval;if(isNaN(s)||(d&&s<E)){s=E}var r={visible:(j.showTickMarks!=false),color:(j.tickMarksColor||"#888888"),unitInterval:s};if(this.rtl){f.x=n.width+f.x}return this._renderAxis(!c,v,b,f,n,E,d,q,C,p,K,r,k)},_buildStats:function(){var N={seriesGroups:new Array()};this._stats=N;for(var J=0;J<this.seriesGroups.length;J++){var r=this.seriesGroups[J];N.seriesGroups[J]={};var f=N.seriesGroups[J];f.isValid=true;var b=r.valueAxis!=undefined;var e=false;var l=10;if(b){e=r.valueAxis.logarithmicScale==true;l=r.valueAxis.logarithmicScaleBase;if(isNaN(l)){l=10}}var t=-1!=r.type.indexOf("stacked");var j=t&&-1!=r.type.indexOf("100");if(j){f.psums=new Array();f.nsums=new Array()}var d=NaN,h=NaN;var L=NaN,O=NaN;var K=r.baselineValue;if(isNaN(K)){K=e&&!j?1:0}var I=this._getDataLen(J);var o=0;var D=NaN;for(var H=0;H<I&&f.isValid;H++){var E=b?r.valueAxis.minValue:Infinity;var G=b?r.valueAxis.maxValue:-Infinity;var m=0,n=0;for(var z=0;z<r.series.length;z++){var P=this._getDataValueAsNumber(H,r.series[z].dataField,J);if(isNaN(P)||(e&&P<=0)){continue}if((isNaN(G)||P>G)&&((!b||isNaN(r.valueAxis.maxValue))?true:P<=r.valueAxis.maxValue)){G=P}if((isNaN(E)||P<E)&&((!b||isNaN(r.valueAxis.minValue))?true:P>=r.valueAxis.minValue)){E=P}if(P>K){m+=P}else{if(P<K){n+=P}}}if(e&&j){for(var z=0;z<r.series.length;z++){var P=this._getDataValueAsNumber(H,r.series[z].dataField,J);if(isNaN(P)||P<=0){continue}var C=m==0?0:P/m;if(isNaN(D)||C<D){D=C}}}var w=m-n;if(o<w){o=w}if(j){f.psums[H]=m;f.nsums[H]=n}if(G>h||isNaN(h)){h=G}if(E<d||isNaN(d)){d=E}if(m>L||isNaN(L)){L=m}if(n<O||isNaN(O)){O=n}}if(j){L=L==0?0:Math.max(L,-O);O=O==0?0:Math.min(O,-L)}var B=b?r.valueAxis.unitInterval:0;if(!B){B=t?(L-O)/10:(h-d)/10}var k=NaN;var c=0;var A=0;if(e){if(j){k=0;var C=1;c=A=a.jqx.log(100,l);while(C>D){C/=l;c--;k++}d=Math.pow(l,c)}else{if(t){h=Math.max(h,L)}A=a.jqx._rnd(a.jqx.log(h,l),1,true);h=Math.pow(l,A);c=a.jqx._rnd(a.jqx.log(d,l),1,false);d=Math.pow(l,c)}B=l}var q=b?r.valueAxis.tickMarksInterval||B:0;var M=b?r.valueAxis.gridLinesInterval||B:0;if(d<O){O=d}if(h>L){L=h}var F=e?d:a.jqx._rnd(t?O:d,B,false);var v=e?h:a.jqx._rnd(t?L:h,B,true);if(j&&v>100){v=100}if(j&&!e){v=(v>0)?100:0;F=(F<0)?-100:0;B=b?r.valueAxis.unitInterval:10;if(isNaN(B)||B<=0||B>=100){B=10}if(q<=0||q>=100){q=10}if(M<=0||M>=100){M=10}}if(isNaN(v)||isNaN(F)||isNaN(B)){continue}if(isNaN(k)){k=(v-F)/(B==0?1:B)}if(e&&!j){k=A-c;o=Math.pow(l,k)}if(k<1){continue}var u=v-F;f.rmax=t?L:h;f.rmin=t?O:d;f.min=F;f.max=v;f.minPow=c;f.maxPow=A;f.mu=B;f.maxRange=o;f.intervals=k;f.tickMarksInterval=q;f.tickMarksIntervals=q==0?0:u/q;f.gridLinesInterval=M;f.gridLinesIntervals=M==0?0:u/M;if(u==0){u=1}f.scale=t?(L-O)/u:(h-d)/u}},_getDataLen:function(c){var b=this.source;if(c!=undefined&&c!=-1&&this.seriesGroups[c].source){b=this.seriesGroups[c].source}if(b instanceof a.jqx.dataAdapter){b=b.records}if(b){return b.length}return 0},_getDataValue:function(b,e,d){var c=this.source;if(d!=undefined&&d!=-1){c=this.seriesGroups[d].source||c}if(c instanceof a.jqx.dataAdapter){c=c.records}if(!c||b<0||b>c.length-1){return NaN}return(e&&e!="")?c[b][e]:c[b]},_getDataValueAsNumber:function(b,e,c){var d=this._getDataValue(b,e,c);if(this._isDate(d)){return d.valueOf()}if(typeof(d)!="number"){d=parseFloat(d)}if(typeof(d)!="number"){d=undefined}return d},_renderPieSeries:function(d,D){var n=this._getDataLen(d);var r=this.seriesGroups[d];while(this._renderData.length<d+1){this._renderData.push(null)}this._renderData[d]=[];for(var g=0;g<r.series.length;g++){var J=r.series[g];var q=J.colorScheme||r.colorScheme||this.colorScheme;var h=J.initialAngle||0;var O=h;var L=J.radius||Math.min(D.width,D.height)*0.4;if(isNaN(L)){L=1}var b=J.innerRadius||0;if(isNaN(b)||b>=L){b=0}var e=J.centerOffset||0;var I=a.jqx.getNum([J.offsetX,r.offsetX,D.width/2]);var G=a.jqx.getNum([J.offsetY,r.offsetY,D.height/2]);var E=this._getAnimProps(d,g);var w=E.enabled&&n<5000&&this._isVML!=true?E.duration:0;if(a.jqx.mobile.isMobileBrowser()&&(this.renderer instanceof a.jqx.HTML5Renderer)){w=0}this._renderData[d].push([]);var m=0;var o=0;for(var Q=0;Q<n;Q++){var C=this._getDataValueAsNumber(Q,J.dataField,d);if(typeof(C)!="number"){continue}if(C>0){m+=C}else{o+=C}}var l=m-o;if(l==0){l=1}for(var Q=0;Q<n;Q++){var C=this._getDataValueAsNumber(Q,J.dataField,d);if(typeof(C)!="number"){continue}var p=Math.round(Math.abs(C)/l*360);if(Q+1==n){p=360+h-O}var H=D.x+I;var F=D.y+G;var M={x1:H,y1:F,innerRadius:b,outerRadius:L,key:d+"_"+g+"_"+Q};this._renderData[d][g].push(M);var N=this.renderer.pieslice(H,F,b,L,O,w==0?O+p:O,e);var S=e;if(a.isFunction(e)){S=e({seriesIndex:g,seriesGroupIndex:d,itemIndex:Q})}if(isNaN(S)){S=0}var t={x:H,y:F,innerRadius:b,outerRadius:L,fromAngle:O,toAngle:O+p,centerOffset:S};var k=this;this._enqueueAnimation("series",N,undefined,w,function(T,i,U){var s=i.fromAngle+U*(i.toAngle-i.fromAngle);var V=k.renderer.pieSlicePath(i.x,i.y,i.innerRadius,i.outerRadius,i.fromAngle,s,i.centerOffset);k.renderer.attr(T,{d:V})},t);var K=this._getColors(d,g,Q,"radialGradient",L);this.renderer.attr(N,{fill:K.fillColor,stroke:K.lineColor,"stroke-width":1});var u=O,P=O+p;var A=Math.abs(u-P);var R=A>180?1:0;if(A>360){u=0;P=360}var f=u*Math.PI*2/360;var v=P*Math.PI*2/360;var B=A/2+u;var c=B*Math.PI*2/360;var j=this._showLabel(d,g,Q,{x:0,y:0,width:0,height:0},"left","top",true);var z=J.labelRadius||L+Math.max(j.width,j.height);z+=e;var H=a.jqx._ptrnd(D.x+I+z*Math.cos(c)-j.width/2);var F=a.jqx._ptrnd(D.y+G-z*Math.sin(c)-j.height/2);this._showLabel(d,g,Q,{x:H,y:F,width:j.width,height:j.height},"left","top");this._installHandlers(N,d,g,Q);O+=p}}},_renderColumnSeries:function(g,c){var r=this.seriesGroups[g];if(!r.series||r.series.length==0){return}var t=r.type.indexOf("stacked")!=-1;var e=t&&r.type.indexOf("100")!=-1;var q=this._getDataLen(g);var N=r.columnsGapPercent;if(isNaN(N)||N<0||N>100){N=25}var A=r.seriesGapPercent;if(isNaN(A)||A<0||A>100){A=10}var f=r.orientation=="horizontal";var K=c;if(f){K={x:c.y,y:c.x,width:c.height,height:c.width}}var z=this._calcGroupOffsets(g,K);if(!z||z.xoffsets.length==0){return}for(var C=0;C<r.series.length;C++){var v=r.series[C];var F=v.dataField;var E=this._getAnimProps(g,C);var b=E.enabled&&z.xoffsets.length<100?E.duration:0;var p=this._alignValuesWithTicks(g);var o=[];for(var G=z.xoffsets.first;G<=z.xoffsets.last;G++){var O=this._getDataValueAsNumber(G,F,g);if(typeof(O)!="number"){continue}var J=z.xoffsets.data[G];if(p){J-=z.xoffsets.itemWidth/2}var I=J+z.xoffsets.itemWidth;var l=(I-J+1);var M=(I-J+1)/(1+N/100);var n=(!t&&r.series.length>1)?(M*A/100)/(r.series.length-1):0;var L=(M-n*(r.series.length-1));if(M<1){M=1}var k=0;if(!t&&r.series.length>1){L/=r.series.length;k=C}var u=J+(l-M)/2+k*(n+L);if(k==r.series.length){L=l-J+M-u}var d=z.offsets[C][G].to;var D=z.offsets[C][G].from;var j=z.baseOffset;var H=D-d;var m={x:c.x+u,y:Math.min(d,D),width:L,height:Math.abs(H)};if(f){m={height:L,y:c.y+u};m.x=D;m.width=Math.abs(H);if(H>0){m.x-=H}}o.push({itemIndex:G,rect:m,size:H,vertical:!f})}var B={groupIndex:g,seriesIndex:C,items:o};this._animateColumns(B,b==0?1:0);var w=this;this._enqueueAnimation("series",undefined,undefined,b,function(i,h,s){w._animateColumns(h,s)},B)}},_calcStackedItemSize:function(o,m,e,h){var c=this._renderData[o];var g=0,n=0;for(var f=0;f<c.offsets.length;f++){var i=Math.abs(c.offsets[f][e].to-c.offsets[f][e].from);if(c.offsets[f][e].to<c.baseOffset){g+=i}else{n+=i}}var b=n*h;var k=g*h;g=0;n=0;var j=0;for(var f=0;f<=m;f++){j=Math.abs(c.offsets[f][e].to-c.offsets[f][e].from);if(c.offsets[f][e].to<c.baseOffset){g+=j}else{n+=j}}var l=Math.abs(c.offsets[m][e].to-c.offsets[m][e].from);if(c.offsets[m][e].to>=c.baseOffset){g=n;k=b}if(k<g-l){return 0}if(k>=g){return l}return k-(g-l)},_animateColumns:function(c,f){var m=c.groupIndex;var k=c.seriesIndex;var l=this.seriesGroups[m];var o=l.series[k];var b=this._getColors(m,k,undefined,this._getGroupGradientType(m));var e=o.opacity||l.opacity;if(!e||e<0||e>1){e=1}var j=l.type.indexOf("stacked")!=-1;var g=c.items;for(var d=0;d<g.length;d++){var h=g[d].rect;var n=a.jqx._ptrnd(g[d].size*f);if(j){n=this._calcStackedItemSize(m,k,d,f);if(n==0){continue}if(g[d].size<0){n*=-1}}if(g[d].element==undefined){g[d].element=this.renderer.rect(h.x,h.y,g[d].vertical?h.width:0,g[d].vertical?0:h.height);this.renderer.attr(g[d].element,{fill:b.fillColor,"fill-opacity":e,stroke:b.lineColor,"stroke-width":1})}n=Math.abs(n);if(g[d].vertical==true){if(g[d].size<0){this.renderer.attr(g[d].element,{height:n})}else{this.renderer.attr(g[d].element,{y:h.y+h.height-n,height:n})}}else{if(g[d].size<0){this.renderer.attr(g[d].element,{width:n})}else{this.renderer.attr(g[d].element,{x:h.x+h.width-n,width:n})}}if(f==1){this._installHandlers(g[d].element,m,k,d);this._showLabel(m,k,d,h)}}},_renderScatterSeries:function(f,d){var m=this.seriesGroups[f];if(!m.series||m.series.length==0){return}var c=m.type=="bubble";var e=m.orientation=="horizontal";var G=d;if(e){G={x:d.y,y:d.x,width:d.height,height:d.width}}var v=this._calcGroupOffsets(f,G);if(!v||v.xoffsets.length==0){return}var k=this._alignValuesWithTicks(f);for(var z=0;z<m.series.length;z++){var o=this._getColors(f,z,undefined,this._getGroupGradientType(f));var q=m.series[z];var C=q.dataField;var g=q.opacity||m.opacity;if(!g||g<0||g>1){g=1}var A=NaN,D=NaN;if(c){for(var E=v.xoffsets.first;E<=v.xoffsets.last;E++){var J=this._getDataValueAsNumber(E,q.radiusDataField,f);if(typeof(J)!="number"){throw"Invalid radiusDataField value at ["+E+"]"}if(isNaN(A)||J<A){A=J}if(isNaN(D)||J>D){D=J}}}var l=q.minRadius;if(isNaN(l)){l=d.width/50}var j=q.maxRadius;if(isNaN(j)){j=d.width/25}if(l>j){throw"Invalid settings: minRadius must be less than or equal to maxRadius"}var h=q.radius||5;var B=this._getAnimProps(f,z);var b=B.enabled&&v.xoffsets.length<5000?B.duration:0;for(var E=v.xoffsets.first;E<=v.xoffsets.last;E++){var J=this._getDataValueAsNumber(E,C,f);if(typeof(J)!="number"){continue}var p=v.xoffsets.data[E];var n=v.offsets[z][E].to;if(isNaN(p)||isNaN(n)){continue}if(e){var H=p;p=n;n=H+d.y}else{p+=d.x}p=a.jqx._ptrnd(p);n=a.jqx._ptrnd(n);var t=h;if(c){var I=this._getDataValueAsNumber(E,q.radiusDataField,f);if(typeof(I)!="number"){continue}t=l+(j-l)*(I-A)/Math.max(1,D-A);if(isNaN(t)){t=l}}var F=this.renderer.circle(p,n,b==0?t:0);this.renderer.attr(F,{fill:o.fillColor,"fill-opacity":g,stroke:o.lineColor,"stroke-width":1});var w={from:0,to:t,groupIndex:f,seriesIndex:z,itemIndex:E,x:p,y:n};var u=this;this._enqueueAnimation("series",F,undefined,b,function(s,i,L){u._animR(s,i,L);if(L>=1){var K=c?i.to:0;u._showLabel(i.groupIndex,i.seriesIndex,i.itemIndex,{x:i.x-K,y:i.y-K,width:2*K,height:2*K})}},w);this._installHandlers(F,f,z,E)}}},_animR:function(c,b,e){var d=Math.round((b.to-b.from)*e+b.from);if(this._isVML){this.renderer.updateCircle(c,undefined,undefined,d)}else{this.renderer.attr(c,{r:d})}},_showToolTip:function(j,g,u,q,c){if(this.showToolTips==false){return}var p=this._getCategoryAxis(u);if(this._toolTipElement&&u==this._toolTipElement.gidx&&q==this._toolTipElement.sidx&&c==this._toolTipElement.iidx){return}if(this._pointMarker){j=parseInt(this._pointMarker.x+5);g=parseInt(this._pointMarker.y-5)}var f=this.seriesGroups[u];var k=f.series[q];var e=k.toolTipFormatSettings||f.toolTipFormatSettings;var o=k.toolTipFormatFunction||f.toolTipFormatFunction;var h=this._getColors(u,q,c);var l=this._getFormattedValue(u,q,c,e,o);var b=this._getDataValue(c,p.dataField,u);if(p.dataField==undefined||p.dataField==""){b=c}var A=p.toolTipFormatSettings||p.formatSettings;var d=p.toolTipFormatFunction||p.formatFunction;if(p.type=="date"){b=this._castAsDate(b)}var B=this._formatValue(b,A,d);if(f.type!="pie"&&f.type!="donut"){l=(k.displayText||k.dataField||"")+", "+B+": "+l}else{b=this._getDataValue(c,k.displayText||k.dataField,u);B=this._formatValue(b,A,d);l=B+": "+l}var s=k.toolTipClass||f.toolTipClass||this.toThemeProperty("jqx-chart-tooltip-text",null);var v=k.toolTipBackground||f.toolTipBackground||"#FFFFFF";var z=k.toolTipLineColor||f.toolTipLineColor||h.lineColor;var n=this.renderer.measureText(l,0,{"class":s});var w={width:n.width,height:n.height};n.width=n.width+5;n.height=n.height+6;rect=this.renderer.getRect();j=Math.max(j-5,rect.x);g=Math.max(g-n.height,rect.y);if(n.width>rect.width||n.height>rect.height){return}if(j+n.width>rect.x+rect.width){j=rect.x+rect.width-n.width-2}if(g+n.height>rect.y+rect.height){g=rect.y+rect.height-n.height-2}j=a.jqx._ptrnd(j);g=a.jqx._ptrnd(g);var t=this._toolTipElement==undefined;var i=t?this.renderer.rect(j,g,n.width,n.height):this._toolTipElement.box;this.renderer.attr(i,{fill:v,"fill-opacity":t?0:0.8,stroke:z,rx:2,ry:2,"stroke-width":1});var m=t?this.renderer.text(l,j,g,n.width,n.height,0,{"class":s,opacity:0},false,"center","center"):this._toolTipElement.txt;this._toolTipElement={box:i,txt:m,sidx:q,gidx:u,iidx:c};this._createAnimationGroup("tooltip");if(t){this._enqueueAnimation("tooltip",i,[{key:"fill-opacity",from:0,to:0.8}],200);this._enqueueAnimation("tooltip",m,[{key:"opacity",from:0,to:1}],500)}else{var r=this.renderer instanceof (a.jqx.svgRenderer);this.renderer.attr(i,{width:n.width,height:n.height});this._enqueueAnimation("tooltip",i,[{key:"x",from:parseInt(this.renderer.getAttr(i,"x")),to:j},{key:"y",from:parseInt(this.renderer.getAttr(i,"y")),to:g}],200);this.renderer.attr(m,{textContent:l,"class":s,width:w.width,height:w.height});if(r){g+=n.height-6}else{g+=(n.height-w.height)/2+2}j+=(n.width-w.width)/2+2;this._enqueueAnimation("tooltip",m,[{key:"x",from:parseInt(this.renderer.getAttr(m,"x")),to:j},{key:"y",from:parseInt(this.renderer.getAttr(m,"y")),to:g}],200)}this._startAnimation("tooltip")},_hideToolTip:function(){if(!this._toolTipElement){return}this.renderer.removeElement(this._toolTipElement.box);this.renderer.removeElement(this._toolTipElement.txt);this._toolTipElement=undefined},_showLabel:function(r,n,c,j,f,k,g){var p=this.seriesGroups[r];var b=p.series[n];var i={width:0,height:0};if(b.showLabels==false||(!b.showLabels&&!p.showLabels)){return i}if(j.width<0||j.height<0){return i}var m=b.labelsAngle||p.labelsAngle||0;var o=b.labelOffset||p.labelAngle||{x:0,y:0};var e=b.labelClass||p.labelClass||this.toThemeProperty("jqx-chart-label-text",null);f=f||"center";k=k||"center";var q=this._getFormattedValue(r,n,c);var l=j.width;var d=j.height;if(l==0||d==0||g){i=this.renderer.measureText(q,m,{"class":e});if(g){return i}l=i.width;d=i.height}var s=this.renderer.text(q,j.x+o.x,j.y+o.y,l,d,m,{},m!=0,f,k);this.renderer.attr(s,{"class":e});if(this._isVML){this.renderer.removeElement(s);this.renderer.getContainer()[0].appendChild(s)}},_getAnimProps:function(j,f){var e=this.seriesGroups[j];var c=e.series[f];var b=this.enableAnimations==true;if(e.enableAnimations){b=e.enableAnimations==true}if(c.enableAnimations){b=c.enableAnimations==true}var i=this.animationDuration;if(isNaN(i)){i=1000}var d=e.animationDuration;if(!isNaN(d)){i=d}var h=c.animationDuration;if(!isNaN(h)){i=h}if(i>5000){i=1000}return{enabled:b,duration:i}},_renderLineSeries:function(e,F){var z=this.seriesGroups[e];if(!z.series||z.series.length==0){return}var l=z.type.indexOf("area")!=-1;var C=z.type.indexOf("stacked")!=-1;var b=C&&z.type.indexOf("100")!=-1;var S=z.type.indexOf("spline")!=-1;var m=z.type.indexOf("step")!=-1;if(m&&S){return}var p=this._getDataLen(e);var Q=F.width/p;var v=Math.round(F.width/Q);var d=Math.round(p/v);var V=z.orientation=="horizontal";var r=this._getCategoryAxis(e).flip==true;var o=F;if(V){o={x:F.y,y:F.x,width:F.height,height:F.width}}var t=this._calcGroupOffsets(e,o);if(!t||t.xoffsets.length==0){return}var H=this._alignValuesWithTicks(e);for(var M=z.series.length-1;M>=0;M--){var T=this._getLineSettings(e,M);var J=t.xoffsets.first;var w=J;do{var K=[];var E=-1;var j=0;var G=NaN;var u=NaN;var U=NaN;if(t.xoffsets.length<1){continue}var I=this._getAnimProps(e,M);var D=I.enabled&&t.xoffsets.length<10000&&this._isVML!=true?I.duration:0;var n=J;for(var R=J;R<=t.xoffsets.last;R++){J=R;var L=t.xoffsets.data[R];if(L==undefined){continue}var h=t.offsets[M][R].to;if(h==undefined){J++;break}w=R;if(!l&&b){if(h<=o.y){h=o.y+1}if(h>=o.y+o.height){h=o.y+o.height-1}}L=Math.max(L,1);j=L;if(m&&!isNaN(G)&&!isNaN(u)){if(u!=h){K.push(V?{y:o.x+j,x:a.jqx._ptrnd(u)}:{x:o.x+j,y:a.jqx._ptrnd(u)})}}K.push(V?{y:o.x+j,x:a.jqx._ptrnd(h),index:R}:{x:o.x+j,y:a.jqx._ptrnd(h),index:R});G=j;u=h;if(isNaN(U)){U=h}}var f=o.x+t.xoffsets.data[n];var O=o.x+t.xoffsets.data[w];if(l&&z.alignEndPointsWithIntervals==true){var q=r?-1:1;if(f>o.x){f=o.x}if(O<o.x+o.width){O=o.x+o.width}if(r){var N=f;f=O;O=N}}O=a.jqx._ptrnd(O);f=a.jqx._ptrnd(f);var g=t.baseOffset;U=a.jqx._ptrnd(U);var c=a.jqx._ptrnd(h)||g;var B=this._calculateLine(K,g,D==0?1:0,l,V);if(B!=""){B=this._buildLineCmd(B,f,O,U,c,g,l,S&&K.length>3,V)}else{B="M 0 0"}var P=this.renderer.path(B,{"stroke-width":T.stroke,stroke:T.colors.lineColor,"fill-opacity":T.opacity,fill:l?T.colors.fillColor:"none"});this._installHandlers(P,e,M);var A={groupIndex:e,seriesIndex:M,pointsArray:K,left:f,right:O,pyStart:U,pyEnd:c,yBase:g,isArea:l,isSpline:S};var k=this;this._enqueueAnimation("series",P,undefined,D,function(Y,s,Z){var aa=k._calculateLine(s.pointsArray,s.yBase,Z,s.isArea,V);if(aa==""){return}var X=s.pointsArray.length;if(!s.isArea){X=Math.round(X*Z)}aa=k._buildLineCmd(aa,s.left,s.right,s.pyStart,s.pyEnd,s.yBase,s.isArea,X>3&&s.isSpline,V);k.renderer.attr(Y,{d:aa});if(Z==1){var ab=k._getLineSettings(s.groupIndex,s.seriesIndex);for(var W=0;W<s.pointsArray.length;W++){k._showLabel(s.groupIndex,s.seriesIndex,s.pointsArray[W].index,{x:s.pointsArray[W].x,y:s.pointsArray[W].y,width:0,height:0});k._drawSymbol(k._getSymbol(s.groupIndex,s.seriesIndex),s.pointsArray[W].x,s.pointsArray[W].y,ab.colors.fillColor,ab.colors.lineColor,1,ab.opacity)}}},A)}while(J<t.xoffsets.length-1)}},_calculateLine:function(f,l,g,h,e){var c="";var b=f.length;if(!h){b=Math.round(b*g)}for(var d=0;d<b;d++){if(d>0){c+=" "}var j=f[d].y;var k=f[d].x;if(h){if(e){k=a.jqx._ptrnd((k-l)*g+l)}else{j=a.jqx._ptrnd((j-l)*g+l)}}c+=k+","+j}return c},_buildLineCmd:function(l,g,p,o,b,q,n,d,k){var f=l;if(d){f=this._getBezierPoints(l)}var m=f.split(" ");var j=m[0].replace("C","");if(n){var e=k?o+","+g:g+","+o;var h=k?b+","+p:p+","+b;var c=k?q+","+g:g+","+q;var i=k?q+","+p:p+","+q;f="M "+c+" L "+j+(d?"":(" L "+j+" "))+f+(d?(" L"+i+" M "+i):(" "+i+" "+c));f+=" Z"}else{if(d){f="M "+j+" "+f}else{f="M "+j+" L "+j+" "+f}}return f},_getLineSettings:function(f,c){var h=this.seriesGroups[f];var e=h.type.indexOf("area")!=-1;var b=this._getColors(f,c,undefined,this._getGroupGradientType(f));var d=h.series[c].opacity||h.opacity;if(!d||d<0||d>1){d=1}var g=h.series[c].lineWidth||h.lineWidth;if(!g||g=="auto"||isNaN(g)||g<1||g>15){g=e?2:3}return{colors:b,stroke:g,opacity:d}},_getColors:function(s,p,d,e){var l=this.seriesGroups[s];if(l.type!="pie"&&l.type!="donut"){d=undefined}var c=l.series[p].useGradient||l.useGradient;if(c==undefined){c=true}var q;if(!isNaN(d)){var k=this._getDataLen(s);q=this._getColor(l.series[p].colorScheme||l.colorScheme||this.colorScheme,p*k+d,s,p)}else{q=this._getSeriesColor(s,p)}var f=a.jqx._adjustColor(q,1.1);var b=a.jqx._adjustColor(q,0.9);var m=a.jqx._adjustColor(f,0.9);var h=q;var n=f;var i=[[0,1.5],[100,1]];var g=[[0,1],[25,1.1],[50,1.5],[100,1]];var o=[[0,1.3],[90,1.2],[100,1]];if(c){if(e=="verticalLinearGradient"){h=this.renderer._toLinearGradient(q,true,i);n=this.renderer._toLinearGradient(f,true,i)}else{if(e=="horizontalLinearGradient"){h=this.renderer._toLinearGradient(q,false,g);n=this.renderer._toLinearGradient(f,false,g)}else{if(e=="radialGradient"){var r=undefined;var j=i;if((l.type=="pie"||l.type=="donut")&&d!=undefined&&this._renderData[s]&&this._renderData[s][p]){r=this._renderData[s][p][d];j=o}h=this.renderer._toRadialGradient(q,j,r);n=this.renderer._toRadialGradient(f,j,r)}}}}return{baseColor:q,fillColor:h,lineColor:b,fillSelected:n,lineSelected:m}},_installHandlers:function(d,j,i,c){var b=this;var h=this.seriesGroups[j];var e=this.seriesGroups[j].series[i];var f=h.type.indexOf("line")!=-1||h.type.indexOf("area")!=-1;if(!f){this.renderer.addHandler(d,"mousemove",function(g){g.preventDefault();b._startTooltipTimer(j,i,c)})}this.renderer.addHandler(d,"mouseover",function(g){g.preventDefault();b._select(d,j,i,c);if(f){return}if(isNaN(c)){return}b._raiseEvent("mouseover",h,e,c)});this.renderer.addHandler(d,"mouseout",function(g){g.preventDefault();if(c!=undefined){b._cancelTooltipTimer()}if(f){return}b._unselect();if(isNaN(c)){return}b._raiseEvent("mouseout",h,e,c)});this.renderer.addHandler(d,"click",function(g){g.preventDefault();if(f){return}if(h.type.indexOf("column")!=-1){b._unselect()}if(isNaN(c)){return}b._raiseEvent("click",h,e,c)})},_getHorizontalOffset:function(u,p,j,h){var c=this._plotRect;var f=this._getDataLen(u);if(f==0){return{index:undefined,value:j}}var n=this._calcGroupOffsets(u,this._plotRect);if(n.xoffsets.length==0){return{index:undefined,value:undefined}}var l=j-c.x;var k=h-c.y;var r=this.seriesGroups[u];if(r.orientation=="horizontal"){var t=l;l=k;k=t}var e=this._getCategoryAxis(u).flip==true;var b=undefined;var m=undefined;for(var q=0;q<n.xoffsets.length;q++){var s=n.xoffsets.data[q];var d=n.offsets[p][q].to;var o=Math.abs(l-s);if(isNaN(b)||b>o){b=o;m=q}}return{index:m,value:n.xoffsets.data[m]}},onmousemove:function(n,l){if(this._mouseX==n&&this._mouseY==l){return}this._mouseX=n;this._mouseY=l;if(!this._selected){return}var m=this._plotRect;var b=this._paddedRect;if(n<b.x||n>b.x+b.width||l<b.y||l>b.y+b.height){this._unselect();return}var p=this._selected.group;var j=this.seriesGroups[p];var t=j.series[this._selected.series];var e=j.orientation=="horizontal";var k=this.seriesGroups[p].type;var m=this._plotRect;if(k.indexOf("line")!=-1||k.indexOf("area")!=-1){var d=this._getHorizontalOffset(p,this._selected.series,n,l);var h=d.index;if(h==undefined){return}if(this._selected.item!=h){if(this._selected.item){this._raiseEvent("mouseout",j,t,this._selected.item)}this._selected.item=h;this._raiseEvent("mouseover",j,t,h)}var r=this._getSymbol(this._selected.group,this._selected.series);if(r=="none"){r="circle"}var o=this._calcGroupOffsets(p,m);l=o.offsets[this._selected.series][h].to;if(l==undefined){return}n=d.value;if(e){var f=n;n=l;l=f+m.y}else{n+=m.x}l=a.jqx._ptrnd(l);n=a.jqx._ptrnd(n);if(this._pointMarker){this.renderer.removeElement(this._pointMarker.element)}var c=this._getSeriesColor(this._selected.group,this._selected.series);var q=a.jqx._adjustColor(c,0.5);this._pointMarker={type:r,x:n,y:l,gidx:p,sidx:this._selected.series,iidx:h};this._pointMarker.element=this._drawSymbol(r,n,l,c,q,1,1,8);this._startTooltipTimer(p,this._selected.series,h)}},_drawSymbol:function(g,i,h,j,k,d,e,m){var c;var f=m||6;var b=f/2;switch(g){case"none":return undefined;case"circle":c=this.renderer.circle(i,h,f/2);break;case"square":f=f-1;b=f/2;c=this.renderer.rect(i-b,h-b,f,f);break;case"diamond":var l="M "+(i-b)+","+(h)+" L "+(i)+","+(h+b)+" L "+(i+b)+","+(h)+" L "+(i)+","+(h-b)+" Z";c=this.renderer.path(l);break;case"triangle_up":var l="M "+(i-b)+","+(h+b)+" L "+(i+b)+","+(h+b)+" L "+(i)+","+(h-b)+" Z";c=this.renderer.path(l);break;case"triangle_down":var l="M "+(i-b)+","+(h-b)+" L "+(i)+","+(h+b)+" L "+(i+b)+","+(h-b)+" Z";c=this.renderer.path(l);break;case"triangle_left":var l="M "+(i-b)+","+(h)+" L "+(i+b)+","+(h+b)+" L "+(i+b)+","+(h-b)+" Z";c=this.renderer.path(l);break;case"triangle_right":var l="M "+(i-b)+","+(h-b)+" L "+(i-b)+","+(h+b)+" L "+(i+b)+","+(h)+" Z";c=this.renderer.path(l);break;default:c=this.renderer.circle(i,h,f)}this.renderer.attr(c,{fill:j,stroke:k,"stroke-width":d,"fill-opacity":e});return c},_getSymbol:function(f,b){var c=["circle","square","diamond","triangle_up","triangle_down","triangle_left","triangle_right"];var e=this.seriesGroups[f];var d=e.series[b];var h=undefined;if(d.symbolType!=undefined){h=d.symbolType}if(h==undefined){h=e.symbolType}if(h=="default"){return c[b%c.length]}else{if(h!=undefined){return h}}return"none"},_startTooltipTimer:function(h,f,d){this._cancelTooltipTimer();var b=this;var e=b.seriesGroups[h];var c=this.toolTipShowDelay||this.toolTipDelay;if(isNaN(c)||c>10000||c<0){c=500}if(this._toolTipElement){c=0}this._tttimer=setTimeout(function(){b._showToolTip(b._mouseX,b._mouseY-3,h,f,d);var g=b.toolTipHideDelay;if(isNaN(g)){g=4000}b._tttimer=setTimeout(function(){b._hideToolTip()},g)},c)},_cancelTooltipTimer:function(){clearTimeout(this._tttimer)},_getGroupGradientType:function(c){var b=this.seriesGroups[c];if(b.type.indexOf("area")!=-1){return b.orientation=="horizontal"?"horizontalLinearGradient":"verticalLinearGradient"}else{if(b.type.indexOf("column")!=-1){return b.orientation=="horizontal"?"verticalLinearGradient":"horizontalLinearGradient"}else{if(b.type.indexOf("scatter")!=-1||b.type.indexOf("bubble")!=-1||b.type.indexOf("pie")!=-1||b.type.indexOf("donut")!=-1){return"radialGradient"}}}return undefined},_select:function(d,h,f,c){if(this._selected&&this._selected.element!=d){this._unselect()}this._selected={element:d,group:h,series:f,item:c};var e=this.seriesGroups[h];var b=this._getColors(h,f,c,this._getGroupGradientType(h));if(e.type.indexOf("line")!=-1&&e.type.indexOf("area")==-1){b.fillSelected="none"}this.renderer.attr(d,{stroke:b.lineSelected,fill:b.fillSelected})},_unselect:function(){if(this._selected){var h=this._selected.group;var f=this._selected.series;var c=this._selected.item;var e=this.seriesGroups[h];var d=e.series[f];var b=this._getColors(h,f,c,this._getGroupGradientType(h));if(e.type.indexOf("line")!=-1&&e.type.indexOf("area")==-1){b.fillColor="none"}this.renderer.attr(this._selected.element,{stroke:b.lineColor,fill:b.fillColor});if(e.type.indexOf("line")!=-1||e.type.indexOf("area")!=-1&&!isNaN(c)){this._raiseEvent("mouseout",e,d,c)}this._selected=undefined}if(this._pointMarker){this.renderer.removeElement(this._pointMarker.element);this._pointMarker=undefined}},_raiseEvent:function(e,f,d,b){var c=d[e]||f[e];var g=0;for(;g<this.seriesGroups.length;g++){if(this.seriesGroups[g]==f){break}}if(g==this.seriesGroups.length){return}if(c&&a.isFunction(c)){c({event:e,seriesGroup:f,serie:d,elementIndex:b,elementValue:this._getDataValue(b,d.dataField,g)})}},_calcGroupOffsets:function(l,c){var r=this.seriesGroups[l];if(!r.series||r.series.length==0){return}var f=r.valueAxis.flip==true;var b=r.valueAxis.logarithmicScale==true;var m=r.valueAxis.logarithmicScaleBase||10;if(!this._renderData){this._renderData=new Array()}while(this._renderData.length<l+1){this._renderData.push(null)}if(this._renderData[l]!=null){return this._renderData[l]}var J=new Array();var s=r.type.indexOf("stacked")!=-1;var e=s&&r.type.indexOf("100")!=-1;var p=this._getDataLen(l);var L=r.baselineValue||r.valueAxis.baselineValue||0;var M=this._stats.seriesGroups[l];if(!M||!M.isValid){return}if(L>M.max){L=M.max}if(L<M.min){L=M.min}var C=(e||b)?M.maxRange:M.max-M.min;var E=M.min;var I=M.max;var N=c.height/(b?M.intervals:C);var g=0;if(e){if(E*I<0){C/=2;g=-(C+L)*N}else{g=-L*N}}else{g=-(L-E)*N}if(f){g=-g+c.y}else{g+=c.y+c.height}var z=new Array();var d=new Array();var D,o;if(b){D=a.jqx.log(I,m)-a.jqx.log(L,m);if(s){D=M.intervals;L=e?0:E}o=M.intervals-D;g=c.y+D/M.intervals*c.height}g=a.jqx._ptrnd(g);var n=(E*I<0)?c.height/2:c.height;var w=[];for(var G=0;G<r.series.length;G++){if(!s&&b){w=[]}J.push(new Array());for(var H=0;H<p;H++){var O=this._getDataValueAsNumber(H,r.series[G].dataField,l);if(isNaN(O)||(b&&O<=0)){J[G].push({from:undefined,to:undefined});continue}if(O>M.rmax){O=M.rmax}if(O<M.rmin){O=M.rmin}var q=(O>L)?z:d;var K=N*(O-L);if(b){while(w.length<=H){w.push({p:{value:0,height:0},n:{value:0,height:0}})}var A=O>L?w[H].p:w[H].n;A.value+=O;if(e){O=A.value/(M.psums[H]+M.nsums[H])*100;K=(a.jqx.log(O,m)-M.minPow)*N}else{K=a.jqx.log(A.value,m)-a.jqx.log(L,m);K*=N}K-=A.height;A.height+=K}var v=g;if(s){if(e&&!b){var t=(M.psums[H]-M.nsums[H]);if(O>L){K=(M.psums[H]/t)*n;if(M.psums[H]!=0){K*=O/M.psums[H]}}else{K=(M.nsums[H]/t)*n;if(M.nsums[H]!=0){K*=O/M.nsums[H]}}}if(isNaN(q[H])){q[H]=g}v=q[H]}K=Math.abs(K);K=this._isVML?Math.round(K):a.jqx._rup(K);if(G==r.series.length-1&&e){var u=0;for(var F=0;F<G;F++){u+=Math.abs(J[F][H].to-J[F][H].from)}u+=K;if(u<n){if(K>0.5){K=a.jqx._ptrnd(K+n-u)}else{var F=G-1;while(F>=0){var B=Math.abs(J[F][H].to-J[F][H].from);if(B>1){if(J[F][H].from>J[F][H].to){J[F][H].from+=n-u}break}F--}}}}if(f){K*=-1}if(O<L){q[H]+=K;J[G].push({from:v,to:v+K-1})}else{q[H]-=K;J[G].push({from:v,to:v-K})}}}this._renderData[l]={baseOffset:g,offsets:J};this._renderData[l].xoffsets=this._calculateXOffsets(l,c);return this._renderData[l]},_isPointSeriesOnly:function(){for(var b=0;b<this.seriesGroups.length;b++){var c=this.seriesGroups[b];if(c.type.indexOf("line")==-1&&c.type.indexOf("area")==-1&&c.type.indexOf("scatter")==-1&&c.type.indexOf("bubble")==-1){return false}}return true},_alignValuesWithTicks:function(f){var b=this._isPointSeriesOnly();var e=this._getCategoryAxis(f);var d=e.valuesOnTicks==undefined?b:e.valuesOnTicks!=false;if(f==undefined){return d}var c=this.seriesGroups[f];if(c.valuesOnTicks==undefined){return d}return c.valuesOnTicks},_getYearsDiff:function(c,b){return b.getFullYear()-c.getFullYear()},_getMonthsDiff:function(c,b){return 12*(b.getFullYear()-c.getFullYear())+b.getMonth()-c.getMonth()},_getDaysDiff:function(c,b){return(b.valueOf()-c.valueOf())/(1000*24*3600)},_getDateDiff:function(e,d,c){var b=0;if(c=="year"){b=this._getYearsDiff(e,d)}else{if(c=="month"){b=this._getMonthsDiff(e,d)}else{b=this._getDaysDiff(e,d)}}return b},_getDatesArray:function(d,k,m,l){var f=[];var g=this._getDateDiff(d,k,m)+1;if(m=="year"){if(l){g++}var b=d.getFullYear();for(var e=0;e<g;e++){f.push(new Date(b,0,1,0,0,0,0));b++}}else{if(m=="month"){if(l){g++}var h=d.getMonth();var j=d.getFullYear();for(var e=0;e<g;e++){f.push(new Date(j,h,1,0,0,0,0));h++;if(h>11){j++;h=0}}}else{if(m=="day"){for(var e=0;e<g;e++){var c=new Date(d.valueOf()+e*1000*3600*24);f.push(c)}}}}return f},_calculateXOffsets:function(c,b){var j=this._getCategoryAxis(c);var u=new Array();var h=this._getDataLen(c);var D=j.type=="date";var m=D?this._castAsDate(j.minValue):this._castAsNumber(j.minValue);var o=D?this._castAsDate(j.maxValue):this._castAsNumber(j.maxValue);var s=m,v=o;if(isNaN(s)||isNaN(v)){for(var w=0;w<h;w++){var q=this._getDataValue(w,j.dataField,c);q=D?this._castAsDate(q):this._castAsNumber(q);if(q==undefined||isNaN(q)){continue}if(q<s||isNaN(s)){s=q}if(q>v||isNaN(v)){v=q}}}s=m||s;v=o||v;if(D&&!(this._isDate(s)&&this._isDate(v))){throw"Invalid Date values"}var r=(j.maxValue!=undefined)||(j.minValue!=undefined);if(r&&(isNaN(v)||isNaN(s))){r=false;throw"Invalid min/max category values"}if(!r&&!D){s=0;v=h-1}var A=j.unitInterval;if(isNaN(A)||A<=0){A=1}var E=NaN;var g=this._alignValuesWithTicks(c);if(r){if(g){E=v-s}else{E=v-s+A}}else{E=h-1;if(!g){E++}}if(E==0){E=A}var t=0;var C=v;var z=s;if(D){E=this._getDateDiff(z,C,j.baseUnit);E=a.jqx._rnd(E,1,false);if(!g||(g&&(j.baseUnit=="month"||j.baseUnit=="year"))){E++}if(j.baseUnit!="day"){if(j.baseUnit=="month"){z=new Date(z.getFullYear(),z.getMonth(),1);C=new Date(z);C.setMonth(C.getMonth()+E)}else{z=new Date(z.getFullYear(),0,1);C=new Date(z);C.setYear(C.getFullYear()+E)}}t=a.jqx._rnd(this._getDateDiff(z,C,"day"),1,false);if(!g){t++}}var f=Math.max(1,E/A);var d=b.width/f;var p=c!=undefined&&this.seriesGroups[c].type.indexOf("column")!=-1;var l=0;if(!g&&(!D||j.baseUnit=="day")&&!p){l=d/2}var e=-1,k=-1;for(var w=0;w<h;w++){if(!r&&!D){u.push(a.jqx._ptrnd(l+(w-z)/E*b.width));if(e==-1){e=w}if(k==-1||k<w){k=w}continue}var q=this._getDataValue(w,j.dataField,c);q=D?this._castAsDate(q):this._castAsNumber(q);if(isNaN(q)||q<z||q>C){u.push(-1);continue}var B=D?a.jqx._rnd(this._getDateDiff(z,q,"day"),1,false):q-z;var n=a.jqx._ptrnd(l+B/(D?t:E)*b.width);u.push(n);if(e==-1){e=w}if(k==-1||k<w){k=w}}if(j.flip==true){u.reverse()}return{data:u,first:e,last:k,length:k==-1?0:k-e+1,itemWidth:d,rangeLength:E,min:s,max:v,customRange:r}},_getCategoryAxis:function(b){if(b==undefined||this.seriesGroups.length<=b){return this.categoryAxis}return this.seriesGroups[b].categoryAxis||this.categoryAxis},_isGreyScale:function(e,b){var d=this.seriesGroups[e];var c=d.series[b];if(c.greyScale==true){return true}else{if(c.greyScale==false){return false}}if(d.greyScale==true){return true}else{if(d.greyScale==false){return false}}return this.greyScale==true},_getSeriesColor:function(d,c){var b=this._getSeriesColorInternal(d,c);if(this._isGreyScale(d,c)&&b.indexOf("#")==0){b=a.jqx.toGreyScale(b)}return b},_getSeriesColorInternal:function(l,c){var e=this.seriesGroups[l];var m=e.series[c];if(m.color){return m.color}var k=0;for(var d=0;d<=l;d++){for(var b in this.seriesGroups[d].series){if(d==l&&b==c){break}else{k++}}}var h=this.colorScheme;if(e.colorScheme){h=e.colorScheme;sidex=c}if(h==undefined||h==""){h=this.colorSchemes[0].name}if(h){for(var d=0;d<this.colorSchemes.length;d++){var f=this.colorSchemes[d];if(f.name==h){while(k>f.colors.length){k-=f.colors.length;if(++d>=this.colorSchemes.length){d=0}f=this.colorSchemes[d]}return f.colors[k%f.colors.length]}}}return"#222222"},_getColor:function(d,f,k,h){if(d==undefined||d==""){d=this.colorSchemes[0].name}for(var g=0;g<this.colorSchemes.length;g++){if(d==this.colorSchemes[g].name){break}}var e=0;while(e<=f){if(g==this.colorSchemes.length){g=0}var b=this.colorSchemes[g].colors.length;if(e+b<=f){e+=b;g++}else{var c=this.colorSchemes[g].colors[f-e];if(this._isGreyScale(k,h)&&c.indexOf("#")==0){c=a.jqx.toGreyScale(c)}return c}}},getColorScheme:function(b){for(var c in this.colorSchemes){if(this.colorSchemes[c].name==b){return this.colorSchemes[c].colors}}return undefined},addColorScheme:function(c,b){for(var d in this.colorSchemes){if(this.colorSchemes[d].name==c){this.colorSchemes[d].colors=b;return}}this.colorSchemes.push({name:c,colors:b})},removeColorScheme:function(b){for(var c in this.colorSchemes){if(this.colorSchemes[c].name==b){this.colorSchemes.splice(c,1);break}}},colorSchemes:[{name:"scheme01",colors:["#4572A7","#AA4643","#89A54E","#71588F","#4198AF"]},{name:"scheme02",colors:["#7FD13B","#EA157A","#FEB80A","#00ADDC","#738AC8"]},{name:"scheme03",colors:["#E8601A","#FF9639","#F5BD6A","#599994","#115D6E"]},{name:"scheme04",colors:["#D02841","#FF7C41","#FFC051","#5B5F4D","#364651"]},{name:"scheme05",colors:["#25A0DA","#309B46","#8EBC00","#FF7515","#FFAE00"]},{name:"scheme06",colors:["#0A3A4A","#196674","#33A6B2","#9AC836","#D0E64B"]},{name:"scheme07",colors:["#CC6B32","#FFAB48","#FFE7AD","#A7C9AE","#888A63"]},{name:"scheme08",colors:["#2F2933","#01A2A6","#29D9C2","#BDF271","#FFFFA6"]},{name:"scheme09",colors:["#1B2B32","#37646F","#A3ABAF","#E1E7E8","#B22E2F"]},{name:"scheme10",colors:["#5A4B53","#9C3C58","#DE2B5B","#D86A41","#D2A825"]},{name:"scheme11",colors:["#993144","#FFA257","#CCA56A","#ADA072","#949681"]}],_formatValue:function(c,f,b){if(c==undefined){return""}if(b){if(!a.isFunction(b)){return c.toString()}try{return b(c)}catch(d){return d.message}}if(this._isNumber(c)){return this._formatNumber(c,f)}if(this._isDate(c)){return this._formatDate(c,f)}if(f){return(f.prefix||"")+c.toString()+(f.sufix||"")}return c.toString()},_getFormattedValue:function(k,e,b,c,d){var h=this.seriesGroups[k];var m=h.series[e];var l="";var f=c,i=d;if(!i){i=m.formatFunction||h.formatFunction}if(!f){f=m.formatSettings||h.formatSettings}if(!m.formatFunction&&m.formatSettings){i=undefined}var j=this._getDataValue(b,m.dataField,k);if(j){l=this._formatValue(j,f,i)}return l||""},_isNumberAsString:function(d){if(typeof(d)!="string"){return false}d=a.trim(d);for(var b=0;b<d.length;b++){var c=d.charAt(b);if((c>="0"&&c<="9")||c==","||c=="."){continue}if(c=="-"&&b==0){continue}if((c=="("&&b==0)||(c==")"&&b==d.length-1)){continue}return false}return true},_castAsDate:function(c){if(c instanceof Date&&!isNaN(c)){return c}if(typeof(c)=="string"){var b=new Date(c);if(b!=undefined){return b}}return undefined},_castAsNumber:function(c){if(c instanceof Date&&!isNaN(c)){return c.valueOf()}if(typeof(c)=="string"){if(this._isNumber(c)){c=parseFloat(c)}else{var b=new Date(c);if(b!=undefined){c=b.valueOf()}}}return c},_isNumber:function(b){if(typeof(b)=="string"){if(this._isNumberAsString(b)){b=parseFloat(b)}}return typeof b==="number"&&isFinite(b)},_isDate:function(b){return b instanceof Date},_isBoolean:function(b){return typeof b==="boolean"},_isObject:function(b){return(b&&(typeof b==="object"||a.isFunction(b)))||false},_formatDate:function(c,b){return c.toString()},_formatNumber:function(n,e){if(!this._isNumber(n)){return n}e=e||{};var q=e.decimalSeparator||".";var o=e.thousandsSeparator||"";var m=e.prefix||"";var p=e.sufix||"";var h=e.decimalPlaces||((n*100!=parseInt(n)*100)?2:0);var l=e.negativeWithBrackets||false;var g=(n<0);if(g&&l){n*=-1}var d=n.toString();var b;var k=Math.pow(10,h);d=(Math.round(n*k)/k).toString();if(isNaN(d)){d=""}b=d.lastIndexOf(".");if(h>0){if(b<0){d+=q;b=d.length-1}else{if(q!=="."){d=d.replace(".",q)}}while((d.length-1-b)<h){d+="0"}}b=d.lastIndexOf(q);b=(b>-1)?b:d.length;var f=d.substring(b);var c=0;for(var j=b;j>0;j--,c++){if((c%3===0)&&(j!==b)&&(!g||(j>1)||(g&&l))){f=o+f}f=d.charAt(j-1)+f}d=f;if(g&&l){d="("+d+")"}return m+d+p},_defaultNumberFormat:{prefix:"",sufix:"",decimalSeparator:".",thousandsSeparator:",",decimalPlaces:2,negativeWithBrackets:false},_getBezierPoints:function(g){var k=[];var h=g.split(" ");for(var f=0;f<h.length;f++){var l=h[f].split(",");k.push({x:parseFloat(l[0]),y:parseFloat(l[1])})}var m="";for(var f=0;f<k.length-1;f++){var b=[];if(0==f){b.push(k[f]);b.push(k[f]);b.push(k[f+1]);b.push(k[f+2])}else{if(k.length-2==f){b.push(k[f-1]);b.push(k[f]);b.push(k[f+1]);b.push(k[f+1])}else{b.push(k[f-1]);b.push(k[f]);b.push(k[f+1]);b.push(k[f+2])}}var d=[];var j=f==0?81:9;var e={x:((-b[0].x+j*b[1].x+b[2].x)/j),y:((-b[0].y+j*b[1].y+b[2].y)/j)};var c={x:((b[1].x+j*b[2].x-b[3].x)/j),y:((b[1].y+j*b[2].y-b[3].y)/j)};d.push({x:b[1].x,y:b[1].y});d.push(e);d.push(c);d.push({x:b[2].x,y:b[2].y});if(f==0){d[1].x++;d[1].y++}m+="C"+a.jqx._ptrnd(d[1].x)+","+a.jqx._ptrnd(d[1].y)+" "+a.jqx._ptrnd(d[2].x)+","+a.jqx._ptrnd(d[2].y)+" "+a.jqx._ptrnd(d[3].x)+","+a.jqx._ptrnd(d[3].y)+" "}return m},_animTickInt:50,_createAnimationGroup:function(b){if(!this._animGroups){this._animGroups={}}this._animGroups[b]={animations:[],startTick:NaN}},_startAnimation:function(c){var e=new Date();var b=e.getTime();this._animGroups[c].startTick=b;this._enableAnimTimer()},_enqueueAnimation:function(e,d,c,g,f,b,h){if(g==0){g=1}if(h==undefined){h="easeInOutSine"}this._animGroups[e].animations.push({key:d,properties:c,duration:g,fn:f,context:b,easing:h})},_stopAnimations:function(){clearTimeout(this._animtimer);this._animtimer=undefined;this._animGroups=undefined},_enableAnimTimer:function(){if(!this._animtimer){var b=this;this._animtimer=setTimeout(function(){b._runAnimation()},this._animTickInt)}},_runAnimation:function(){if(this._animGroups){var s=new Date();var k=s.getTime();var o={};for(var l in this._animGroups){var r=this._animGroups[l].animations;var m=this._animGroups[l].startTick;var h=0;for(var n=0;n<r.length;n++){var t=r[n];var b=(k-m);if(t.duration>h){h=t.duration}var q=t.duration>0?b/t.duration:0;var e=q;if(t.easing){e=jQuery.easing[t.easing](q,b,0,1,t.duration)}if(q>1){q=1;e=1}if(t.fn){t.fn(t.key,t.context,e);continue}var g={};for(var l=0;l<t.properties.length;l++){var c=t.properties[l];var f=0;if(q==1){f=c.to}else{f=e*(c.to-c.from)+c.from}g[c.key]=f}this.renderer.attr(t.key,g)}if(m+h>k){o[l]=({startTick:m,animations:r})}}this._animGroups=o;if(this.renderer instanceof a.jqx.HTML5Renderer){this.renderer.refresh()}}this._animtimer=null;for(var l in this._animGroups){this._enableAnimTimer();break}}});a.jqx.toGreyScale=function(b){var c=a.jqx.cssToRgb(b);c[0]=c[1]=c[2]=Math.round(0.3*c[0]+0.59*c[1]+0.11*c[2]);var d=a.jqx.rgbToHex(c[0],c[1],c[2]);return"#"+d[0]+d[1]+d[2]},a.jqx._adjustColor=function(d,b){var e=a.jqx.cssToRgb(d);var d="#";for(var f=0;f<3;f++){var g=Math.round(b*e[f]);if(g>255){g=255}else{if(g<=0){g=0}}g=a.jqx.decToHex(g);if(g.toString().length==1){d+="0"}d+=g}return d.toUpperCase()};a.jqx.decToHex=function(b){return b.toString(16)},a.jqx.hexToDec=function(b){return parseInt(b,16)};a.jqx.rgbToHex=function(e,d,c){return[a.jqx.decToHex(e),a.jqx.decToHex(d),a.jqx.decToHex(c)]};a.jqx.hexToRgb=function(c,d,b){return[a.jqx.hexToDec(c),a.jqx.hexToDec(d),a.jqx.hexToDec(b)]};a.jqx.cssToRgb=function(b){if(b.indexOf("rgb")<=-1){return a.jqx.hexToRgb(b.substring(1,3),b.substring(3,5),b.substring(5,7))}return b.substring(4,b.length-1).split(",")};a.jqx.swap=function(b,d){var c=b;b=d;d=c};a.jqx.getNum=function(b){if(!a.isArray(b)){if(isNaN(b)){return 0}}else{for(var c=0;c<b.length;c++){if(!isNaN(b[c])){return b[c]}}}return 0};a.jqx._ptrnd=function(c){if(!document.createElementNS){if(Math.round(c)==c){return c}return a.jqx._rnd(c,1,false)}if(Math.abs(Math.round(c)-c)==0.5){return c}var b=a.jqx._rnd(c,1,false);return b-0.5};a.jqx._rup=function(c){var b=Math.round(c);if(c>b){b++}return b};a.jqx.log=function(c,b){return Math.log(c)/(b?Math.log(b):1)};a.jqx._rnd=function(c,e,d){if(isNaN(c)){return c}var b=c-c%e;if(c==b){return b}if(d){if(c>b){b+=e}}else{if(b>c){b-=e}}return b};a.jqx.commonRenderer={pieSlicePath:function(j,i,g,q,z,A,d){if(!q){q=1}var l=Math.abs(z-A);var o=l>180?1:0;if(l>=360){A=z+359.99}var p=z*Math.PI*2/360;var h=A*Math.PI*2/360;var v=j,u=j,f=i,e=i;var m=!isNaN(g)&&g>0;if(m){d=0}if(d+g>0){if(d>0){var k=l/2+z;var w=k*Math.PI*2/360;j+=d*Math.cos(w);i-=d*Math.sin(w)}if(m){var t=g;v=j+t*Math.cos(p);f=i-t*Math.sin(p);u=j+t*Math.cos(h);e=i-t*Math.sin(h)}}var s=j+q*Math.cos(p);var r=j+q*Math.cos(h);var c=i-q*Math.sin(p);var b=i-q*Math.sin(h);var n="";if(m){n="M "+u+","+e;n+=" a"+g+","+g;n+=" 0 "+o+",1 "+(v-u)+","+(f-e);n+=" L"+s+","+c;n+=" a"+q+","+q;n+=" 0 "+o+",0 "+(r-s)+","+(b-c)}else{n="M "+r+","+b;n+=" a"+q+","+q;n+=" 0 "+o+",1 "+(s-r)+","+(c-b);n+=" L"+j+","+i+" Z"}return n}};a.jqx.svgRenderer=function(){};a.jqx.svgRenderer.prototype={_svgns:"http://www.w3.org/2000/svg",init:function(f){var d="<table id=tblChart cellspacing='0' cellpadding='0' border='0' align='left' valign='top'><tr><td colspan=2 id=tdTop></td></tr><tr><td id=tdLeft></td><td class='chartContainer'></td></tr></table>";f.append(d);this.host=f;var b=f.find(".chartContainer");b[0].style.width=f.width()+"px";b[0].style.height=f.height()+"px";var h;try{var c=document.createElementNS(this._svgns,"svg");c.setAttribute("id","svgChart");c.setAttribute("version","1.1");c.setAttribute("width","100%");c.setAttribute("height","100%");b[0].appendChild(c);this.canvas=c}catch(g){return false}this._id=new Date().getTime();this.clear();this._layout();this._runLayoutFix();return true},_runLayoutFix:function(){var b=this;this._fixLayout()},_fixLayout:function(){var g=a(this.canvas).position();var d=(parseFloat(g.left)==parseInt(g.left));var b=(parseFloat(g.top)==parseInt(g.top));if(a.jqx.browser.msie){var d=true,b=true;var e=this.host;var c=0,f=0;while(e&&e.position&&e[0].parentNode){var h=e.position();c+=parseFloat(h.left)-parseInt(h.left);f+=parseFloat(h.top)-parseInt(h.top);e=e.parent()}d=parseFloat(c)==parseInt(c);b=parseFloat(f)==parseInt(f)}if(!d){this.host.find("#tdLeft")[0].style.width="0.5px"}if(!b){this.host.find("#tdTop")[0].style.height="0.5px"}},_layout:function(){var c=a(this.canvas).offset();var b=this.host.find(".chartContainer");this._width=Math.max(a.jqx._rup(this.host.width())-1,0);this._height=Math.max(a.jqx._rup(this.host.height())-1,0);b[0].style.width=this._width;b[0].style.height=this._height;this._fixLayout()},getRect:function(){return{x:0,y:0,width:this._width,height:this._height}},getContainer:function(){var b=this.host.find(".chartContainer");return b},clear:function(){while(this.canvas.childElementCount>0){this.canvas.removeChild(this.canvas.firstElementChild)}this._defs=document.createElementNS(this._svgns,"defs");this._gradients={};this.canvas.appendChild(this._defs)},removeElement:function(c){if(c!=undefined){try{if(c.parentNode){c.parentNode.removeChild(c)}else{this.canvas.removeChild(c)}}catch(b){}}},_openGroups:[],beginGroup:function(){var b=this._activeParent();var c=document.createElementNS(this._svgns,"g");b.appendChild(c);this._openGroups.push(c);return c},endGroup:function(){if(this._openGroups.length==0){return}this._openGroups.pop()},_activeParent:function(){return this._openGroups.length==0?this.canvas:this._openGroups[this._openGroups.length-1]},createClipRect:function(d){var e=document.createElementNS(this._svgns,"clipPath");var b=document.createElementNS(this._svgns,"rect");this.attr(b,{x:d.x,y:d.y,width:d.width,height:d.height});this._clipId=this._clipId||0;e.id="cl"+this._id+"_"+(++this._clipId).toString();e.appendChild(b);this._defs.appendChild(e);return e},setClip:function(c,b){return this.attr(c,{"clip-path":"url(#"+b.id+")"})},_clipId:0,addHandler:function(b,d,c){b["on"+d]=c},shape:function(b,e){var c=document.createElementNS(this._svgns,b);if(!c){return undefined}for(var d in e){c.setAttribute(d,e[d])}this._activeParent().appendChild(c);return c},measureText:function(m,d,e){var g=document.createElementNS(this._svgns,"text");this.attr(g,e);g.appendChild(g.ownerDocument.createTextNode(m));var l=this._activeParent();l.appendChild(g);var n=g.getBBox();if(isNaN(n.width)||isNaN(n.height)||Math.abs(n.width)==Infinity||Math.abs(n.height)==Infinity){return{width:0,height:0}}var h=a.jqx._rup(n.width);var b=a.jqx._rup(n.height);l.removeChild(g);if(d==0){return{width:h,height:b}}var j=d*Math.PI*2/360;var c=Math.abs(Math.sin(j));var i=Math.abs(Math.cos(j));var f=Math.abs(h*c+b*i);var k=Math.abs(h*i+b*c);return{width:a.jqx._rup(k),height:a.jqx._rup(f)}},text:function(r,o,m,v,t,D,F,E,q,i){var u;if(!q){q="center"}if(!i){i="center"}if(E){u=this.beginGroup();var e=this.createClipRect({x:a.jqx._rup(o)-1,y:a.jqx._rup(m)-1,width:a.jqx._rup(v)+2,height:a.jqx._rup(t)+2});this.setClip(u,e)}var s=document.createElementNS(this._svgns,"text");this.attr(s,F);s.appendChild(s.ownerDocument.createTextNode(r));var l=this._activeParent();l.appendChild(s);var b=s.getBBox();l.removeChild(s);var G=b.width;var j=b.height*0.6;var p=v||0;var B=t||0;if(!D||D==0){if(q=="center"){o+=(p-G)/2}else{if(q=="right"){o+=(p-G)}}m+=j;if(i=="center"){m+=(B-j)/2}else{if(i=="bottom"){m+=B-j}}if(!v){v=G}if(!t){t=j}this.attr(s,{x:a.jqx._rup(o),y:a.jqx._rup(m),width:a.jqx._rup(v),height:a.jqx._rup(t),cursor:"default"});l.appendChild(s);this.endGroup();return s}var f=D*Math.PI*2/360;var C=Math.sin(f);var g=Math.cos(f);var k=j*g+G*C;var n=G*g+j*C;var z=m;var d=o;o+=(v-n)/2;m+=(t-k)/2;m+=j*g;if(q=="left"){if(g>0){o=d;if(C<0){o-=C*j}}else{o=d-g*G;if(C<0){o-=C*j}}}else{if(q=="right"){if(g>0){o=d+v-n;if(C<0){o+=C*j}}else{o=d+v;if(C>=0){o-=C*j}}}}if(i=="top"){if(C<0){m=z-C*G;if(g>0){m+=g*j}}else{m=z;if(g>0){m=z+j*g}}}else{if(i=="bottom"){if(C<0){m=z+t;if(g<=0){m+=j*g}}else{m=z+t-G*C;if(g<0){m+=j*g}}}}o=a.jqx._rup(o);m=a.jqx._rup(m);var A=this.shape("g",{transform:"translate("+o+","+m+")"});var c=this.shape("g",{transform:"rotate("+D+")"});A.appendChild(c);c.appendChild(s);l.appendChild(A);this.endGroup();return A},line:function(d,f,c,e,g){var b=this.shape("line",{x1:d,y1:f,x2:c,y2:e});this.attr(b,g)},path:function(c,d){var b=this.shape("path");b.setAttribute("d",c);if(d){this.attr(b,d)}return b},rect:function(b,g,c,e,f){b=a.jqx._ptrnd(b);g=a.jqx._ptrnd(g);c=a.jqx._rup(c);e=a.jqx._rup(e);var d=this.shape("rect",{x:b,y:g,width:c,height:e});if(f){this.attr(d,f)}return d},circle:function(b,d,c){return this.shape("circle",{cx:b,cy:d,r:c})},pieSlicePath:function(c,h,g,e,f,d,b){return a.jqx.commonRenderer.pieSlicePath(c,h,g,e,f,d,b)},pieslice:function(j,h,g,d,f,b,i,c){var e=this.pieSlicePath(j,h,g,d,f,b,i);var k=this.shape("path");k.setAttribute("d",e);if(c){this.attr(k,c)}return k},attr:function(b,d){if(!b||!d){return}for(var c in d){if(c=="textContent"){b.textContent=d[c]}else{b.setAttribute(c,d[c])}}},getAttr:function(c,b){return c.getAttribute(b)},_gradients:{},_toLinearGradient:function(e,g,h){var c="grd"+e.replace("#","")+(g?"v":"h");var b="url(#"+c+")";if(this._gradients[b]){return b}var d=document.createElementNS(this._svgns,"linearGradient");this.attr(d,{x1:"0%",y1:"0%",x2:g?"0%":"100%",y2:g?"100%":"0%",id:c});for(var f in h){var j=document.createElementNS(this._svgns,"stop");var i="stop-color:"+a.jqx._adjustColor(e,h[f][1]);this.attr(j,{offset:h[f][0]+"%",style:i});d.appendChild(j)}this._defs.appendChild(d);this._gradients[b]=true;return b},_toRadialGradient:function(e,h,g){var c="grd"+e.replace("#","")+"r"+(g!=undefined?g.key:"");var b="url(#"+c+")";if(this._gradients[b]){return b}var d=document.createElementNS(this._svgns,"radialGradient");if(g==undefined){this.attr(d,{cx:"50%",cy:"50%",r:"100%",fx:"50%",fy:"50%",id:c})}else{this.attr(d,{cx:g.x1,cy:g.y1,r:g.outerRadius,id:c,gradientUnits:"userSpaceOnUse"})}for(var f in h){var j=document.createElementNS(this._svgns,"stop");var i="stop-color:"+a.jqx._adjustColor(e,h[f][1]);this.attr(j,{offset:h[f][0]+"%",style:i});d.appendChild(j)}this._defs.appendChild(d);this._gradients[b]=true;return b}};a.jqx.vmlRenderer=function(){};a.jqx.vmlRenderer.prototype={init:function(g){var f="<div class='chartContainer' style=\"position:relative;overflow:hidden;\"><div>";g.append(f);this.host=g;var b=g.find(".chartContainer");b[0].style.width=g.width()+"px";b[0].style.height=g.height()+"px";var d=true;try{for(var c=0;c<document.namespaces.length;c++){if(document.namespaces[c].name=="v"&&document.namespaces[c].urn=="urn:schemas-microsoft-com:vml"){d=false;break}}}catch(h){return false}if(a.jqx.browser.msie&&parseInt(a.jqx.browser.version)<9&&(document.childNodes&&document.childNodes.length>0&&document.childNodes[0].data&&document.childNodes[0].data.indexOf("DOCTYPE")!=-1)){if(d){document.namespaces.add("v","urn:schemas-microsoft-com:vml")}this._ie8mode=true}else{if(d){document.namespaces.add("v","urn:schemas-microsoft-com:vml");document.createStyleSheet().cssText="v\\:* { behavior: url(#default#VML); display: inline-block; }"}}this.canvas=b[0];this._width=Math.max(a.jqx._rup(b.width()),0);this._height=Math.max(a.jqx._rup(b.height()),0);b[0].style.width=this._width+2;b[0].style.height=this._height+2;this._id=new Date().getTime();this.clear();return true},getRect:function(){return{x:0,y:0,width:this._width,height:this._height}},getContainer:function(){var b=this.host.find(".chartContainer");return b},clear:function(){while(this.canvas.childElementCount>0){this.canvas.removeChild(this.canvas.firstElementChild)}this._gradients={}},removeElement:function(b){if(b!=null){b.parentNode.removeChild(b)}},_openGroups:[],beginGroup:function(){var b=this._activeParent();var c=document.createElement("v:group");c.style.position="absolute";c.coordorigin="0,0";c.coordsize=this._width+","+this._height;c.style.left=0;c.style.top=0;c.style.width=this._width;c.style.height=this._height;b.appendChild(c);this._openGroups.push(c);return c},endGroup:function(){if(this._openGroups.length==0){return}this._openGroups.pop()},_activeParent:function(){return this._openGroups.length==0?this.canvas:this._openGroups[this._openGroups.length-1]},createClipRect:function(b){var c=document.createElement("div");c.style.height=b.height+"px";c.style.width=b.width+"px";c.style.position="absolute";c.style.left=b.x+"px";c.style.top=b.y+"px";c.style.overflow="hidden";this._clipId=this._clipId||0;c.id="cl"+this._id+"_"+(++this._clipId).toString();this._activeParent().appendChild(c);return c},setClip:function(c,b){b.appendChild(c)},_clipId:0,addHandler:function(b,d,c){a(b).on(d,c)},measureText:function(o,d,e){var f=document.createElement("v:textbox");var m=document.createElement("span");m.appendChild(document.createTextNode(o));f.appendChild(m);if(e["class"]){m.className=e["class"]}var n=this._activeParent();n.appendChild(f);var h=a(f);var i=a.jqx._rup(h.width());var b=a.jqx._rup(h.height());n.removeChild(f);if(b==0&&a.jqx.browser.msie&&parseInt(a.jqx.browser.version)<9){var p=h.css("font-size");if(p){b=parseInt(p);if(isNaN(b)){b=0}}}if(d==0){return{width:i,height:b}}var k=d*Math.PI*2/360;var c=Math.abs(Math.sin(k));var j=Math.abs(Math.cos(k));var g=Math.abs(i*c+b*j);var l=Math.abs(i*j+b*c);return{width:a.jqx._rup(l),height:a.jqx._rup(g)}},text:function(o,l,k,r,p,A,C,B,n,g){var s=C.stroke||"black";var q;if(!n){n="center"}if(!g){g="center"}B=false;if(B){q=this.beginGroup();var e=this.createClipRect({x:a.jqx._rup(l),y:a.jqx._rup(k),width:a.jqx._rup(r),height:a.jqx._rup(p)});this.setClip(q,e)}var b=document.createElement("v:textbox");b.style.position="absolute";var t=document.createElement("span");t.appendChild(document.createTextNode(o));if(C["class"]){t.className=C["class"]}b.appendChild(t);var j=this._activeParent();j.appendChild(b);var D=a(b).width();var i=a(b).height();j.removeChild(b);var m=r||0;var v=p||0;if(!A||A==0||Math.abs(A)!=90){if(n=="center"){l+=(m-D)/2}else{if(n=="right"){l+=(m-D)}}if(g=="center"){k=k+(v-i)/2}else{if(g=="bottom"){k=k+v-i}}if(!r){r=D}if(!p){p=i}if(!q){b.style.left=a.jqx._rup(l);b.style.top=a.jqx._rup(k);b.style.width=a.jqx._rup(r);b.style.height=a.jqx._rup(p)}j.appendChild(b);if(q){this.endGroup();return j}return b}var f=A*Math.PI*2/360;var d=Math.abs(D*Math.sin(f)-i*Math.cos(f));var z=Math.abs(D*Math.cos(f)+i*Math.sin(f));if(n=="center"){l+=(m-z)/2}else{if(n=="right"){l+=(m-z)}}if(g=="center"){k=k+(v-d)/2}else{if(g=="bottom"){k=k+v-d}}l=a.jqx._rup(l);k=a.jqx._rup(k);var u=a.jqx._rup(l+z);var c=a.jqx._rup(k+d);if(Math.abs(A)==90){j.appendChild(b);b.style.left=a.jqx._rup(l);b.style.top=a.jqx._rup(k);b.style.filter="progid:DXImageTransform.Microsoft.BasicImage(rotation=3)";if(q){this.endGroup();return j}return b}return b},shape:function(b,e){var c=document.createElement(this._createElementMarkup(b));if(!c){return undefined}for(var d in e){c.setAttribute(d,e[d])}this._activeParent().appendChild(c);return c},line:function(e,g,d,f,h){var b="M "+e+","+g+" L "+d+","+f+" X E";var c=this.path(b);this.attr(c,h);return c},_createElementMarkup:function(b){var c="<v:"+b+' style=""></v:'+b+">";if(this._ie8mode){c=c.replace('style=""','style="behavior: url(#default#VML);"')}return c},path:function(c,e){var b=document.createElement(this._createElementMarkup("shape"));b.style.position="absolute";b.coordsize=this._width+" "+this._height;b.coordorigin="0 0";b.style.width=parseInt(this._width);b.style.height=parseInt(this._height);b.style.left=0;b.style.top=0;var d=document.createElement(this._createElementMarkup("path"));d.v=c;b.appendChild(d);this._activeParent().appendChild(b);if(e){this.attr(b,e)}return b},rect:function(b,g,c,d,f){b=a.jqx._ptrnd(b);g=a.jqx._ptrnd(g);c=a.jqx._rup(c);d=a.jqx._rup(d);var e=this.shape("rect",f);e.style.position="absolute";e.style.left=b;e.style.top=g;e.style.width=c;e.style.height=d;e.strokeweight=0;return e},circle:function(b,e,d){var c=this.shape("oval");b=a.jqx._ptrnd(b-d);e=a.jqx._ptrnd(e-d);d=a.jqx._rup(d);c.style.position="absolute";c.style.left=b;c.style.top=e;c.style.width=d*2;c.style.height=d*2;return c},updateCircle:function(d,b,e,c){if(b==undefined){b=parseFloat(d.style.left)+parseFloat(d.style.width)/2}if(e==undefined){e=parseFloat(d.style.top)+parseFloat(d.style.height)/2}if(c==undefined){c=parseFloat(d.width)/2}b=a.jqx._ptrnd(b-c);e=a.jqx._ptrnd(e-c);c=a.jqx._rup(c);d.style.left=b;d.style.top=e;d.style.width=c*2;d.style.height=c*2},pieSlicePath:function(k,j,h,r,B,C,d){if(!r){r=1}var m=Math.abs(B-C);var p=m>180?1:0;if(m>360){B=0;C=360}var q=B*Math.PI*2/360;var i=C*Math.PI*2/360;var w=k,v=k,f=j,e=j;var n=!isNaN(h)&&h>0;if(n){d=0}if(d>0){var l=m/2+B;var A=l*Math.PI*2/360;k+=d*Math.cos(A);j-=d*Math.sin(A)}if(n){var u=h;w=a.jqx._ptrnd(k+u*Math.cos(q));f=a.jqx._ptrnd(j-u*Math.sin(q));v=a.jqx._ptrnd(k+u*Math.cos(i));e=a.jqx._ptrnd(j-u*Math.sin(i))}var t=a.jqx._ptrnd(k+r*Math.cos(q));var s=a.jqx._ptrnd(k+r*Math.cos(i));var c=a.jqx._ptrnd(j-r*Math.sin(q));var b=a.jqx._ptrnd(j-r*Math.sin(i));r=a.jqx._ptrnd(r);h=a.jqx._ptrnd(h);k=a.jqx._ptrnd(k);j=a.jqx._ptrnd(j);var g=Math.round(B*65535);var z=Math.round(C-B)*65536;var o="";if(n){o="M"+w+" "+f;o+=" AE "+k+" "+j+" "+h+" "+h+" "+g+" "+z;o+=" L "+s+" "+b;g=Math.round(B-C)*65535;z=Math.round(C)*65536;o+=" AE "+k+" "+j+" "+r+" "+r+" "+z+" "+g;o+=" L "+w+" "+f}else{o="M"+k+" "+j;o+=" AE "+k+" "+j+" "+r+" "+r+" "+g+" "+z}o+=" X E";return o},pieslice:function(k,i,h,e,g,b,j,d){var f=this.pieSlicePath(k,i,h,e,g,b,j);var c=this.path(f,d);if(d){this.attr(c,d)}return c},_keymap:[{svg:"fill",vml:"fillcolor"},{svg:"stroke",vml:"strokecolor"},{svg:"stroke-width",vml:"strokeweight"},{svg:"fill-opacity",vml:"fillopacity"},{svg:"opacity",vml:"opacity"},{svg:"cx",vml:"style.left"},{svg:"cy",vml:"style.top"},{svg:"height",vml:"style.height"},{svg:"width",vml:"style.width"},{svg:"x",vml:"style.left"},{svg:"y",vml:"style.top"},{svg:"d",vml:"v"}],_translateParam:function(b){for(var c in this._keymap){if(this._keymap[c].svg==b){return this._keymap[c].vml}}return b},attr:function(c,e){if(!c||!e){return}for(var d in e){var b=this._translateParam(d);if(b=="fillcolor"&&e[d].indexOf("grd")!=-1){c.type=e[d]}else{if(b=="opacity"||b=="fillopacity"){if(c.fill){c.fill.opacity=e[d]}}else{if(b=="textContent"){c.children[0].innerText=e[d]}else{if(b.indexOf("style.")==-1){c[b]=e[d]}else{c.style[b.replace("style.","")]=e[d]}}}}}},getAttr:function(d,c){var b=this._translateParam(c);if(b=="opacity"||b=="fillopacity"){if(d.fill){return d.fill.opacity}else{return 1}}if(b.indexOf("style.")==-1){return d[b]}return d.style[b.replace("style.","")]},_gradients:{},_toRadialGradient:function(b,d,c){return b},_toLinearGradient:function(g,i,j){if(this._ie8mode){return g}var d="grd"+g.replace("#","")+(i?"v":"h");var e="#"+d+"";if(this._gradients[e]){return e}var f=document.createElement(this._createElementMarkup("fill"));f.type="gradient";f.method="linear";f.angle=i?0:90;var c="";for(var h in j){if(h>0){c+=", "}c+=j[h][0]+"% "+a.jqx._adjustColor(g,j[h][1])}f.colors=c;var b=document.createElement(this._createElementMarkup("shapetype"));b.appendChild(f);b.id=d;this.canvas.appendChild(b);return e}};a.jqx.HTML5Renderer=function(){};a.jqx.ptrnd=function(c){if(Math.abs(Math.round(c)-c)==0.5){return c}var b=Math.round(c);if(b<c){b=b-1}return b+0.5};a.jqx.HTML5Renderer.prototype={_elements:{},init:function(b){try{this.host=b;this.host.append("<canvas id='__jqxCanvasWrap' style='width:100%; height: 100%;'/>");this.canvas=b.find("#__jqxCanvasWrap");this.canvas[0].width=b.width();this.canvas[0].height=b.height();this.ctx=this.canvas[0].getContext("2d")}catch(c){return false}return true},getContainer:function(){if(this.canvas&&this.canvas.length==1){return this.canvas}return undefined},getRect:function(){return{x:0,y:0,width:this.canvas[0].width-1,height:this.canvas[0].height-1}},beginGroup:function(){},endGroup:function(){},setClip:function(){},createClipRect:function(b){},addHandler:function(b,d,c){},clear:function(){this._elements={};this._maxId=0;this._renderers._gradients={};this._gradientId=0},removeElement:function(b){if(this._elements[b.id]){delete this._elements[b,id]}},_maxId:0,shape:function(b,e){var c={type:b,id:this._maxId++};for(var d in e){c[d]=e[d]}this._elements[c.id]=c;return c},attr:function(b,d){for(var c in d){b[c]=d[c]}},rect:function(b,g,c,e,f){if(isNaN(b)){throw'Invalid value for "x"'}if(isNaN(g)){throw'Invalid value for "y"'}if(isNaN(c)){throw'Invalid value for "width"'}if(isNaN(e)){throw'Invalid value for "height"'}var d=this.shape("rect",{x:b,y:g,width:c,height:e});if(f){this.attr(d,f)}return d},path:function(b,d){var c=this.shape("path",d);this.attr(c,{d:b});return c},line:function(c,e,b,d,f){return this.path("M "+c+","+e+" L "+b+","+d,f)},circle:function(b,f,d,e){var c=this.shape("circle",{x:b,y:f,r:d});if(e){this.attr(c,e)}return c},pieSlicePath:function(c,h,g,e,f,d,b){return a.jqx.commonRenderer.pieSlicePath(c,h,g,e,f,d,b)},pieslice:function(j,h,g,e,f,b,i,c){var d=this.path(this.pieSlicePath(j,h,g,e,f,b,i),c);this.attr(d,{x:j,y:h,innerRadius:g,outerRadius:e,angleFrom:f,angleTo:b});return d},_getCSSStyle:function(c){var g=document.styleSheets;try{for(var d=0;d<g.length;d++){for(var b=0;g[d].cssRules&&b<g[d].cssRules.length;b++){if(g[d].cssRules[b].selectorText.indexOf(c)!=-1){return g[d].cssRules[b].style}}}}catch(f){}return{}},measureText:function(o,e,f){var k="Arial";var p="10pt";var m="";if(f["class"]){var b=this._getCSSStyle(f["class"]);if(b.fontSize){p=b.fontSize}if(b.fontFamily){k=b.fontFamily}if(b.fontWeight){m=b.fontWeight}}this.ctx.font=m+" "+p+" "+k;var h=this.ctx.measureText(o).width;var n=document.createElement("span");n.font=this.ctx.font;n.textContent=o;document.body.appendChild(n);var c=n.offsetHeight*0.6;document.body.removeChild(n);if(e==0){return{width:h,height:c}}var j=e*Math.PI*2/360;var d=Math.abs(Math.sin(j));var i=Math.abs(Math.cos(j));var g=Math.abs(h*d+c*i);var l=Math.abs(h*i+c*d);return{width:a.jqx._rup(l),height:a.jqx._rup(g)}},text:function(l,k,i,c,m,e,f,d,g,j){var n=this.shape("text",{text:l,x:k,y:i,width:c,height:m,angle:e,clip:d,halign:g,valign:j});if(f){this.attr(n,f)}n.fontFamily="Arial";n.fontSize="10pt";n.fontWeight="";n.color="#000000";if(f["class"]){var b=this._getCSSStyle(f["class"]);n.fontFamily=b.fontFamily||n.fontFamily;n.fontSize=b.fontSize||n.fontSize;n.fontWeight=b.fontWeight||n.fontWeight;n.color=b.color||n.color}var h=this.measureText(l,0,f);n.textWidth=h.width;n.textHeight=h.height;return n},_toLinearGradient:function(c,g,f){if(this._renderers._gradients[c]){return c}var b=[];for(var e=0;e<f.length;e++){b.push({percent:f[e][0]/100,color:a.jqx._adjustColor(c,f[e][1])})}var d="gr"+this._gradientId++;this.createGradient(d,g?"vertical":"horizontal",b);return d},_toRadialGradient:function(c,f){if(this._renderers._gradients[c]){return c}var b=[];for(var e=0;e<f.length;e++){b.push({percent:f[e][0]/100,color:a.jqx._adjustColor(c,f[e][1])})}var d="gr"+this._gradientId++;this.createGradient(d,"radial",b);return d},_gradientId:0,createGradient:function(d,c,b){this._renderers.createGradient(d,c,b)},_renderers:{_gradients:{},createGradient:function(d,c,b){this._gradients[d]={orientation:c,colorStops:b}},setStroke:function(b,c){b.strokeStyle=c.stroke||"transparent";b.lineWidth=c["stroke-width"]||1},setFillStyle:function(m,e){m.fillStyle="transparent";if(e["fill-opacity"]){m.globalAlpha=e["fill-opacity"]}else{m.globalAlpha=1}if(e.fill&&e.fill.indexOf("#")==-1&&this._gradients[e.fill]){var k=this._gradients[e.fill].orientation!="horizontal";var g=this._gradients[e.fill].orientation=="radial";var c=a.jqx.ptrnd(e.x);var l=a.jqx.ptrnd(e.y);var b=a.jqx.ptrnd(e.x+(k?0:e.width));var h=a.jqx.ptrnd(e.y+(k?e.height:0));var j;if((e.type=="circle"||e.type=="path")&&g){x=a.jqx.ptrnd(e.x);y=a.jqx.ptrnd(e.y);r1=e.innerRadius||0;r2=e.outerRadius||e.r||0;j=m.createRadialGradient(x,y,r1,x,y,r2)}if(!g){if(isNaN(c)||isNaN(b)||isNaN(l)||isNaN(h)){c=0;l=0;b=k?0:m.canvas.width;h=k?m.canvas.height:0}j=m.createLinearGradient(c,l,b,h)}var d=this._gradients[e.fill].colorStops;for(var f=0;f<d.length;f++){j.addColorStop(d[f].percent,d[f].color)}m.fillStyle=j}else{if(e.fill){m.fillStyle=e.fill}}},rect:function(b,c){b.fillRect(a.jqx.ptrnd(c.x),a.jqx.ptrnd(c.y),c.width,c.height);b.strokeRect(a.jqx.ptrnd(c.x),a.jqx.ptrnd(c.y),c.width,c.height)},circle:function(b,c){if(c.r==0){return}b.beginPath();b.arc(a.jqx.ptrnd(c.x),a.jqx.ptrnd(c.y),c.r,0,Math.PI*2,false);b.closePath();b.fill();b.stroke()},_parsePoint:function(c){var b=this._parseNumber(c);var d=this._parseNumber(c);return({x:b,y:d})},_parseNumber:function(d){var e=false;for(var b=this._pos;b<d.length;b++){if((d[b]>="0"&&d[b]<="9")||d[b]=="."||(d[b]=="-"&&!e)){e=true;continue}if(!e&&(d[b]==" "||d[b]==",")){this._pos++;continue}break}var c=parseFloat(d.substring(this._pos,b));if(isNaN(c)){return undefined}this._pos=b;return c},_pos:0,_cmds:"mlcaz",_lastCmd:"",_isRelativeCmd:function(b){return a.jqx.string.contains(this._cmds,b)},_parseCmd:function(b){for(var c=this._pos;c<b.length;c++){if(a.jqx.string.containsIgnoreCase(this._cmds,b[c])){this._pos=c+1;this._lastCmd=b[c];return this._lastCmd}if(b[c]==" "){this._pos++;continue}if(b[c]>="0"&&b[c]<="9"){this._pos=c;if(this._lastCmd==""){break}else{return this._lastCmd}}}return undefined},_toAbsolutePoint:function(b){return{x:this._currentPoint.x+b.x,y:this._currentPoint.y+b.y}},_currentPoint:{x:0,y:0},path:function(C,L){var z=L.d;this._pos=0;this._lastCmd="";var k=undefined;this._currentPoint={x:0,y:0};C.beginPath();var G=0;while(this._pos<z.length){var F=this._parseCmd(z);if(F==undefined){break}if(F=="M"||F=="m"){var D=this._parsePoint(z);if(D==undefined){break}C.moveTo(D.x,D.y);this._currentPoint=D;if(k==undefined){k=D}continue}if(F=="L"||F=="l"){var D=this._parsePoint(z);if(D==undefined){break}C.lineTo(D.x,D.y);this._currentPoint=D;continue}if(F=="A"||F=="a"){var g=this._parseNumber(z);var f=this._parseNumber(z);var J=this._parseNumber(z)*(Math.PI/180);var N=this._parseNumber(z);var e=this._parseNumber(z);var o=this._parsePoint(z);if(this._isRelativeCmd(F)){o=this._toAbsolutePoint(o)}if(g==0||f==0){continue}var h=this._currentPoint;var I={x:Math.cos(J)*(h.x-o.x)/2+Math.sin(J)*(h.y-o.y)/2,y:-Math.sin(J)*(h.x-o.x)/2+Math.cos(J)*(h.y-o.y)/2};var j=Math.pow(I.x,2)/Math.pow(g,2)+Math.pow(I.y,2)/Math.pow(f,2);if(j>1){g*=Math.sqrt(j);f*=Math.sqrt(j)}var p=(N==e?-1:1)*Math.sqrt(((Math.pow(g,2)*Math.pow(f,2))-(Math.pow(g,2)*Math.pow(I.y,2))-(Math.pow(f,2)*Math.pow(I.x,2)))/(Math.pow(g,2)*Math.pow(I.y,2)+Math.pow(f,2)*Math.pow(I.x,2)));if(isNaN(p)){p=0}var H={x:p*g*I.y/f,y:p*-f*I.x/g};var B={x:(h.x+o.x)/2+Math.cos(J)*H.x-Math.sin(J)*H.y,y:(h.y+o.y)/2+Math.sin(J)*H.x+Math.cos(J)*H.y};var A=function(i){return Math.sqrt(Math.pow(i[0],2)+Math.pow(i[1],2))};var t=function(m,i){return(m[0]*i[0]+m[1]*i[1])/(A(m)*A(i))};var M=function(m,i){return(m[0]*i[1]<m[1]*i[0]?-1:1)*Math.acos(t(m,i))};var E=M([1,0],[(I.x-H.x)/g,(I.y-H.y)/f]);var n=[(I.x-H.x)/g,(I.y-H.y)/f];var l=[(-I.x-H.x)/g,(-I.y-H.y)/f];var K=M(n,l);if(t(n,l)<=-1){K=Math.PI}if(t(n,l)>=1){K=0}if(e==0&&K>0){K=K-2*Math.PI}if(e==1&&K<0){K=K+2*Math.PI}var t=(g>f)?g:f;var w=(g>f)?1:g/f;var q=(g>f)?f/g:1;C.translate(B.x,B.y);C.rotate(J);C.scale(w,q);C.arc(0,0,t,E,E+K,1-e);C.scale(1/w,1/q);C.rotate(-J);C.translate(-B.x,-B.y);continue}if((F=="Z"||F=="z")&&k!=undefined){C.lineTo(k.x,k.y);this._currentPoint=k;continue}if(F=="C"||F=="c"){var d=this._parsePoint(z);var c=this._parsePoint(z);var b=this._parsePoint(z);C.bezierCurveTo(d.x,d.y,c.x,c.y,b.x,b.y);this._currentPoint=b;continue}}C.fill();C.stroke();C.closePath()},text:function(q,v){var k=a.jqx.ptrnd(v.x);var i=a.jqx.ptrnd(v.y);var o=a.jqx.ptrnd(v.width);var n=a.jqx.ptrnd(v.height);var m=v.halign;var d=v.valign;var t=v.angle;var u=v.clip||true;q.save();if(!m){m="center"}if(!d){d="center"}if(u){q.rect(k-2,i-2,o+5,n+5);q.clip()}var z=v.textWidth;var f=v.textHeight;var l=o||0;var r=n||0;q.fillStyle=v.color;q.font=v.fontWeight+" "+v.fontSize+" "+v.fontFamily;if(!t||t==0){if(m=="center"){k+=(l-z)/2}else{if(m=="right"){k+=(l-z)}}i+=f;if(d=="center"){i+=(r-f)/2}else{if(d=="bottom"){i+=r-f}}if(!o){o=z}if(!n){n=f}q.fillText(v.text,k,i);q.restore();return}var c=t*Math.PI*2/360;var s=Math.sin(c);var e=Math.cos(c);var g=f*e+z*s;var j=z*e+f*s;var p=i;var b=k;k+=(o-j)/2;i+=(n-g)/2;i+=f*e;if(m=="left"){if(e>0){k=b;if(s<0){k-=s*f}}else{k=b-e*z;if(s<0){k-=s*f}}}else{if(m=="right"){if(e>0){k=b+o-j;if(s<0){k+=s*f}}else{k=b+o;if(s>=0){k-=s*f}}}}if(d=="top"){if(s<0){i=p-s*z;if(e>0){i+=e*f}}else{i=p;if(e>0){i=p+f*e}}}else{if(d=="bottom"){if(s<0){i=p+n;if(e<=0){i+=f*e}}else{i=p+n-z*s;if(e<0){i+=f*e}}}}k=a.jqx._rup(k);i=a.jqx._rup(i);q.translate(k,i);q.rotate(c);q.fillText(v.text,0,0);q.restore()}},refresh:function(){this.ctx.clearRect(0,0,this.canvas[0].width,this.canvas[0].height);for(var b in this._elements){var c=this._elements[b];this._renderers.setFillStyle(this.ctx,c);this._renderers.setStroke(this.ctx,c);this._renderers[this._elements[b].type](this.ctx,c)}}}})(jQuery);
    var celeb = {
    "rachel-bilson" : {
        nav_today : 12,
        nav_yest: 10
    },
    "jennifer-anniston" : {
        nav_today : 15,
        nav_yest: 12
    },
    "kim-kardashian" : {
        nav_today : 20,
        nav_yest: 8
    },
    "zooey-deschanel" : {
        nav_today : 5,
        nav_yest: 9
    },
    "ashton-kutcher" : {
        nav_today : 30,
        nav_yest: 25
    },
    "jessica-simpson" : {
        nav_today : 11,
        nav_yest: 11
    },
    "angelina-jolie" : {
        nav_today : 6,
        nav_yest: 7
    },
    "anne-hathaway" : {
        nav_today : 14,
        nav_yest: 12
    },
    "beyonce" : {
        nav_today : 18,
        nav_yest: 12
    },
    "tom-cruise" : {
        nav_today : 16,
        nav_yest: 13
    },
    "emma-watson" : {
        nav_today : 16,
        nav_yest: 13
    },
    "george-clooney" : {
        nav_today : 12,
        nav_yest: 10
    },
    "johnny-depp" : {
        nav_today : 5,
        nav_yest: 4
    },
    "jessica-alba" : {
        nav_today : 16,
        nav_yest: 12
    },
    "justin-timberlake" : {
        nav_today : 10,
        nav_yest: 14
    },
    "lindsay-lohan" : {
        nav_today : 17,
        nav_yest: 12
    },
    "madonna" : {
        nav_today : 15,
        nav_yest: 10
    },
    "miley-cyrus" : {
        nav_today : 18,
        nav_yest: 20
    },
    "paris-hilton" : {
        nav_today : 8,
        nav_yest: 10
    },
    "brad-pitt" : {
        nav_today : 16,
        nav_yest: 10
    },
    "christina-aguilera" : {
        nav_today : 20,
        nav_yest: 12
    },
    "eva-longoria" : {
        nav_today : 12,
        nav_yest: 15
    },
    "halle-berry" : {
        nav_today : 16,
        nav_yest: 12
    },
    "rihanna" : {
        nav_today : 30,
        nav_yest: 25
    },
    "penelope-cruz" : {
        nav_today : 16,
        nav_yest: 14
    },
    "victoria-beckham" : {
        nav_today : 10,
        nav_yest: 10
    },
    "courteney-cox" : {
        nav_today : 15,
        nav_yest: 12
    },
    "ryan-reynolds" : {
        nav_today : 6,
        nav_yest: 10
    },
    "robert-pattinson" : {
        nav_today : 12,
        nav_yest: 18
    },
    "demi-moore" : {
        nav_today : 17,
        nav_yest: 15
    },
    "sandra-bullock" : {
        nav_today : 14,
        nav_yest: 11
    }
};


function populateDiv() {
    var dataSkeleton = "<div class=\"snap-data-grp\">\n" +
            "                        <div class=\"snap-data ast-col\"><a href=\"#\">ACTOR_NAME</a>\n" +
            "                        </div><div class=\"snap-data nav-col\">CURRENT_NAV\n" +
            "                        </div><div class=\"snap-data chgm-col\"><span class=\"PROFIT_OR_LOSS_STYLE\">PROFIT_OR_LOSS_SYMBOL DELTA_DOLLARS</span>\n" +
            "                        </div><div class=\"snap-data chgp-col\"><span class=\"PROFIT_OR_LOSS_STYLE\">PROFIT_OR_LOSS_SYMBOL DELTA_PERCENTAGE %</span>\n" +
            "                        </div><div class=\"snap-data unt-col\">1\n" +
            "                        </div><div class=\"snap-data mkt-col\">CURRENT_NAV</div>\n" +
            "                    </div>";
    var totalSkeleton = "<div class=\"snap-smry-grp\">\n" +
            "                        <div class=\"snap-smry fuse-ast-nav-chg-col\">Portfolio Total :\n" +
            "                        </div><div class=\"snap-smry unt-col\">PORTFOLIO_TOTAL_SHARES\n" +
            "                        </div><div class=\"snap-smry mkt-col\">PORTFOLIO_TOTAL_VALUE</div>\n" +
            "                    </div>";


    var arr1 = localStorage.getItem("player1");
    var myArray = [];
    if(arr1 != null && arr1 != '') {
        myArray = arr1.split(',');
    }

    var celebName = "";
    var currNav = "";
    var prevNav = "";

    $("#my-investments").html("");
    $("#my-investments-total").html("");

    myArray.forEach( function(token) {
        var dataSkeletonLocal = dataSkeleton;
        // Replace ID with name
        celebName = token.replace(/(?:_| |\b)(\w)/g, function(str, p1) { return p1.toUpperCase()}).replace("-"," ");

        dataSkeletonLocal = dataSkeletonLocal.replace(/ACTOR_NAME/g, celebName);
        dataSkeletonLocal = dataSkeletonLocal.replace(/CURRENT_NAV/g, celeb[token].nav_today);
        dataSkeletonLocal = dataSkeletonLocal.replace(/PROFIT_OR_LOSS_SYMBOL/g, ((parseInt(celeb[token].nav_yest, 10) - parseInt(celeb[token].nav_today,10)) >= 0) ? ( ((parseInt(celeb[token].nav_yest, 10) - parseInt(celeb[token].nav_today,10)) > 0) ? "+" : "" ) : "-");
        dataSkeletonLocal = dataSkeletonLocal.replace(/PROFIT_OR_LOSS_STYLE/g, ((parseInt(celeb[token].nav_yest, 10) - parseInt(celeb[token].nav_today,10)) >= 0) ? "plus" : "minus");
        dataSkeletonLocal = dataSkeletonLocal.replace(/DELTA_DOLLARS/g, Math.abs(parseInt(celeb[token].nav_yest, 10) - parseInt(celeb[token].nav_today,10)));
        dataSkeletonLocal = dataSkeletonLocal.replace(/DELTA_PERCENTAGE/g, Math.floor(Math.abs(parseInt(celeb[token].nav_yest, 10) - parseInt(celeb[token].nav_today,10))/ parseInt(celeb[token].nav_today,10) *100) );

        $("#my-investments").append(dataSkeletonLocal);

    });

    var rowCntr = 0;
    var totalShares = 0;
    var totalValue = 0;
    $('.nav-col').each(function(){
        if(rowCntr > 0) {
            totalValue += parseInt($(this).text(), 10);
        }
        ++rowCntr;
    });
    rowCntr = 0;
    $('.unt-col').each(function(){
        if(rowCntr > 0) {
            totalShares += parseInt($(this).text(), 10);
        }
        ++rowCntr;
    });

    if(rowCntr > 1) {
        totalSkeleton = totalSkeleton.replace(/PORTFOLIO_TOTAL_SHARES/g, totalShares);
        totalSkeleton = totalSkeleton.replace(/PORTFOLIO_TOTAL_VALUE/g, totalValue);
        $("#my-investments-total").html(totalSkeleton);
        sortLeaderBoard({key : "<span class='you'>You !</span>" ,value : totalValue});
        $("#acc-balance-left").text(totalValue);
    } else {
        $("#my-investments").html("<div class='warning'>You have not purchased any celebrity stocks !</div>");
        sortLeaderBoard({key : "<span class='you'>You !</span>" ,value : 0});
        $("#acc-balance-left").text(0);
    }
}

function sortLeaderBoard(you) {
    var a = [
        {key: "Carl Friedrich ", value: 35},
        {key: "Marie", value: 40},
        {key: "Grace", value: 35},
        {key: "Claude", value: 20},
        {key: "Ada Love", value: 25}
    ];

    if(you != null) {
        a.push(you);
    }

    var sorted = a.slice(0).sort(function(a, b) {
        return  b.value - a.value;
    });

    var counter = 0;
    var youDetected = false;
    $("#leaderboard").html("");

    sorted.forEach( function(sortedToken) {
        ++counter;
        if(counter > 5 && sortedToken.key == "<span class='you'>You !</span>") {
            $("#leaderboard").append("<li><div class='name'><span style='font-size: 22px;'>&nbsp;&nbsp;&nbsp; " + sortedToken.key + "</div><div class='score'>" + sortedToken.value + "</div></li>");
        } else {
            $("#leaderboard").append("<li><div class='name'><span style='font-size: 22px;'>#" + counter + "</span> " + sortedToken.key + "</div><div class='score'>" + sortedToken.value + "</div></li>");
        }
    });
}


    var content = "<table>";
    for (i = 0; i < 3; i++) {
        content += '<tr><td>' + 'result ' + i + '</td></tr>';
    }
    content += "</table>";

    function allowDrop(ev) {
        ev.preventDefault();
    }

    function drag(ev) {
        ev.dataTransfer.setData("Text", ev.target.id);
    }

    function drop(ev) {
        ev.preventDefault();
        var data = ev.dataTransfer.getData("Text");
        ev.target.appendChild(document.getElementById(data));


        var des = localStorage.getItem("player1");

        if(des == null || des == '') {
            var arr = [];
            localStorage.setItem("player1", data);
            var per_bar = 100-15;
            $("#percent-bar").css('width', per_bar+'%');
            $("#balance-left").text(per_bar);
            populateDiv();
        } else {
            var arr = des.split(',');
            arr.push(data);
            localStorage.setItem("player1",arr);
            var per_bar = 100-((arr.length)*15);
            $("#percent-bar").css('width', per_bar+'%');
            $("#balance-left").text(per_bar);
            populateDiv();
        }

    }

    $(document).ready(function () {
    $.getJSON( "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Fomg.yahoo.com%2F%22%20and%0A%20%20%20%20%20%20xpath%3D'%2F%2Fdiv%5B%40id%3D%22MediaStoryListLP%22%5D%2Fdiv%5B2%5D%2Ful%2F%2Fh4%2Fa'&format=json",function ( data ) {
        data.query.results.a.forEach( function(token) {
            $("#js-news").append('<li class="news-item"><a target="_blank" href="http://omg.yahoo.com' + token.href +'">' + token.content + '</a></li>');
        });
        $('#js-news').ticker({titleText: 'Celeb News',speed: 0.10});
    });
    // prepare chart data as an array
    var sampleData = [
        { Day: 'Feb/16', Points: 2422 },
        { Day: 'Feb/17', Points: 2323 },
        { Day: 'Feb/18', Points: 2747 },
        { Day: 'Feb/19', Points: 2200 },
        { Day: 'Feb/20', Points: 2482 },
        { Day: 'Feb/21', Points: 2945 },
        { Day: 'Feb/22', Points: 2443 }
    ];
    var settings = {
        title: "",
        description: "",
        enableAnimations: true,
        showLegend: false,
        padding: { left: 20, top: 0, right: 30, bottom: 0 },
        source: sampleData,
        showBorderLine: false,
        categoryAxis:
        {
            text: 'Category Axis',
            textRotationAngle: 0,
            dataField: 'Day',
            showTickMarks: true,
            valuesOnTicks: true,
            tickMarksInterval: 1,
            tickMarksColor: '#888888',
            unitInterval: 1,
            showGridLines: false,
            axisSize: 'auto',
            displayValueAxis: false
        },
        seriesGroups:
                [
                    {
                        type: 'line',
                        showLabels: true,
                        symbolType: 'circle',
                        valueAxis:
                        {
                            unitInterval: 20,
                            minValue: 1000,
                            maxValue: 4000,
                            description: 'Points',
                            axisSize: 5,
                            showTickMarks: false,
                            showGridLines: false,
                            displayValueAxis: false
                        },
                        series: [
                            { dataField: 'Points', displayText: 'Points'}
                        ]
                    }
                ]
    };
    // setup the chart
    $('#stockindex').jqxChart(settings);

    var arr1 = localStorage.getItem("player1");
    var myArray = [];
    if(arr1 != null && arr1 != '') {
        myArray = arr1.split(',');
    }

    var per_bar = 100-((myArray.length)*15);
    $("#percent-bar").css('width', per_bar+'%');
    $("#balance-left").text(per_bar);
    populateDiv();

    var scroll = '<marquee width="70%" height = "600px" behavior="scroll" scrollamount="4" direction="down" BGColor="transparent" OnMouseOver="this.stop()" OnMouseOut="this.start()" text-align= "center">';

    var res = [
        {
            url:"http://l2.yimg.com/bt/api/res/1.2/AvFGBSeT26zQ2z_fcqzkJQ--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTcwO3B5b2ZmPTI1O3E9ODU7c209MTt3PTcw/http://media.zenfs.com/en_us/US/OMG/PhotoG/1434700544_8584614506.jpg",
            page_url:"http://omg.yahoo.com/rachel-bilson/",
            name:"rachel-bilson",
            nav_today:12,
            nav_yest:10
        },
        {
            url:"http://l.yimg.com/bt/api/res/1.2/kcl.Hy6KeFhwhTkYLA2_Xw--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTcwO3B5b2ZmPTI1O3E9ODU7c209MTt3PTcw/http://media.zenfs.com/en_us/News/associatedcontent/470_2001035.jpg",
            page_url:"http://omg.yahoo.com/jennifer-aniston/",
            name:"jennifer-anniston",
            nav_today:15,
            nav_yest:12
        },
        {
            url:"http://l3.yimg.com/bt/api/res/1.2/l7Z7gs8rl7zOVDIxrZS4sg--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTcwO3B5b2ZmPTI1O3E9ODU7c209MTt3PTcw/http://l.yimg.com/os/275/2011/11/17/kim_131431.jpg",
            page_url:"http://omg.yahoo.com/kim-kardashian/",
            name:"kim-kardashian",
            nav_today:20,
            nav_yest:8
        },
        {
            url:"http://l.yimg.com/bt/api/res/1.2/qCYIPq62Iek8.JIUZ_2JoA--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTcwO3B5b2ZmPTI1O3E9ODU7c209MTt3PTcw/http://media.zenfs.com/en_us/News/USWeekly/1313594524_zooey-deschannel-290.jpg",
            page_url:"http://omg.yahoo.com/zooey_deschanel",
            name:"zooey-deschanel",
            nav_today:5,
            nav_yest:9
        },
        {
            url:"http://l3.yimg.com/bt/api/res/1.2/oJbY3IA0cpKvD_k2lTG8Qw--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTcwO3B5b2ZmPTI1O3E9ODU7c209MTt3PTcw/http://media.zenfs.com/en_us/News/associatedcontent/470_1982911.jpg",
            page_url:"http://omg.yahoo.com/ashton_kutcher",
            name:"ashton-kutcher",
            nav_today:30,
            nav_yest:25
        },
        {
            url:"http://l2.yimg.com/bt/api/res/1.2/A7GQp0FXRJ0SPF5uhbyCxw--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/JessicaSimpson_070248.jpg",
            page_url:"http://omg.yahoo.com/jessica-simpson/",
            name:"jessica-simpson",
            nav_today:11,
            nav_yest:11
        },
        {
            url:"http://l1.yimg.com/bt/api/res/1.2/mfkjBYhCZ_YwCWKkxoeskg--/YXBwaWQ9eW5ld3M7Y2g9NDcwO2NyPTE7Y3c9NDcwO2R4PTA7ZHk9NTA7Zmk9dWxjcm9wO2g9MzEwO3E9ODU7c209MTt3PTMxMA--/http://media.zenfs.com/en_us/News/associatedcontent/470_2527717.jpg",
            page_url:"http://omg.yahoo.com/angelina-jolie/",
            name:"angelina-jolie",
            nav_today:6,
            nav_yest:7
        },
        {
            url:"http://l3.yimg.com/bt/api/res/1.2/.3aYdd9_H3ER__WmrApvUg--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/AnneHathaway_063033.jpg",
            page_url:"http://omg.yahoo.com/anne-hathaway/",
            name:"anne-hathaway",
            nav_today:14,
            nav_yest:12
        },
        {
            url:"http://l1.yimg.com/bt/api/res/1.2/cf6gQCcoV1ZGVsVGrEcECQ--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/Beyonce_063257.jpg",
            page_url:"http://omg.yahoo.com/beyonce/",
            name:"beyonce",
            nav_today:18,
            nav_yest:12
        },
        {
            url:"http://l2.yimg.com/bt/api/res/1.2/W2t5BrXI_ih7lmU4.QihEw--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/TomCruise_071720.jpg",
            page_url:"http://omg.yahoo.com/tom-cruise/",
            name:"tom-cruise",
            nav_today:8,
            nav_yest:11
        },
        {
            url:"http://l3.yimg.com/bt/api/res/1.2/367BGphKNDjaAse_WjsofQ--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/EmmaWatson_065812.jpg",
            page_url:"http://omg.yahoo.com/emma-watson/",
            name:"emma-watson",
            nav_today:16,
            nav_yest:13
        },
        {
            url:"http://l.yimg.com/bt/api/res/1.2/dXsfRj7IxCaQeMWm_wFadg--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/GeorgeClooney_065909.jpg",
            page_url:"http://omg.yahoo.com/george-clooney/",
            name:"george-clooney",
            nav_today:12,
            nav_yest:10
        },
        {
            url:"http://l.yimg.com/bt/api/res/1.2/KT43dOWbTUUKTQqbJSvIGw--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/JohnnyDepp_070323.jp",
            page_url:"http://omg.yahoo.com/johnny-depp/",
            name:"johnny-depp",
            nav_today:5,
            nav_yest:4
        },
        {
            url:"http://l3.yimg.com/bt/api/res/1.2/PkeFOZocMRJZCKLT6q23uQ--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/JessicaAlba_070230.jpg",
            page_url:"http://omg.yahoo.com/jessica-alba/",
            name:"jessica-alba",
            nav_today:16,
            nav_yest:12
        },
        {
            url:"http://l2.yimg.com/bt/api/res/1.2/61dIVWkHzlUeiCLLRxTCYw--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/JustinTimberlake_070414.jpg",
            page_url:"http://omg.yahoo.com/justin-timberlake/",
            name:"justin-timberlake",
            nav_today:10,
            nav_yest:14
        },
        {
            url:"http://l3.yimg.com/bt/api/res/1.2/2qUmADq0ArgHTp_WODetGQ--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/LindsayLohan_070838.jpg",
            page_url:"http://omg.yahoo.com/lindsay-lohan/",
            name:"lindsay-lohan",
            nav_today:17,
            nav_yest:12
        },
        {
            url:"http://l.yimg.com/bt/api/res/1.2/dcsSon8F41Z7MnUg7Zv3pA--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/Madonna_070855.jpg",
            page_url:"http://omg.yahoo.com/madonna/",
            name:"madonna",
            nav_today:15,
            nav_yest:10
        },
        {
            url:"http://l.yimg.com/bt/api/res/1.2/7eJZb.gbw6zpvnjAkhPHaQ--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/MileyCyrus_071025.jpg",
            page_url:"http://omg.yahoo.com/miley-cyrus/",
            name:"miley-cyrus",
            nav_today:18,
            nav_yest:20
        },
        {
            url:"http://l2.yimg.com/bt/api/res/1.2/vL..JSuBTo1ELH1ydSxuZA--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/ParisHilton_071204.jpg",
            page_url:"http://omg.yahoo.com/paris-hilton/",
            name:"paris-hilton",
            nav_today:8,
            nav_yest:10
        },
        {
            url:"http://l.yimg.com/bt/api/res/1.2/3Wke9W_JhcAWuHPb_96vtw--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/BradPitt_063335.jpg",
            page_url:"http://omg.yahoo.com/brad-pitt/",
            name:"brad-pitt",
            nav_today:16,
            nav_yest:10
        },
        {
            url:"http://l.yimg.com/bt/api/res/1.2/SPUmc95Zd0.dSw7CfJCYPw--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/ChristinaAguilera_064642.jpg",
            page_url:"http://omg.yahoo.com/christina-aguilera/",
            name:"christina-aguilera",
            nav_today:20,
            nav_yest:12
        },
        {
            url:"http://l.yimg.com/bt/api/res/1.2/ar.xPzAHoDJPv5124kLEhg--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/EvaLongoria_065830.jpg",
            page_url:"http://omg.yahoo.com/eva-longoria/",
            name:"eva-longoria",
            nav_today:12,
            nav_yest:15
        },
        {
            url:"http://l.yimg.com/bt/api/res/1.2/KSm5U1QlvnMnfaG9YDHdjA--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/09/HalleBerry_064401.jpg",
            page_url:"http://omg.yahoo.com/halle-berry/",
            name:"halle-berry",
            nav_today:16,
            nav_yest:12
        },
        {
            url:"http://l2.yimg.com/bt/api/res/1.2/Moh8u3Zp2uyeMlpp.EAXFQ--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/Rihanna_071317.jpg",
            page_url:"http://omg.yahoo.com/rihanna/",
            name:"rihanna",
            nav_today:30,
            nav_yest:25
        },
        {
            url:"http://l2.yimg.com/bt/api/res/1.2/EWtrQa0TDF3bKK6LrLNGZw--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/PenelopeCruz_071222.jpg",
            page_url:"http://omg.yahoo.com/penelope-cruz/",
            name:"penelope-cruz",
            nav_today:16,
            nav_yest:14
        },
        {
            url:"http://l.yimg.com/bt/api/res/1.2/BDGIpjg8XrC3UZPHXGKynQ--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/VictoriaBeckham_071817.jpg",
            page_url:"http://omg.yahoo.com/victoria-beckham/",
            name:"victoria-beckham",
            nav_today:10,
            nav_yest:10
        },
        {
            url:"http://l2.yimg.com/bt/api/res/1.2/AjNnNRu7gQbUVS9JLd0vVA--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/CourteneyCox_064700.jpg",
            page_url:"http://omg.yahoo.com/courteney-cox/",
            name:"courteney-cox",
            nav_today:15,
            nav_yest:12
        },
        {
            url:"http://l1.yimg.com/bt/api/res/1.2/VBJQdxXU0U1KOvXtusuGxg--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/RyanReynolds_071410.jpg",
            page_url:"http://omg.yahoo.com/ryan-reynolds/",
            name:"ryan-reynolds",
            nav_today:6,
            nav_yest:10
        },
        {
            url:"http://l1.yimg.com/bt/api/res/1.2/lj4t05BI8.IQZ9zEZ4Al2A--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/RobertPattinson_071334.jpg",
            page_url:"http://omg.yahoo.com/robert-pattinson/",
            name:"robert-pattinson",
            nav_today:12,
            nav_yest:18
        },
        {
            url:"http://l1.yimg.com/bt/api/res/1.2/6sYq2TgI0WthLmLsmNslSw--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/DemiMoore_064756.jpg",
            page_url:"http://omg.yahoo.com/demi-moore/",
            name:"demi-moore",
            nav_today:17,
            nav_yest:15
        },
        {
            url:"http://l2.yimg.com/bt/api/res/1.2/yyi_Ao4cdDQSo21c0kHeTw--/YXBwaWQ9eW5ld3M7Zmk9ZmlsbDtoPTMxMDtxPTg1O3NtPTE7dz0zMTA-/http://media.zenfs.com/289/2011/08/02/SandraBullock_071446.jpg",
            page_url:"http://omg.yahoo.com/sandra-bullock/",
            name:"sandra-bullock",
            nav_today:14,
            nav_yest:11
        }
    ];



    var player_celebs = "";

    $.each(res, function(index, value) {

        if( $.inArray(value.name , myArray) == -1 ){
            scroll += '<img id="'+ value.name + '" src="'  + value.url + '" border="0" draggable="true" ondragstart="drag(event)" > <br>';
        } else {
            player_celebs += '<img id="'+ value.name + '" src="'  + value.url + '" border="0" draggable="true" ondragstart="drag(event)" >';
        }
    });
    scroll += '</marquee>';
    $('#all-celebs').append(scroll);
    $('#play-pic').append(player_celebs);


    $('#all-celebs img, #play-pic img').click(function (e) {
        var that = this;
        setTimeout(function () {
            var dblclick = parseInt($(that).data('double'), 10);
            if (dblclick > 0) {
                $(that).data('double', dblclick - 1);
            } else {
                //alert("single");
                $('#all-celebs marquee').append($(that).clone());
                $(that).remove();
                $("table tr#abc").remove();
                Array.prototype.remByVal = function(val) {
                    for (var i = 0; i < this.length; i++) {
                        if (this[i] === val) {
                            this.splice(i, 1);
                            i--;
                        }
                    }
                    return this;
                }



                var arr = localStorage.getItem("player1");
                var arr_celeb = arr.split(',');
                arr_celeb.remByVal(that.id);
                localStorage.setItem("player1",arr_celeb);
                var per_bar = 100-((arr_celeb.length)*15);
                $("#percent-bar").css('width', per_bar+'%');
                $("#balance-left").text(per_bar);
                populateDiv();

                //alert(localStorage.getItem("player1"));

            }
        }, 300);
    }).dblclick(function(e) {
                $(this).data('double', 2);
                window.open("http://omg.yahoo.com/"+this.id , '_newtab');

            });
});
