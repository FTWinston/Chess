<?
require_once('../php/core.php');
require_once('../php/game.php');
$db = db_connect();
redirectIfNotLoggedIn();

function loadGame($gameID)
{
	global $db;
	if ( !isset($gameID) )
	{
		header('location: /');
		die();
	}
	
	$query = "SELECT * FROM Games WHERE ID = :gameID";
		
	$query_params = array(
	':gameID' => $gameID
	);
	
	try
	{
		$stmt = $db->prepare($query);
		$result = $stmt->execute($query_params);
	}
	catch(PDOException $ex)
	{
		die("Error loading game" . db_error(__FILE__, __LINE__, $ex));
	}
	
	$gameInfo = $stmt->fetch();
	if(!$gameInfo)
	{
		header('location: /');
		die();
	}
	return $gameInfo;
}

$gameID = $_GET['id'];
$gameInfo = loadGame($gameID);


$variantInfo = getVariantDefinition($_GET['variant'], $_SESSION['user']['ID']);
if ( $variantInfo == null )
{
	header('location: /');
	die();
}

echo startPage('Game ' . $gameID . ': ' . $variantInfo[0]);
echo loadVariant($variantInfo[1]);

echo endPage();
?>