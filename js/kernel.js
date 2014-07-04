/*******************************************************************************
 * 
 * webos desktop application in browser
 * 
 * WEB_OS.base.init() 初始化
 * 
 ******************************************************************************/

var TEMP = {},
	WEB_OS = {},
	ajaxUrl = "#"
iconPath = './img/icon/';
WEB_OS.appCfg = {};
WEB_OS.DESK_APP = {};

WEB_OS.CONFIG = {
	fullScreen: true,// 是否开启窗体全屏按钮
	defaultSkin: 'chrome', // 默认皮肤
	desk: 3, // 当前显示桌面
	taskbarFloat: 'right',// 任务栏图标从那一侧展示，left,right
	dockPos: 'none', // 应用码头位置，参数有：top,left,right,none：为none 时隐藏码头
	appXY: 'x', // 图标排列方式，参数有：x,y
	addApp: false,// 是否显示添加app ＋
	appButtonTop: 20, // 桌面图标top初始位置
	appButtonLeft: 20, // 桌面图标left初始位置
	createIndexid: 1, // z-index初始值，弹出窗体的默认z-index
	windowMinWidth: 215, // 窗口最小宽度
	windowMinHeight: 59, // 窗口最小高度
	wallpaper: 'img/wallpaper/wallpaper2.jpg'// 默认壁纸

};

WEB_OS.base = (function() {
	return {
		init: function() {
			// 绑定body点击事件，主要目的就是为了强制隐藏右键菜单
			$('#desktop').on('click', function() {
				$('.popup-menu').hide();
				$('.quick_view_container').remove();
			});
			// 隐藏浏览器默认右键菜单
			$('body').on('contextmenu', function() {
				$(".popup-menu").hide();
				return false;
			});
			// 绑定浏览器resize事件
			WEB_OS.base.resize();

			// 加载壁纸
			WEB_OS.wallpaper.get(WEB_OS.CONFIG.wallpaper, function() {
				WEB_OS.wallpaper.set();
			});

			// 初始化主题
			var defaultSkin = $.cookie("webos_skin") || WEB_OS.CONFIG.defaultSkin;
			this.getSkin(defaultSkin);

			// 初始化分页栏
			WEB_OS.navbar.init();
			// 绑定任务栏点击事件
			WEB_OS.taskbar.init();
			// 获得dock的位置
			WEB_OS.dock.getPos(function() {
				// 获取图标排列顺序
				WEB_OS.app.getXY(function() {
					WEB_OS.app.get();
				});
			});
			// 绑定应用码头2个按钮的点击事件

			$('.dock-tool-pinyin').on('mousedown', function() {
				return false;
			}).on('click', function() {
				javascript: (function(q) {
					q ? q.toggle() : function(d, j) {
						j = d.createElement('script');
						j.async = true;
						j.src = '//ime.qq.com/fcgi-bin/getjs';
						j.setAttribute('ime-cfg', 'lt=2');
						d = d.getElementsByTagName('head')[0];
						d.insertBefore(j, d.firstChild)
					}(document)
				})(window.QQWebIME);
			});
			$('.dock-tool-style').on('mousedown', function() {
				return false;
			}).on('click', function() {
				WEB_OS.window.createTemp({
					id: 'ztsz',
					title: '主题设置',
					url: 'sysapp/wallpaper/index.html',
					width: 580,
					height: 520,
					isresize: false,
					isflash: false
				});
			});

			// 桌面右键
			$('#desk').on('contextmenu', function(e) {
				$(".popup-menu").hide();
				$('.quick_view_container').remove();
				// TODO:bug 右键菜单在应用最小化后出不来
				var popupmenu = WEB_OS.popupMenu.desk();
				l = ($(document).width() - e.clientX) < popupmenu.width() ? (e.clientX - popupmenu.width()) : e.clientX;
				t = ($(document).height() - e.clientY) < popupmenu.height()
				? (e.clientY - popupmenu.height())
				: e.clientY;
				popupmenu.css({
					left: l,
					top: t
				}).show();
				return false;
			});

			// 初始化小部件clock
			if ($.cookie('widgetState')){
				// 还原widget
				WEB_OS.widget.reduction();
			}else{
				WEB_OS.widget.create('clock', 'widget');
			}

			// 配置artDialog全局默认参数
			(function(config) {
				config['lock'] = true;
				config['fixed'] = true;
				config['resize'] = false;
				config['background'] = '#000';
				config['opacity'] = 0.5;
			})(window || $.dialog.defaults);
		},
		logout: function() {
			art.dialog({
				icon: 'question',
				content: '确定要注销当前登录用户吗？',
				ok: function() {
					window.location.href = "＃";
					return true;
				},
				cancelVal: '取消',
				cancel: true
			});
		},
		resize: function() {
			$(window).on('resize', function() {
				WEB_OS.deskTop.resize(200);
			});
		},
		getSkin: function(skin) {
			$.cookie("webos_skin", skin, {
				expires: 3650
			});
			$('#window-skin').remove();
			var link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'img/skins/' + skin + '.css';
			link.id = 'window-skin';
			$('body').append(link);
		}
	}
})();

/*******************************************************************************
 * 
 * app icon
 * 
 ******************************************************************************/
