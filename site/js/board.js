function BoardLine(alignment, from, to) {
	this.from = from;
	this.to = to;
	this.alignment = alignment;
}

function BoardCell(type, x, y) {
	this.coord = new Coord(x, y);
	this.wOffset = 0; this.hOffset = 0;
	this.type = type;
	this.cssClass = 'cell';
	this.interior = '';
	this.piece = null;
}

Board = new Class({
	initialize: function(gameElement, cellRefStyle, color1, color2, color3) {
		this.gameElement = gameElement;
		this.game = null;
		this.xMin = undefined; this.xMax = undefined;
		this.yMin = undefined; this.yMax = undefined;
		
		this.cells = new HashTable();

		this.cellSize = 49; // fixed, for now, though this should be scalable
		this.xOffset = 2; this.yOffset = 2;
		this.flipVertical = false;
		
		// these variables should come from the game mode in question
		this.numPlayers = 2;
		this.gameUsesHeldPieces = false;
		
		this.showCellReferences = cellRefStyle;
		this.showCapturedPieces = null;
		this.capturedPieceFractionOfCellSize = 1.0;
		this.cellReferenceFractionOfCellSize = 0.65;
	},
	
	rows: function() {
		return this.yMax - this.yMin + 1;
	},
	
	cols: function() {
		return this.xMax - this.xMin + 1;
	},
	
	updateSize: function() {
		var leftSpace = 2; var rightSpace = 2; var topSpace = 2; var bottomSpace = 2;
		
		var refSize = this.cellReferenceFractionOfCellSize * this.cellSize;
		switch ( this.showCellReferences )
		{
		case Board.CellReferenceStyle.TopLeft:
			topSpace += refSize;
			leftSpace += refSize;
			break;
		case Board.CellReferenceStyle.BottomLeft:
			bottomSpace += refSize;
			leftSpace += refSize;
			break;
		case Board.CellReferenceStyle.AllSides:
			topSpace += refSize;
			leftSpace += refSize;
			bottomSpace += refSize;
			rightSpace += refSize;
			break;
		}
		
		if ( this.showCapturedPieces == Board.Orientation.Horizontal ) {
			topSpace += this.capturedPieceFractionOfCellSize * (Math.floor(this.numPlayers / 2) + this.numPlayers % 2);
			bottomSpace += this.capturedPieceFractionOfCellSize * Math.floor(this.numPlayers / 2);
		}
		else if ( this.showCapturedPieces == Board.Orientation.Vertical || this.gameUsersHeldPieces ) {
			leftSpace += this.capturedPieceFractionOfCellSize * (Math.floor(this.numPlayers / 2) + this.numPlayers % 2);
			rightSpace += this.capturedPieceFractionOfCellSize * Math.floor(this.numPlayers / 2);
		}
		
		this.gameElement.css("width", leftSpace + rightSpace + (this.cols() * this.cellSize));
		this.gameElement.css("height", topSpace + bottomSpace + (this.rows() * this.cellSize));
		this.xOffset = leftSpace;
		this.yOffset = topSpace;
	},

	isValidCell: function(coord) {
		if ( coord.x > this.xMax || coord.y > this.yMax || coord.x < this.xMin || coord.y < this.yMin )
			return false;
		
		var cell = this.cells.getItem(coord);
		if ( cell == undefined )
			return false;
			
		return cell.type != Board.CellType.Inaccessible;
	},
	
	getPieceAt: function(coord) {
		var cell = this.cells.getItem(coord);
		if ( cell == undefined )
			return null;
		return cell.piece;
	},
	
	setPieceAt: function(coord,piece) {
		var cell = this.cells.getItem(coord);
		if ( cell == undefined )
			return;
		cell.piece = piece;
	},
	
	getAllPieces: function() {
		var all = [];
		for ( var i=0; i<game.players.length; i++ )
			all.append(game.players[i].piecesOnBoard);
		return all;
	},
	
	getAllPiecesMatching: function(checkForPlayer, pieceOwner, type) {
		var matches = new Array();
		for ( var i=0; i<game.players.length; i++ )
		{
			var player = game.players[i];
			if (pieceOwner == MoveDefinition.Owner.Any || checkForPlayer.getOwnerFromPlayer(player) == owner)
			{
				// consider: should we have a special case checking for "any" here that just concats these two arrays?
				for ( var j=0; j<player.piecesOnBoard.length; j++ )
					if ( player.piecesOnBoard[j].typeMatches(type) )
						matches.push(player.piecesOnBoard[j]);

				for ( var j=0; j<player.piecesInHand.length; j++ )
					if ( player.piecesInHand[j].typeMatches(type) )
						matches.push(player.piecesInHand[j]);
			}
		}
		return matches;
	},
	
	addCells: function(appearance, fromX, fromY, toX, toY) {
		// see if we need to update our extent
		if ( this.xMin == undefined || fromX < this.xMin )
			this.xMin = fromX;
		if ( this.xMax == undefined || fromX > this.xMax )
			this.xMax = fromX;
		if ( toX < this.xMin )
			this.xMin = toX;
		if ( toX > this.xMax )
			this.xMax = toX;
			
		if ( this.yMin == undefined || fromY < this.yMin )
			this.yMin = fromY;
		if ( this.yMax == undefined || fromY > this.yMax )
			this.yMax = fromY;
		if ( toY < this.yMin )
			this.yMin = toY;
		if ( toY > this.yMax )
			this.yMax = toY;
		
		// actually add the cells ... work out what classes to give them all here
		for (var x = fromX; x <= toX; x++)
			for (var y = fromY; y <= toY; y++) {
				var cell = new BoardCell(Board.CellType.Normal, x, y);
				
				if ( appearance == 'alternating' )
					cell.cssClass += (x + y) % 2 == 0 ? ' light' : ' dark';
				else if ( appearance == 'grid' ) {
					cell.cssClass += ' grid';
					cell.hOffset = -1;
					if ( x == toX )
						cell.wOffset -= 1;
				}
				else if ( appearance == 'lines' ) {
					cell.cssClass += ' lines';
					cell.interior = '<div class="tr line" /><div class="bl line" /><div class="br line" /></div>';
				}
				else
					cell.cssClass += ' ' + appearance;
				
				if ( x == fromX )
					cell.cssClass += ' left';
				else if ( x == toX )
					cell.cssClass += ' right';
				
				if ( y == fromY )
					cell.cssClass += this.flipVertical ? ' top' : ' bottom';
				else if ( y == toY )
					cell.cssClass += this.flipVertical ? ' bottom' : ' top';
				
				this.cells.setItem(cell.coord, cell);
			}
	},
	
	getMaxProjectionDistance: function(coord, absDir) {
		switch (absDir)
		{
		case AbsoluteDirection.North:
			return this.yMax - coord.y;
		case AbsoluteDirection.South:
			return coord.y - this.yMin;
		case AbsoluteDirection.East:
			return this.xMax - coord.x;
		case AbsoluteDirection.West:
			return coord.x - this.xMin;
		case AbsoluteDirection.NorthEast:
			return Math.min(this.yMax - coord.y, this.xMax - coord.y);
		case AbsoluteDirection.NorthWest:
			return Math.min(this.yMax - coord.y, coord.x - this.xMin);
		case AbsoluteDirection.SouthEast:
			return Math.min(coord.y - this.yMin, this.xMax - coord.x);
		case AbsoluteDirection.SouthWest:
			return Math.min(coord.y - this.yMin, coord.x - this.xMin);
		default:
			throw "Unexpected direction in board.getMaxProjectionDistance: " + absDir;
		}
	},
	
	getCellBounds: function(x, y) {
		var rect;
			
		if ( this.flipVertical )
			rect = new Rectangle((x - this.xMin) * this.cellSize + this.xOffset, (y - this.yMin) * this.cellSize + this.yOffset, this.cellSize, this.cellSize);
		else
			rect = new Rectangle((x - this.xMin) * this.cellSize + this.xOffset, (this.yMax - y) * this.cellSize + this.yOffset, this.cellSize, this.cellSize);

		return rect;
	},
	
	getRectangleForRange: function(c1, c2) {
		var r1 = this.getCellBounds(c1.x, c1.y);
		var r2 = this.getCellBounds(c2.x, c2.y);
		
		var xMin = Math.min(r1.x, r2.x); var xMax = Math.max(r1.x + r1.w, r2.x + r2.w);
		var yMin = Math.min(r1.y, r2.y); var yMax = Math.max(r1.y + r1.h, r2.y + r2.h);
		return new Rectangle(xMin, yMin, xMax - xMin, yMax - yMin);
	},
	
	getCellAtPoint: function(x, y) {
		var col = Math.floor(x / this.cellSize + 1 - this.xOffset); var row;
		if ( this.flipVertical )
			row = Math.floor(y / this.cellSize + 1 - this.yOffset);
		else
			row = this.yMax - Math.floor(y / this.cellSize + 1 - this.yOffset);
			
		var c = new Coord(col, row);
		if ( this.isValidCell(c) )
			return c;
		return null;
	},
	
	addDetailsFromDefinition: function(xml) {
		var boardDef = $(xml).children().first().children('board');

		if ( $(boardDef).attr('type') != 'square' ) {
			alert("Cannot load the game board, as it doesn't use square cells");
			return;
		}

		var board = this;
		$(boardDef).children().each(function() {
			if ( $(this).is('cells') ) {
				var x1 = parseInt($(this).attr('column_from'));
				var x2 = parseInt($(this).attr('column_to'));
				var y1 = parseInt($(this).attr('rank_from'));
				var y2 = parseInt($(this).attr('rank_to'));
				
				var appearance = $(this).attr('appearance');
				board.addCells(appearance, x1, y1, x2, y2);
			}
			else if ( $(this).is('detail') ) {
				var x = parseInt($(this).attr('column'));
				var y = parseInt($(this).attr('rank'));
				var style = $(this).attr('style');
				
				// add this style onto the class of the cell at x,y
				var cell = board.cells.getItem(new Coord(x,y));
				if ( cell == undefined )
					return true;
				
				// account for vertical flipping, where necessary
				if ( this.flipVertical )
					if ( style == 'diagonalBLTR' )
						style = 'diagonalTLBR';
					else if ( style == 'diagonalTLBR' )
						style = 'diagonalBLTR';
					else if ( style == 'diagonalBL' )
						style = 'diagonalTL';
					else if ( style == 'diagonalBR' )
						style = 'diagonalTR';
					else if ( style == 'diagonalTL' )
						style = 'diagonalBL';
					else if ( style == 'diagonalTR' )
						style = 'diagonalBR';
				
				cell.cssClass += ' ' + style;
			}
			else {
				alert("Cannot render elements of the game board, because they were not recognised");
				return true;
			}
		});
	},

	render: function() {
		this.updateSize();
		
		this.gameElement.find('.cell').remove();
		this.gameElement.find('.piece').remove();
		this.gameElement.find('.reference').remove();
		
		this.createCellElements();
		this.createReferenceElements();
		this.createPieceElements();
	},
	
	createCellElements: function() {
		var board = this;
		this.cells.each(function(ref, cell) {
			var rect = board.getCellBounds(cell.coord.x, cell.coord.y);
			$('<div id="c' + cell.coord.toString() + '" class="' + cell.cssClass + '" style="top:' + rect.y + 'px; left:' + rect.x + 'px; width:' + (rect.w + cell.wOffset) + 'px; height:' + (rect.h + cell.hOffset) + 'px;">' + cell.interior + '</div>')
			.appendTo(board.gameElement);
		});
	},
	
	createReferenceElements: function() {
		if ( this.showCellReferences != Board.CellReferenceStyle.None ) {
			var rankMin = this.getCellBounds(this.xMin, this.yMin);
			var rankMax = this.getCellBounds(this.xMin, this.yMax);
			var topmostRank = rankMin.y < rankMax.y ? this.yMin - 1 : this.yMax + 1;
			var bottommostRank = rankMin.y < rankMax.y ? this.yMax + 1 : this.yMin - 1;
			
			var size = Math.floor(this.cellSize * this.cellReferenceFractionOfCellSize) - 4;
			
			// draw left side
			for ( var y = this.yMin; y<=this.yMax; y++ ) {
				var rect = this.getCellBounds(this.xMin - 1, y);
				rect.x += this.cellSize - this.cellSize * this.cellReferenceFractionOfCellSize;
				rect.w *= this.cellReferenceFractionOfCellSize;
				this.createElementForReference(rect, y.toString(), size);
			}
			
			// draw right side
			if ( this.showCellReferences == Board.CellReferenceStyle.AllSides )
				for ( var y = this.yMin; y<=this.yMax; y++ ) {
					var rect = this.getCellBounds(this.xMax + 1, y);
					rect.w *= this.cellReferenceFractionOfCellSize;
					this.createElementForReference(rect, y.toString(), size);
				}
				
			// draw bottom side
			if ( this.showCellReferences == Board.CellReferenceStyle.BottomLeft || this.showCellReferences == Board.CellReferenceStyle.AllSides )
				for ( var x = this.xMin; x<=this.xMax; x++ ) {
					var rect = this.getCellBounds(x, this.yMin - 1);
					rect.h *= this.cellReferenceFractionOfCellSize;
					this.createElementForReference(rect, Coord.columnName(x), size);
				}
				
			// draw top side
			if ( this.showCellReferences == Board.CellReferenceStyle.TopLeft || this.showCellReferences == Board.CellReferenceStyle.AllSides )
				for ( var x = this.xMin; x<=this.xMax; x++ ) {
					var rect = this.getCellBounds(x, this.yMax + 1);
					rect.y += this.cellSize - this.cellSize * this.cellReferenceFractionOfCellSize;
					rect.h *= this.cellReferenceFractionOfCellSize;
					this.createElementForReference(rect, Coord.columnName(x), size);
				}
		}
	},
	
	createElementForReference: function(rect, text, size) {
		$('<div class="reference" style="top:' + rect.y + 'px; left:' + rect.x + 'px; width:' + rect.w + 'px; height:' + rect.h + 'px; line-height:' + rect.h + 'px; font-size:' + size + 'px;">' + text + '</div>')
			.appendTo(this.gameElement);
	},
	
	createPieceElements: function() {
		for ( var i=0; i<this.game.players.length; i++ )
			for ( var j=0; j<this.game.players[i].piecesOnBoard.length; j++ )
				this.createElementForPiece(this.game.players[i].piecesOnBoard[j], this.game.variantDir);
		
		this.gameElement.find(".piece")
		.draggable({
			//grid: [ game.board.cellSize, game.board.cellSize ], // causes reverting drag to sometimes return to the wrong place
			containment: "#game",
			distance: game.board.cellSize * 0.35,
			stack: ".piece",
			snap: ".move.destination", // why won't this work?
			snapMode: "inner",
			revert: "invalid",
			start: function(event, ui) {
				$(".piece.selected").removeClass("selected"); // deselect this (or any other) piece
				game.board.createMoveMarkers($(this).get(0).tag);
			},
			stop: function(event, ui) {
				game.board.removeAllMoveMarkers();
			}
		})
		.click(function() {
			if ( !$(this).hasClass("selected") )
			{// deselect all others, select me
				$(".piece.selected").removeClass("selected");
				$(this).addClass("selected");
			}
		
			game.board.createMoveMarkers($(this).get(0).tag);
		});
	},
	
	createElementForPiece: function(piece, gameDir) {
		var rect = this.getCellBounds(piece.position.x, piece.position.y);
	
		$('<div id="' + piece.position + '" class="' + piece.getCssClass() + '" style="' +
		'left:' + rect.x + 'px; top:' + rect.y + 'px; ' +
		'width:' + rect.w + 'px; height:' + rect.h + 'px; ' +
		'background-image:url(\'' + piece.getPieceImage(gameDir) + '\')' +
		'"></div>')
			.appendTo('#game')
			.get(0).tag = piece;
	},
	
	createMoveMarkers: function(piece) {
		this.removeAllMoveMarkers();
		
		var moves = piece.getPossibleMoves(game);
		/*
		if ( moves.length == 0 )
			console.log(piece.ownerPlayer.name + " " + piece.pieceType.name + " at " + piece.position.getName() + " cannot move" );
		else
		{
			var log = piece.ownerPlayer.name + " " + piece.pieceType.name + " at " + piece.position.getName() + " can move to: ";
			for ( var i = 0; i < moves.length; i++ )
			{
				if ( i > 0 )
					log += ", ";
				log += moves[i].endPos().getName();
			}
			console.log(log);
		}*/
		
		for ( var i=0; i<moves.length; i++ )
		{
			// todo: create shoot & capture markers for intermediate steps
			this.createMoveMarker(moves[i], i, "destination");
		}
		
		$(".move.destination")
		.droppable({
			tolerance: "intersect",
			drop: function( event, ui ) {
				game.board.moveSelected(this);
			}
		})
		.click(function() {
			game.board.moveSelected(this);
		});
	},
	
	removeAllMoveMarkers: function() {
		$(".move").remove();
	},
	
	createMoveMarker: function(move, number, type) {
		var endPos = move.endPos();
		var rect = this.getCellBounds(endPos.x, endPos.y);
		
		$('<div id="move' + number + '" class="move ' + type + '" style="' +
		'left:' + rect.x + 'px; top:' + rect.y + 'px; ' +
		'width:' + rect.w + 'px; height:' + rect.h + 'px;"></div>')
			.appendTo('#game')
			.get(0).tag = move;
	},
	
	moveSelected: function(marker) {
		var move = $(marker).get(0).tag;
		this.removeAllMoveMarkers();
		$(".piece.selected").removeClass("selected");
		this.game.performMove(move);
	}
});

Board.CellType = {
	Normal: 0,
	Inaccessible : 1
}

Board.Orientation = {
	Horizontal: 1,
	Vertical: 2
}

Board.CellReferenceStyle = {
	None: 0,
	TopLeft: 1,
	BottomLeft: 2,
	AllSides: 3
}