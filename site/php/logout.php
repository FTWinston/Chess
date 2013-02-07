<?php
	require_once("core.php");
	db_connect();
	
	unset($_SESSION['user']);

	header("Location: /");
	die("Redirecting to main page...");
?>