WEB_OS.app = (function() {
	return {
		// 获得图标排列方式，x横向排列，y纵向排列
		getXY: function(func) {
			if ($.cookie("webos_appXY")){
				WEB_OS.CONFIG.appXY = $.cookie("webos_appXY");
			}else{
				WEB_OS.CONFIG.appXY = 'y';
			}
			if (typeof(func) == 'function'){
				func();
			}
		},
		// 更新图标排列方式
		updateXY: function(i, func) {
			$.cookie("webos_appXY", i, {
				expires: 3650
			});
			WEB_OS.CONFIG.appXY = i;
			if (typeof(func) == 'function'){
				func();
			}
		},
		// 获取图标
		get: function() {
			// 绘制图标表格
			var grid = WEB_OS.grid.getAppGrid(),
				dockGrid = WEB_OS.grid.getDockAppGrid(),
				sc = {},
				ss = dataArr;

			for (var i = 0; i < ss.length; i++){
				$('.indicator-' + (i + 1)).attr("title", ss[i].name);// 设置桌面分组名称
				var desk = sc['desk' + (i + 1)] = [];
				for (var j = 0; j < ss[i].children.length; j++){
					var app = ss[i].children[j];
					var appCfg = {
						id: app.id,
						icon: iconPath + app.module + '.png',
						name: app.name,
						type: app.url ? 'papp' : 'app',
						module: app.module,
						maximized: app.maximized,
						url: app.url
					};
					desk.push(appCfg);
					WEB_OS.DESK_APP[app.module] = appCfg;
				}
			}

			// 加载应用码头图标
			if (sc['dock'] != null){
				var dock_append = '',
					temp = {};

				for (var i = 0; i < sc['dock'].length; i++){
					dock_append += appbtnTemp({
						'top': dockGrid[i]['startY'],
						'left': dockGrid[i]['startX'],
						'title': sc['dock'][i]['name'],
						'type': sc['dock'][i]['type'],
						'id': 'd_' + sc['dock'][i]['type'] + '_' + sc['dock'][i]['id'],
						'realid': sc['dock'][i]['id'],
						'imgsrc': sc['dock'][i]['icon']
					});
				}
				$('#dock-bar .dock-applist').html('').append(dock_append);
			}

			// 加载桌面图标
			for (var j = 1; j <= 5; j++){
				var desk_append = '',
					temp = {};

				if (sc['desk' + j] != null){
					for (var i = 0; i < sc['desk' + j].length; i++){
						desk_append += appbtnTemp({
							'top': grid[i]['startY'] + 7,
							'left': grid[i]['startX'] + 16,
							'title': sc['desk' + j][i]['name'],
							'type': sc['desk' + j][i]['type'],
							'id': 'd_' + sc['desk' + j][i]['type'] + '_' + sc['desk' + j][i]['id'],
							'realid': sc['desk' + j][i]['id'],
							'imgsrc': sc['desk' + j][i]['icon'],
							'module': sc['desk' + j][i]['module'],
							'url': sc['desk' + j][i]['url']
						});
					}
				}
				// 添加应用button |+|
				if (WEB_OS.CONFIG.addApp){
					desk_append += addbtnTemp({
						'top': grid[i]['startY'] + 7,
						'left': grid[i]['startX'] + 16
					});

				}

				$('#desk-' + j + ' li').remove();
				$('#desk-' + j).append(desk_append);
				i = 0;
			}

			// 绑定图标拖动事件
			WEB_OS.app.move();
			// 绑定应用码头拖动事件
			WEB_OS.dock.move();
			// 加载滚动条
			WEB_OS.app.getScrollbar();
			// 绑定滚动条拖动事件
			WEB_OS.app.moveScrollbar();

		},
		// 添加应用
		add: function(id, type, fun) {
			alert('add new app to this desk');
		},
		// 删除应用
		remove: function(id, type, fun) {
			alert('remove this app from this desk');
		},
		//
		// 图标拖动、打开 这块代码略多，主要处理了9种情况下的拖动，分别是：
		// 桌面拖动到应用码头、桌面拖动到文件夹内、当前桌面上拖动(排序) * 应用码头拖动到桌面、应用码头拖动到文件夹内、应用码头上拖动(排序) *
		// 文件夹内拖动到桌面、文件夹内拖动到应用码头、不同文件夹之间拖动
		//
		move: function() {
			// 应用码头图标拖动
			$('#dock-bar .dock-applist').off('mousedown', 'li').on('mousedown', 'li', function(e) {
				e.preventDefault();
				e.stopPropagation();
				if (e.button == 0 || e.button == 1){
					var oldobj = $(this), x, y, cx, cy, dx, dy, lay,
						obj = $('<li id="shortcut_shadow">' + oldobj.html() + '</li>');
					dx = cx = e.clientX;
					dy = cy = e.clientY;
					x = dx - oldobj.offset().left;
					y = dy - oldobj.offset().top;
					// 绑定鼠标移动事件
					$(document).on('mousemove', function(e) {
						$('body').append(obj);
						lay = WEB_OS.maskBox.desk();
						lay.show();
						cx = e.clientX <= 0 ? 0 : e.clientX >= $(document).width() ? $(document).width() : e.clientX;
						cy = e.clientY <= 0 ? 0 : e.clientY >= $(document).height() ? $(document).height() : e.clientY;
						_l = cx - x;
						_t = cy - y;
						if (dx != cx || dy != cy){
							obj.css({
								left: _l,
								top: _t
							}).show();
						}
					}).on('mouseup', function() {
						$(document).off('mousemove').off('mouseup');
						obj.remove();
						if (typeof(lay) !== 'undefined'){
							lay.hide();
						}
						// 判断是否移动图标，如果没有则判断为click事件
						if (dx == cx && dy == cy){
							switch(oldobj.attr('type')){
								case 'app':
								case 'papp':
									alert(1);
									WEB_OS.window.create(oldobj.attr('realid'), oldobj.attr('type'));
									break;
								case 'widget':
								case 'pwidget':
									WEB_OS.widget.create(oldobj.attr('realid'), oldobj.attr('type'));
									break;
								case 'folder':
									WEB_OS.folderView.init(oldobj);
									break;
							}
							return false;
						}
						var icon, icon2;
						var iconIndex = $('#desk-' + WEB_OS.CONFIG.desk + ' li.appbtn:not(.add)').length == 0
						? -1
						: $('#desk-' + WEB_OS.CONFIG.desk + ' li').index(oldobj);
						var iconIndex2 = $('#dock-bar .dock-applist').html() == ''
						? -1
						: $('#dock-bar .dock-applist li').index(oldobj);

						var dock_w2 = WEB_OS.CONFIG.dockPos == 'left' ? 0 : WEB_OS.CONFIG.dockPos == 'top' ? ($(window)
						.width()
						- $('#dock-bar .dock-applist').width() - 20)
						/ 2 : $(window).width() - $('#dock-bar .dock-applist').width();
						var dock_h2 = WEB_OS.CONFIG.dockPos == 'top' ? 0 : ($(window).height()
						- $('#dock-bar .dock-applist').height() - 20)
						/ 2;
						icon2 = WEB_OS.grid.searchDockAppGrid(cx - dock_w2, cy - dock_h2);
						// app icon position change
						if (icon2 != null && icon2 != oldobj.index()){
							if (icon2 < iconIndex2){
								$('#dock-bar .dock-applist li:eq(' + icon2 + ')').before(oldobj);
							}else if (icon2 > iconIndex2){
								$('#dock-bar .dock-applist li:eq(' + icon2 + ')').after(oldobj);
							}
							WEB_OS.deskTop.appresize();
						}else{
							var dock_w = WEB_OS.CONFIG.dockPos == 'left' ? 73 : 0;
							var dock_h = WEB_OS.CONFIG.dockPos == 'top' ? 73 : 0;
							icon = WEB_OS.grid.searchAppGrid(cx - dock_w, cy - dock_h);
							// app icon position change
							if (icon != null){
								if (icon < iconIndex){
									$('#desk-' + WEB_OS.CONFIG.desk + ' li:not(.add):eq(' + icon + ')').before(oldobj);
								}else if (icon > iconIndex){
									$('#desk-' + WEB_OS.CONFIG.desk + ' li:not(.add):eq(' + icon + ')').after(oldobj);
								}else{
									if (iconIndex == -1){
										$('#desk-' + WEB_OS.CONFIG.desk + ' li.add').before(oldobj);
									}
								}
								WEB_OS.deskTop.appresize();
							}
						}
					});
				}
				return false;
			});
			// 桌面图标拖动
			$('#desk .desktop-container').off('mousedown', 'li:not(.add)').on('mousedown', 'li:not(.add)', function(e) {
				e.preventDefault();
				e.stopPropagation();
				if (e.button == 0 || e.button == 1){
					var oldobj = $(this), x, y, cx, cy, dx, dy, lay,
						obj = $('<li id="shortcut_shadow">' + oldobj.html() + '</li>');
					dx = cx = e.clientX;
					dy = cy = e.clientY;
					x = dx - oldobj.offset().left;
					y = dy - oldobj.offset().top;
					// 绑定鼠标移动事件
					$(document).on('mousemove', function(e) {
						$('body').append(obj);
						lay = WEB_OS.maskBox.desk();
						lay.show();
						cx = e.clientX <= 0 ? 0 : e.clientX >= $(document).width() ? $(document).width() : e.clientX;
						cy = e.clientY <= 0 ? 0 : e.clientY >= $(document).height() ? $(document).height() : e.clientY;
						_l = cx - x;
						_t = cy - y;
						if (dx != cx || dy != cy){
							obj.css({
								left: _l,
								top: _t
							}).show();
						}
					}).on('mouseup', function() {
						$(document).off('mousemove').off('mouseup');
						obj.remove();
						if (typeof(lay) !== 'undefined'){
							lay.hide();
						}
						// 判断是否移动图标，如果没有则判断为click事件
						if (dx == cx && dy == cy){
							switch(oldobj.attr('type')){
								case 'app':
									WEB_OS.window.create(oldobj.attr('realid'), oldobj.attr('type'), oldobj
									.attr('module'));
									break;
								case 'papp':
									var url = oldobj.attr('url');
									window.open(url, url.indexOf('rcp') != -1 ? '_self' : '_blank');
									break;
								case 'widget':
								case 'pwidget':
									WEB_OS.widget.create(oldobj.attr('realid'), oldobj.attr('type'));
									break;
								case 'folder':
									WEB_OS.folderView.init(oldobj);
									break;
							}
							return false;
						}
						var icon, icon2;
						var iconIndex = $('#desk-' + WEB_OS.CONFIG.desk + ' li.appbtn:not(.add)').length == 0
						? -1
						: $('#desk-' + WEB_OS.CONFIG.desk + ' li').index(oldobj);
						var iconIndex2 = $('#dock-bar .dock-applist').html() == ''
						? -1
						: $('#dock-bar .dock-applist li').index(oldobj);

						var dock_w2 = WEB_OS.CONFIG.dockPos == 'left' ? 0 : WEB_OS.CONFIG.dockPos == 'top' ? ($(window)
						.width()
						- $('#dock-bar .dock-applist').width() - 20)
						/ 2 : $(window).width() - $('#dock-bar .dock-applist').width();
						var dock_h2 = WEB_OS.CONFIG.dockPos == 'top' ? 0 : ($(window).height()
						- $('#dock-bar .dock-applist').height() - 20)
						/ 2;
						icon2 = WEB_OS.grid.searchDockAppGrid(cx - dock_w2, cy - dock_h2);

						// app icon change
						if (icon2 != null){
							if (icon2 < iconIndex2){
								$('#dock-bar .dock-applist li:eq(' + icon2 + ')').before(oldobj);
							}else if (icon2 > iconIndex2){
								$('#dock-bar .dock-applist li:eq(' + icon2 + ')').after(oldobj);
							}else{
								if (iconIndex2 == -1){
									$('#dock-bar .dock-applist').append(oldobj);
								}
							}
							if ($('#dock-bar .dock-applist li').length > 7){
								$('#desk-' + WEB_OS.CONFIG.desk + ' li.add').before($('#dock-bar .dock-applist li')
								.last());
							}
							WEB_OS.deskTop.appresize();
						}else{
							var dock_w = WEB_OS.CONFIG.dockPos == 'left' ? 73 : 0;
							var dock_h = WEB_OS.CONFIG.dockPos == 'top' ? 73 : 0;
							icon = WEB_OS.grid.searchAppGrid(cx - dock_w, cy - dock_h);

							// app icon change
							if (icon != null && icon != (oldobj.index() - 2)){
								if (icon < iconIndex){
									$('#desk-' + WEB_OS.CONFIG.desk + ' li:not(.add):eq(' + icon + ')').before(oldobj);
								}else if (icon > iconIndex){
									$('#desk-' + WEB_OS.CONFIG.desk + ' li:not(.add):eq(' + icon + ')').after(oldobj);
								}else{
									if (iconIndex == -1){
										$('#desk-' + WEB_OS.CONFIG.desk + ' li.add').before(oldobj);
									}
								}
								WEB_OS.deskTop.appresize();
							}
						}
					});
				}
			});
		},
		// 加载滚动条
		getScrollbar: function() {
			setTimeout(function() {
				$('#desk .desktop-container').each(function() {
					var desk = $(this),
						scrollbar = desk.children('.scrollbar');
					// 先清空所有附加样式
					scrollbar.hide();
					desk.scrollLeft(0).scrollTop(0);
					// 判断图标排列方式 * 横向排列超出屏幕则出现纵向滚动条，纵向排列超出屏幕则出现横向滚动条
					if (WEB_OS.CONFIG.appXY == 'x'){
						// 获得桌面图标定位好后的实际高度 * 因为显示的高度是固定的，而实际的高度是根据图标个数会变化
						var deskH = parseInt(desk.children('.add').css('top')) + 108;
						//
						// * 计算滚动条高度 * 高度公式（图标纵向排列计算滚动条宽度以此类推）： * 滚动条实际高度 =
						// 桌面显示高度 / 桌面实际高度 * 滚动条总高度(桌面显示高度) * 如果“桌面显示高度 / 桌面实际高度
						// >=
						// 1”说明图标个数未能超出桌面，则不需要出现滚动条
						//
						if (desk.height() / deskH < 1){
							desk.children('.scrollbar-y').height(desk.height() / deskH * desk.height()).css('top', 0)
							.show();
						}
					}else{
						var deskW = parseInt(desk.children('.add').css('left')) + 106;
						if (desk.width() / deskW < 1){
							desk.children('.scrollbar-x').width(desk.width() / deskW * desk.width()).css('left', 0)
							.show();
						}
					}
				});
			}, 500);
		},
		// 移动滚动条
		moveScrollbar: function() {
			// 手动拖动
			$('.scrollbar').on('mousedown', function(e) {
				var x, y, cx, cy, deskrealw, deskrealh, movew, moveh;
				var scrollbar = $(this),
					desk = scrollbar.parent('.desktop-container');
				deskrealw = parseInt(desk.children('.add').css('left')) + 106;
				deskrealh = parseInt(desk.children('.add').css('top')) + 108;
				movew = desk.width() - scrollbar.width();
				moveh = desk.height() - scrollbar.height();
				if (scrollbar.hasClass('scrollbar-x')){
					x = e.clientX - scrollbar.offset().left;
				}else{
					y = e.clientY - scrollbar.offset().top;
				}
				$(document).on('mousemove', function(e) {
					if (scrollbar.hasClass('scrollbar-x')){
						if (WEB_OS.CONFIG.dockPos == 'left'){
							cx = e.clientX - x - 73 < 0 ? 0 : e.clientX - x - 73 > movew ? movew : e.clientX - x - 73;
						}else{
							cx = e.clientX - x < 0 ? 0 : e.clientX - x > movew ? movew : e.clientX - x;
						}
						scrollbar.css('left', cx / desk.width() * deskrealw + cx);
						desk.scrollLeft(cx / desk.width() * deskrealw);
					}else{
						if (WEB_OS.CONFIG.dockPos == 'top'){
							cy = e.clientY - y - 73 < 0 ? 0 : e.clientY - y - 73 > moveh ? moveh : e.clientY - y - 73;
						}else{
							cy = e.clientY - y < 0 ? 0 : e.clientY - y > moveh ? moveh : e.clientY - y;
						}
						scrollbar.css('top', cy / desk.height() * deskrealh + cy);
						desk.scrollTop(cy / desk.height() * deskrealh);
					}
				}).on('mouseup', function() {
					$(this).off('mousemove').off('mouseup');
				});
			});
			// 鼠标滚轮 * 只支持纵向滚动条
			$('#desk .desktop-container').each(function(i) {
				$('#desk-' + (i + 1)).on('mousewheel', function(event, delta) {
					var desk = $(this),
						deskrealh = parseInt(desk.children('.add').css('top')) + 108, scrollupdown;
					//
					// delta == -1 往下 * delta == 1 往上 *
					// chrome下鼠标滚轮每滚动一格，页面滑动距离是200px，所以下面也用这个值来模拟每次滑动的距离
					//
					if (delta < 0){
						scrollupdown = desk.scrollTop() + 200 > deskrealh - desk.height()
						? deskrealh - desk.height()
						: desk.scrollTop() + 200;
					}else{
						scrollupdown = desk.scrollTop() - 200 < 0 ? 0 : desk.scrollTop() - 200;
					}
					desk.stop(false, true).animate({
						scrollTop: scrollupdown
					}, 300);
					desk.children('.scrollbar-y').stop(false, true).animate({
						top: scrollupdown / deskrealh * desk.height() + scrollupdown
					}, 300);
				});
			});
		}
	}
})();

