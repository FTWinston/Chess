<?php
function clean($str) // sanitize form values, prevent SQL injection
{
	$str = @trim($str);
	if(get_magic_quotes_gpc()) {
		$str = stripslashes($str);
	}
	return mysql_real_escape_string($str);
}

function db_connect()
{
	include 'db.php';
	$options = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8'); 
	
	try
	{
		$db = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8", $username, $password, $options); 
	} 
	catch(PDOException $ex) 
	{
		die("Failed to connect to the database" . db_error(__FILE__, __LINE__, $ex));
	}
    
	$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // throw exceptions on error
	$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);  // results as associative array

	header('Content-Type: text/html; charset=utf-8'); 
	session_start();
	
	return $db;
}

function db_error($file, $line, $exception)
{
	$displayErrors = true;
	
	if ( $displayErrors )
		return $exception->getMessage() . " at line " . $line . " of " . $file;
	else
		return "";
}

function notLoggedIn()
{
	return empty($_SESSION['user']);
}

function redirectIfNotLoggedIn()
{
	if( notLoggedIn() )
	{
		header("Location: /login.php");
		die("Redirecting to login page...");
	}
}

function readFromUserSession($varName)
{
	if ( isset($_SESSION['user']) )
		return htmlentities($_SESSION['user'][$varName], ENT_QUOTES, 'UTF-8');
	
	switch ( $varName )
	{
	case "Prefs_CellReferences":
		return 2;
	case "Prefs_BoardColor1";
		return "f0d9b5";
	case "Prefs_BoardColor2";
		return "b58863";
	case "Prefs_BoardColor3";
		return "cccccc";
	default:
		die("Unexpected variable requested for not-logged-in user: " . $varName);
	}
}

function startPage($title)
{
	return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" >
<head>
<link type="text/css" href="/css/smoothness/jquery-ui-1.10.0.custom.min.css" rel="stylesheet" />
<link type="text/css" href="/css/common.css" rel="stylesheet" />

<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js"></script>
<script type="text/javascript" src="/js/jquery-ui-1.10.0.custom.min.js"></script>
<title>' . $title . '</title>
</head>
<body>
';
}

function endPage()
{
	return '</body>
</html>';
}

?>