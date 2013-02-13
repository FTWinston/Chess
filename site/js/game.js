Game = new Class({
	initialize: function(board, xml, loadInitialPieceLayout) {
		board.addDetailsFromDefinition(xml);
		this.board = board;
		board.game = this;
		
		this.rules = Game.Rules.loadFromDefinition(xml);
		
		this.pieceTypes = PieceType.loadDefinitions(xml); // now saving this, so <move_like other="target"/> can try out the moves of every type. COULD have it instead get the type of every piece on the board, but that's a bunch of work.
		this.players = Player.parseAll(xml, this.pieceTypes, this.board, loadInitialPieceLayout);
		if ( !loadInitialPieceLayout )
			; // todo: load from database? that'll either be in the php directly, or a dynamic js load of a file made by php
		
		// todo: load game rules
		
		this.moveNumber = 1; // todo: how is this set when loading?
		this.turnNumber = 1; // todo: how is this set when loading?
		this.actualTurnNumber = 1; // todo: how is this set when loading?
		this.iCurrentPlayer = 0;
		
		this.moveHistory = new Array();
	},
	
	performMove: function(move, animate) {
		var piece = move.piece;
		var oldPos = piece.position;
		
		// todo: remove this, and replace with proper stuff!
		// move steps should update their pieces automatically anyway (but not when predicting)
		
		//if ( move.moveNumber == this.moveNumber && ... && move.perform(this) )
	
		if ( move.perform(this, true, animate) )
			console.log(piece.ownerPlayer.name + " " + piece.pieceType.name + " at " + oldPos.getName() + " moving to " + piece.position.getName()); // todo: fixme: piece position hasn't changed! eh???
		else
		{
			console.log("error, cannot move");
			return false;
		}
		
		// todo: removing and recreating all pieces, just to move them (and change their type) ??? that sucks
		//this.board.gameElement.find(".piece").remove();
		//this.board.createPieceElements();
		this.board.getAllPieces().each(function(piece) {
			piece.clearPossibleMoves();
		});
		
		
		return true; // todo: see what is meant to use this return value
	}
	
	// todo: implement all the member functions here!
		
	// note: piece images came from http://commons.wikimedia.org/wiki/Category:SVG_chess_pieces & http://commons.wikimedia.org/wiki/Category:Standard_chess_tiles has crescent etc
});

Game.Rules = new Class({
	initialize: function() {
		//this.moveOrder = "sequence";
		this.usesHeldPieces = false;
		this.holdCapturedPieces = false;
		this.victoryConditions = [];
		this.dropPiecesWhen = null;
	}
	
	// todo: write LoadVictoryConditions method and VictoryConditionsGroup class
});

Game.Rules.loadFromDefinition = function(xml) {
	return new Game.Rules();
}