// 全局视图
WEB_OS.appmanage = (function() {
	return {
		init: function() {
			$('#amg_dock_container').html('').append($('#dock-container .dock-applist li').clone());
			$('#desk .desktop-container').each(function(i) {
				$('#amg_folder_container .folderItem:eq(' + i + ') .folderInner').html('');
				$(this).children('.appbtn:not(.add)').each(function() {
					$('#amg_folder_container .folderItem:eq(' + i + ') .folderInner').append($(this).clone());
				});
			});
			$('#desktop').hide();
			$('#appmanage').show();
			$('#amg_folder_container .folderItem').show().addClass('folderItem_turn');
			$('#amg_folder_container').height($(document).height() - 80);
			$('#appmanage .amg_close').off('click').on('click', function() {
				WEB_OS.appmanage.close();
			});
			WEB_OS.appmanage.appresize();
			WEB_OS.appmanage.move();
			WEB_OS.appmanage.getScrollbar();
			WEB_OS.appmanage.moveScrollbar();
		},
		getScrollbar: function() {
			setTimeout(function() {
				$('#amg_folder_container .folderItem').each(function() {
					var desk = $(this).find('.folderInner'),
						deskrealh = parseInt(desk.children('.shortcut:last').css('top')) + 41,
						scrollbar = desk.next('.scrollBar');
					// 先清空所有附加样式
					scrollbar.hide();
					desk.scrollTop(0);
					if (desk.height() / deskrealh < 1){
						scrollbar.height(desk.height() / deskrealh * desk.height()).css('top', 0).show();
					}
				});
			}, 500);
		},
		moveScrollbar: function() {
			// 手动拖动
			$('.scrollBar').on('mousedown', function(e) {
				var y, cy, deskrealh, moveh;
				var scrollbar = $(this),
					desk = scrollbar.prev('.folderInner');
				deskrealh = parseInt(desk.children('.shortcut:last').css('top')) + 41;
				moveh = desk.height() - scrollbar.height();
				y = e.clientY - scrollbar.offset().top;
				$(document).on('mousemove', function(e) {
					// 减80px是因为顶部dock区域的高度为80px，所以计算移动距离需要先减去80px
					cy = e.clientY - y - 80 < 0 ? 0 : e.clientY - y - 80 > moveh ? moveh : e.clientY - y - 80;
					scrollbar.css('top', cy);
					desk.scrollTop(cy / desk.height() * deskrealh);
				}).on('mouseup', function() {
					$(this).off('mousemove').off('mouseup');
				});
			});
			// 鼠标滚轮
			$('#amg_folder_container .folderInner').off('mousewheel').on('mousewheel', function(event, delta) {
				var desk = $(this),
					deskrealh = parseInt(desk.children('.shortcut:last').css('top')) + 41, scrollupdown;
				//
				// delta == -1 往下 * delta == 1 往上
				//
				if (delta < 0){
					scrollupdown = desk.scrollTop() + 120 > deskrealh - desk.height()
					? deskrealh - desk.height()
					: desk.scrollTop() + 120;
				}else{
					scrollupdown = desk.scrollTop() - 120 < 0 ? 0 : desk.scrollTop() - 120;
				}
				desk.stop(false, true).animate({
					scrollTop: scrollupdown
				}, 300);
				desk.next('.scrollBar').stop(false, true).animate({
					top: scrollupdown / deskrealh * desk.height()
				}, 300);
			});
		},
		resize: function() {
			$('#amg_folder_container').height($(document).height() - 80);
			WEB_OS.appmanage.getScrollbar();
		},
		appresize: function() {
			var manageDockGrid = WEB_OS.grid.getManageDockAppGrid();
			$('#amg_dock_container li').each(function(i) {
				$(this).css({
					'left': manageDockGrid[i]['startX'],
					'top': 10
				}, 500);
			});
			for (var i = 0; i < 5; i++){
				var manageAppGrid = WEB_OS.grid.getManageAppGrid();
				$('#amg_folder_container .folderItem:eq(' + i + ') .folderInner li').each(function(j) {
					$(this).css({
						'left': 0,
						'top': manageAppGrid[j]['startY']
					}, 500).attr('desk', i);
				});
			}
		},
		close: function() {
			$('#amg_dock_container').html('');
			$('#amg_folder_container .folderInner').html('');
			$('#desktop').show();
			$('#appmanage').hide();
			$('#amg_folder_container .folderItem').removeClass('folderItem_turn');
			WEB_OS.app.get();
		},
		move: function() {
			$('#amg_dock_container').off('mousedown').on('mousedown', 'li', function(e) {
				e.preventDefault();
				e.stopPropagation();
				if (e.button == 0 || e.button == 1){
					var oldobj = $(this), x, y, cx, cy, dx, dy, lay,
						obj = $('<li id="shortcut_shadow">' + oldobj.html() + '</li>');
					dx = cx = e.clientX;
					dy = cy = e.clientY;
					x = dx - oldobj.offset().left;
					y = dy - oldobj.offset().top;
					// 绑定鼠标移动事件
					$(document).on('mousemove', function(e) {
						$('body').append(obj);
						lay = WEB_OS.maskBox.desk();
						lay.show();
						cx = e.clientX <= 0 ? 0 : e.clientX >= $(document).width() ? $(document).width() : e.clientX;
						cy = e.clientY <= 0 ? 0 : e.clientY >= $(document).height() ? $(document).height() : e.clientY;
						_l = cx - x;
						_t = cy - y;
						if (dx != cx || dy != cy){
							obj.css({
								left: _l,
								top: _t
							}).show();
						}
					}).on('mouseup', function() {
						$(document).off('mousemove').off('mouseup');
						obj.remove();
						if (typeof(lay) !== 'undefined'){
							lay.hide();
						}
						// 判断是否移动图标，如果没有则判断为click事件
						if (dx == cx && dy == cy){
							WEB_OS.appmanage.close();
							switch(oldobj.attr('type')){
								case 'widget':
								case 'pwidget':
									WEB_OS.widget.create(oldobj.attr('realid'), oldobj.attr('type'));
									break;
								case 'app':
								case 'papp':
							}
							return false;
						}

						var icon, icon2;
						var iconIndex = $('#amg_folder_container .folderItem:eq(' + oldobj.attr('desk')
						+ ') .folderInner li').length == 0 ? -1 : $('#amg_folder_container .folderItem:eq('
						+ oldobj.attr('desk') + ') .folderInner li').index(oldobj);
						var iconIndex2 = $('#amg_dock_container').html() == '' ? -1 : $('#amg_dock_container li')
						.index(oldobj);
						if (cy <= 80){
							icon2 = WEB_OS.grid.searchManageDockAppGrid(cx);

							// manager app position change
							if (icon2 != null && icon2 != oldobj.index()){
								if (icon2 < iconIndex2){
									$('#amg_dock_container li:eq(' + icon2 + ')').before(oldobj);
								}else if (icon2 > iconIndex2){
									$('#amg_dock_container li:eq(' + icon2 + ')').after(oldobj);
								}
								WEB_OS.appmanage.appresize();
								WEB_OS.appmanage.getScrollbar();
							}
						}else{
							var movedesk = parseInt(cx / ($(document).width() / 5));
							icon = WEB_OS.grid.searchManageAppGrid(cy - 90, movedesk);

							// manager app position change
							if (icon != null){
								if (icon < iconIndex){
									$('#amg_folder_container .folderItem:eq(' + movedesk + ') .folderInner li:eq('
									+ icon + ')').before(oldobj);
								}else if (icon > iconIndex){
									$('#amg_folder_container .folderItem:eq(' + movedesk + ') .folderInner li:eq('
									+ icon + ')').after(oldobj);
								}else{
									if (iconIndex == -1){
										$('#amg_folder_container .folderItem:eq(' + movedesk + ') .folderInner')
										.append(oldobj);
									}
								}
								WEB_OS.appmanage.appresize();
								WEB_OS.appmanage.getScrollbar();
							}
						}
					});
				}
				return false;
			});
			$('#amg_folder_container').off('mousedown', 'li.appbtn:not(.add)').on('mousedown', 'li.appbtn:not(.add)',
			function(e) {
				e.preventDefault();
				e.stopPropagation();
				if (e.button == 0 || e.button == 1){
					var oldobj = $(this), x, y, cx, cy, dx, dy, lay,
						obj = $('<li id="shortcut_shadow2">' + oldobj.html() + '</li>');
					dx = cx = e.clientX;
					dy = cy = e.clientY;
					x = dx - oldobj.offset().left;
					y = dy - oldobj.offset().top;
					// 绑定鼠标移动事件
					$(document).on('mousemove', function(e) {
						$('body').append(obj);
						lay = WEB_OS.maskBox.desk();
						lay.show();
						cx = e.clientX <= 0 ? 0 : e.clientX >= $(document).width() ? $(document).width() : e.clientX;
						cy = e.clientY <= 0 ? 0 : e.clientY >= $(document).height() ? $(document).height() : e.clientY;
						_l = cx - x;
						_t = cy - y;
						if (dx != cx || dy != cy){
							obj.css({
								left: _l,
								top: _t
							}).show();
						}
					}).on('mouseup', function() {
						$(document).off('mousemove').off('mouseup');
						obj.remove();
						if (typeof(lay) !== 'undefined'){
							lay.hide();
						}
						// 判断是否移动图标，如果没有则判断为click事件
						if (dx == cx && dy == cy){
							WEB_OS.appmanage.close();
							switch(oldobj.attr('type')){
								case 'widget':
								case 'pwidget':
									WEB_OS.widget.create(oldobj.attr('realid'), oldobj.attr('type'));
									break;
								case 'app':
									// TODO:open with global view
									WEB_OS.window.create(oldobj.attr('realid'), oldobj.attr('type'), oldobj
									.attr('module'));
									break;
								case 'papp':
									window.open(oldobj.attr('url'), oldobj.attr('url').indexOf('rcp') != -1
									? '_self'
									: '_blank');
									break;
							}
							return false;
						}
						var icon, icon2;
						var iconIndex = $('#amg_folder_container .folderItem:eq(' + oldobj.attr('desk')
						+ ') .folderInner li').length == 0 ? -1 : $('#amg_folder_container .folderItem:eq('
						+ oldobj.attr('desk') + ') .folderInner li').index(oldobj);
						var iconIndex2 = $('#amg_dock_container').html() == '' ? -1 : $('#amg_dock_container li')
						.index(oldobj);
						if (cy <= 80){
							icon2 = WEB_OS.grid.searchManageDockAppGrid(cx);

							// manage app position change
							if (icon2 != null){
								if (icon2 < iconIndex2){
									$('#amg_dock_container li:eq(' + icon2 + ')').before(oldobj);
								}else if (icon2 > iconIndex2){
									$('#amg_dock_container li:eq(' + icon2 + ')').after(oldobj);
								}else{
									if (iconIndex2 == -1){
										$('#amg_dock_container').append(oldobj);
									}
								}
								if ($('#amg_dock_container li.shortcut').length > 7){
									if ($('#amg_folder_container .folderItem:eq(' + oldobj.attr('desk')
									+ ') .folderInner li').length == 0){
										$('#amg_folder_container .folderItem:eq(' + oldobj.attr('desk')
										+ ') .folderInner').append($('#amg_dock_container li').last());
									}else{
										$('#amg_folder_container .folderItem:eq(' + oldobj.attr('desk')
										+ ') .folderInner li').last().after($('#amg_dock_container li').last());
									}
								}
								WEB_OS.appmanage.appresize();
								WEB_OS.appmanage.getScrollbar();
							}
						}else{
							var movedesk = parseInt(cx / ($(document).width() / 5));
							icon = WEB_OS.grid.searchManageAppGrid(cy - 90, movedesk);
							if (icon != null){
								// 判断是在同一桌面移动，还是跨桌面移动
								// manage app position change
								if (movedesk == oldobj.attr('desk')){
									if (icon < iconIndex){
										$('#amg_folder_container .folderItem:eq(' + movedesk + ') .folderInner li:eq('
										+ icon + ')').before(oldobj);
									}else if (icon > iconIndex){
										$('#amg_folder_container .folderItem:eq(' + movedesk + ') .folderInner li:eq('
										+ icon + ')').after(oldobj);
									}else{
										if (iconIndex == -1){
											$('#amg_folder_container .folderItem:eq(' + movedesk + ') .folderInner')
											.append(oldobj);
										}
									}
									WEB_OS.appmanage.appresize();
									WEB_OS.appmanage.getScrollbar();
								}else{
									if (icon != -1){
										$('#amg_folder_container .folderItem:eq(' + movedesk + ') .folderInner li:eq('
										+ icon + ')').before(oldobj);
									}else{
										$('#amg_folder_container .folderItem:eq(' + movedesk + ') .folderInner')
										.append(oldobj);
									}
									WEB_OS.appmanage.appresize();
									WEB_OS.appmanage.getScrollbar();
								}
							}
						}
					});
				}
				return false;
			});
		}
	}
})();

