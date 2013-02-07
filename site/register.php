<?
require_once('php/core.php'); 
$db = db_connect();

// This if statement checks to determine whether the registration form has been submitted
// If it has, then the registration code is run, otherwise the form is displayed
if(!empty($_POST))
{
        // Ensure that the user has entered a non-empty username
        if(empty($_POST['username']))
        	$error = "Please enter a user name.";
	else if(empty($_POST['password']))
		$error = "Please enter a password.";
        else if ( $_POST['password'] != $_POST['password2'] )
		$error = "Passwords don't match";
	else
	{// check if this username is already in use
		$query = "SELECT ID FROM Users WHERE Name = :username";
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
			die("Error checking if username is taken" . db_error(__FILE__, __LINE__, $ex));
		}
		
		if($stmt->fetch()) // a record with this name already exists
			$error = "This username is already in use";
	}
	
	if ( !isset($error) )
	{
		$salt = dechex(mt_rand(0, 2147483647)) . dechex(mt_rand(0, 2147483647));
		$passwordHash = hash('sha256', $_POST['password'] . $salt);
	
		$query = "INSERT INTO Users (Name, Password, Salt, LastOnline) VALUES (:username, :password, :salt, :lastOnline)";
		$query_params = array(
		':username' => $_POST['username'],
		':password' => $passwordHash,
		':salt' => $salt,
		':lastOnline' => time()
		);
		
		try
		{
			$stmt = $db->prepare($query);
			$result = $stmt->execute($query_params);
		}
		catch(PDOException $ex)
		{
			die("Error adding new user" . db_error(__FILE__, __LINE__, $ex));
		}

		// redirect the user back to the login page after they register
		header("Location: login.php");
		die("Redirecting to login page...");
	}
} 
echo startPage("Account registration");
?>
<link type="text/css" href="/css/login.css" rel="stylesheet" />

<script type="text/javascript">
$(function() {
 $('#submit').button();
});
</script>

<div id="body">

<div id="welcome" class="panel"><div class="heading">Welcome to chess.ftwinston.com!</div>
<div class="panelBody">
Some blurb text here about how great this site is to encourage you to log in / register.
</div></div>

<div id="news" class="panel"><div class="heading">News</div>
<div class="panelBody">
<p>Blah blah blah blah blah</p>
<p>Blah blah blah blah blah</p>
<p>Blah blah blah blah blah</p>
</div></div>

<form action="register.php" method="post" class="panel login">
    <div class="heading">Register</div>
    <div class="panelBody">
<?
    if ( isset($error) )
	echo '<div class="error">' . $error . '</div>';
?>

	<div class="field">
		<label for="username">Username:</label>
		<input class="fieldValue text ui-widget-content ui-corner-all" type="text" name="username" id="username" value="" />
	</div>
	<div class="field">
		<label for="password">Password:</label>
		<input class="fieldValue text ui-widget-content ui-corner-all" type="password" name="password" id="password" value="" />
	</div>
	<div class="field">
		<label for="password2">Confirm password:</label>
		<input class="fieldValue text ui-widget-content ui-corner-all" type="password" name="password2" id="password2" value="" />
	</div>
	<div class="field bottom">
		<input type="submit" value="Register" id="submit" />
	</div>
    </div>
</form>
<? echo endPage(); ?>