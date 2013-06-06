<?

function getVariantDefinition($variantSlug, $userID)
{
	global $db;
	$query = "SELECT Name FROM Variants WHERE Slug = :slug and (Public = 1 OR CreatedBy = :userID)";
	
	$query_params = array(
	':slug' => $variantSlug,
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
	
	return Array($row['Name'], '/variants/' . $variantSlug . '/definition.xml');
}

function loadVariant($definition)
{
	return '<link type="text/css" href="/css/game.css" rel="stylesheet" />
<link type="text/css" href="/css/board/light brown.css" rel="stylesheet" />
<link type="text/css" href="/css/pieces temp.css" rel="stylesheet" />
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
<script type="text/javascript" src="/js/interface.js"></script>

<script type="text/javascript">
$(function() {
     initiateGame("' . $definition . '", ' . readFromUserSession('Prefs_CellReferences') . ');
});
</script>

<div id="game"></div>

<div id="gameSidebar">
<span id="zoomOut">-</span> <span id="zoomIn">+</span> <span id="zoomAuto" style="display:none">Auto</span>
<ol id="log"></ol>
</div>';
}

?>