Player = new Class({
	initialize: function(name, forwardDir, index){
		this.name = name;
		this.forwardDir = forwardDir;
		this.index = index;

		this.piecesOnBoard = [];
		this.piecesInHand = [];
		this.piecesCaptured = [];
	
		this.gameEnd = null;
	},
	
	outOfGame: function() { return this.gameEnd != null; },
	
	isAllyOf: function (otherPlayer) { return false; },
	
	// local direction stuff
	getMinRank: function(board) {
		switch ( this.forwardDir )
		{
		case AbsoluteDirection.North:
		case AbsoluteDirection.South:
			return board.yMin;
		case AbsoluteDirection.East:
		case AbsoluteDirection.West:
			return board.xMin;
		case AbsoluteDirection.NorthEast:
		case AbsoluteDirection.NorthWest:
		case AbsoluteDirection.SouthEast:
		case AbsoluteDirection.SouthWest:
			return 1; // for all diagonal directions, min rank/column is 1
		default:
			throw "Unexpected forward direction in Player.getMinRank: " + this.forwardDir;
		}
	},
	
	getMinColumn: function(board) {
		switch ( this.forwardDir )
		{
		case AbsoluteDirection.North:
		case AbsoluteDirection.South:
			return board.xMin;
		case AbsoluteDirection.East:
		case AbsoluteDirection.West:
			return board.yMin;
		case AbsoluteDirection.NorthEast:
		case AbsoluteDirection.NorthWest:
		case AbsoluteDirection.SouthEast:
		case AbsoluteDirection.SouthWest:
			return 1; // for all diagonal directions, min rank/column is 1
		default:
			throw "Unexpected forward direction in Player.getMinColumn: " + this.forwardDir;
		}
	},
	
	getMaxRank: function(board) {
		switch ( this.forwardDir )
		{
		case AbsoluteDirection.North:
		case AbsoluteDirection.South:
			return board.yMax;
		case AbsoluteDirection.East:
		case AbsoluteDirection.West:
			return board.xMax;
		case AbsoluteDirection.NorthEast:
		case AbsoluteDirection.NorthWest:
		case AbsoluteDirection.SouthEast:
		case AbsoluteDirection.SouthWest:
			return board.xMax - board.xMin + board.yMax - board.yMin + 1; // for all diagonal directions, min rank/column is just the distance between opposite corners
		default:
			throw "Unexpected forward direction in Player.getMaxRank: " + this.forwardDir;
		}
	},
	
	getMaxColumn: function(board) {
		switch ( this.forwardDir )
		{
		case AbsoluteDirection.North:
		case AbsoluteDirection.South:
			return board.xMax;
		case AbsoluteDirection.East:
		case AbsoluteDirection.West:
			return board.yMax;
		case AbsoluteDirection.NorthEast:
		case AbsoluteDirection.NorthWest:
		case AbsoluteDirection.SouthEast:
		case AbsoluteDirection.SouthWest:
			return 1; // for all diagonal directions, min rank/column is 1
		default:
			throw "Unexpected forward direction in Player.getMaxColumn: " + this.forwardDir;
		}
	},
	
	getRank: function(board, coord) {
		switch ( this.forwardDir )
		{
		case AbsoluteDirection.North:
			return coord.y;
		case AbsoluteDirection.South:
			return board.yMax + board.yMin - coord.y;
		case AbsoluteDirection.East:
			return coord.x;
		case AbsoluteDirection.West:
			return board.xMax + board.xMin - coord.x;
		
		case AbsoluteDirection.NorthEast:
			return board.xMax - coord.x + coord.y - board.yMin + 1
		case AbsoluteDirection.NorthWest:
			return coord.x - board.xMin + coord.y - board.yMin + 1;
		case AbsoluteDirection.SouthEast:
			return board.xMax - coord.x + board.yMax - coord.y + 1;
		case AbsoluteDirection.SouthWest:
			return coord.x - board.xMin + board.yMax - coord.y + 1;
		default:
			throw "Unexpected forward direction in Player.getRank: " + this.forwardDir;
		}
	},
	
	getColumn: function(board, coord) {
		switch ( this.forwardDir )
		{
		case AbsoluteDirection.North:
			return coord.x;
		case AbsoluteDirection.South:
			return board.xMax - coord.x + board.xMin;
		case AbsoluteDirection.East:
			return coord.y;
		case AbsoluteDirection.West:
			return board.yMax + coord.y + board.yMin;
		
		case AbsoluteDirection.NorthEast:
			return coord.x - board.xMin + board.yMax - coord.y + 1
		case AbsoluteDirection.NorthWest:
			return coord.x - board.xMin + coord.y - board.yMin + 1;	// same as getRank?? seems wrong
		case AbsoluteDirection.SouthEast:
			return board.xMax - coord.x + coord.y - board.yMin + 1;
		case AbsoluteDirection.SouthWest:
			return board.xMax - coord.x + coord.y - board.yMin + 1;
		default:
			throw "Unexpected forward direction in Player.getColumn: " + this.forwardDir;
		}
	},
	
	getCoord: function(board, rank, col) {
		switch ( this.forwardDir )
		{
		case AbsoluteDirection.North:
			return new Coord(col, rank);
		case AbsoluteDirection.South:
			return new Coord(board.xMax + board.xMin - col, board.yMax + board.yMin - rank);
		case AbsoluteDirection.East:
			return new Coord(rank, board.yMax + board.yMin - col);
		case AbsoluteDirection.West:
			return new Coord(board.xMax + board.xMin - rank, col);
		
		case AbsoluteDirection.NorthEast:
			// col  proportional to x and inversely proportional to y
			// rank proportional to x and y
			return new Coord(Math.floor((col + rank)/2) - 2 + board.xMin, Math.floor((-col + rank)/2) + 1 + board.yMin);
		case AbsoluteDirection.NorthWest:
			// col  proportional to x and y
			// rank inversely proportional to x and proportional to y
			return new Coord(Math.floor((col - rank)/2) + 2 + board.xMin, Math.floor((col + rank)/2) - 3 + board.yMin);
		case AbsoluteDirection.SouthEast:
			// col  inversely proportional to x and y
			// rank proportional to x and inversely proportional to y
			return new Coord(Math.floor((-col + rank)/2) + 2 + board.xMin, Math.floor((-col - rank)/2) + 5 + board.yMin);
		case AbsoluteDirection.SouthWest:
			// col inversely proportional to x and proportional to y
			// rank inversely proportional to x and y
			return new Coord(Math.floor((-col - rank)/2) + 6 + board.xMin, Math.floor((col - rank)/2) + 1 + board.yMin);
		default:
			throw "Unexpected forward direction in Player.getCoord: " + this.forwardDir;
		}
	},

	getAbsoluteDirections: function(dirs, prevDir) {
		var abs = [];
		for(i=0; i<dirs.length; i++ )
			abs[i] = this.getAbsoluteDirection(dirs[i], prevDir);
		return abs;
	},
	
	getAbsoluteDirection: function(dir, prevDir) {
		// if its a relative direction, don't care who the player is, just need to rotate from the previous abs direction
		var offset = 0;
		switch ( dir )
		{
		case MoveDefinition.Direction.Relative_Left_90:
			offset = -2; break;
		case MoveDefinition.Direction.Relative_Left_135:
			offset = -3; break;
		case MoveDefinition.Direction.Relative_Left_45:
			offset = -1; break;
		case MoveDefinition.Direction.Relative_Right_90:
			offset = 2; break;
		case MoveDefinition.Direction.Relative_Right_135:
			offset = 3; break;
		case MoveDefinition.Direction.Relative_Right_45:
			offset = 1; break;
		case MoveDefinition.Direction.Relative_Opposite:
			offset = 4; break;
		case MoveDefinition.Direction.Relative_Same:
			return prevDir;
		}
		
		if ( offset != 0 )
		{
			var newDir = prevDir + offset;
			if ( newDir > 7 )
				newDir -= 8;
			else if ( newDir < 0 )
				newDir += 8;
			return newDir;
		}
		
		// otherwise, get directions as if the forward direction was north, then rotate based on actual forward direction
		switch ( dir )
		{
		case MoveDefinition.Direction.Forward:
			nonRotated = AbsoluteDirection.North; break;
		case MoveDefinition.Direction.Backward:
			nonRotated = AbsoluteDirection.South; break;
		case MoveDefinition.Direction.Left:
			nonRotated = AbsoluteDirection.West; break;
		case MoveDefinition.Direction.Right:
			nonRotated = AbsoluteDirection.East; break;
		case MoveDefinition.Direction.Forward_Diagonal_Left:
			nonRotated = AbsoluteDirection.NorthWest; break;
		case MoveDefinition.Direction.Forward_Diagonal_Right:
			nonRotated = AbsoluteDirection.NorthEast; break;
		case MoveDefinition.Direction.Backward_Diagonal_Left:
			nonRotated = AbsoluteDirection.SouthWest; break;
		case MoveDefinition.Direction.Backward_Diagonal_Right:
			nonRotated = AbsoluteDirection.SouthEast; break;
		default:
			throw "Unexpected direction in Player.getAbsoluteDirection: " + dir;
		}
		
		var absDir = nonRotated + this.forwardDir;
		if ( absDir > 7 )
			absDir -= 8;
		return absDir;
	},
	
	getOwnerFromPlayer: function(otherPlayer) {
		if ( otherPlayer == this )
			return MoveDefinition.Owner.Self;
		else if ( this.isAllyOf(otherPlayer) )
			return MoveDefinition.Owner.Ally;
		else
			return MoveDefinition.Owner.Enemy;
	},
	
	getPossibleMoves: function(game) {
		var list = [];
		
		for ( var i=0; i<this.piecesOnBoard.length; i++ )
			list.append(this.piecesOnBoard[i].getPossibleMoves(game));
		
		for ( var i=0; i<this.piecesInHand.length; i++ )
			list.append(this.piecesInHand[i].getPossibleMoves(game));
		
		return list;
	}
});

