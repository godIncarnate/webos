/*******************************************************************************
 * 
 * bootstrap.js 禁止backspace, boot webos.
 * 
 ******************************************************************************/
(function() {

	function doKey(e) {
		var ev = e || window.event;// 获取event对象
		var obj = ev.target || ev.srcElement;// 获取事件源
		var t = obj.type || obj.getAttribute('type');// 获取事件源类型
		var readonly = obj.readonly || obj.getAttribute('readonly');

		if ((ev.keyCode == 8 && t != "password" && t != "text" && t != "textarea")
		|| (ev.keyCode == 8 && readonly == 'readonly')){ return false; }
	}
	// 禁止后退键 作用于Firefox、Opera
	document.onkeypress = doKey;
	// 禁止后退键 作用于IE、Chrome
	document.onkeydown = doKey;

	$(document).ready(function() {
		// IE下禁止选中
		document.body.onselectstart = document.body.ondrag = function() {
			return false;
		}
		$('.loading').hide();

		$('#desktop').show();

		WEB_OS.base.init();

	});

})();