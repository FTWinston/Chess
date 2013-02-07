<?
require_once('../php/core.php');
require_once('../php/game.php');
$db = db_connect();
//redirectIfNotLoggedIn();

$variantInfo = getVariantDefinition($_GET['variant'], $_SESSION['user']['ID']);
if ( $variantInfo == null )
{
	header('location: /');
	die();
}

echo startPage('Local Game: ' . $variantInfo[0]);
echo loadVariant($variantInfo[1], $variantInfo[2]);

echo endPage();
?>