Player.parseAll = function(xml, pieceDefs, board, loadInitialPieceLayout)
{
	var players = [];
	
	var num = 1;
	$(xml).children().first().children('players').children().each(function() {
		var forward = AbsoluteDirection.parse($(this).attr('forward_direction')); // you can just do AbsoluteDirection['North'] - but the xml values are lowercase
		var p = new Player($(this).attr('name'), forward, num++);
		players.push(p);
		
		if ( !loadInitialPieceLayout)
			return true;

		$(this).children('pieces_on_board').children().each(function() {
			var strType = $(this).attr('type');
			if ( !pieceDefs.hasOwnProperty(strType) )
				throw "Unrecognised piece type on board: " + strType;
			
			var pos = new Coord($(this).attr('column'), $(this).attr('rank'));
			var piece = new Piece(p, pieceDefs[strType], pos, Piece.State.OnBoard);
			
			p.piecesOnBoard.push(piece);
			board.setPieceAt(pos, piece);
		});
		
		$(this).children('held_pieces').children().each(function() {
			var strType = $(this).attr('type');
			if ( !pieceDefs.hasOwnProperty(strType) )
				throw "Unrecognised piece type in hand: " + strType;
			
			var piece = new Piece(p, pieceDefs[strType], null, Piece.State.Held);
			p.piecesInHand.push(piece);
		});
	});
	
	return players;
}

Player.GameEndType = {
	Victory: 1,
	Defeat: 2,
	Draw: 3
}