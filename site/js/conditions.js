// todo: write all this
Condition = new Class({
	initialize: function() {
		
    },
	
	isSatisfied: function(move, game) { return true; }
});

Condition.ComparisonType = {
	Equals: 0,
	LessThan: 1,
	GreaterThan : 2
}

Condition.ComparisonVariable = {
	Rank: 0,
	Column: 1,
	DestinationRank: 2,
	DestinationColumn: 3,
	PieceMoveNumber: 4,
	TargetMoveNumber: 5,
	GameTurn: 6
}

Condition.resolveComparison = function(type, val1, val2) {
	switch (type)
	{
	case Condition.ComparisonType.LessThan:
		return val1 < val2;
	case Condition.ComparisonType.GreaterThan:
		return val1 > val2;
	case Condition.ComparisonType.Equals:
	default:
		return val1 == val2;
	}
}

Condition.loadConditions = function(conds, groupType) {
	if ( groupType == undefined )
		groupType = ConditionsGroup.Type.And;
	
	var group = new ConditionsGroup(groupType);
	if ( conds != null )
		Condition.loadConditionsForGroup(group, conds);
	return group;
}

Condition.loadConditionsForGroup = function(group, conds) {	
	$(conds).children().each(function(index, child) {
		switch (child.Name)
		{
		// firstly the groups, recursively
		case "and":
			group.elements.push(loadConditions(child.children(), ConditionGroup.Type.And));
			break;
		case "or":
			group.elements.push(loadConditions(child.children(), ConditionGroup.Type.Or));
			break;
			
		case "nand":
			group.elements.push(loadConditions(child.children(), ConditionGroup.Type.Nand));
			break;
		case "not":
		case "nor":
			group.elements.push(loadConditions(child.children(), ConditionGroup.Type.Nor));
			break;
		case "xor":
			group.elements.push(loadConditions(child.children(), ConditionGroup.Type.Xor));
			break;

		// and all the condition elements
		case "compare":
			var vari = Condition.readComparisonVariable(child.attr("var"));
			var type = Condition.readComparisonType(child.attr("comparison"));
			var value = new ComparisonValue(child.text());
			/*
			group.elements.push(new Condition_Compare(var, type, value));*/
			break;
/*
		case "type":
			{
				string of = child.Attributes["of"].InnerText;
				group.elements.push(new Condition_Type(of, child.InnerText));
				break;
			}
		case "owner":
			{
				string of = child.Attributes["of"].InnerText;
				group.elements.push(new Condition_Owner(of, child.ReadOwner()));
				break;
			}
		case "threatened":
			MoveDefinition.PartOfMove where = child.ReadPartOfMove("where");
			group.elements.push(new Condition_Threatened(where, child.ReadBool()));
			break;
		case "num_pieces_in_range":
			{
				string type = child.Attributes["type"].InnerText;
				MoveDefinition.Owner owner = child.ReadOwner("owner");
				ComparisonValue rankMin = new ComparisonValue(child.attr("rank_min"));
				ComparisonValue rankMax = new ComparisonValue(child.attr("rank_max"));
				ComparisonValue colMin = new ComparisonValue(child.attr("col_min"));
				ComparisonValue colMax = new ComparisonValue(child.attr("col_max"));
				ComparisonType comparison = child.ReadComparisonType("comparison");
				ComparisonValue value = new ComparisonValue(child.text());

				group.elements.push(new Condition_NumPiecesInRange(type, owner, rankMin, rankMax, colMin, colMax, comparison, value));
				break;
			}
		case "move_causes_check":
			group.elements.push(new Condition_MoveCausesCheck(child.ReadBool()));
			break;
		case "move_causes_checkmate":
			group.elements.push(new Condition_MoveCausesCheckmate(child.ReadBool()));
			break;
		case "checkmate":
			{
				string num = child.AttributeOrDefault("num", "any");
				string type = child.AttributeOrDefault("type", "any");
				MoveDefinition.Owner owner = child.ReadOwner("owner");
				group.elements.push(new Condition_Checkmate(num, type, owner));
				break;
			}
		case "pieces_threatened":
			{
				string num = child.AttributeOrDefault("num", "any");
				string type = child.AttributeOrDefault("type", "any");
				MoveDefinition.Owner owner = child.ReadOwner("owner");
				group.elements.push(new Condition_PiecesThreatened(num, type, owner));
				break;
			}
		case "repeated_check":
			{
				int duration = child.AttributeOrDefaultInt("duration", 1);
				string type = child.AttributeOrDefault("type", "any");
				MoveDefinition.Owner owner = child.ReadOwner("owner");
				group.elements.push(new Condition_RepeatedCheck(duration, type, owner));
				break;
			}
		case "no_moves_possible":
			{
				string type = child.AttributeOrDefault("type", "any");
				MoveDefinition.Owner player = child.ReadOwner("player");
				group.elements.push(new Condition_NoMovesPossible(type, player));
				break;
			}
		case "repetition_of_position":
			{
				int occurances = child.AttributeOrDefaultInt("occurances", 1);
				group.elements.push(new Condition_RepetitionOfPosition(occurances));
				break;
			}
		case "turns_since_last_capture":
			{
				string type = child.AttributeOrDefault("type", "any");
				MoveDefinition.Owner owner = child.ReadOwner("owner");
				Condition.ComparisonType comparison = child.ReadComparisonType("comparison");
				ComparisonValue value = new ComparisonValue(child.text());
				group.elements.push(new Condition_TurnsSinceLastCapture(type, owner, comparison, value));
				break;
			}
		case "turns_since_last_move":
			{
				string type = child.AttributeOrDefault("type", "any");
				MoveDefinition.Owner owner = child.ReadOwner("owner");
				Condition.ComparisonType comparison = child.ReadComparisonType("comparison");
				ComparisonValue value = new ComparisonValue(child.text());
				group.elements.push(new Condition_TurnsSinceLastMove(type, owner, comparison, value));
				break;
			}
*/			
		default:
			throw "Unexpected condition node name: " + child.Name;
		}
	});
}

