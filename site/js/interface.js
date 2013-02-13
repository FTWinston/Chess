var cellRefs;
function initiateGame(definition, variant, cellRefMode) {
	cellRefs = cellRefMode;
	
	$.ajax({
	type: "GET",
	url: definition,
	dataType: "xml",
	success: parseXml
  });
  
  $("#zoomIn").button().click(function() { changeZoom(true); });
  $("#zoomOut").button().click(function() { changeZoom(false); });
}

var game;
function parseXml(xml) {
	var board = new Board($("#game"), cellRefs);
	game = new Game(board, xml, true);
	game.board.render();
}

var zoom = 1;
function changeZoom(zoomIn) {
	if ( zoomIn )
		zoom += 0.1;
	else if ( zoom > 0.1 )
		zoom -= 0.1;
	
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