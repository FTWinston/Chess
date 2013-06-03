PlayerAction = new Class({
	initialize: function() {
		this.isMove = false;
		this.isPromotion = false;
		this.isEndOfTurn = false;
		
		this.player = null;
		this.piece = null;
		this.moveNumber = 1;
	},
	
	endPos: function() { return false; },
	perform: function(game, updateDisplay, animate) { return false; },
	reverse: function(game) { return false; }
});

MoveAppearance = {
	EnterBoard: 0,
	ExitBoard: 1,
	Hop: 2,
	Slide: 3,
	Leap: 4,
	Shoot: 5,
	ArbitraryAttack: 6
}

Move = new Class({
	Extends: PlayerAction,
	
	initialize: function(player, piece, startPos, moveNum, isEndOfTurn) {
		this.parent();
		
		this.isMove = true;
		this.isPromotion = false;
		this.isEndOfTurn = isEndOfTurn;
		
		this.player = player;
		this.piece = piece;
		this.startPos = startPos;
		this.moveNumber = moveNum;
		
		this.steps = new Array();
		this.references = new HashTable();
	},
	
	addStep: function(step) { this.steps.push(step); },
	
	clone: function() {
		var move = new Move(this.player, this.piece, this.startPos, this.moveNumber, this.isEndOfTurn);
		
		for ( var i=0; i<this.steps.length; i++ )
			move.addStep(this.steps[i]);
		
		this.references.each(function(ref, piece) {
			move.addPieceReference(piece, ref);
		});
		
		return move;
	},
	
	endPos: function() {
		for (var i = this.steps.length-1; i >= 0; i--)
		{
			var s = this.steps[i];
			if (s.piece == this.piece && s.toCoord != null)
				return s.toCoord;
		}
		return this.startPos;
	},
	
	perform: function(game, updateDisplay, animate) {
		for (var i = 0; i < this.steps.length; i++)
			if ( !this.steps[i].perform(game, updateDisplay, animate) ) // move failed, roll-back
			{
				for (var j = i - 1; j >= 0; j--)
					if (!this.steps[j].reverse(game))
						throw "Move failed on step " + i + "/" + this.steps.length + ", and rolling move back then failed on step " + j + ". Unable to rectify board state.";

				return false;
			}
		
		if ( this.piece.moveNumber == 1 )
			this.piece.firstMoveTurn = game.TurnNumber;
		
		this.piece.lastMoveTurn = game.TurnNumber;
        this.piece.moveNumber++;
		
		return true;
	},
	
	reverse: function(game) {
		for (var i = this.steps.length - 1; i >= 0; i--)
			if ( !this.steps[i].reverse(game) ) // move failed, roll-back
			{
				for (var j = i + 1; j < steps.length; j++)
					if (!this.steps[j].perform(game))
						throw "Reversing move failed on step " + i + "/" + this.steps.length + " (counting backwards), and rolling move back then failed on step " + j + ". Unable to rectify board state.";

				return false;
			}
		
        this.piece.moveNumber--;
		if ( this.piece.firstMoveTurn == game.TurnNumber )
			this.piece.firstMoveTurn = null;
		
		return true;
	},
	
	addPieceReference: function(piece, ref) {
		this.references.setItem(ref, piece);
	},
	
	getPieceByRef: function(ref) {
		var piece = this.references.getItem(ref);
		if ( piece == undefined )
			return null;
		return piece;
	},
	
	listAllPositionsOfPiece: function() {
		var allPoints = new Array();
		for ( var i=0; i<this.steps.count; i++ )
			if ( this.steps[i].piece == this.piece && this.steps[i].toState == PieceState.OnBoard )
				allPoints.push(this.steps[i].toCoord);
		return allPoints;
	}
});