Condition.readComparisonVariable = function(val) {

	if (val == undefined)
		return Condition.ComparisonVariable.Rank;
	switch (val)
	{
		case "rank":
			return Condition.ComparisonVariable.Rank;
		case "column":
			return Condition.ComparisonVariable.Column;
		case "destination rank":
			return Condition.ComparisonVariable.DestinationRank;
		case "destination column":
			return Condition.ComparisonVariable.DestinationColumn;
		case "piece move number":
			return Condition.ComparisonVariable.PieceMoveNumber;
		case "target move number":
			return Condition.ComparisonVariable.TargetMoveNumber;
		case "game turn":
			return Condition.ComparisonVariable.GameTurn;
		default:
			throw "Unexpected comparison var: " + val;
	}
}

Condition.readComparisonType = function(val) {

	if (val == undefined)
		return Condition.ComparisonType.Equals;
	
	switch (val)
	{
		case "equals":
			return Condition.ComparisonType.Equals;
		case "less than":
			return Condition.ComparisonType.LessThan;
		case "greater than":
			return Condition.ComparisonType.GreaterThan;
		default:
			throw "Unexpected comparison type: " + val;
	}
}







ConditionsGroup = new Class({
	initialize: function() {
		this.elements = [];
	}
});

ConditionsGroup.Type = {
	And: 0,
	Or: 1,
	Nand: 2,
	Nor: 3,
	Xor: 4
}







ComparisonValue = new Class({
	initialize: function(expr) {
		this.components = [];
		this.joins = [];
		
		var pos; var sepPos = -1; var plus; var minus; var partNum = 0;
		
		do
		{
			pos = sepPos + 1;
			plus = expr.indexOf('+', pos);
			minus = expr.indexOf('-', pos);
			
			if ( plus == -1 )
				sepPos = minus;
			else if ( minus == -1 )
				sepPos = plus;
			else
				sepPos = Math.min(plus, minus);
			
			if ( sepPos == -1 )
				this.components.push(ComparisonValue.Component.parse(expr.substr(pos)));
			else {
				this.components.push(ComparisonValue.Component.parse(expr.substr(pos, sepPos - pos)));
				switch(expr[sepPos]) {
				case '+':
					this.joins.push(ComparisonValue.JoinType.Add); break;
				case '-':
				default:
					this.joins.push(ComparisonValue.JoinType.Subtract); break;
				}
			}
			
			partNum ++;
		} while ( sepPos != -1 );
	},
	
	resolve: function(move, game) {
		var iVal = 0;
		for (var i = 0; i < this.components.length; i++)
		{
			var compVal = this.components[i].resolve(move, game);
			if (i == 0)
				iVal = compVal;
			else if (this.joins[i - 1] == ComparisonValue.JoinType.Add)
				iVal += compVal;
			else
				iVal -= compVal;
		}
		return iVal;
	}
	
/*
	private static char[] plusMinus = new char[] { '+', '-' };
*/
});

