<?
require_once('core.php'); 
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

		// redirect the user back to the main page
		// THIS SHOULD LOG THEM IN AUTOMATICALLY!
		header("Location: /");
		die("Redirecting...");
	}
	else
		header("Location: /?registerfailed=" . urlencode($error));
} 
?>