// 桌面
WEB_OS.deskTop = (function() {
	return {
		// 处理浏览器改变大小后的事件
		resize: function(time) {
			// 使用doTimeout插件，防止出现resize两次的bug
			$.doTimeout('resize', time, function() {
				if ($('#desktop').css('display') !== 'none'){
					// 更新码头位置
					WEB_OS.dock.setPos();
					// 更新图标定位
					WEB_OS.deskTop.appresize();
					// 更新窗口定位
					WEB_OS.deskTop.windowresize();
					// 更新滚动条
					WEB_OS.app.getScrollbar();
				}else{
					WEB_OS.appmanage.resize();
				}
				WEB_OS.wallpaper.set(false);
			});
		},
		// 重新排列图标
		appresize: function() {
			var grid = WEB_OS.grid.getAppGrid(),
				dockGrid = WEB_OS.grid.getDockAppGrid();
			$('#dock-bar .dock-applist li').each(function(i) {
				$(this).animate({
					'left': dockGrid[i]['startX'],
					'top': dockGrid[i]['startY']
				}, 500);
			});
			for (var j = 1; j <= 5; j++){
				$('#desk-' + j + ' li').each(function(i) {
					$(this).animate({
						'left': grid[i]['startX'] + 16,
						'top': grid[i]['startY'] + 7
					}, 500);
				});
			}
		},
		// 重新定位窗口位置
		windowresize: function() {
			$('#desk div.window-container').each(function() {
				var windowdata = $(this).data('info');
				currentW = $(window).width() - $(this).width();
				currentH = $(window).height() - $(this).height();
				_l = windowdata['left'] / windowdata['emptyW'] * currentW >= currentW ? currentW : windowdata['left']
				/ windowdata['emptyW'] * currentW;
				_l = _l <= 0 ? 0 : _l;
				_t = windowdata['top'] / windowdata['emptyH'] * currentH >= currentH ? currentH : windowdata['top']
				/ windowdata['emptyH'] * currentH;
				_t = _t <= 0 ? 0 : _t;
				$(this).animate({
					'left': _l,
					'top': _t
				}, 500);
			});
		}
	}
})();

// 应用码头
WEB_OS.dock = (function() {
	return {
		getPos: function(fun) {
			WEB_OS.dock.setPos();
			if (typeof(fun) != 'undefined'){
				fun();
			}
		},
		setPos: function() {
			var desktop = $('#desk-' + WEB_OS.CONFIG.desk),
				desktops = $('#desk .desktop-container');
			var desk_w = desktop.css('width', '100%').width(),
				desk_h = desktop.css('height', '100%').height();
			// 清除dock位置样式
			$('#dock-container').removeClass('dock-top').removeClass('dock-left').removeClass('dock-right');
			$('#dock-bar').removeClass('top-bar').removeClass('left-bar').removeClass('right-bar').hide();
			if (WEB_OS.CONFIG.dockPos == 'top'){
				$('#dock-bar').addClass('top-bar').children('#dock-container').addClass('dock-top');
				desktops.css({
					'width': desk_w,
					'height': desk_h - 143,
					'left': desk_w,
					'top': 73
				});
				desktop.css({
					'left': 0
				});
			}else if (WEB_OS.CONFIG.dockPos == 'left'){
				$('#dock-bar').addClass('left-bar').children('#dock-container').addClass('dock-left');
				desktops.css({
					'width': desk_w - 73,
					'height': desk_h - 70,
					'left': desk_w + 73,
					'top': 0
				});
				desktop.css({
					'left': 73
				});
			}else if (WEB_OS.CONFIG.dockPos == 'right'){
				$('#dock-bar').addClass('right-bar').children('#dock-container').addClass('dock-right');
				desktops.css({
					'width': desk_w - 73,
					'height': desk_h - 70,
					'left': desk_w,
					'top': 0
				});
				desktop.css({
					'left': 0
				});
			}else if (WEB_OS.CONFIG.dockPos == 'none'){
				$('#dock-bar').addClass('top-bar').children('#dock-container').addClass('dock-top');
				desktops.css({
					'width': desk_w,
					'height': desk_h - 143,
					'left': desk_w,
					'top': 10
				});
				desktop.css({
					'left': 0
				});
			}
			// dockPos 为none 时隐藏应用码头
			if (WEB_OS.CONFIG.dockPos != 'none'){
				$('#dock-bar').show();
			}
			WEB_OS.taskbar.resize();
		},
		updatePos: function(pos, fun) {
			WEB_OS.CONFIG.dockPos = pos;
			if (typeof(fun) != 'undefined'){
				fun();
			}
		},
		move: function() {
			$('#dock-container').off('mousedown').on('mousedown', function(e) {
				if (e.button == 0 || e.button == 1){
					var lay = WEB_OS.maskBox.dock(), location;
					$(document).on('mousemove', function(e) {
						lay.show();
						if (e.clientY < lay.height() * 0.2){
							location = 'top';
						}else if (e.clientX < lay.width() * 0.5){
							location = 'left';
						}else{
							location = 'right';
						}
						$('.dock_drap_effect').removeClass('hover');
						$('.dock_drap_effect_' + location).addClass('hover');
					}).on('mouseup', function() {
						$(document).off('mousemove').off('mouseup');
						lay.hide();
						if (location != WEB_OS.CONFIG.dockPos && typeof(location) != 'undefined'){
							WEB_OS.dock.updatePos(location, function() {
								// 更新码头位置
								WEB_OS.dock.setPos();
								// 更新图标位置
								WEB_OS.deskTop.appresize();
								// 更新滚动条
								WEB_OS.app.getScrollbar();
							});
						}
					});
				}
			});
		}
	}
})();

/*******************************************************************************
 * 
 * 图标布局格子 * 这篇文章里有简单说明格子的作用 *
 * http://www.cnblogs.com/hooray/archive/2012/03/23/2414410.html
 * 
 ******************************************************************************/
WEB_OS.grid = (function() {
	return {
		getAppGrid: function() {
			var width, height;
			width = $('#desk-' + WEB_OS.CONFIG.desk).width() - WEB_OS.CONFIG.appButtonLeft;
			height = $('#desk-' + WEB_OS.CONFIG.desk).height() - WEB_OS.CONFIG.appButtonTop;
			var appGrid = [],
				_top = WEB_OS.CONFIG.appButtonTop,
				_left = WEB_OS.CONFIG.appButtonLeft;
			for (var i = 0; i < 10000; i++){
				appGrid.push({
					startY: _top,
					endY: _top + 100,
					startX: _left,
					endX: _left + 120
				});
				if (WEB_OS.CONFIG.appXY == 'x'){
					_left += 120;
					if (_left + 100 > width){
						_top += 100;
						_left = WEB_OS.CONFIG.appButtonLeft;
					}
				}else{
					_top += 100;
					if (_top + 70 > height){
						_top = WEB_OS.CONFIG.appButtonTop;
						_left += 120;
					}
				}
			}
			return appGrid;
		},
		searchAppGrid: function(x, y) {
			var grid = WEB_OS.grid.getAppGrid(),
				j = grid.length;
			var flags = 0,
				appLength = $('#desk-' + WEB_OS.CONFIG.desk + ' li.appbtn:not(.add)').length - 1;
			for (var i = 0; i < j; i++){
				if (x >= grid[i].startX && x <= grid[i].endX){
					flags += 1;
				}
				if (y >= grid[i].startY && y <= grid[i].endY){
					flags += 1;
				}
				if (flags === 2){
					return i > appLength ? appLength : i;
				}else{
					flags = 0;
				}
			}
			return null;
		},
		getDockAppGrid: function() {
			var height = $('#dock-bar .dock-applist').height();
			var dockAppGrid = [],
				_left = 0,
				_top = 0;
			for (var i = 0; i < 7; i++){
				dockAppGrid.push({
					startY: _top,
					endY: _top + 62,
					startX: _left,
					endX: _left + 62
				});
				_top += 62;
				if (_top + 62 > height){
					_top = 0;
					_left += 62;
				}
			}
			return dockAppGrid;
		},
		searchDockAppGrid: function(x, y) {
			var grid = WEB_OS.grid.getDockAppGrid(),
				j = grid.length,
				flags = 0,
				appLength = $('#dock-bar .dock-applist li').length - 1;
			for (var i = 0; i < j; i++){
				if (x >= grid[i].startX && x <= grid[i].endX){
					flags += 1;
				}
				if (y >= grid[i].startY && y <= grid[i].endY){
					flags += 1;
				}
				if (flags === 2){
					return i > appLength ? appLength : i;
				}else{
					flags = 0;
				}
			}
			return null;
		},
		getManageDockAppGrid: function() {
			var manageDockAppGrid = [],
				_left = 20;
			for (var i = 0; i < 7; i++){
				manageDockAppGrid.push({
					startX: _left,
					endX: _left + 72
				});
				_left += 72;
			}
			return manageDockAppGrid;
		},
		searchManageDockAppGrid: function(x) {
			var grid = WEB_OS.grid.getManageDockAppGrid(),
				j = grid.length,
				flags = 0,
				appLength = $('#amg_dock_container li').length - 1;
			for (var i = 0; i < j; i++){
				if (x >= grid[i].startX && x <= grid[i].endX){
					flags += 1;
				}
				if (flags === 1){
					return i > appLength ? appLength : i;
				}else{
					flags = 0;
				}
			}
			return null;
		},
		getManageAppGrid: function() {
			var manageAppGrid = [],
				_top = 0;
			for (var i = 0; i < 10000; i++){
				manageAppGrid.push({
					startY: _top,
					endY: _top + 40
				});
				_top += 40;
			}
			return manageAppGrid;
		},
		searchManageAppGrid: function(y, desk) {
			var grid = WEB_OS.grid.getManageAppGrid(),
				j = grid.length,
				flags = 0,
				appLength = $('#amg_folder_container .folderItem:eq(' + desk + ') .folderInner li').length - 1;
			for (var i = 0; i < j; i++){
				if (y >= grid[i].startY && y <= grid[i].endY){
					flags += 1;
				}
				if (flags === 1){
					return i > appLength ? appLength : i;
				}else{
					flags = 0;
				}
			}
			return null;
		}
	}
})();