ComparisonValue.JoinType = {
	Add: 0,
	Subtract: 1
}

ComparisonValue.Component = new Class({
	initialize: function(type, numericValue) {
		this.componentType = type;
		if (type == ComparisonValue.Component.Type.Numeric && numericValue == undefined)
			this.numericValue = 0;
		else
			this.numericValue = numericValue;
	},
	
	resolve: function(move, game) {
		switch (this.componentType)
		{
		case ComparisonValue.Component.Type.Numeric:
			return this.numericValue;
		case ComparisonValue.Component.Type.Rank:
			return move.player.getRank(game.board, move.piece.position);
		case ComparisonValue.Component.Type.Column:
			return move.player.getColumn(game.board, move.piece.position);
		case ComparisonValue.Component.Type.MinRank:
			return move.player.getMinRank(game.board);
		case ComparisonValue.Component.Type.MinColumn:
			return move.player.getMinColumn(game.board);
		case ComparisonValue.Component.Type.MaxRank:
			return move.player.getMaxRank(game.board);
		case ComparisonValue.Component.Type.MaxColumn:
			return move.player.getMaxColumn(game.board);
		case ComparisonValue.Component.Type.DestinationRank:
			return move.endPos().y;
		case ComparisonValue.Component.Type.DestinationColumn:
			return move.endPos().x;
		case ComparisonValue.Component.Type.TurnOfTargetFirstMove:
			var target = move.getPieceByRef("target");
			return target != null && target.firstMoveTurn != undefined ? target.firstMoveTurn : -1;
		default:
			throw "Unexpected comparison value component type: " + this.componentType;
		}
	}
});

ComparisonValue.Component.Type = {
	Numeric: 0,
	Rank: 1,
	Column: 2,
	MinRank: 3,
	MinColumn: 4,
	MaxRank: 5,
	MaxColumn: 6,
	DestinationRank: 7,
	DestinationColumn: 8,
	TurnOfTargetFirstMove: 9
}

ComparisonValue.Component.parse = function(str) {
// str must be one of the following:
//min_rank|max_rank|min_column|max_column|turn_of_target_first_move|destination_rank|destination_column|rank|column|[0-9]+
	var ival = +str; // this converts to int, without ignoring trailing strings. "25" -> 25, but "25 fish" -> NaN is what's wanted here
	if (ival != NaN)
		return new ComparisonValue.Component(ComparisonValue.Component.Type.Numeric, ival);
	
	switch (str)
	{	
		case "rank":
			return new Component(ComparisonValue.Component.Type.Rank, null);
		case "column":
			return new Component(ComparisonValue.Component.Type.Column, null);
		case "min_rank":
			return new Component(ComparisonValue.Component.Type.MinRank, null);
		case "min_column":
			return new Component(ComparisonValue.Component.Type.MinColumn, null);
		case "max_rank":
			return new Component(ComparisonValue.Component.Type.MaxRank, null);
		case "max_column":
			return new Component(ComparisonValue.Component.Type.MaxColumn, null);
		case "destination_rank":
			return new Component(ComparisonValue.Component.Type.DestinationRank, null);
		case "destination_column":
			return new Component(ComparisonValue.Component.Type.DestinationColumn, null);
		case "turn_of_target_first_move":
			return new Component(ComparisonValue.Component.Type.TurnOfTargetFirstMove, null);
		default:
			throw "Unexpected comparison value component: " + str;
	}
}