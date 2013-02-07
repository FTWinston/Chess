function BoardLine(alignment, from, to) {
	this.from = from;
	this.to = to;
	this.alignment = alignment;
}

function CellRange(style, from, to) {
	this.from = from;
	this.to = to;
	this.style = style;
}

function BoardCell(type) {
	this.type = type;
	this.piece = null;
}

Board = new Class({
	initialize: function(canvas, cellRefStyle, color1, color2, color3) {
		canvas.getContext("2d").lineWidth = 1;
		
		this.canvas = canvas;
		this.game = null;
		this.xMin = undefined; this.xMax = undefined;
		this.yMin = undefined; this.yMax = undefined;
		
		this.cells = new HashTable();
		this.details = new Array();

		this.cellSize = 50; // fixed, for now, though this should be scalable
		this.xOffset = 2; this.yOffset = 2;
		this.flipVertical = false;
		
		// these variables should come from the game mode in question
		this.numPlayers = 2;
		this.gameUsesHeldPieces = false;
		
		this.color1 = color1;
		this.color2 = color2;
		this.color3 = color3;
		
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
		
		this.canvas.width = leftSpace + rightSpace + (this.cols() * this.cellSize);
		this.canvas.height = topSpace + bottomSpace + (this.rows() * this.cellSize);
		$("#game").css("width", this.canvas.width).css("height", this.canvas.height);
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
	
	addDetail: function(detail) {
		this.details.push(detail);
		
		// see if we need to update our extent
		if ( this.xMin == undefined || detail.from.x < this.xMin )
			this.xMin = detail.from.x;
		if ( this.xMax == undefined || detail.from.x > this.xMax )
			this.xMax = detail.from.x;
		if ( detail.to.x < this.xMin )
			this.xMin = detail.to.x;
		if ( detail.to.x > this.xMax )
			this.xMax = detail.to.x;
			
		if ( this.yMin == undefined || detail.from.y < this.yMin )
			this.yMin = detail.from.y;
		if ( this.yMax == undefined || detail.from.y > this.yMax )
			this.yMax = detail.from.y;
		if ( detail.to.y < this.yMin )
			this.yMin = detail.to.y;
		if ( detail.to.y > this.yMax )
			this.yMax = detail.to.y;
		
		// add cells if this is a cell range
		if ( detail instanceof CellRange ) {
			for (var x = detail.from.x; x <= detail.to.x; x++)
				for (var y = detail.from.y; y <= detail.to.y; y++)
					this.cells.setItem(new Coord(x, y), new BoardCell(Board.CellType.Normal));
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
	
	getCellBounds: function(x, y, considerFlipVertical) {
		var rect;
			
		if ( this.flipVertical && considerFlipVertical )
			rect = new Rectangle((x - this.xMin) * this.cellSize + this.xOffset, (y - this.yMin) * this.cellSize + this.yOffset, this.cellSize, this.cellSize);
		else
			rect = new Rectangle((x - this.xMin) * this.cellSize + this.xOffset, (this.yMax - y) * this.cellSize + this.yOffset, this.cellSize, this.cellSize);

		return rect;
	},
	
	getRectangleForRange: function(c1, c2) {
		var r1 = this.getCellBounds(c1.x, c1.y, true);
		var r2 = this.getCellBounds(c2.x, c2.y, true);
		
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
			var x1 = parseInt($(this).attr('column_from'));
			var x2 = parseInt($(this).attr('column_to'));
			var y1 = parseInt($(this).attr('rank_from'));
			var y2 = parseInt($(this).attr('rank_to'));

			if ( $(this).is('cells') ) {
				var val = $(this).attr('appearance'); var appearance;
				if ( val == 'alternating' )
					appearance = Board.CellRangeStyle.Alternating;
				else if ( val == 'grid' )
					appearance = Board.CellRangeStyle.Grid;
				else if ( val == 'lines' )
					appearance = Board.CellRangeStyle.Lines;
				else if ( val == 'plain' )
					appearance = Board.CellRangeStyle.Plain;
				else {
					alert("Unrecognised cell range type: " + val);
					appearance = Board.CellRangeStyle.Plain;
				}
				board.addDetail(new CellRange(appearance, new Coord(x1,y1), new Coord(x2,y2)));
			}
			else if ( $(this).is('line') ) {
				var val = $(this).attr('alignment'); var alignment;
				if ( val == 'center' )
					alignment = Board.LineAlignment.Center;
				else if ( val == 'corner' )
					alignment= Board.LineAlignment.Corner;
				else if ( val == 'vertical edge' )
					alignment= Board.LineAlignment.VerticalEdge;
				else if ( val == 'horizontal edge' )
					alignment= Board.LineAlignment.HorizontalEdge;
				else {
					alert("Unrecognised line alignment: " + val);
					alignment = Board.LineAlignment.Corner;
				}
				board.addDetail(new BoardLine(alignment, new Coord(x1,y1), new Coord(x2,y2)));
			}
			else {
				alert("Cannot elements of the game board, because they were not recognised");
				return true;
			}
		});
	},

	render: function() {
		this.updateSize();
		var ctx = this.canvas.getContext("2d");

		for ( var i=0; i<this.details.length; i++ ) {
			var detail = this.details[i];

			if ( detail instanceof CellRange ) {
				switch ( detail.style )
				{
				case Board.CellRangeStyle.Alternating:
					for ( var y = detail.from.y; y <= detail.to.y; y++ )
						for ( var x = detail.from.x; x <= detail.to.x; x++ )
						{
							rect = this.getCellBounds(x, y, true);
							if ( (x + y) % 2 == 0 )
								ctx.fillStyle = this.color1;
							else
								ctx.fillStyle = this.color2;
							ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
						}
					break;
				case Board.CellRangeStyle.Grid:
					// first fill the background
					var rect = this.getRectangleForRange(detail.from, detail.to);
					ctx.fillStyle = this.color3;
					ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
					var yMin; var yMax;
					
					// now draw the grid lines
					if ( this.flipVertical ) {
						yMin = detail.from.y; yMax = detail.to.y + 1;
					}
					else {
						yMin = detail.from.y - 1; yMax = detail.to.y;
					}
					
					ctx.strokeStyle = this.color2;
					ctx.beginPath();
					for ( var y = yMin; y <= yMax; y++ )
					{
						var startCell = this.getCellBounds(detail.from.x, y, true);
						var endCell = this.getCellBounds(detail.to.x + 1, y, true);
						ctx.moveTo(startCell.x,startCell.y);
						ctx.lineTo(endCell.x,endCell.y);
					}
					for ( var x = detail.from.x; x <= detail.to.x + 1; x++ )
					{
						var startCell = this.getCellBounds(x, yMin, true);
						var endCell = this.getCellBounds(x, yMax, true);
						ctx.moveTo(startCell.x,startCell.y);
						ctx.lineTo(endCell.x,endCell.y);
					}
					ctx.stroke();
					break;
				case Board.CellRangeStyle.Lines:
					// first fill the background
					var rect = this.getRectangleForRange(detail.from, detail.to);
					ctx.fillStyle = this.color3;
					ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
					
					// now draw the lines					
					ctx.strokeStyle = this.color2;
					ctx.beginPath();
					for ( var y = detail.from.y; y <= detail.to.y; y++ )
					{
						var startCell = this.getCellBounds(detail.from.x, y, true);
						var endCell = this.getCellBounds(detail.to.x, y, true);
						ctx.moveTo(startCell.centerX(),startCell.centerY());
						ctx.lineTo(endCell.centerX(),endCell.centerY());
					}
					for ( var x = detail.from.x; x <= detail.to.x; x++ )
					{
						var startCell = this.getCellBounds(x, detail.from.y, true);
						var endCell = this.getCellBounds(x, detail.to.y, true);
						ctx.moveTo(startCell.centerX(),startCell.centerY());
						ctx.lineTo(endCell.centerX(),endCell.centerY());
					}
					ctx.stroke();
					break;
				case Board.CellRangeStyle.Plain:
					var rect = this.getRectangleForRange(detail.from, detail.to);
					ctx.fillStyle = this.color3;
					ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
					break;
				}
			}
			else if ( detail instanceof BoardLine )
			{
				var xToEdge; var yToEdge;
				switch ( detail.alignment )
				{
				case Board.LineAlignment.Center:
					xToEdge = false; yToEdge = false; break;
				case Board.LineAlignment.Corner:
					xToEdge = true; yToEdge = true; break;
				case Board.LineAlignment.VerticalEdge:
					xToEdge = true; yToEdge = false; break;
				case Board.LineAlignment.HorizontalEdge:
					xToEdge = false; yToEdge = true; break;
				default:
					xToEdge = false; yToEdge = false; break;
				}
				
				var from = this.getCellBounds(detail.from.x, detail.from.y, true);
				var to = this.getCellBounds(detail.to.x, detail.to.y, true);
				var x1; var x2; var y1; var y2;

				if ( xToEdge ) {
					if ( from.x <= to.x ) {
						x1 = from.x;
						x2 = to.x + to.w;
					}
					else {
						x1 = from.x + from.w;
						x2 = to.x;
					}		
				}
				else {
					x1 = from.centerX();
					x2 = to.centerX();
				}
				
				if ( yToEdge ) {
					if ( from.y <= to.y ) {
						y1 = from.y;
						y2 = to.y + to.h;
					}
					else {
						y1 = from.y + from.h;
						y2 = to.y;
					}
				}
				else {
					y1 = from.centerY();
					y2 = to.centerY();
				}
				
				ctx.strokeStyle = this.color2;
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
			}
			else
	                        throw "Unexpected board detail type, cannot render: " + detail;
		}
		
		// now see if we should render cell references
		if ( this.showCellReferences != Board.CellReferenceStyle.None ) {
			var rankMin = this.getCellBounds(this.xMin, this.yMin, true);
			var rankMax = this.getCellBounds(this.xMin, this.yMax, true);
			var topmostRank = rankMin.y < rankMax.y ? this.yMin - 1 : this.yMax + 1;
			var bottommostRank = rankMin.y < rankMax.y ? this.yMax + 1 : this.yMin - 1;
			
			ctx.font = (Math.floor(this.cellSize * this.cellReferenceFractionOfCellSize) - 4) + "px Georgia";
			ctx.fillStyle = this.color3;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			
			// draw left side
			for ( var y = this.yMin; y<=this.yMax; y++ ) {
				var rect = this.getCellBounds(this.xMin - 1, y, true);
				rect.x += this.cellSize - this.cellSize * this.cellReferenceFractionOfCellSize;
				rect.w *= this.cellReferenceFractionOfCellSize;
				ctx.fillText(y,rect.centerX(),rect.centerY());
			}
			
			// draw right side
			if ( this.showCellReferences == Board.CellReferenceStyle.AllSides )
				for ( var y = this.yMin; y<=this.yMax; y++ ) {
					var rect = this.getCellBounds(this.xMax + 1, y, true);
					rect.w *= this.cellReferenceFractionOfCellSize;
					ctx.fillText(y,rect.centerX(),rect.centerY());
				}
				
			// draw bottom side
			if ( this.showCellReferences == Board.CellReferenceStyle.BottomLeft || this.showCellReferences == Board.CellReferenceStyle.AllSides )
				for ( var x = this.xMin; x<=this.xMax; x++ ) {
					var rect = this.getCellBounds(x, this.yMin - 1, true);
					rect.h *= this.cellReferenceFractionOfCellSize;
					ctx.fillText(Coord.columnName(x),rect.centerX(),rect.centerY());
				}
				
			// draw top side
			if ( this.showCellReferences == Board.CellReferenceStyle.TopLeft || this.showCellReferences == Board.CellReferenceStyle.AllSides )
				for ( var x = this.xMin; x<=this.xMax; x++ ) {
					var rect = this.getCellBounds(x, this.yMax + 1, true);
					rect.y += this.cellSize - this.cellSize * this.cellReferenceFractionOfCellSize;
					rect.h *= this.cellReferenceFractionOfCellSize;
					ctx.fillText(Coord.columnName(x),rect.centerX(),rect.centerY());
				}
		}
	},
	
	createElementsForAllPieces: function() {
		for ( var i=0; i<this.game.players.length; i++ )
			for ( var j=0; j<this.game.players[i].piecesOnBoard.length; j++ )
				this.createElement(this.game.players[i].piecesOnBoard[j], this.game.variantDir);
		
		$(".piece")
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
	
	createElement: function(piece, gameDir) {
		var rect = this.getCellBounds(piece.position.x, piece.position.y, true);
	
		$("#game").append('<div id="' + piece.position + '" class="' + piece.getCssClass() + '" style="' +
		'left:' + rect.x + 'px; top:' + rect.y + 'px; ' +
		'width:' + rect.w + 'px; height:' + rect.h + 'px; ' +
		'background-image:url(\'' + piece.getPieceImage(gameDir) + '\')' +
		'"></div>');
		$("#" + piece.position).get(0).tag = piece;
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
		var rect = this.getCellBounds(endPos.x, endPos.y, true);
		
		$("#game").append('<div id="move' + number + '" class="move ' + type + '" style="' +
		'left:' + rect.x + 'px; top:' + rect.y + 'px; ' +
		'width:' + rect.w + 'px; height:' + rect.h + 'px;"></div>');
		
		$("#move" + number).get(0).tag = move;
	},
	
	moveSelected: function(marker) {
		var move = $(marker).get(0).tag;
		this.removeAllMoveMarkers();
		$(".piece.selected").removeClass("selected");
		this.game.performMove(move);
	}
});

Board.LineAlignment = {
	Center : 0,
	Corner : 1,
	VerticalEdge : 2,
	HorizontalEdge : 3
}

Board.CellRangeStyle = {
	Alternating: 0,
	Grid : 1,
	Lines : 2,
	Plain : 3
}

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