// 透明遮罩层 * 当拖动图标、窗口等一切可拖动的对象时，会加载一个遮罩层 * 避免拖动时触发或选中一些不必要的操作，安全第一
WEB_OS.maskBox = (function() {
	return {
		desk: function() {
			if (!TEMP.maskBoxDesk){
				TEMP.maskBoxDesk = $('<div id="maskbox" style="display: none;"></div>');
				$('body').append(TEMP.maskBoxDesk);
			}
			return TEMP.maskBoxDesk;
		},
		dock: function() {
			if (!TEMP.maskBoxDock){
				TEMP.maskBoxDock = $('<div style="z-index:1000000003;display:block;cursor:default;background:none;width:100%;height:100%;position:absolute;top:0;left:0"><div id="docktop" class="dock_drap_effect dock_drap_effect_top"></div><div id="dockleft" class="dock_drap_effect dock_drap_effect_left"></div><div id="dockright" class="dock_drap_effect dock_drap_effect_right"></div><div id="dockmask" class="dock_drap_mask"><div class="dock_drop_region_top"></div><div class="dock_drop_region_left"></div><div class="dock_drop_region_right"></div></div></div>');
				$('body').append(TEMP.maskBoxDock);
			}
			return TEMP.maskBoxDock;
		}
	}
})();

//
// 分页导航
//
WEB_OS.navbar = (function() {
	return {
		init: function() {
			$('#nav-bar').css({
				'left': $(document).width() / 2 - 105,
				'top': 10
			}).show();
			WEB_OS.navbar.move();
			WEB_OS.navbar.deskSwitch();

			// 设置默认选中页
			var nav = $('#navContainer');
			var cIndex= ($.cookie("webos_switchindex") == null) ? WEB_OS.CONFIG.desk : $
			.cookie("webos_switchindex")
			nav.addClass('nav-current-' + cIndex);
			WEB_OS.CONFIG.desk = cIndex;

		},
		move: function() {
			$('#nav-bar').on('mousedown', function(e) {
				if (e.button == 0 || e.button == 1){
					var x, y, cx, cy, lay,
						obj = $('#nav-bar');
					x = e.clientX - obj.offset().left;
					y = e.clientY - obj.offset().top;
					// 绑定鼠标移动事件
					$(document).on('mousemove', function(e) {
						lay = WEB_OS.maskBox.desk();
						lay.show();
						cx = e.clientX - x <= 0 ? 0 : e.clientX - x > $(document).width() - 210 ? $(document).width()
						- 210 : e.clientX - x;
						cy = e.clientY - y <= 10 ? 10 : e.clientY - y > $(document).height() - 50 ? $(document)
						.height()
						- 50 : e.clientY - y;
						obj.css({
							left: cx,
							top: cy
						});
					}).on('mouseup', function() {
						if (typeof(lay) !== 'undefined'){
							lay.hide();
						}
						$(this).off('mousemove').off('mouseup');
					});
				}
			});
		},
		// 点击切换
		deskSwitch: function() {
			$('#nav-bar .nav-container').on('mousedown', 'a.indicator', function(e) {
				$('.popup-menu').hide();
				$('.quick_view_container').remove();
				if (e.button == 0 || e.button == 1){
					var x, y, cx, cy, dx, dy, lay,
						obj = $('#nav-bar'),
						thisobj = $(this);
					dx = cx = obj.offset().left;
					dy = cy = obj.offset().top;
					x = e.clientX - dx;
					y = e.clientY - dy;
					// 绑定鼠标移动事件
					$(document).on('mousemove', function(e) {
						lay = WEB_OS.maskBox.desk();
						lay.show();
						cx = e.clientX - x <= 0 ? 0 : e.clientX - x > $(document).width() - 210 ? $(document).width()
						- 210 : e.clientX - x;
						cy = e.clientY - y <= 10 ? 10 : e.clientY - y > $(document).height() - 50 ? $(document)
						.height()
						- 50 : e.clientY - y;
						obj.css({
							left: cx,
							top: cy
						});
					}).on('mouseup', function() {
						if (dx == cx && dy == cy){
							if (typeof(thisobj.attr('index')) !== 'undefined'){
								var nav = $('#navContainer'),
									currindex = WEB_OS.CONFIG.desk,
									switchindex = thisobj.attr('index'),
									currleft = $('#desk-' + currindex).offset().left,
									switchleft = $('#desk-' + switchindex).offset().left;

								if (currindex != switchindex){
									if (!$('#desk-' + switchindex).hasClass('animated')
									&& !$('#desk-' + currindex).hasClass('animated')){

										$('#desk-' + currindex).addClass('animated').animate({
											left: switchleft
										}, 600, 'easeInOutCirc', function() {
											$(this).removeClass('animated');
										});

										$('#desk-' + switchindex).addClass('animated').animate({
											left: currleft
										}, 600, 'easeInOutCirc', function() {
											$(this).removeClass('animated');
											nav.removeClass('nav-current-' + currindex).addClass('nav-current-'
											+ switchindex);
											$.cookie("webos_switchindex", switchindex, {
												expires: 3650
											});
											
											WEB_OS.CONFIG.desk = $.cookie("webos_switchindex");
											
										});
									}
								}
							}else{
								// 初始化全局视图
								WEB_OS.appmanage.init();
							}
						}
						if (typeof(lay) !== 'undefined'){
							lay.hide();
						}
						$(this).off('mousemove').off('mouseup');
					});
				}
			});
		}
	}
})();

//
// app 右键菜单
//
WEB_OS.popupMenu = (function() {
	return {
		// 任务栏右键
		task: function(obj) {
			if (!TEMP.popupMenuTask){
				TEMP.popupMenuTask = $('<div class="popup-menu task-menu" style="z-index:9990;display:none"><ul><li><a menu="max" href="javascript:;">最大化</a></li><li style="border-bottom:1px solid #F0F0F0"><a menu="hide" href="javascript:;">最小化</a></li><li><a menu="close" href="javascript:;">关闭</a></li></ul></div>');
				$('body').append(TEMP.popupMenuTask);
				$('.task-menu').on('contextmenu', function() {
					return false;
				});
			}
			// 绑定事件
			$('.task-menu a[menu="max"]').off('click').on('click', function() {
				WEB_OS.window.max(obj.attr('realid'), obj.attr('type'));
				$('.popup-menu').hide();
			});
			$('.task-menu a[menu="hide"]').off('click').on('click', function() {
				WEB_OS.window.hide(obj.attr('realid'), obj.attr('type'));
				$('.popup-menu').hide();
			});
			$('.task-menu a[menu="close"]').off('click').on('click', function() {
				WEB_OS.window.close(obj.attr('realid'), obj.attr('type'));
				$('.popup-menu').hide();
			});
			return TEMP.popupMenuTask;
		},
		// 桌面右键
		desk: function() {
			if (!TEMP.popupMenuDesk){
				TEMP.popupMenuDesk = $('<div class="popup-menu desk-menu" style="z-index:9990;display:none"> <ul><li><a menu="hideall" href="javascript:;">显示桌面</a></li> <li><b class="refresh"></b><a menu="refresh" href="javascript:;">刷新</a></li> <li style="border-bottom:1px solid #F0F0F0"><a menu="closeall" href="javascript:;">关闭所有应用</a></li> <li><b class="themes"></b><a menu="themes" href="javascript:;">主题设置</a></li>  <li style="border-bottom:1px solid #F0F0F0"><a href="javascript:;">图标设置<b class="arrow">»</b></a> <div class="popup-menu" style="display:none"> <ul> <li><b class="hook"></b><a menu="orderby" orderby="x" href="javascript:;">横向排列</a></li> <li><b class="hook"></b><a menu="orderby" orderby="y" href="javascript:;">纵向排列</a></li> </ul> </div> </li> <li><a menu="logout" href="javascript:;">注销</a></li> <li><a menu="resetpass" href="javascript:;">修改密码</a></li></ul></div>');
				$('body').append(TEMP.popupMenuDesk);
				$('.desk-menu').on('contextmenu', function() {
					return false;
				});
				// 绑定事件
				$('.desk-menu li').off('mouseover').off('mouseout').on('mouseover', function() {
					if ($(this).children('a').next() != ''){
						$(this).children('a').addClass('focus');
						if ($(document).width() - $('.desk-menu').offset().left > 250){
							$(this).children('div').css({
								left: 122,
								top: -2
							});
						}else{
							$(this).children('div').css({
								left: -126,
								top: -2
							});
						}
						$(this).children('div').show();
					}
				}).on('mouseout', function() {
					$(this).children('a').removeClass('focus');
					$(this).children('div').hide();
				});
				$('.desk-menu a[menu="orderby"]').off('click').on('click', function() {
					var xy = $(this).attr('orderby');
					if (WEB_OS.CONFIG.appXY != xy){
						WEB_OS.app.updateXY(xy, function() {
							WEB_OS.deskTop.appresize();
							WEB_OS.app.getScrollbar();
						});
					}
					$('.popup-menu').hide();
				});
				$('.desk-menu a[menu="refresh"]').on('click', function() {
					WEB_OS.app.get();
					$('.popup-menu').hide();
				});
				$('.desk-menu a[menu="hideall"]').on('click', function() {
					WEB_OS.window.hideAll();
					$('.popup-menu').hide();
				});
				$('.desk-menu a[menu="closeall"]').on('click', function() {
					art.dialog({
						content: '确定要关闭所有已打开的应用？',
						icon: 'question',
						ok: function() {
							WEB_OS.window.closeAll();
						},
						cancelVal: '取消',
						cancel: true
					});
					$('.popup-menu').hide();
				});
				$('.desk-menu a[menu="themes"]').on('click', function() {
					WEB_OS.window.createTemp({
						id: 'ztsz',
						title: '主题设置',
						url: 'sysapp/wallpaper/index.html',
						width: 580,
						height: 520,
						isresize: false,
						isflash: false
					});
					$('.popup-menu').hide();
				});
				$('.desk-menu a[menu="setting"]').on('click', function() {
					WEB_OS.window.createTemp({
						id: 'zmsz',
						title: '桌面设置',
						url: 'sysapp/desksetting/index.html',
						width: 750,
						height: 450,
						isresize: false,
						isflash: false
					});
					$('.popup-menu').hide();
				});
				$('.desk-menu a[menu="logout"]').on('click', function() {
					WEB_OS.base.logout();
					$('.popup-menu').hide();
				});
				$('.desk-menu a[menu="resetpass"]').on('click', function() {
					WEB_OS.window.createTemp({
						id: 'yhzx',
						title: '用户中心',
						url: '../v5/sys/account/index.html',
						width: 520,
						height: 420,
						isresize: false,
						isflash: false
					});
					$('.popup-menu').hide();
				});
			}
			$('.desk-menu a[menu="orderby"]').each(function() {
				$(this).prev().hide();
				if ($(this).attr('orderby') == WEB_OS.CONFIG.appXY){
					$(this).prev().show();
				}
				$('.popup-menu').hide();
			});
			return TEMP.popupMenuDesk;
		}
	}
})();

