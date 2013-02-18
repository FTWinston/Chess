<?
require_once('php/core.php');
$db = db_connect();

echo startPage('Chess thing');
?>
<link type="text/css" href="/css/homepage.css" rel="stylesheet" />

<div id="menubar">
<?

if ( notLoggedIn() )
	echo 'You will need to <a href="#" onclick="return showLogIn();">log in</a> or <a href="#"  onclick="return showRegister();">sign up</a> to play online.';
else
	echo 'Welcome, <a href="#">' . readFromUserSession("Name") . '</a>.
<a href="#" class="menu first">My games (3)</a><a href="#" class="menu">Manage account</a><a href="/php/logout.php" class="menu last">Logout</a>';
?>
</div>

<div id="body">
	<div id="main">
		<div class="bigTitle">What do you want to play?</div>
		
<?
	$query = "select ID, Name, Slug, Description from Variants where Public = 1 OR CreatedBy = :userID order by SortOrder, Name";

	$query_params = array(
		':userID' => $_SESSION['user']['ID']
	);
	
	try
	{
		$stmt = $db->prepare($query);
		$result = $stmt->execute($query_params);
	}
	catch(PDOException $ex)
	{
		die("Error listing variants" . db_error(__FILE__, __LINE__, $ex));
	}
	
	$disableOnline = notLoggedIn();
	$row = $stmt->fetch();
	while ($row)
	{
		echo '<div class="panel" variant="' . $row['Slug'] . '"><div class="heading">' . $row['Name'] . '</div><div class="panelBody">' . $row['Description'] . '<div class="playButtons"><span class="playButton enabled" playType="0">Play locally</span><span class="playButton enabled" playType="1">Play vs computer</span><span class="playButton';
		if ( $disableOnline )
			echo ' disabled">Log in to play online';
		else
			echo ' enabled" playType="2">Play online';
		echo '</span></div></div></div>';
		$row = $stmt->fetch();
	}
?>
	</div>
	<div id="sidebar">
		<div class="panel"><div class="heading">News</div>
			<div class="panelBody">
				<p>This site is a work in progress.</p>
				<p>It will eventually allow you to create and share your own chess variants, and play them online with others.</p>
				<p>That's not going to happen until I finish the chess engine, however.</p>
			</div>
		</div>
		
		<div class="panel"><div class="heading">Online players</div>
			<div class="panelBody">
				...<br/>...<br/>
				...<br/>...<br/>
				...<br/>...<br/>
				...<br/>...<br/>
				...<br/>
				...<br/>
			</div>
		</div>
	</div>
</div>

<script type="text/javascript">
$(function() {
	$('.playButton.enabled').button().click(function(event) {
		var variant = $(this).parent().parent().parent().attr('variant');
	
		var type = $(this).attr('playType');
		if ( type == '0' ) // local
		{
			window.location = '/localgame?variant=' + variant;
		}
		else if ( type == '1' )
		{
			// show difficulty selection popup?
			
			window.location = '/localgame?variant=' + variant + '&ai=1';
		}
		else if ( type == '2' )
		{
			window.location = '/php/newgame.php?variant=' + variant;
		}
	});
	$('.playButton.disabled').button({ disabled: true });
});

<? if ( notLoggedIn() )
{
	echo "
$(function() {
	$('#loginPopup').dialog({
		autoOpen: false,
		height: 275,
		width: 375,
		modal: true,
		buttons:
		[
			{
				text: 'OK',
				click: function() {
					//allFields.removeClass( 'ui-state-error' );

					if ( $('#username').val() == '' || $('#password').val() == '' )
						return;
					
					$('#loginForm').submit()
				},
			},
			{
				text: 'Cancel',
				click: function() {
					$( this ).dialog( 'close' );
				}
			}
		]
	});
";
$username = $_GET['loginfailed'];
if ( isset($username) && $username != null )
{
	echo "
	$('#username').val('" . $username . "');
	$('#loginForm').prepend('<div class=\"error\">Invalid username / password</div>');
	showLogIn();";
}
$error = $_GET['registerfailed'];
if ( isset($error) && $error != null )
{
	echo "
	$('#loginForm').prepend('<div class=\"error\">" . $error . "</div>');
	showRegister();";
}
echo "
});

function showLogIn()
{
	toggleRegister(false);
	$('#loginPopup').dialog('open');
	return false;
}

function showRegister()
{
	toggleRegister(true);
	$('#loginPopup').dialog('open');
	return false;
}

function toggleRegister(show)
{
	if ( show )
	{
		$('#loginPopup').dialog('option', 'title', 'Register a new account');
		$('#loginForm').attr('action', '/php/register.php');
		$('.loginOnly').hide();
		$('.registerOnly').show();
	}
	else
	{
		$('#loginPopup').dialog('option', 'title', 'Log in to your account');
		$('#loginForm').attr('action', '/php/login.php');
		$('.registerOnly').hide();
		$('.loginOnly').show();
	}
	return false;
}";
}
?>
</script>

<? if ( notLoggedIn() )
{
	echo '
<div id="loginPopup">
	
	<form id="loginForm" method="post">';
	
	echo '<div class="field">
		<label for="username">Username:</label>
		<input class="fieldValue text ui-widget-content ui-corner-all" type="text" name="username" id="username" />
	</div>
	<div class="field">
		<label for="password">Password:</label>
		<input class="fieldValue text ui-widget-content ui-corner-all" type="password" name="password" id="password" value="" />
	</div>
	<div class="field registerOnly">
		<label for="password2">Confirm Password:</label>
		<input class="fieldValue text ui-widget-content ui-corner-all" type="password" name="password2" id="password2" value="" />
	</div>
	
	<div class="field bottom loginOnly">
		If you don\'t have an account, you can <a href="#" onclick="return toggleRegister(true);">register</a> one easily.
	</div>
	<div class="field bottom registerOnly">
		If you already have an account, you should <a href="#" onclick="return toggleRegister(false);">log in</a> to that.
	</div>
</form>
</div>';
}
?>

<? echo endPage(); ?>