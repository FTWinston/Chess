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
		groupType = ConditionGroup.Type.And;
	
	var group = new ConditionGroup(groupType);
	if ( conds != null )
		Condition.loadConditionsForGroup(group, conds);
	return group;
}

Condition.loadConditionsForGroup = function(group, conds) {	
	$(conds).each(function(index, child) {
		var name = child.nodeName.toLowerCase();
		child = $(child);
		switch (name)
		{
		// firstly the groups, recursively
		case "and":
			group.elements.push(Condition.loadConditions(child.children(), ConditionGroup.Type.And));
			break;
		case "or":
			group.elements.push(Condition.loadConditions(child.children(), ConditionGroup.Type.Or));
			break;
		case "nand":
			group.elements.push(Condition.loadConditions(child.children(), ConditionGroup.Type.Nand));
			break;
		case "not":
		case "nor":
			group.elements.push(Condition.loadConditions(child.children(), ConditionGroup.Type.Nor));
			break;
		case "xor":
			group.elements.push(Condition.loadConditions(child.children(), ConditionGroup.Type.Xor));
			break;

		// and all the condition elements
		case "compare":
			var vari = Condition.readComparisonVariable(child.attr("var"));
			var type = Condition.readComparisonType(child.attr("comparison"));
			var value = new ComparisonValue(child.text());
			group.elements.push(new Condition.Compare(vari, type, value));
			break;

		case "type":
			{
				var of = child.attr("of")
				var type = child.text();
				group.elements.push(new Condition.Type(of, type));
				break;
			}
		case "owner":
			{
				var of = child.attr("of");
				var owner = XmlHelper.readOwner(child.text());
				group.elements.push(new Condition.Owner(of, owner));
				break;
			}
		case "threatened":
			var where = XmlHelper.readPartOfMove(child.attr("where"));
			var threatened = XmlHelper.readBool(child.text());
			group.elements.push(new Condition.Threatened(where, threatened));
			break;
		case "num_pieces_in_range":
			{
				var type = child.attr("type");
				var owner = XmlHelper.readOwner(child.attr("owner"));
				var rankMin = new ComparisonValue(child.attr("rank_min"));
				var rankMax = new ComparisonValue(child.attr("rank_max"));
				var colMin = new ComparisonValue(child.attr("col_min"));
				var colMax = new ComparisonValue(child.attr("col_max"));
				var comparison = Condition.readComparisonType(child.attr("comparison"));
				var value = new ComparisonValue(child.text());

				group.elements.push(new Condition.NumPiecesInRange(type, owner, rankMin, rankMax, colMin, colMax, comparison, value));
				break;
			}
		case "move_causes_check":
			var check = XmlHelper.readBool(child.text());
			group.elements.push(new Condition.MoveCausesCheck(check));
			break;
		case "move_causes_checkmate":
			var mate = XmlHelper.readBool(child.text());
			group.elements.push(new Condition.MoveCausesCheckmate(mate));
			break;
		case "checkmate":
			{
				var num = child.attr("num"); if ( num == undefined ) num = "any";
				var type = child.attr("type"); if ( type == undefined ) type = "any";
				var owner = XmlHelper.readOwner(child.attr("owner"));
				group.elements.push(new Condition.Checkmate(num, type, owner));
				break;
			}
		case "pieces_threatened":
			{
				var num = child.attr("num"); if ( num == undefined ) num = "any";
				var type = child.attr("type"); if ( type == undefined ) type = "any";
				var owner = XmlHelper.readOwner(child.attr("owner"));
				group.elements.push(new Condition.PiecesThreatened(num, type, owner));
				break;
			}
		case "repeated_check":
			{
				var dur = child.attr("duration"); if ( dur == undefined ) dur = 1;
				var type = child.attr("type"); if ( type == undefined ) type = "any";
				var owner = XmlHelper.readOwner(child.attr("owner"));
				group.elements.push(new Condition.RepeatedCheck(duration, type, owner));
				break;
			}
		case "no_moves_possible":
			{
				var type = child.attr("type"); if ( type == undefined ) type = "any";
				var player = XmlHelper.readOwner(child.attr("player"));
				group.elements.push(new Condition.NoMovesPossible(type, player));
				break;
			}
		case "repetition_of_position":
			{
				var occurances = child.attr("occurances"); if ( occurances == undefined ) occurances = 1;
				group.elements.push(new Condition.RepetitionOfPosition(occurances));
				break;
			}
		case "turns_since_last_capture":
			{
				var type = child.attr("type"); if ( type == undefined ) type = "any";
				var owner = XmlHelper.readOwner(child.attr("owner"));
				var type = Condition.readComparisonType(child.attr("comparison"));
				var value = new ComparisonValue(child.text());
				group.elements.push(new Condition.TurnsSinceLastCapture(type, owner, comparison, value));
				break;
			}
		case "turns_since_last_move":
			{
				var type = child.attr("type"); if ( type == undefined ) type = "any";
				var owner = XmlHelper.readOwner(child.attr("owner"));
				var type = Condition.readComparisonType(child.attr("comparison"));
				var value = new ComparisonValue(child.text());
				group.elements.push(new Condition.TurnsSinceLastMove(type, owner, comparison, value));
				break;
			}
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
	if (!isNaN(ival))
		return new ComparisonValue.Component(ComparisonValue.Component.Type.Numeric, ival);

	switch (str)
	{	
		case "rank":
			return new ComparisonValue.Component(ComparisonValue.Component.Type.Rank, null);
		case "column":
			return new ComparisonValue.Component(ComparisonValue.Component.Type.Column, null);
		case "min_rank":
			return new ComparisonValue.Component(ComparisonValue.Component.Type.MinRank, null);
		case "min_column":
			return new ComparisonValue.Component(ComparisonValue.Component.Type.MinColumn, null);
		case "max_rank":
			return new ComparisonValue.Component(ComparisonValue.Component.Type.MaxRank, null);
		case "max_column":
			return new ComparisonValue.Component(ComparisonValue.Component.Type.MaxColumn, null);
		case "destination_rank":
			return new ComparisonValue.Component(ComparisonValue.Component.Type.DestinationRank, null);
		case "destination_column":
			return new ComparisonValue.Component(ComparisonValue.Component.Type.DestinationColumn, null);
		case "turn_of_target_first_move":
			return new ComparisonValue.Component(ComparisonValue.Component.Type.TurnOfTargetFirstMove, null);
		default:
			throw "Unexpected comparison value component: " + str;
	}
}

Condition.Compare = new Class({
	Extends: Condition,
	
	initialize: function(vari, type, val) {
		this.vari = vari;
		this.type = type;
		this.val = val;
	},
	
	isSatisfied: function(move, game) {
		var val = this.val.resolve(move, game);
		
		var vari;
		switch ( this.vari ) {
		case Condition.ComparisonVariable.Rank:
			vari = move.player.getRank(game.board, move.piece.position); break;
		case Condition.ComparisonVariable.Column:
			vari = move.player.getColumn(game.board, move.piece.position); break;
		case Condition.ComparisonVariable.DestinationRank:
			vari = move.player.getRank(game.board, move.endPos()); break;
		case Condition.ComparisonVariable.DestinationColumn:
			vari = move.player.getColumn(game.board, move.endPos()); break;
		case Condition.ComparisonVariable.GameTurn:
			vari = game.turnNumber; break;
		case Condition.ComparisonVariable.PieceMoveNumber:
			vari = move.piece.moveNumber; break;
		case Condition.ComparisonVariable.TargetMoveNumber:
			var target = move.getPieceByRef("target");
			vari = target != null ? target.moveNumber : 0; break;
		default:
			return false;
		}
		
		return Condition.resolveComparison(this.type, vari, val);
	}
});

Condition.Owner = new Class({
	Extends: Condition,
	
	initialize: function(of, val) {
		this.of = of;
		this.val = val;
	},
	
	isSatisfied: function(move, game) {
		if ( this.val == MoveDefinition.Owner.Any )
			return true;
		
		var other = move.getPieceByRef(this.of);
		if ( other == null )
		{
			throw "Piece reference not found: " + this.of;
			//return false;
		}
		
		switch ( this.val ) {
		case MoveDefinition.Owner.Self:
			return other.ownerPlayer == move.piece.ownerPlayer;
		case MoveDefinition.Owner.Enemy:
			return !other.ownerPlayer.isAllyOf(m.piece.ownerPlayer);
		case MoveDefinition.Owner.Ally:
			return other.ownerPlayer.isAllyOf(m.piece.ownerPlayer);
		default:
			throw "Unexpected piece owner type in Condition.Owner.IsSatisfied: " + this.val;
		}
	}
});

Condition.Type = new Class({
	Extends: Condition,
	
	initialize: function(of, val) {
		this.of = of;
		this.val = val;
	},
	
	isSatisfied: function(move, game) {
		var other = move.getPieceByRef(this.of);
		if (other == null)
		{
			throw "Piece reference not found: " + this.of;
			//return false;
		}
		return other.pieceType.name == this.val;
	}
});

Condition.NumPiecesInRange = new Class({
	Extends: Condition,
	
	initialize: function(type, owner, rankMin, rankMax, colMin, colMax, comparison, value) {
		this.type = type;
		this.owner = owner;
		this.rankMin = rankMin;
		this.rankMax = rankMax;
		this.colMin = colMin;
		this.colMax = colMax;
		this.comparison = comparison;
		this.value = value;
	},
	
	isSatisfied: function(move, game) {
		var num = 0;
		var colMin = this.colMin.resolve(move, game);
		var colMax = this.colMax.resolve(move, game);
		var rankMin = this.rankMin.resolve(move, game);
		var rankMax = this.rankMax.resolve(move, game);
		
		if ( colMin > colMax )
		{
			var tmp = colMax;
			colMax = colMin;
			colMin = tmp;
		}
		if ( rankMin > rankMax )
		{
			var tmp = rankMax;
			rankMax = rankMin;
			rankMin = tmp;
		}
		
		for ( var col = colMin; col<= colMax; col++ )
			for ( var rank = rankMin; rank <= rankMax; rank++)
			{
				var c = move.player.getCoord(game.board, rank, col);
				if ( !game.board.isValidCell(c) )
					continue; // not a board cell
				
				var p = game.pieces.getOnBoard(c);
				if ( p == null )
					continue; // no piece here
				
				if ( !p.typeMatches(this.type) )
					continue; // piece is wrong type
				if ( this.owner != MoveDefinition.Owner.Any && move.piece.getOwnerFromPlayer(p.ownerPlayer) != this.owner)
					continue; // owner doesn't match
				
				num++;
			}

		return Condition.resolveComparison(this.comparison, num, this.val.resolve(move, game));
	}
});

Condition.Threatened = new Class({
	Extends: Condition,
	
	initialize: function(where, val) {
		this.where = where;
		this.val = val;
	},
	
	isSatisfied: function(move, game) {
		switch (this.where) {
			case MoveDefinition.PartOfMove.Start:
				return this.value == move.piece.isThreatenedAt(game, move.StartPos);
			case MoveDefinition.PartOfMove.Destination:
				return this.value == move.piece.isThreatenedAt(game, move.endPos());
			case MoveDefinition.PartOfMove.WholeRoute:
				var allPoints = move.listAllPositionsOfPiece(game, move.piece);
				for (var i = 0; i < allPoints.length; i++)
					if ( move.piece.isThreatenedAt(game, allPoints[i]) )
						return this.value;
				return !this.value;
			default:
				throw "Unexpected where value in Condition.Threatened.IsSatisfied: " + this.where;
		}
	}
});

Condition.MoveCausesCheck = new Class({
	Extends: Condition,
	
	initialize: function(val) {
		this.val = val;
	},
	
	isSatisfied: function(move, game) {
		throw "Condition.MoveCausesCheck has not been implemented";
	}
});

Condition.MoveCausesCheckmate = new Class({
	Extends: Condition,
	
	initialize: function(val) {
		this.val = val;
	},
	
	isSatisfied: function(move, game) {
		throw "Condition.MoveCausesCheckmate has not been implemented";
	}
});

Condition.Checkmate = new Class({
	Extends: Condition,
	
	initialize: function(num, type, owner) {
		
		if (num == "any")
		{
			this.anyNumber = true;
			this.num = 0;
		}
		else if (num == "all")
		{
			this.allNumber = true;
			this.num = 0;
		}
		else
		{
			this.anyNumber = false;
			this.allNumber = false;
			this.num = +num;
		}
		
		this.type = type;
		this.owner = owner;
	},
	
	isSatisfied: function(move, game) {
		throw "Condition.MoveCausesCheckmate has not been implemented";
	}
});

Condition.PiecesThreatened = new Class({
	Extends: Condition,
	
	initialize: function(num, type, owner) {
		
		if (num == "any")
		{
			this.anyNumber = true;
			this.num = 0;
		}
		else if (num == "all")
		{
			this.allNumber = true;
			this.num = 0;
		}
		else
		{
			this.anyNumber = false;
			this.allNumber = false;
			this.num = +num;
		}
		
		this.type = type;
		this.owner = owner;
	},
	
	isSatisfied: function(move, game) {
		throw "Condition.PiecesThreatened has not been implemented";
	}
});

Condition.RepeatedCheck = new Class({
	Extends: Condition,
	
	initialize: function(duration, type, owner) {
		this.duration = duration;
		this.type = type;
		this.owner = owner;
	},
	
	isSatisfied: function(move, game) {
		throw "Condition.RepeatedCheck has not been implemented";
	}
});

Condition.NoMovesPossible = new Class({
	Extends: Condition,
	
	initialize: function(type, owner) {
		this.type = type;
		this.owner = owner;
	},
	
	isSatisfied: function(move, game) {
		var pieces = game.board.getAllPiecesMatching(game, move.player, this.owner, this.type);
		for ( var i=0; i<pieces.length; i++ )
			if ( pieces[i].getPossibleMoves(game).length > 0 )
				return false;
		return true;
	}
});

Condition.RepetitionOfPosition = new Class({
	Extends: Condition,
	
	initialize: function(occurances) {
		this.occurances = occurances;
	},
	
	isSatisfied: function(move, game) {
		throw "Condition.RepetitionOfPosition has not been implemented";
	}
});

Condition.TurnsSinceLastCapture = new Class({
	Extends: Condition,
	
	initialize: function(type, owner, comparison, value) {
		this.type = type;
		this.owner = owner;
		this.comparison = comparison;
		this.value = value;
	},
	
	isSatisfied: function(move, game) {
		throw "Condition.TurnsSinceLastCapture has not been implemented";
	}
});

Condition.TurnsSinceLastMove = new Class({
	Extends: Condition,
	
	initialize: function(type, owner, comparison, value) {
		this.type = type;
		this.owner = owner;
		this.comparison = comparison;
		this.value = value;
	},
	
	isSatisfied: function(move, game) {
		var turns = -1;
		var pieces = game.board.getAllPiecesMatching(game, move.player, this.owner, this.type);
		for ( var i=0; i<pieces.length; i++ )
			if ( pieces[i].lastMoveTurn != null )
				turns = Math.max(turns, game.turnNumber - pieces[i].lastMoveTurn);
		
		if ( turns == -1 )
			return false; // no piece in the set has moved yet, so this can't be valid
		
		return Condition.resolveComparison(this.comparison, turns, this.val.resolve(move, game));
	}
});

ConditionGroup = new Class({
	Extends: Condition,
	
	initialize: function(type) {
		this.elements = [];
		this.type = type;
	},
	
	isSatisfied: function(move, game) {
		switch (this.type)
		{
		case ConditionGroup.Type.And:
			for ( var i=0; i<this.elements.length; i++ )
				if ( !this.elements[i].isSatisfied(move, game) )
					return false;
			return true;
		case ConditionGroup.Type.Or:
			for ( var i=0; i<this.elements.length; i++ )
				if ( this.elements[i].isSatisfied(move, game) )
					return true;
			return false;
		case ConditionGroup.Type.Nand:
			for ( var i=0; i<this.elements.length; i++ )
				if ( !this.elements[i].isSatisfied(move, game) )
					return true;
			return false;
		case ConditionGroup.Type.Nor:
			for ( var i=0; i<this.elements.length; i++ )
				if ( this.elements[i].isSatisfied(move, game) )
					return false;
			return true;
		case ConditionGroup.Type.Xor:
			var any = false;
			for ( var i=0; i<this.elements.length; i++ )
				if ( this.elements[i].isSatisfied(move, game) )
					if (any)
						return false;
					else
						any = true;
			return any;
		default: // there are no other types!
			return false;
		}
	}
});

ConditionGroup.Type = {
	And: 0,
	Or: 1,
	Nand: 2,
	Nor: 3,
	Xor: 4
}