// 任务栏
WEB_OS.taskbar = (function() {
	return {
		init: function() {
			$('#task-content-inner').off('click').on('click', 'a.task-item', function() {
				if ($(this).hasClass('task-item-current')){
					WEB_OS.window.hide($(this).attr('realid'), $(this).attr('type'));
				}else{
					WEB_OS.window.show2top($(this).attr('realid'), $(this).attr('type'));
				}
			}).off('contextmenu').on('contextmenu', 'a.task-item', function(e) {
				$('.popup-menu').hide();
				$('.quick_view_container').remove();
				WEB_OS.taskbar.rightClick($(this), e.clientX, e.clientY);
				return false;
			}).css({
				'float': WEB_OS.CONFIG.taskbarFloat
			});
		},
		rightClick: function(obj, x, y) {
			$('.popup-menu').hide();
			$('.quick_view_container').remove();
			var popupmenu = WEB_OS.popupMenu.task(obj);
			l = $(document).width() - x < popupmenu.width() ? x - popupmenu.width() : x;
			t = y - popupmenu.height();
			popupmenu.css({
				left: l,
				top: t
			}).show();
			return false;
		},
		pageClick: function(showW, realW) {
			var overW = realW - showW;
			if (WEB_OS.CONFIG.dockPos == 'right'){
				$('#task-content-inner').animate({
					marginLeft: 0
				}, 200);
			}else{
				$('#task-content-inner').animate({
					marginRight: 0
				}, 200);
			}
			$('#task-next a').addClass('disable');
			$('#task-pre a').removeClass('disable');
			$('#task-next-btn').off('click').on('click', function() {
				if ($(this).hasClass('disable') == false){
					if (WEB_OS.CONFIG.dockPos == 'right'){
						var marginL = parseInt($('#task-content-inner').css('margin-left')) + 114;
						if (marginL >= 0){
							marginL = 0;
							$('#task-next a').addClass('disable');
						}
						$('#task-pre a').removeClass('disable');
						$('#task-content-inner').animate({
							marginLeft: marginL
						}, 200);
					}else{
						var marginR = parseInt($('#task-content-inner').css('margin-right')) + 114;
						if (marginR >= 0){
							marginR = 0;
							$('#task-next a').addClass('disable');
						}
						$('#task-pre a').removeClass('disable');
						$('#task-content-inner').animate({
							marginRight: marginR
						}, 200);
					}
				}
			});
			$('#task-pre-btn').off('click').on('click', function() {
				if ($(this).hasClass('disable') == false){
					if (WEB_OS.CONFIG.dockPos == 'right'){
						var marginL = parseInt($('#task-content-inner').css('margin-left')) - 114;
						if (marginL <= overW * -1){
							marginL = overW * -1;
							$('#task-pre a').addClass('disable');
						}
						$('#task-next a').removeClass('disable');
						$('#task-content-inner').animate({
							marginLeft: marginL
						}, 200);
					}else{
						var marginR = parseInt($('#task-content-inner').css('margin-right')) - 114;
						if (marginR <= overW * -1){
							marginR = overW * -1;
							$('#task-pre a').addClass('disable');
						}
						$('#task-next a').removeClass('disable');
						$('#task-content-inner').animate({
							marginRight: marginR
						}, 200);
					}
				}
			});
		},
		resize: function() {
			if (WEB_OS.CONFIG.dockPos == 'left'){
				$('#task-bar').css({
					'left': 73,
					'right': 0
				});
				$('#task-content-inner').removeClass('fl');
			}else if (WEB_OS.CONFIG.dockPos == 'right'){
				$('#task-bar').css({
					'left': 0,
					'right': 73
				});
				$('#task-content-inner').addClass('fl');
			}else{
				$('#task-bar').css({
					'left': 0,
					'right': 0
				});
				$('#task-content-inner').removeClass('fl');
			}
			var w = $('#task-bar').width(),
				taskItemW = $('#task-content-inner .task-item').length * 114,
				showW = w - 112;
			if (taskItemW >= showW){
				$('#task-next, #task-pre').show();
				$('#task-content').css('width', showW);
				WEB_OS.taskbar.pageClick(showW, taskItemW);
			}else{
				$('#task-next, #task-pre').hide();
				$('#task-content').css('width', '100%');
				$('#task-content-inner').css({
					'margin-left': 0,
					'margin-right': 0
				});
			}
		}
	}
})();

// 壁纸
WEB_OS.wallpaper = (function() {
	return {
		// 获取壁纸
		get: function(src, fun) {
			var wallpaper = $.cookie("webos_zoomWallpaper");
			if (wallpaper){
				src = wallpaper;
			}

			WEB_OS.CONFIG.wallpaper = src;

			if (typeof(fun) == 'function'){
				fun();
			}

		},
		// 设置壁纸 * 平铺和居中可直接用css样式background解决
		set: function(isreload) {
			// 判断壁纸是否需要重新载入 * 比如当浏览器尺寸改变时，只需更新壁纸，而无需重新载入
			var isreload = typeof(isreload) == 'undefined' ? true : isreload;
			if (isreload){
				$('#zoomWallpaperGrid').remove();
			}
			var w = $(window).width(),
				h = $(window).height();

			if (isreload){
				$('body')
				.append(Utils
				.formatStr(
				'<div id="zoomWallpaperGrid" style="position:absolute;z-index:-10;left:0;top:0;overflow:hidden;height: {0}px;width: {1}px"><img id="zoomWallpaper" style="position:absolute;height:'
				+ '{2}px;width: {3}px;top:0;left:0"><div style="position:absolute;height: {4}px;width: {5}px;background:#fff;opacity:0;filter:alpha(opacity=0)"></div></div>',
				h, w, h, w, h, w));

				$('#zoomWallpaper').attr('src', WEB_OS.CONFIG.wallpaper).on('load', function() {
					$(this).show();
				});
			}else{
				$('#zoomWallpaperGrid').css({
					height: h + 'px',
					width: w + 'px'
				}).children('#zoomWallpaper, div').css({
					height: h + 'px',
					width: w + 'px'
				});
			}
		},
		// 更新壁纸 * 通过ajax到后端进行更新，同时获得壁纸
		update: function(wallpaper) {
			var src = 'img/wallpaper/wallpaper' + wallpaper + '.jpg';
			$.cookie("webos_zoomWallpaper", src, {
				expires: 3650
			});
			WEB_OS.wallpaper.get(src, function() {
				WEB_OS.wallpaper.set(true);
			});
		}
	}
})();

WEB_OS.widget = (function() {
	return {
		create: function(id, obj) {
			// 判断窗口是否已打开
			var iswidgetopen = false, widgetid;
			if (id === 0){
				widgetid = typeof(obj.num) == 'undefined' || obj.num == '' ? Date.parse(new Date()) : obj.num;
			}else{
				widgetid = id;
			}
			$('#desk .widget').each(function() {
				if ($(this).attr('widget') == widgetid){
					iswidgetopen = true;
				}
			});
			// 如果没有打开，则进行创建
			if (iswidgetopen == false){
				function nextDo(options) {
					$('#desk').append(widgetWindowTemp({
						'width': options.width,
						'height': options.height,
						'num': options.num,
						'url': options.url
					}));
					var widget = '#widget_' + options.num + '_warp';
					// 绑定小挂件上各个按钮事件
					WEB_OS.widget.handle($(widget));
					// 绑定小挂件移动
					WEB_OS.widget.move($(widget));
				}
				if (id === 0){
					var options = {
						num: typeof(obj.num) == 'undefined' || obj.num == '' ? Date.parse(new Date()) : obj.num,
						url: obj.url,
						width: obj.width,
						height: obj.height
					};
					nextDo(options);
				}else{
					ZENG.msgbox.show('小挂件正在加载中，请耐心等待...', 6, 100000);
				}
			}
		},
		create: function(id, type) {
			// 判断窗口是否已打开
			var iswidgetopen = false, widgetid;
			$('#desk .widget').each(function() {
				if ($(this).attr('realid') == id){
					iswidgetopen = true;
				}
			});
			// 如果没有打开，则进行创建
			if (iswidgetopen == false){
				function nextDo(options) {
					if (WEB_OS.widget.checkCookie(id, type)){
						if ($.cookie('widgetState')){
							widgetState = eval("(" + $.cookie('widgetState') + ")");
							$(widgetState).each(function() {
								if (this.id == options.id){
									options.top = this.top;
									options.left = this.left;
									options.type = this.type;
								}
							});
						}
					}else{
						WEB_OS.widget.addCookie(options.id, options.type, 10, 1100);
					}
					$('#desk').append(widgetWindowTemp({
						'width': options.width,
						'height': options.height,
						'type': options.type,
						'id': 'w_' + options.type + '_' + options.id,
						'realid': options.id,
						'top': options.top == '' ? 0 : options.top,
						'left': options.left == '' ? 0 : options.left,
						'url': options.url
					}));
					var widgetId = '#w_' + options.type + '_' + options.id;
					// 绑定小挂件上各个按钮事件
					WEB_OS.widget.handle($(widgetId));
					// 绑定小挂件移动
					WEB_OS.widget.move($(widgetId));
				}
				ZENG.msgbox.show('小挂件正在加载中，请耐心等待...', 6, 100000);
				var widget = {
					id: id,
					url: './sysapp/clock/index.html',
					width: 150,
					height: 160,
					top: 10,
					left: $(window).width() - 200,
					type: 'app'
				}

				if (widget != null){
					ZENG.msgbox._hide();
					var options = {
						id: widget['id'],
						url: widget['url'],
						width: widget['width'],
						height: widget['height'],
						type: widget['type'],
						top: widget['top'],
						left: widget['left'],
						right: widget['right']
					};
					nextDo(options);
				}else{
					ZENG.msgbox.show('小挂件加载失败', 5, 2000);
					return false;
				}
			}
		},
		// 还原上次退出系统时widget的状态
		reduction: function() {
			if ($.cookie('widgetState')){
				var widgetState = eval("(" + $.cookie('widgetState') + ")");
				for (var i = 0; i < widgetState.length; i++){
					WEB_OS.widget.create(widgetState[i].id, widgetState[i].type);
				}
			}
		},
		// 根据id验证是否存在cookie中
		checkCookie: function(id, type) {
			var flag = false;
			if ($.cookie('widgetState')){
				widgetState = eval("(" + $.cookie('widgetState') + ")");
				$(widgetState).each(function() {
					if (this.id == id && this.type == type){
						flag = true;
					}
				});
			}
			return flag;
		},
		//
		// 以下三个方法：addCookie、updateCookie、removeCookie * 用于记录widget打开状态以及摆放位置 *
		// 实现用户二次登入系统时，还原上次widget的状态
		//
		addCookie: function(id, type, top, left) {
			if (!WEB_OS.widget.checkCookie(id, type)){
				var json = [];
				if ($.cookie('widgetState')){
					var widgetState = eval("(" + $.cookie('widgetState') + ")"),
						len = 0;
					for (var i = 0; i < len; i++){
						json.push("{'id':'" + widgetState[i].id + "','type':'" + widgetState[i].type + "','top':'"
						+ widgetState[i].top + "','left':'" + widgetState[i].left + "'}");
					}
				}
				json.push("{'id':'" + id + "','type':'" + type + "','top':'" + top + "','left':'" + left + "'}");
				$.cookie('widgetState', '[' + json.join(',') + ']', {
					expires: 95
				});
			}
		},
		updateCookie: function(id, type, top, left) {
			if (WEB_OS.widget.checkCookie(id, type)){
				var widgetState = eval("(" + $.cookie('widgetState') + ")"),
					len = widgetState.length,
					json = [];
				for (var i = 0; i < len; i++){
					if (widgetState[i].id == id){
						json
						.push("{'id':'" + id + "','type':'" + type + "','top':'" + top + "','left':'" + left + "'}");
					}else{
						json.push("{'id':'" + widgetState[i].id + "','type':'" + widgetState[i].type + "','top':'"
						+ widgetState[i].top + "','left':'" + widgetState[i].left + "'}");
					}
				}
				$.cookie('widgetState', '[' + json.join(',') + ']', {
					expires: 95
				});
			}
		},
		removeCookie: function(id, type) {
			if (WEB_OS.widget.checkCookie(id, type)){
				var widgetState = eval("(" + $.cookie('widgetState') + ")"),
					len = widgetState.length,
					json = [];
				for (var i = 0; i < len; i++){
					if (widgetState[i].id != id){
						json.push("{'id':'" + widgetState[i].id + "','type':'" + widgetState[i].type + "','top':'"
						+ widgetState[i].top + "','left':'" + widgetState[i].left + "'}");
					}
				}
				$.cookie('widgetState', '[' + json.join(',') + ']', {
					expires: 95
				});
			}
		},
		move: function(obj) {
			obj.on('mousedown', '.move', function(e) {
				var lay, x, y;
				x = e.clientX - obj.offset().left;
				y = e.clientY - obj.offset().top;
				// 绑定鼠标移动事件
				$(document).on('mousemove', function(e) {
					lay = WEB_OS.maskBox.desk();
					lay.show();
					_l = e.clientX - x;
					_t = e.clientY - y;
					_t = _t < 0 ? 0 : _t;
					obj.css({
						left: _l,
						top: _t
					});
				}).on('mouseup', function() {
					$(this).off('mousemove').off('mouseup');
					if (typeof(lay) !== 'undefined'){
						lay.hide();
					}
					WEB_OS.widget.updateCookie(obj.attr('realid'), obj.attr('type'), _t, _l);
				});
			});
		},
		close: function(id, type) {
			var widgetId = '#w_' + type + '_' + id;
			$(widgetId).html('').remove();
			WEB_OS.widget.removeCookie(id, type);
		},
		handle: function(obj) {
			obj.on('click', '.ha-close', function() {
				WEB_OS.widget.close(obj.attr('realid'), obj.attr('type'));
			})
		}
	}
})();