MoveStep = new Class({
	initialize: function(piece) {
		this.piece = piece;
		this.fromState = null;
		this.toState = null;
		this.fromCoord = null;
		this.toCoord = null;
		this.fromOwner = null;
		this.toOwner = null;
		this.fromStateOwner = null;
		this.toStateOwner = null;
		this.distance = 0;
		this.direction = null;
		this.appearance = null;
	},
	
	perform: function(game, updateDisplay, animate) {
		if ( !this.checkStateAndRemovePiece(game, this.fromState, this.fromCoord, this.fromStateOwner) )
			return false;
		
		if ( this.fromOwner != this.toOwner ) {
			this.piece.ownerPlayer = this.toOwner;
			
			if ( updateDisplay )
				game.board.gameElement.find('#' + this.piece.uniqueID).attr('css', this.piece.getCssClass());
		}
		
		this.placePiece(game, this.toState, this.toCoord, this.toStateOwner);
		
		if ( updateDisplay )
			this.updateDisplay(game, animate);
			
		return true;
	},
	
	reverse: function(game) {
		if ( !this.checkStateAndRemovePiece(game, this.toState, this.toCoord, this.toStateOwner) )
			return false;
		
		if ( this.fromOwner != this.toOwner )
			this.piece.ownerPlayer = this.fromOwner;
		
		this.placePiece(game, this.fromState, this.fromCoord, this.fromStateOwner);
		return true;
	},
	
	checkStateAndRemovePiece: function(game, state, coord, stateOwner) {
		if ( this.piece.pieceState != state ) // piece isn't in the expected state, quit
		{
			console.log("state is wrong: got " + this.piece.pieceState + ", expected " + state + ' for ' + this.piece.ownerPlayer.name + '\'s ' + this.piece.pieceType.name); // todo: remove debug message
			return false;
		}
			
		switch (state)
		{
		case Piece.State.OnBoard:
			if ( this.piece.position != coord )
			{
				console.log("position is wrong: got " + this.piece.position + ", expected " + coord + ' for ' + this.piece.ownerPlayer.name + '\'s ' + this.piece.pieceType.name); // todo: remove debug message
				return false;
			}
			this.piece.ownerPlayer.piecesOnBoard.removeItem(this.piece);
			game.board.setPieceAt(this.piece.position, null); // remove from the board itself
			return true;
		case Piece.State.Captured:
			if ( stateOwner == null || !stateOwner.piecesCaptured.removeItem(this.piece) )
				return false; // wasn't captured by that player after all ... can't perform this action
			return true;
		case Piece.State.Held:
			if ( stateOwner == null || !stateOwner.piecesInHand.removeItem(this.piece) )
				return false; // wasn't captured by that player after all ... can't perform this action
			return true;
		default:
			throw "Unexpected piece state in MoveStep.checkStateAndRemovePiece: " + state;
		}
	},
	
	placePiece: function(game, state, coord, stateOwner) {
		switch ( state )
		{
		case Piece.State.OnBoard:
			this.piece.position = coord;
			this.piece.state = state;
			this.piece.ownerPlayer.piecesOnBoard.push(this.piece);
			game.board.setPieceAt(coord, this.piece);
			break;
		case Piece.State.Captured:
			this.piece.position = null;
			this.piece.state = state;
			stateOwner.piecesCaptured.push(this.piece);
			break;
		case Piece.State.Held:
			this.piece.position = null;
			this.piece.state = state;
			stateOwner.piecesInHand.push(this.piece);
		default:
			throw "Unexpected piece state in MoveStep.placePiece: " + state;
		}
	},
	
	updateDisplay: function(game, animate) {
		// first work out where it should be
		var newState; var remove;
		
		switch (this.toState)
		{
		case Piece.State.OnBoard:
			var rect = game.board.getCellBounds(this.toCoord.x, this.toCoord.y);
			newState = {
				top: rect.y,
				left: rect.x
			}
			break;
		case Piece.State.Captured:
			if ( animate )
				$('#' + this.piece.uniqueID).addClass('removing').hide('scale', {}, 'slow').animate({'opacity': 0}).removeClass('removing');
			else
				$('#' + this.piece.uniqueID).hide();
			return true; // todo: move to captured location, if visible
		case Piece.State.Held:
			if ( animate )
				$('#' + this.piece.uniqueID).addClass('removing').hide('scale', {}, 'slow').animate({'opacity': 0}).removeClass('removing');
			else
				$('#' + this.piece.uniqueID).hide();
			return true; // todo: move to captured location, if visible
		default:
			throw "Unexpected piece state in MoveStep.checkStateAndRemovePiece: " + state;
		}
		
		// then work out how we want to get it there
		if ( animate ) {
			$('#' + this.piece.uniqueID).animate(newState);
			
			// pause thread to allow animation?
		}
		else
			$('#' + this.piece.uniqueID).css(newState);
	}
});

MoveStep.Create = function(piece, from, to, appearance, distance, direction) {
	var s = new MoveStep(piece);
	s.fromCoord = from;
	s.toCoord = to;
	s.fromState = Piece.State.OnBoard;
	s.toState = Piece.State.OnBoard;
	s.appearance = appearance;
	s.distance = distance;
	s.direction = direction;
	return s;
}

MoveStep.CreateCapture = function(piece, from, capturedBy, toHeld) {
	if ( toHeld )
		return MoveStep.CreateMoveToHeld(piece, from, capturedBy);
	
	var s = new MoveStep(piece);
	s.fromCoord = from;
	s.fromState = Piece.State.OnBoard;
	s.toState = Piece.State.Captured;
	s.toStateOwner = capturedBy;
	s.distance = 0;
	s.appearance = MoveAppearance.ExitBoard;
	return s;
}

MoveStep.CreateMoveToHeld = function(piece, from, droppedBy) {
	var s = new MoveStep(piece);
	s.fromCoord = from;
	s.fromState = Piece.State.OnBoard;
	s.toState = Piece.State.Held;
	s.toStateOwner = droppedBy;
	s.distance = 0;
	s.appearance = MoveAppearance.ExitBoard;
	
	s.fromOwner = piece.ownerPlayer; // change the actual owner of this piece
	s.toOwner = droppedBy;
	return s;
}

MoveStep.CreateDrop = function(piece, dest, droppedBy) {
	var s = new MoveStep(piece);
	s.fromState = Piece.State.Held;
	s.fromStateOwner = droppedBy;
	s.toState = Piece.State.OnBoard;
	s.toCoord = dest;
	s.distance = 0;
	s.appearance = MoveAppearance.EnterBoard;
	return s;
}

Promotion = new Class({
	Extends: PlayerAction,
	
	initialize: function(player, piece, type, moveNum, isEndOfTurn) {
		this.parent();
		
		this.isMove = true;
		this.isPromotion = false;
		this.isEndOfTurn = isEndOfTurn;
		this.moveNumber = moveNum;
		
		this.player = player;
		this.piece = piece;
		
		this.toType = type;
		this.fromType = piece.PieceType;
		this.position = piece.Position;
	},
	
	perform: function(game, updateDisplay, animate) {
		this.piece.type = this.toType;
		
		if ( updateDisplay ) {
			game.board.gameElement.find('#' + this.piece.uniqueID).attr('css', this.piece.getCssClass());
		}
		
		return true;
	},
	
	reverse: function(game) {
		this.piece.type = this.fromType;
		return true;
	},
	
	endPos: function() {
		return this.position;
	}
});