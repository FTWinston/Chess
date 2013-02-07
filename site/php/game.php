<?

function getVariantDefinition($variantID, $userID)
{
	global $db;
	$query = "SELECT Name, Definition FROM Variants WHERE ID = :variantID and (Public = 1 OR CreatedBy = :userID)";
	
	$query_params = array(
	':variantID' => $variantID,
	':userID' => $userID
	);
	
	try
	{
		$stmt = $db->prepare($query);
		$result = $stmt->execute($query_params);
	}
	catch(PDOException $ex)
	{
		die("Error loading variant" . db_error(__FILE__, __LINE__, $ex));
	}
	
	$row = $stmt->fetch();
	if(!$row)
		return null;
	
	return Array($row['Name'], '/variants/' . $row['Definition'] . '/definition.xml', '/variants/' . $row['Definition']);
}

function loadVariant($definition, $variantDir)
{
	return '
<link type="text/css" href="/css/game.css" rel="stylesheet" />
<script type="text/javascript" src="/js/mootools-core-1.4.5.js"></script>
<script type="text/javascript" src="/js/core.js"></script>
<script type="text/javascript" src="/js/xmlhelper.js"></script>
<script type="text/javascript" src="/js/board.js"></script>
<script type="text/javascript" src="/js/conditions.js"></script>
<script type="text/javascript" src="/js/move.js"></script>
<script type="text/javascript" src="/js/movedefinition.js"></script>
<script type="text/javascript" src="/js/piecetype.js"></script>
<script type="text/javascript" src="/js/piece.js"></script>
<script type="text/javascript" src="/js/player.js"></script>
<script type="text/javascript" src="/js/game.js"></script>

<div id="game">
<canvas id="board">Your browser is not capable of displaying this game - please use a more modern browser (e.g. Chrome, Firefox, or Internet Explorer 9)</canvas>
</div>

<div id="sidebar">
<span id="zoomIn">Zoom in</span> <span id="zoomOut">Zoom out</span>
</div>

<script type="text/javascript">
$(document).ready(function() {
	$.ajax({
	type: "GET",
	url: "' . $definition . '",
	dataType: "xml",
	success: parseXml
  });
  
  $("#zoomIn").button().click(function() { resize(board.cellSize * 1.3333333333333); });
  $("#zoomOut").button().click(function() { resize(board.cellSize * 0.75); });
});

function parseXml(xml) {
	var canvas = $("#board").get(0);
	board = new Board(canvas, ' . readFromUserSession('Prefs_CellReferences') . ', "#' . readFromUserSession('Prefs_BoardColor1') . '", "#' . readFromUserSession('Prefs_BoardColor2') . '", "#' . readFromUserSession('Prefs_BoardColor3') . '");

	game = new Game(board, xml, "' . $variantDir . '", true);
	board.render();
	game.board.createElementsForAllPieces();
}

function resize(newCellSize) {
	board.cellSize = newCellSize;
	$(".piece").remove();
	board.render();
	game.board.createElementsForAllPieces();
}
</script>';
}

?>