// 应用窗口
WEB_OS.window = (function() {
	return {
		//
		// * 创建窗口 *
		// 自定义窗口：WEB_OS.window.createTemp({title,url,width,height,resize}); *
		// 因为是自定义窗口，所以id就写0，不能省略 * 后面参数依次为：标题、地址、宽、高、是否可拉伸、是否为flash *
		// 示例：WEB_OS.window.createTemp({title:"百度",url:"http://www.baidu.com",width:800,height:400,isresize:false,isflash:false});
		//
		createTemp: function(obj) {
			$('.popup-menu').hide();
			$('.quick_view_container').remove();
			var type = 'app',
				id = typeof(obj.id) == 'undefined' || obj.id == '' ? Date.parse(new Date()) : obj.id;
			// 判断窗口是否已打开
			var iswindowopen = false;
			$('#task-content-inner a.task-item').each(function() {
				if ($(this).attr('realid') == id && $(this).attr('type') == type){
					iswindowopen = true;
					WEB_OS.window.show2top(id, type);
				}
			});
			// 如果没有打开，则进行创建
			if (iswindowopen == false){
				function nextDo(options) {
					var windowId = '#w_' + options.type + '_' + options.id;
					// 新增任务栏
					$('#task-content-inner').prepend(taskTemp({
						'type': options.type,
						'id': 't_' + options.type + '_' + options.id,
						'realid': options.id,
						'title': options.title,
						'imgsrc': options.imgsrc
					}));
					$('#task-content-inner').css('width', $('#task-content-inner .task-item').length * 114);
					WEB_OS.taskbar.resize();
					// 新增窗口
					TEMP.windowTemp = {
						'width': options.width,
						'height': options.height,
						'top': ($(window).height() - options.height) / 2 <= 0
						? 0
						: ($(window).height() - options.height) / 2,
						'left': ($(window).width() - options.width) / 2 <= 0 ? 0 : ($(window).width() - options.width)
						/ 2,
						'emptyW': $(window).width() - options.width,
						'emptyH': $(window).height() - options.height,
						'zIndex': WEB_OS.CONFIG.createIndexid,
						'type': options.type,
						'id': 'w_' + options.type + '_' + options.id,
						'realid': options.id,
						'title': options.title,
						'url': options.url,
						'imgsrc': options.imgsrc,
						'isresize': options.isresize == 1 ? true : false,
						'istitlebar': options.isresize == 1 ? true : false,
						'istitlebarFullscreen': WEB_OS.CONFIG.fullScreen ? (options.isresize == 1
						? window.fullScreenApi.supportsFullScreen == true ? true : false
						: false) : false,
						'issetbar': options.issetbar == 1 ? true : false,
						'isflash': options.isflash == 1 ? true : false
					};
					$('#desk').append(windowTemp(TEMP.windowTemp));
					$(windowId).data('info', TEMP.windowTemp);
					WEB_OS.CONFIG.createIndexid += 1;
					// iframe加载完毕后
					$(windowId).find('iframe').on('load', function() {
						if (options.isresize){
							// 绑定窗口拉伸事件
							WEB_OS.window.resize($(windowId));
						}
						// 隐藏loading
						$(windowId + ' .window-frame').children('div').eq(1).fadeOut();
					});
					$(windowId).on('contextmenu', function() {
						return false;
					});
					// 绑定窗口上各个按钮事件
					WEB_OS.window.handle($(windowId));
					// 绑定窗口移动
					WEB_OS.window.move($(windowId));
					// 绑定窗口遮罩层点击事件
					$('.window-mask').off('click').on('click', function() {
						WEB_OS.window.show2top($(this).parents('.window-container').attr('realid'), $(this)
						.parents('.window-container').attr('type'));
					});
					WEB_OS.window.show2top(options.id, options.type);
				}
				nextDo({
					type: 'app',
					id: typeof(obj.id) == 'undefined' || obj.id == '' ? Date.parse(new Date()) : obj.id,
					imgsrc: 'img/ui/default_icon.png',
					title: obj.title,
					url: obj.url,
					width: obj.width,
					height: obj.height,
					isresize: obj.isresize,
					issetbar: false,
					isflash: typeof(obj.isflash) == 'undefined' || obj.id == '' ? true : obj.isflash
				});
			}
		},
		//
		// 创建窗口 * 系统窗口：WEB_OS.window.create(id, type); *
		// 示例：WEB_OS.window.create(12, 'app');
		//
		create: function(id, type, module, app, openId) {
			$('.popup-menu').hide();
			$('.quick_view_container').remove();
			// 判断窗口是否已打开
			var iswindowopen = false;
			$('#task-content-inner a.task-item').each(function() {
				if ($(this).attr('realid') == id && $(this).attr('type') == type){
					iswindowopen = true;
					WEB_OS.window.show2top(id, type);
				}
			});
			// 如果没有打开，则进行创建
			if (iswindowopen == false){// TODO:XXX
				function nextDo(options) {
					WEB_OS.appCfg[options.id] = options;
					var windowId = '#w_' + options.type + '_' + options.id;
					var top = ($(window).height() - options.height) / 2 <= 0
					? 0
					: ($(window).height() - options.height) / 2;
					var left = ($(window).width() - options.width) / 2 <= 0 ? 0 : ($(window).width() - options.width)
					/ 2;
					switch(options.type){
						case 'app':
						case 'papp':
							// 新增任务栏
							$('#task-content-inner').prepend(taskTemp({
								'type': options.type,
								'id': 't_' + options.type + '_' + options.id,
								'realid': options.id,
								'title': options.title,
								'imgsrc': options.imgsrc
							}));
							$('#task-content-inner').css('width', $('#task-content-inner .task-item').length * 114);
							WEB_OS.taskbar.resize();
							// 新增窗口
							TEMP.windowTemp = {
								'width': options.width,
								'height': options.height,
								'top': top,
								'left': left,
								'emptyW': $(window).width() - options.width,
								'emptyH': $(window).height() - options.height,
								'zIndex': WEB_OS.CONFIG.createIndexid,
								'type': options.type,
								'id': 'w_' + options.type + '_' + options.id,
								'realid': options.id,
								'title': options.title,
								'url': options.url,
								'imgsrc': options.imgsrc,
								'isresize': options.isresize || false,
								'istitlebar': options.isresize || false,
								'istitlebarFullscreen': WEB_OS.CONFIG.fullScreen ? (options.isresize == 1
								? ((window.fullScreenApi.supportsFullScreen == true) ? true : false)
								: false) : false,
								'issetbar': options.issetbar || false,
								'isflash': options.isflash || false
							};
							$('#desk').append(windowTemp(TEMP.windowTemp));
							$(windowId).data('info', TEMP.windowTemp);
							WEB_OS.CONFIG.createIndexid += 1;
							// iframe加载完毕后
							$(windowId + ' iframe').on('load', function() {
								if (options.isresize){
									// 绑定窗口拉伸事件
									WEB_OS.window.resize($(windowId));
								}
								// 隐藏loading
								$(windowId + ' .window-frame').children('div').eq(1).fadeOut();
							});
							$(windowId).on('contextmenu', function() {
								return false;
							});
							// 绑定窗口上各个按钮事件
							WEB_OS.window.handle($(windowId));
							// 绑定窗口移动
							WEB_OS.window.move($(windowId));
							// 绑定窗口遮罩层点击事件
							$('.window-mask').off('click').on('click', function() {
								WEB_OS.window.show2top($(this).parents('.window-container').attr('realid'), $(this)
								.parents('.window-container').attr('type'));
							});
							WEB_OS.window.show2top(options.id, options.type);
							if (options.maximized){
								WEB_OS.window.max(options.id, options.type);
							}
							break;
					}
				}
				// TODO:open one module
				ZENG.msgbox.show('应用正在加载中，请耐心等待...', 6, 100000);
				if (!app){
					var full = WEB_OS.DESK_APP[module];
					var url = 'http://www.baidu.com';
					app = {
						id: full.id,
						type: 'app',
						maximized: full.maximized,
						icon: iconPath + full.module + '.png',
						name: full.name,
						url: url,
						height: full.height || 620,
						width: full.width || 1050,
						isresize: true,
						issetbar: true,// 显示窗体下排按钮，评分，帮助...等等
						isflash: true
						// 是否显示非当前模块 休息中...
					};
				}
				if (app != null){
					ZENG.msgbox._hide();
					switch(app['type']){
						case 'app':
						case 'papp':
						case 'widget':
						case 'pwidget':
							nextDo({
								callback: app['callback'],
								closeCall: app['closeCall'],
								maximized: app['maximized'],
								type: app['type'],
								id: app['id'],
								title: app['name'],
								imgsrc: app['icon'],
								url: app['url'],
								width: app['width'],
								height: app['height'],
								isresize: app['isresize'],
								issetbar: app['issetbar'],
								isflash: app['isflash']
							});
							break;
					}
				}else{
					ZENG.msgbox.show('数据拉取失败', 5, 2000);
					return false;
				}
			}
		},
		close: function(id, type) {
			var cfg = WEB_OS.appCfg[id];
			if (cfg){
				if (cfg.closeCall && typeof cfg.closeCall == 'function'){
					cfg.closeCall.apply(window);
				}
			}
			var windowId = '#w_' + type + '_' + id,
				taskId = '#t_' + type + '_' + id;
			$(windowId).removeData('info').html('').remove();
			$('#task-content-inner ' + taskId).html('').remove();
			$('#task-content-inner').css('width', $('#task-content-inner .task-item').length * 114);
			$('#task-bar, #nav-bar').removeClass('min-zIndex');
			WEB_OS.taskbar.resize();
		},
		closeAll: function() {
			$('#desk .window-container').each(function() {
				WEB_OS.window.close($(this).attr('realid'), $(this).attr('type'));
			});
		},
		hide: function(id, type) {
			WEB_OS.window.show2top(id, type);
			var windowId = '#w_' + type + '_' + id,
				taskId = '#t_' + type + '_' + id;
			$(windowId).hide();
			$('#task-content-inner ' + taskId).removeClass('task-item-current');
			if ($(windowId).attr('ismax') == 1){
				$('#task-bar, #nav-bar').removeClass('min-zIndex');
			}
		},
		hideAll: function() {
			$('#task-content-inner a.task-item').removeClass('task-item-current');
			$('#desk-' + WEB_OS.CONFIG.desk).nextAll('div.window-container').hide();
		},
		max: function(id, type) {
			WEB_OS.window.show2top(id, type);
			var windowId = '#w_' + type + '_' + id,
				taskId = '#t_' + type + '_' + id;
			$(windowId + ' .title-handle .ha-max').hide().next(".ha-revert").show();
			$(windowId).attr('ismax', 1).animate({
				width: '100%',
				height: '100%',
				top: 0,
				left: -2
			}, 200);
			$('#task-bar').addClass('min-zIndex');
			// TODO:---去除窗体最大话时 navar z-index 设置成min-zIndex
			$('#nav-bar').addClass('min-zIndex');
		},
		revert: function(id, type) {
			WEB_OS.window.show2top(id, type);
			var windowId = '#w_' + type + '_' + id,
				taskId = '#t_' + type + '_' + id;
			$(windowId + ' .title-handle .ha-revert').hide().prev('.ha-max').show();
			var obj = $(windowId),
				windowdata = obj.data('info');
			obj.attr('ismax', 0).animate({
				width: windowdata['width'],
				height: windowdata['height'],
				left: windowdata['left'],
				top: windowdata['top']
			}, 500);
			$('#task-bar, #nav-bar').removeClass('min-zIndex');
		},
		refresh: function(id, type) {
			// TODO:xx refresh
			WEB_OS.window.show2top(id, type);
			var windowId = '#w_' + type + '_' + id,
				taskId = '#t_' + type + '_' + id;
			// 判断是应用窗口，还是文件夹窗口
			if ($(windowId + '_iframe').length != 0){
				$(windowId + '_iframe').attr('src', $(windowId + '_iframe').attr('src'));
			}
		},
		show2top: function(id, type) {
			var windowId = '#w_' + type + '_' + id,
				taskId = '#t_' + type + '_' + id;
			// 改变任务栏样式
			$('#task-content-inner a.task-item').removeClass('task-item-current');
			$('#task-content-inner ' + taskId).addClass('task-item-current');
			if ($(windowId).attr('ismax') == 1){
				$('#task-bar, #nav-bar').addClass('min-zIndex');
			}
			// 改变窗口样式
			$('#desk .window-container .window-container').removeClass('window-current');
			$(windowId).addClass('window-current').css({
				'z-index': WEB_OS.CONFIG.createIndexid,
				'visibility': 'visible'
			});
			// 改变窗口遮罩层样式
			$('#desk .window-container .window-mask').show();
			$(windowId + ' .window-mask').hide();
			// 改变iframe显示
			$('#desk .window-container-flash iframe').hide();
			$(windowId + ' iframe').show();
			$(windowId).show();
			WEB_OS.CONFIG.createIndexid += 1;
		},
		handle: function(obj) {
			obj.on('dblclick', '.title-bar', function(e) {
				// 判断当前窗口是否已经是最大化
				if (obj.find('.ha-max').is(':hidden')){
					obj.find('.ha-revert').click();
				}else{
					obj.find('.ha-max').click();
				}
			}).on('click', '.ha-hide', function() {
				WEB_OS.window.hide(obj.attr('realid'), obj.attr('type'));
			}).on('click', '.ha-max', function() {
				WEB_OS.window.max(obj.attr('realid'), obj.attr('type'));
			}).on('click', '.ha-revert', function() {
				WEB_OS.window.revert(obj.attr('realid'), obj.attr('type'));
			}).on('click', '.ha-fullscreen', function() {
				window.fullScreenApi.requestFullScreen(document.getElementById(obj.find('iframe').attr('id')));
			}).on('click', '.ha-close', function() {
				WEB_OS.window.close(obj.attr('realid'), obj.attr('type'));
			}).on('click', '.refresh', function() {
				WEB_OS.window.refresh(obj.attr('realid'), obj.attr('type'));
			}).on('click', '.star', function() {
				alert('star');
			}).on('click', '.help', function() {
				alert('help');
			}).on('contextmenu', '.window-container', function() {
				$('.popup-menu').hide();
				$('.quick_view_container').remove();
				return false;
			});
		},
		move: function(obj) {
			obj.on('mousedown', '.title-bar', function(e) {
				// 这里处理最大化后不允许拖拽
				/*
				 * if(obj.attr('ismax') == 1){ return; }
				 */
				WEB_OS.window.show2top(obj.attr('realid'), obj.attr('type'));
				var windowdata = obj.data('info'), lay, x, y;
				x = e.clientX - obj.offset().left;
				y = e.clientY - obj.offset().top;
				// 绑定鼠标移动事件
				$(document).on('mousemove', function(e) {
					lay = WEB_OS.maskBox.desk();
					lay.show();
					// 强制把右上角还原按钮隐藏，最大化按钮显示
					obj.find('.ha-revert').hide().prev('.ha-max').show();
					_l = e.clientX - x;
					_t = e.clientY - y;
					_w = windowdata['width'];
					_h = windowdata['height'];
					// 窗口贴屏幕顶部10px内 || 底部60px内
					_t = _t <= 10 ? 0 : _t >= lay.height() - 30 ? lay.height() - 30 : _t;
					obj.css({
						width: _w,
						height: _h,
						left: _l,
						top: _t
					});
					obj.data('info').left = obj.offset().left;
					obj.data('info').top = obj.offset().top;
					// 最大化拖拽
					if (obj.attr('ismax') == 1){
						$('#task-bar, #nav-bar').removeClass('min-zIndex');
					}
				}).on('mouseup', function() {
					$(this).off('mousemove').off('mouseup');
					if (typeof(lay) !== 'undefined'){
						lay.hide();
					}
				});
			});
		},
		resize: function(obj) {
			obj.find('div.window-resize').on('mousedown', function(e) {
				// 增加背景遮罩层
				var resizeobj = $(this), lay,
					x = e.clientX,
					y = e.clientY,
					w = obj.width(),
					h = obj.height();
				$(document).on('mousemove', function(e) {
					lay = WEB_OS.maskBox.desk();
					lay.show();
					_x = e.clientX;
					_y = e.clientY;
					// 当拖动到屏幕边缘时，自动贴屏
					_x = _x <= 10 ? 0 : _x >= (lay.width() - 12) ? (lay.width() - 2) : _x;
					_y = _y <= 10 ? 0 : _y >= (lay.height() - 12) ? lay.height() : _y;
					switch(resizeobj.attr('resize')){
						case 't':
							h + y - _y > WEB_OS.CONFIG.windowMinHeight ? obj.css({
								height: h + y - _y,
								top: _y
							}) : obj.css({
								height: WEB_OS.CONFIG.windowMinHeight
							});
							break;
						case 'r':
							w - x + _x > WEB_OS.CONFIG.windowMinWidth ? obj.css({
								width: w - x + _x
							}) : obj.css({
								width: WEB_OS.CONFIG.windowMinWidth
							});
							break;
						case 'b':
							h - y + _y > WEB_OS.CONFIG.windowMinHeight ? obj.css({
								height: h - y + _y
							}) : obj.css({
								height: WEB_OS.CONFIG.windowMinHeight
							});
							break;
						case 'l':
							w + x - _x > WEB_OS.CONFIG.windowMinWidth ? obj.css({
								width: w + x - _x,
								left: _x
							}) : obj.css({
								width: WEB_OS.CONFIG.windowMinWidth
							});
							break;
						case 'rt':
							h + y - _y > WEB_OS.CONFIG.windowMinHeight ? obj.css({
								height: h + y - _y,
								top: _y
							}) : obj.css({
								height: WEB_OS.CONFIG.windowMinHeight
							});
							w - x + _x > WEB_OS.CONFIG.windowMinWidth ? obj.css({
								width: w - x + _x
							}) : obj.css({
								width: WEB_OS.CONFIG.windowMinWidth
							});
							break;
						case 'rb':
							w - x + _x > WEB_OS.CONFIG.windowMinWidth ? obj.css({
								width: w - x + _x
							}) : obj.css({
								width: WEB_OS.CONFIG.windowMinWidth
							});
							h - y + _y > WEB_OS.CONFIG.windowMinHeight ? obj.css({
								height: h - y + _y
							}) : obj.css({
								height: WEB_OS.CONFIG.windowMinHeight
							});
							break;
						case 'lt':
							w + x - _x > WEB_OS.CONFIG.windowMinWidth ? obj.css({
								width: w + x - _x,
								left: _x
							}) : obj.css({
								width: WEB_OS.CONFIG.windowMinWidth
							});
							h + y - _y > WEB_OS.CONFIG.windowMinHeight ? obj.css({
								height: h + y - _y,
								top: _y
							}) : obj.css({
								height: WEB_OS.CONFIG.windowMinHeight
							});
							break;
						case 'lb':
							w + x - _x > WEB_OS.CONFIG.windowMinWidth ? obj.css({
								width: w + x - _x,
								left: _x
							}) : obj.css({
								width: WEB_OS.CONFIG.windowMinWidth
							});
							h - y + _y > WEB_OS.CONFIG.windowMinHeight ? obj.css({
								height: h - y + _y
							}) : obj.css({
								height: WEB_OS.CONFIG.windowMinHeight
							});
							break;
					}
				}).on('mouseup', function() {
					if (typeof(lay) !== 'undefined'){
						lay.hide();
					}
					obj.data('info').width = obj.width();
					obj.data('info').height = obj.height();
					obj.data('info').left = obj.offset().left;
					obj.data('info').top = obj.offset().top;
					obj.data('info').emptyW = $(window).width() - obj.width();
					obj.data('info').emptyH = $(window).height() - obj.height();
					$(this).off('mousemove').off('mouseup');
				});
			});
		}
	}
})();

