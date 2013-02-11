PieceType = new Class({
	initialize: function(name, symbol, value, appearance, capturedAs) {
		this.allMoves = [];
		this.name = name;
		this.symbol = symbol;
		this.value = value;
		this.appearanceCss = appearance;
		this.capturedAs = capturedAs == null ? name : capturedAs; // todo: consider: shouldn't this store the actual type, rather than its name?
		this.royalty = PieceType.RoyalState.None;
		this.promotionOpportunities = [];
		this.immobilizations = [];
	}
});

PieceType.RoyalState = {
	None: 0,
	Royal: 1,
	AntiRoyal: 2
}

PieceType.loadDefinitions = function(xml) {
	var definitions = {};

	$(xml).children().first().children('pieces').children().each(function() {
		var type = PieceType.parse(this);
		if ( definitions.hasOwnProperty(type.name) ) // check for dupes
			throw "Duplicate piece types detected: two piece types exist with the name '" + type.name + "'. This is not allowed.";
		definitions[type.name] = type;
	});
	
	for ( key in definitions )
	{
		var type = definitions[key];
		for ( var i=0; i<type.promotionOpportunities.length; i++ )
			type.promotionOpportunities[i].resolveOptions(definitions);
	}

	return definitions; // must be used when loading actual pieces (from board or databases). Not needed for promotions, cos they keep the correct types anyway
}

PieceType.parse = function(xmlNode)
{
	var value = $(xmlNode).attr("value");
	if ( value == undefined )
		value = 1;

	var name = $(xmlNode).children("name").text();
	
	var symbol = $(xmlNode).attr("symbol");
	if ( symbol == undefined )
		symbol = name.substr(0,1).toUpperCase();
	
	var appearanceNode = $(xmlNode).children("appearance");
	var appearance = 'piece ' + $(appearanceNode).text();	
	
	var strOrientation = $(appearanceNode).attr("orientation");
	if ( strOrientation != undefined )
		switch (strOrientation)
		{
		case "normal":
			break;
		case "inverted":
			appearance += " inverted"; break;
		case "mirrored":
			appearance += " mirrored"; break;
		case "left-45":
			appearance += " left45"; break;
		case "right-45":
			appearance += " right45"; break;
		case "left-90":
			appearance += " left90"; break;
		case "right-90":
			appearance += " right90"; break;
		case "left-135":
			appearance += " left135"; break;
		case "right-135":
			appearance += " right135"; break;
		case "180":
			appearance += " rotate180"; break;
		default:
			throw "Invalid piece orientation: " + strOrientation;
		}
	
	var capturedAs = $(xmlNode).children("captured_as");
	if ( capturedAs == undefined )
		capturedAs = name;
	else
		capturedAs = $(capturedAs).text();

	var type = new PieceType(name, symbol, value, appearance, capturedAs);
	
	var movesNode = $(xmlNode).children("moves");
	if ( movesNode != undefined )
		$(movesNode).children().each(function() {
			type.allMoves.push(MoveDefinition.loadFromXml(this, true));
		});
	
	var specialNode = $(xmlNode).children("special");
	if ( specialNode != undefined )
		$(specialNode).children().each(function() {
			if ( this.tagName == "royal" ) // consider: while these properties should remain on pieces IN CODE (for game logic's sake) - shouldn't royalty in the DEFINITION be handled via victory conditions? lose when any/all pieces of given type are checkmated/captured/are in check/aren't in check? loading code could then apply royal / antiroyal values
				type.royalty = PieceType.RoyalState.Royal;
			else if ( this.tagName == "anti_royal" )
				type.royalty = PieceType.RoyalState.AntiRoyal;
			else if ( this.tagName == "immobilize" )
				type.immobilizations.push(Immobilization.parse(this));
			else // consider: other special types: blocks (as per immobilize, but instead prevents pieces entering a square), kills (kills pieces in target squares without expending a move)
				throw "Unexpected node name in piece's \"special\" tag: " + this.tagName;
		});

	$(xmlNode).children("promotion").each(function() {
		type.promotionOpportunities.push(PromotionOpportunity.parse(this));
	});
	
	return type;
}


PromotionType = {
	StartOfMove: 0,
	EndOfMove: 1,
	StartOrEnd: 2,
	CountsAsMove: 3
}

PromotionOpportunity = new Class({
	initialize: function(unresolvedOptions, mandatory, type, conditions) {
		this.unresolvedOptions = unresolvedOptions;
		this.mandatory = mandatory;
		this.type = type;
		this.conditions = conditions;
		this.options = []; // list of actual types
	},
	
	resolveOptions: function(allTypes) {
		for ( var i=0; i<this.unresolvedOptions.length; i++ )
		{
			var type = allTypes[this.unresolvedOptions[i]];
			if ( type == undefined )
				throw "Unrecognized piece type as promotion option: " + this.unresolvedOptions[i];
			
			this.options.push(type);
		}
		this.unresolvedOptions = undefined;
	},
	
	isAvailable: function(move, game) {
		if ( this.conditions == null )
			return true;
		
		this.conditions.isSatisfied(move, game);
		return false;
	}
});

PromotionOpportunity.parse = function(xmlNode) {
	var conditionNode = $(xmlNode).children("conditions");
	var conditions = conditionNode == null ? null : Condition.loadConditions(conditionNode.children());
	
	var unresolvedOptions = [];	
	$(xmlNode).children("option").each(function() {
		unresolvedOptions.push($(this).text());
	});
	
	var mandatory = XmlHelper.readBool($(xmlNode).attr("mandatory"));
	var strType = $(xmlNode).attr("type");
	if ( strType == undefined )
		strType = "end_of_move";
	
	var type;
	switch ( strType )
	{
	case "start_of_move":
		type = PromotionType.StartOfMove; break;
	case "end_of_move":
		type = PromotionType.EndOfMove; break;
	case "start_or_end":
		type = PromotionType.StartOrEnd; break;
	case "counts_as_move":
		type = PromotionType.CountsAsMove; break;
	default:
		throw "Unexpected promotion type: " + strType;
	}
	
	return new PromotionOpportunity(unresolvedOptions, mandatory, type, conditions);
}


Immobilization = new Class({
	initialize: function(dirs, dist, dist2, offset, allowImmobilizedSuicide, conditions) {
		this.dirs = dirs;
		this.dist = dist;
		this.dist2 = dist2;
		this.offset = offset;
		this.allowImmobilizedSuicide = allowImmobilizedSuicide;
		this.conditions = Condition.loadConditions(conditions);
	}
});

Immobilization.parse = function(xmlNode) {
	var conditions = $(xmlNode).children("conditions");
	
	var dirs = MoveDefinition.ParseDirection($(xmlNode).attr("dir"));
	var dist = XmlHelper.readDistance(xmlNode, "dist");
	var dist2 = XmlHelper.readDistance(xmlNode, "dist2");
	var offset = XmlHelper.readDistance($(xmlNode).attr("offset"));
	var allowImmobilizedSuicide = XmlHelper.readBool($(xmlNode).attr("allow_immobilized_suicide"));
	
	return new Immobilization(dirs, dist, dist2, offset, allowImmobilizedSuicide, conditions.children());
}