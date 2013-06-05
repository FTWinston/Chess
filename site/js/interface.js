var cellRefs;
function initiateGame(definition, cellRefMode) {
	cellRefs = cellRefMode;
	$.ajax({
	type: "GET",
	url: definition,
	dataType: "xml",
	success: parseXml
  });
  
  $("#zoomIn").button().click(function() { zoom += 0.1; setZoom(); });
  $("#zoomOut").button().click(function() { if ( zoom > 0.1 ) zoom -= 0.1; setZoom(); });
  $("#zoomAuto").button().click(function() { zoomAuto(); });
}

var game;
function parseXml(xml) {
	var board = new Board($("#game"), cellRefs, supportsSVG());
	game = new Game(board, xml, true);
	game.board.render();
}

var zoom = 1;
function zoomAuto() {
	var maxVertical = $(window).height() / $('#game').outerHeight(true);
	var maxHoriz = ($(window).width() - $('#gameSidebar').outerWidth(true)) / $('#game').outerWidth(true);
	
	var newZoom = Math.min(maxVertical, maxHoriz);
	if ( newZoom == zoom )
		zoom = 1;
	else
		zoom = newZoom;
	setZoom();
}

function setZoom() {
	$("#game").css({
		"zoom": zoom, // IE, Safari, Chrome
		"-moz-transform": "scale(" + zoom + ")", // Firefox
		"-moz-transform-origin": "0 0",
		"-o-transform": "scale(" + zoom + ")", // Opera
		"-o-transform-origin": "0 0"/*,
		"-webkit-transform": "scale(" + zoom + ")", // Safari and Chrome
		"-webkit-transform-origin": "0 0"*/
	});
}

function supportsSVG() {
	return !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;
}