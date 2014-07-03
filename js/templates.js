//桌面图标
var appbtnTemp = template(
	'<li class="appbtn" module="<%=module%>" url="<%=url%>" type="<%=type%>" id="<%=id%>" realid="<%=realid%>" style="top:<%=top%>px;left:<%=left%>px">'+
		'<div><img src="<%=imgsrc%>" onerror="this.src=\'img\/ui\/default_icon.png\'" title="<%=title%>" alt="<%=title%>"></div>'+
		'<span><%=title%></span>'+
	'</li>'
);
//桌面"添加应用"图标
var addbtnTemp = template(
	'<li class="appbtn add" style="top:<%=top%>px;left:<%=left%>px">'+
		'<i class="addicon"></i>'+
		'<span>添加应用</span>'+
	'</li>'
);
//任务栏
var taskTemp = template(
	'<a id="<%=id%>" realid="<%=realid%>" title="<%=title%>" type="<%=type%>" class="task-item task-item-current">'+
		'<div class="task-item-icon">'+
			'<img src="<%=imgsrc%>" onerror="this.src=\'img\/ui\/default_icon.png\'">'+
		'</div>'+
		'<div class="task-item-txt"><%=title%></div>'+
	'</a>'
);
//小挂件
var widgetWindowTemp = template(
	'<div id="<%=id%>" realid="<%=realid%>" type="<%=type%>" class="widget" style="z-index:1;width:<%=width%>px;height:<%=height%>px;top:<%=top%>px;left:<%=left%>px">'+
		'<div class="move"></div>'+
		'<a class="ha-close" href="javascript:;" title="关闭"></a>'+
		'<div class="frame">'+
			'<iframe src="<%=url%>" frameborder="0" allowtransparency="true"></iframe>'+
		'</div>'+
	'</div>'
);
//应用窗口
var windowTemp = template(
	'<div id="<%=id%>" realid="<%=realid%>" type="<%=type%>" class="window-container window-current<% if(isflash){ %> window-container-flash<% } %>" style="width:<%=width%>px;height:<%=height%>px;top:<%=top%>px;left:<%=left%>px;z-index:<%=zIndex%>">'+
		'<div style="height:100%">'+
			'<div class="title-bar">'+
				'<img class="icon" src="<%=imgsrc%>" onerror="this.src=\'img\/ui\/default_icon.png\'"><span class="title"><%=title%></span>'+
			'</div>'+
			'<div class="title-handle">'+
				'<a class="ha-hide" btn="hide" href="javascript:;" title="最小化"><b class="hide-b"></b></a>'+
				'<% if(istitlebar){ %>'+
					'<a class="ha-max" btn="max" href="javascript:;" title="最大化"><b class="max-b"></b></a>'+
					'<a class="ha-revert" btn="revert" href="javascript:;" title="还原" style="display:none"><b class="revert-b"></b><b class="revert-t"></b></a>'+
				'<% } %>'+
				'<% if(istitlebarFullscreen){ %>'+
					'<a class="ha-fullscreen" btn="fullscreen" href="javascript:;" title="全屏">+</a>'+
				'<% } %>'+
				'<a class="ha-close" btn="close" href="javascript:;" title="关闭">×</a>'+
			'</div>'+
			'<div class="window-frame">'+
				'<% if(isflash){ %>'+
					'<div class="window-mask"><div class="maskbg"></div><div>运行中，点击恢复显示 :)</div></div>'+
				'<% }else{ %>'+
					'<div class="window-mask window-mask-noflash"></div>'+
				'<% } %>'+
				'<div class="window-loading-mask"> <p><img alt="Octocat-spinner-128" height="64" src="./img/ui/loading.gif" width="64"></p><p>Loading...</p></div>'+
				'<iframe id="<%=id%>_iframe" frameborder="0" src="<%=url%>"></iframe>'+
			'</div>'+
			'<div class="set-bar"><div class="fr">'+
				'<% if(issetbar){ %>'+
					'<a class="btn star"><i class="icon icon177"></i><span class="btn-con">收藏</span></a>'+
					'<a class="btn help"><i class="icon icon105"></i><span class="btn-con">帮助</span></a>'+
				'<% } %>'+
				'<a class="btn refresh"><i class="icon icon158"></i><span class="btn-con">刷新</span></a>'+
			'</div></div>'+
		'</div>'+
		'<% if(isresize){ %>'+
			'<div class="window-resize window-resize-t" resize="t"></div>'+
			'<div class="window-resize window-resize-r" resize="r"></div>'+
			'<div class="window-resize window-resize-b" resize="b"></div>'+
			'<div class="window-resize window-resize-l" resize="l"></div>'+
			'<div class="window-resize window-resize-rt" resize="rt"></div>'+
			'<div class="window-resize window-resize-rb" resize="rb"></div>'+
			'<div class="window-resize window-resize-lt" resize="lt"></div>'+
			'<div class="window-resize window-resize-lb" resize="lb"></div>'+
		'<% } %>'+
	'</div>'
);
 
 