// 工具类
Utils = {
	formatmodel: function(str, model) { // String format
		for (var k in model){
			var re = new RegExp("{" + k + "}", "g");
			str = str.replace(re, model[k])
		}
		return str
	},
	processStr: function(str) {
		if (str){
			return str.replace(/[\.\:\"\'\{\}\,\-\_\*\$]/g, '');
		}else{
			return str;
		}
	},
	formatStr: function(format) {
		var args = [];
		for (var i in arguments){
			if (i != 0){
				args.push(arguments[i])
			}
		}
		return format.replace(/\{(\d+)\}/g, function(m, i) {
			return args[i];
		});
	}
}

Windows = function(me) {
	return me = {// 根据参数和模块生成一个惟一id
		generatorUUID: function(module, param) {
			// 生成的id不能包含下划线，点号，防止变态的id组织结构导致查不到元素
			return Utils.processStr(module + param);
		},
		// 打开一个桌面模块,可以传参数openId
		openWindow: function(module, openId) {
			var appCfg = WEB_OS.DESK_APP[module];
			WEB_OS.window.create(appCfg.id, 'app', module, null, openId);

		},
		// 打开一个后台的窗体模块，桌面没有图标
		openNoGroupWindow: function(module, param, config) {
			var id = me.generatorUUID(module, param);
			var url = Utils.formatStr(//
			'../v5/{0}/index.html?openId={1}', module.replace(/\./g, '/'), (typeof(param) == 'string') ? param.replace(
			/\"/g, '\'') : param);

			WEB_OS.window.create(id, 'app', null, {
				id: id,
				type: 'app',
				icon: iconPath + module + '.png',
				name: config.title || '',
				url: url,
				height: config.height || 600,
				width: config.width || 800,
				maximized: config.maximized,
				callback: config.callback,
				closeCall: config.closeCall,
				isresize: true,
				issetbar: false,
				isflash: false
			});
		},
		// 关闭一个后台窗体模块
		closeNoGroupWindow: function(module, param) {
			var id = this.generatorUUID(module, param);
			var cfg = me.getWindowCfg(module, param);
			if (cfg.closeCall && typeof cfg.closeCall == 'function'){
				cfg.closeCall.apply(window);
			}
			WEB_OS.window.close(id, 'app');
		},
		// 返回窗口信息
		getWindowCfg: function(module, param) {
			var id = me.generatorUUID(module, param);
			return WEB_OS.appCfg[id];
		}
	}
}();
