XmlHelper = new Class();

XmlHelper.readBool = function(val) {
	if ( val == 'false' )
		return false;
	return true;
}


XmlHelper.textOrDefault = function(node, defaultValue) {
	var val = $(node).text();
	if ( val == undefined )
		return defaultValue;
	return val;
}

XmlHelper.attributeOrDefault = function(node, attrName, defaultValue)
{
	var val = $(node).attr(attrName);
	if ( val == undefined )
		return defaultValue;
	return val;
}

XmlHelper.readDistance = function(node, attrName) {
	if ( node == null )
		return null;
	
	var val = $(node).attr(attrName);
	if ( val == undefined )
		return null;
	
	if ( val == "any" )
		return Distance.Any;
	else if ( val.substr(0,3) == "max" ) // starts with
		return new Distance(Distance.RelativeTo.Max, parseInt(val.substr(3)));
	else if ( val.substr(0,4) == "prev" ) // starts with
		return new Distance(Distance.RelativeTo.Prev, parseInt(val.substr(4)));
	else
		return new Distance(Distance.RelativeTo.None, parseInt(val));
}

XmlHelper.readWhen = function(node, attrName) {
	if ( node == null )
		return MoveDefinition.When.Any;

	var val = $(node).attr(attrName);
	if ( val == undefined )
		return MoveDefinition.When.Any;

	if ( val == "capture" )
		return MoveDefinition.When.Capture;
	else if ( val == "move" )
		return MoveDefinition.When.Move;
	else if ( val == "any" )
		return MoveDefinition.When.Any;
	else
		throw "Unexpected when value: " + val;
}

XmlHelper.readPartOfTurn = function(node, attrName) {
	if ( node == null )
		return MoveDefinition.PartOfTurn.Either;

	var val = $(node).attr(attrName);
	if ( val == undefined )
		return MoveDefinition.PartOfTurn.Either;

	if ( val == "either" )
		return MoveDefinition.PartOfTurn.Either;
	else if ( val == "before_moving" )
		return MoveDefinition.PartOfTurn.Before;
	else if ( val == "after_moving" )
		return MoveDefinition.PartOfTurn.After;
	else
		throw "Unexpected part-of-turn value: " + val;
}

XmlHelper.readPartOfMove = function(node, attrName) {
	if ( node == null )
		return MoveDefinition.PartOfMove.WholeRoute;

	var val = $(node).attr(attrName);
	if ( val == undefined )
		return MoveDefinition.PartOfMove.WholeRoute;

	if ( val == "whole route" )
		return MoveDefinition.PartOfMove.WholeRoute;
	else if ( val == "start" )
		return MoveDefinition.PartOfMove.Start;
	else if ( val == "destination" )
		return MoveDefinition.PartOfMove.Destination;
	else
		throw "Unexpected part-of-move value: " + val;
}