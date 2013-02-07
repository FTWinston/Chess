<?
require_once('core.php'); 
$db = db_connect();

if ( !notLoggedIn() )
{
	header("Location: /");
	die("Already logged in, redirecting...");
}

$submitted_username = '';
if(empty($_POST)) 
	return;

$query = "SELECT * FROM Users WHERE Name = :username";

$query_params = array(
':username' => $_POST['username']
);

try
{
	$stmt = $db->prepare($query);
	$result = $stmt->execute($query_params);
}
catch(PDOException $ex)
{
	die("Error loading user record" . db_error(__FILE__, __LINE__, $ex));
}

$login_ok = false;

$row = $stmt->fetch();
if($row)
{
	$passwordHash = hash('sha256', $_POST['password'] . $row['Salt']);
	if($passwordHash === $row['Password'])
	{
		$login_ok = true;
	}
}

if($login_ok)
{
	unset($row['salt']);
	unset($row['password']);
	
	$_SESSION['user'] = $row;

	header("Location: /");
	die("Login successful, redirecting...");
}
else
	header("Location: /?loginfailed=" . urlencode($_POST['username']) );
?>