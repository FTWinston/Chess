MoveDefinition = new Class({
	initialize: function() {
		this.nextStep = null;
	},
	
	allowTopLevel: function() { return false; },
	
	appendValidNextSteps: function(move, piece, game, previousStep) {
		return [];
	}
});

MoveElement = new Class({
    Extends: MoveDefinition,
    
	initialize: function(pieceRef, dirs, when, conditions) {
		this.parent();
        this.piece = pieceRef;
        this.dirs = dirs;
		this.moveWhen = when;
		this.conditions = Condition.loadConditions(conditions);
    },
	
	allowTopLevel: function() { return true; }
});

MoveDefinition.When = {
	Any: 0,
	Move: 1,
	Capture: 2
}

MoveDefinition.Owner = {
	Any: 0,
	Self: 1,
	Enemy: 2,
	Ally: 3
}

Distance = new Class({
	initialize: function(reference, number) {
		this.numeric = number;
		this.reference = reference;
	},
	
	equals: function(other) {
		return this.numeric == other.numeric && this.reference == other.reference;
	}
});

Distance.RelativeTo = {
	None: 1,
	Max: 2,
	Prev: 3
}

Distance.Any = new Distance(Distance.RelativeTo.None, -1);
Distance.Zero = new Distance(Distance.RelativeTo.None, 0);

Distance.ParseValue = function(dist, previousStep, maxProjectionDist) { // changed signature to return value instead of out parameter
	switch ( dist.reference )
	{
	case Distance.RelativeTo.None:
		return dist.equals(Distance.Any) ? 1 : dist.numeric;
	case Distance.RelativeTo.Max:
		return maxProjectionDist + dist.numeric;
	case Distance.RelativeTo.Prev:
		if ( previousStep != null )
			return previousStep.distance + dist.numeric;
		return dist.numeric;
	default:
		throw "Unexpected Distance.RelativeTo value in Distance.ParseValue: " + dist.reference;
	}
}

Distance.ParseValues = function(dist, dist2, previousStep, maxProjectionDist) { // changed signature to return array instead of out parameters
	var outDist1 = Distance.ParseValue(dist, previousStep, maxProjectionDist);
	var outDist2;
	
	if ( dist.equals(Distance.Any) )
		outDist2 = maxProjectionDist;
	else if ( dist2 == null )
		outDist2 = outDist1;
	else
	{
		outDist2 = Distance.ParseValue(dist2, previousStep, maxProjectionDist);
		if ( outDist2 > maxProjectionDist )
			outDist2 = maxProjectionDist;
	}
	
	if ( outDist1 > outDist2 )
		return [outDist2, outDist1];
	return [outDist1, outDist2];
}


MoveDefinition.PartOfMove = {
	WholeRoute: 0,
	Start: 1,
	Destination: 2
}

MoveDefinition.PartOfTurn = {
	Either: 0,
	Before: 1,
	After: 2
}

MoveDefinition.PerpendicularDir = {
	Both: 0,
	Left: 1,
	Right: 2
}

// these vary depending on the current player's forward direction, or the last direction a piece moved in
// every other (non-absolute) direction can be resolved (at runtime) down to 1 or many of these
MoveDefinition.Direction = {
	None: 0,
	Forward: 1,
	Backward: 2,
	Left: 3,
	Right: 4,
	Forward_Diagonal_Left: 5,
	Forward_Diagonal_Right: 6,
	Backward_Diagonal_Left: 7,
	Backward_Diagonal_Right: 8,

	Relative_Same: 9,
	Relative_Opposite: 10,
	Relative_Left_90: 11,
	Relative_Right_90: 12,
	Relative_Left_45: 13,
	Relative_Right_45: 14,
	Relative_Left_135: 15,
	Relative_Right_135: 16,
}

// now the "groups" that resolve to multiple directions
MoveDefinition.Direction.Orthogonal = [ MoveDefinition.Direction.Forward, MoveDefinition.Direction.Backward, MoveDefinition.Direction.Left, MoveDefinition.Direction.Right ];
MoveDefinition.Direction.Diagonal = [ MoveDefinition.Direction.Forward_Diagonal_Left, MoveDefinition.Direction.Forward_Diagonal_Right, MoveDefinition.Direction.Backward_Diagonal_Left, MoveDefinition.Direction.Backward_Diagonal_Right ];
MoveDefinition.Direction.Any = [ MoveDefinition.Direction.Forward, MoveDefinition.Direction.Backward, MoveDefinition.Direction.Left, MoveDefinition.Direction.Right, MoveDefinition.Direction.Forward_Diagonal_Left, MoveDefinition.Direction.Forward_Diagonal_Right, MoveDefinition.Direction.Backward_Diagonal_Left, MoveDefinition.Direction.Backward_Diagonal_Right ];

MoveDefinition.Direction.Sideways = [ MoveDefinition.Direction.Left, MoveDefinition.Direction.Right ];
MoveDefinition.Direction.Forward_Backward = [ MoveDefinition.Direction.Forward, MoveDefinition.Direction.Backward ];
MoveDefinition.Direction.ForwardDiagonal = [ MoveDefinition.Direction.Forward_Diagonal_Left, MoveDefinition.Direction.Forward_Diagonal_Right];
MoveDefinition.Direction.BackwardDiagonal = [ MoveDefinition.Direction.Backward_Diagonal_Left, MoveDefinition.Direction.Backward_Diagonal_Right ];
MoveDefinition.Direction.LeftDiagonal = [ MoveDefinition.Direction.Forward_Diagonal_Left, MoveDefinition.Direction.Backward_Diagonal_Left ];
MoveDefinition.Direction.RightDiagonal = [ MoveDefinition.Direction.Backward_Diagonal_Right, MoveDefinition.Direction.Forward_Diagonal_Right ];
/*
MoveDefinition.Direction.ForwardLeft_BackwardRight = [ MoveDefinition.Direction.Forward_Diagonal_Left, MoveDefinition.Direction.Backward_Diagonal_Right ];
MoveDefinition.Direction.ForwardRight_BackwardLeft = [ MoveDefinition.Direction.Forward_Diagonal_Right, MoveDefinition.Direction.Backward_Diagonal_Left ];
MoveDefinition.Direction.Forward_Left = [ MoveDefinition.Direction.Left, MoveDefinition.Direction.Forward ];
MoveDefinition.Direction.Backward_Left = [ MoveDefinition.Direction.Left, MoveDefinition.Direction.Backward ];
MoveDefinition.Direction.Forward_Right = [ MoveDefinition.Direction.Right, MoveDefinition.Direction.Forward ];
MoveDefinition.Direction.Backward_Right = [  MoveDefinition.Direction.Right, MoveDefinition.Direction.Backward ];
*/
MoveDefinition.Direction.Relative_Perpendicular = [ MoveDefinition.Direction.Relative_Left_90, MoveDefinition.Direction.Relative_Right_90 ];
MoveDefinition.Direction.Relative_Turn_45 = [ MoveDefinition.Direction.Relative_Left_45, MoveDefinition.Direction.Relative_Right_45 ];
MoveDefinition.Direction.Relative_Turn_135 = [ MoveDefinition.Direction.Relative_Left_135, MoveDefinition.Direction.Relative_Right_135 ];

MoveDefinition.ParseDirection = function(dir) { // renamed from ResolveDiscreetDirections
	switch (dir)
	{
	case "orthogonal":
		return MoveDefinition.Direction.Orthogonal;
	case "diagonal":
		return MoveDefinition.Direction.Diagonal;
	case "any":
		return MoveDefinition.Direction.Any;
	case "forward":
		return [MoveDefinition.Direction.Forward];
	case "backward":
		return [MoveDefinition.Direction.Backward];
	case "left":
		return [MoveDefinition.Direction.Left];
	case "right":
		return [MoveDefinition.Direction.Right];
	case "sideways":
		return MoveDefinition.Direction.Sideways;
	case "forward-left":
		return [MoveDefinition.Direction.Forward_Diagonal_Left];
	case "forward-right":
		return [MoveDefinition.Direction.Forward_Diagonal_Right];
	case "forward-diagonal":
		return MoveDefinition.Direction.ForwardDiagonal;
	case "backward-left":
		return [MoveDefinition.Direction.Backward_Diagonal_Left];
	case "backward-right":
		return [MoveDefinition.Direction.Backward_Diagonal_Right];
	case "backward-diagonal":
		return MoveDefinition.Direction.BackwardDiagonal;
	case "left-diagonal":
		return MoveDefinition.Direction.LeftDiagonal;
	case "right-diagonal":
		return MoveDefinition.Direction.RightDiagonal;
	case "same":
		return [MoveDefinition.Direction.Relative_Same];
	case "opposite":
		return [MoveDefinition.Direction.Relative_Opposite];
	case "left-90":
		return [MoveDefinition.Direction.Relative_Left_90];
	case "right-90":
		return [MoveDefinition.Direction.Relative_Right_90];
	case "left-45":
		return [MoveDefinition.Direction.Relative_Left_45];
	case "right-45":
		return [MoveDefinition.Direction.Relative_Right_45];
	case "left-135":
		return [MoveDefinition.Direction.Relative_Left_135];
	case "right-135":
		return [MoveDefinition.Direction.Relative_Right_135];
	case "perpendicular":
		return MoveDefinition.Direction.Relative_Perpendicular;
	case "turn-45":
		return MoveDefinition.Direction.Relative_Turn_45;
	case "turn-135":
		return MoveDefinition.Direction.Relative_Turn_135;
	default:
		throw "Direction not recognized: " + dir;
	}
}

MoveDefinition.ResolveRelativeDirection = function(relative, prev)
{
	switch (relative)
	{
	case MoveDefinition.Direction.Relative_Same:
		return [prev];
	case MoveDefinition.Direction.Relative_Opposite:
		switch (prev)
		{
		case MoveDefinition.Direction.Forward:
			return [MoveDefinition.Direction.Backward];
		case MoveDefinition.Direction.Backward:
			return [MoveDefinition.Direction.Forward];
		case MoveDefinition.Direction.Left:
			return [MoveDefinition.Direction.Right];
		case MoveDefinition.Direction.Right:
			return [MoveDefinition.Direction.Left];
		case MoveDefinition.Direction.Backward_Diagonal_Left:
			return [MoveDefinition.Direction.Forward_Diagonal_Right];
		case MoveDefinition.Direction.Backward_Diagonal_Right:
			return [MoveDefinition.Direction.Forward_Diagonal_Left];
		case MoveDefinition.Direction.Forward_Diagonal_Left:
			return [MoveDefinition.Direction.Backward_Diagonal_Right];
		case MoveDefinition.Direction.Forward_Diagonal_Right:
			return [MoveDefinition.Direction.Backward_Diagonal_Left];
		}
		break;
	case MoveDefinition.Direction.Relative_Left_90:
		switch (prev)
		{
		case MoveDefinition.Direction.Forward:
			return [MoveDefinition.Direction.Left];
		case MoveDefinition.Direction.Backward:
			return [MoveDefinition.Direction.Right];
		case MoveDefinition.Direction.Left:
			return [MoveDefinition.Direction.Backward];
		case MoveDefinition.Direction.Right:
			return [MoveDefinition.Direction.Forward];
		case MoveDefinition.Direction.Backward_Diagonal_Left:
			return [MoveDefinition.Direction.Backward_Diagonal_Right];
		case MoveDefinition.Direction.Backward_Diagonal_Right:
			return [MoveDefinition.Direction.Forward_Diagonal_Right];
		case MoveDefinition.Direction.Forward_Diagonal_Left:
			return [MoveDefinition.Direction.Backward_Diagonal_Left];
		case MoveDefinition.Direction.Forward_Diagonal_Right:
			return [MoveDefinition.Direction.Forward_Diagonal_Left];
		}
		break;
	case MoveDefinition.Direction.Relative_Right_90:
		switch (prev)
		{
		case MoveDefinition.Direction.Forward:
			return [MoveDefinition.Direction.Right];
		case MoveDefinition.Direction.Backward:
			return [MoveDefinition.Direction.Left];
		case MoveDefinition.Direction.Left:
			return [MoveDefinition.Direction.Forward];
		case MoveDefinition.Direction.Right:
			return [MoveDefinition.Direction.Backward];
		case MoveDefinition.Direction.Backward_Diagonal_Left:
			return [MoveDefinition.Direction.Forward_Diagonal_Left];
		case MoveDefinition.Direction.Backward_Diagonal_Right:
			return [MoveDefinition.Direction.Backward_Diagonal_Left];
		case MoveDefinition.Direction.Forward_Diagonal_Left:
			return [MoveDefinition.Direction.Forward_Diagonal_Right];
		case MoveDefinition.Direction.Forward_Diagonal_Right:
			return [MoveDefinition.Direction.Backward_Diagonal_Right];
		}
		break;
	case MoveDefinition.Direction.Relative_Left_45:
		switch (prev)
		{
		case MoveDefinition.Direction.Forward:
			return [MoveDefinition.Direction.Forward_Diagonal_Left];
		case MoveDefinition.Direction.Backward:
			return [MoveDefinition.Direction.Backward_Diagonal_Right];
		case MoveDefinition.Direction.Left:
			return [MoveDefinition.Direction.Backward_Diagonal_Left];
		case MoveDefinition.Direction.Right:
			return [MoveDefinition.Direction.Forward_Diagonal_Right];
		case MoveDefinition.Direction.Backward_Diagonal_Left:
			return [MoveDefinition.Direction.Backward];
		case MoveDefinition.Direction.Backward_Diagonal_Right:
			return [MoveDefinition.Direction.Right];
		case MoveDefinition.Direction.Forward_Diagonal_Left:
			return [MoveDefinition.Direction.Left];
		case MoveDefinition.Direction.Forward_Diagonal_Right:
			return [MoveDefinition.Direction.Forward];
		}
		break;
	case MoveDefinition.Direction.Relative_Right_45:
		switch (prev)
		{
		case MoveDefinition.Direction.Forward:
			return [MoveDefinition.Direction.Forward_Diagonal_Right];
		case MoveDefinition.Direction.Backward:
			return [MoveDefinition.Direction.Backward_Diagonal_Left];
		case MoveDefinition.Direction.Left:
			return [MoveDefinition.Direction.Forward_Diagonal_Left];
		case MoveDefinition.Direction.Right:
			return [MoveDefinition.Direction.Backward_Diagonal_Right];
		case MoveDefinition.Direction.Backward_Diagonal_Left:
			return [MoveDefinition.Direction.Left];
		case MoveDefinition.Direction.Backward_Diagonal_Right:
			return [MoveDefinition.Direction.Backward];
		case MoveDefinition.Direction.Forward_Diagonal_Left:
			return [MoveDefinition.Direction.Forward];
		case MoveDefinition.Direction.Forward_Diagonal_Right:
			return [MoveDefinition.Direction.Right];
		}
		break;
	case MoveDefinition.Direction.Relative_Left_135:
		switch (prev)
		{
		case MoveDefinition.Direction.Forward:
			return [MoveDefinition.Direction.Backward_Diagonal_Left];
		case MoveDefinition.Direction.Backward:
			return [MoveDefinition.Direction.Forward_Diagonal_Right];
		case MoveDefinition.Direction.Left:
			return [MoveDefinition.Direction.Backward_Diagonal_Right];
		case MoveDefinition.Direction.Right:
			return [MoveDefinition.Direction.Forward_Diagonal_Left];
		case MoveDefinition.Direction.Backward_Diagonal_Left:
			return [MoveDefinition.Direction.Right];
		case MoveDefinition.Direction.Backward_Diagonal_Right:
			return [MoveDefinition.Direction.Forward];
		case MoveDefinition.Direction.Forward_Diagonal_Left:
			return [MoveDefinition.Direction.Backward];
		case MoveDefinition.Direction.Forward_Diagonal_Right:
			return [MoveDefinition.Direction.Left];
		}
		break;
	case MoveDefinition.Direction.Relative_Right_135:
		switch (prev)
		{
		case MoveDefinition.Direction.Forward:
			return [MoveDefinition.Direction.Backward_Diagonal_Right];
		case MoveDefinition.Direction.Backward:
			return [MoveDefinition.Direction.Forward_Diagonal_Left];
		case MoveDefinition.Direction.Left:
			return [MoveDefinition.Direction.Forward_Diagonal_Right];
		case MoveDefinition.Direction.Right:
			return [MoveDefinition.Direction.Backward_Diagonal_Left];
		case MoveDefinition.Direction.Backward_Diagonal_Left:
			return [MoveDefinition.Direction.Forward];
		case MoveDefinition.Direction.Backward_Diagonal_Right:
			return [MoveDefinition.Direction.Left];
		case MoveDefinition.Direction.Forward_Diagonal_Left:
			return [MoveDefinition.Direction.Right];
		case MoveDefinition.Direction.Forward_Diagonal_Right:
			return [MoveDefinition.Direction.Backward];
		}
		break;
	default:
		throw "Relative direction not recognized: " + relative.ToString();
	}
	throw "Invalid previous direction when calculating relative: " + prev.ToString();
}

MoveDefinition.Direction.IsRelative = function(dir) {
	return dir >= MoveDefinition.Direction.Relative_Same;
}

MoveDefinition.loadFromXml = function(xmlNode, isTopLevel) {
	switch ($(xmlNode).get(0).nodeName.toLowerCase())
	{
	case "slide":
		return Slide.loadFromXml(xmlNode);
	case "leap":
		return Leap.loadFromXml(xmlNode);
	case "hop":
		return Hop.loadFromXml(xmlNode);
	case "shoot":
		return Shoot.loadFromXml(xmlNode);
	case "move_like":
		return MoveLike.loadFromXml(xmlNode);
	case "sequence":
		if (!isTopLevel)
			throw xmlNode.Name + " only allowed at top level!";
		return Sequence.loadFromXml(xmlNode);
	case "repeat":
		if (isTopLevel)
			throw xmlNode.Name + " not allowed at top level!";
		return Repeat.loadFromXml(xmlNode);
	case "when_possible":
		if (isTopLevel)
			throw xmlNode.Name + " not allowed at top level!";
		return WhenPossible.loadFromXml(xmlNode);
	case "reference_piece":
		if (isTopLevel)
			throw xmlNode.Name + " not allowed at top level!";
		return ReferencePiece.loadFromXml(xmlNode);
	case "arbitrary_attack":
		if (isTopLevel)
			throw xmlNode.Name + " not allowed at top level!";
		return ArbitraryAttack.loadFromXml(xmlNode);
	default:
		throw "Unexpected move type: " + $(xmlNode).get(0).nodeName.toLowerCase();
	}
}

Slide = new Class({
	Extends: MoveElement,
    
	initialize: function(pieceRef, dirs, dist, dist2, when, conditions) {
		this.parent(pieceRef, dirs, when, conditions)
		this.dist = dist;
		this.dist2 = dist2;
    },
	
	appendValidNextSteps: function(move, piece, game, previousStep) {
		var moves = [];
		var absDirs = move.player.getAbsoluteDirections(this.dirs, previousStep != null && previousStep.direction != null ? previousStep.direction : piece.ownerPlayer.forwardDir);
		
		for ( var i=0; i<absDirs.length; i++ )
		{
			var absDir = absDirs[i];
			var maxProjectionDist = game.board.getMaxProjectionDistance(piece.position, absDir);
			var distances = Distance.ParseValues(this.dist, this.dist2, previousStep, maxProjectionDist);
			for (var dist = 1; dist <= distances[1]; dist++)
			{
				// these checks need to occur on cells up to the minimum, to allow for blocking by intervening pieces
				var dest = piece.position.offset(absDir, dist);
				if ( !game.board.isValidCell(dest) )
					break; // can't slide over invalid cells, so this must be the end
				
				var target = game.board.getPieceAt(dest);
				
				if ( dist >= distances[0] )
				{
					var captureStep = null;
					if ( this.moveWhen == MoveDefinition.When.Capture )
					{
						if (target == null)
							continue; // needs to be a capture for this to be valid, and there isn't a piece here - but there may be pieces beyond this one
						else if (piece.canCapture(target))
							captureStep = MoveStep.CreateCapture(target, target.position, piece.ownerPlayer, game.rules.holdCapturedPieces); // todo: check this is right, once rules are loaded
						else
							break; // cannot capture this piece, and also cannot move beyond it
					}
					else if ( this.moveWhen == MoveDefinition.When.Move && target != null )
						break; // needs to be a non-capture to be valid, and we're blocked by a piece, so can be no more valid slides in this direction
					else if ( target != null )
						if (piece.canCapture(target))
							captureStep = MoveStep.CreateCapture(target, target.position, piece.ownerPlayer, game.rules.holdCapturedPieces);
						else
							break; // cannot capture this piece (probably own it)
					
					var newMove = move.clone();
					if (captureStep != null)
					{
						newMove.addStep(captureStep);
						newMove.addPieceReference(target, "target");
					}
					newMove.addStep(MoveStep.Create(piece, piece.position, dest, MoveAppearance.Slide, dist, absDir));
					if (this.conditions.isSatisfied(newMove, game))
						moves.push(newMove);
				}
				
				if (target != null)
					break; // slides can't pass intervening pieces, so as this cell was occupied, there can be no more valid slides in this direction
			}
		}

		return moves;
	}
});

Slide.loadFromXml = function(xmlNode, isTopLevel) {
	var conditions = $(xmlNode).children("conditions");
	
	var pieceRef = $(xmlNode).attr("piece");
	if ( pieceRef == undefined )
		pieceRef = "self";

	var dirs = MoveDefinition.ParseDirection($(xmlNode).attr("dir"));
	
	var dist = XmlHelper.readDistance(xmlNode, "dist");
	var dist2 = XmlHelper.readDistance(xmlNode, "dist2");
	var when = XmlHelper.readWhen(xmlNode, "when");

	return new Slide(pieceRef, dirs, dist, dist2, when, conditions == null ? null : conditions.children());
}

Leap = new Class({
	Extends: MoveElement,
	
	initialize: function(pieceRef, dirs, dist, dist2, perpDir, perpDist, when, conditions) {
		this.parent(pieceRef, dirs, when, conditions)
		this.dist = dist;
		this.dist2 = dist2;
		this.perpDir = perpDir;
		this.perpDist = perpDist;
	},
	
	appendValidNextSteps: function(move, piece, game, previousStep) {
		var moves = [];

		var absDirs = move.player.getAbsoluteDirections(this.dirs, previousStep != null && previousStep.direction != null ? previousStep.direction : piece.ownerPlayer.forwardDir);
		
		for ( var i=0; i<absDirs.length; i++ )
		{
			var absDir = absDirs[i];
			var maxProjectionDist = game.board.getMaxProjectionDistance(piece.position, absDir);
			var distances = Distance.ParseValues(this.dist, this.dist2, previousStep, maxProjectionDist);
			
			absPerpDirs = Leap.getAbsPerpendicularDirs(absDir, this.perpDir);
			for ( var j=0; j<absPerpDirs.length; j++ )
			{
				var absPerpDir = absPerpDirs[j];
				var maxPerpProjectionDistance = game.board.getMaxProjectionDistance(piece.position, absPerpDir); // using piece.position here is wrong, but as the first step may be of any distance, seems like the easiest way
				var perpDistances = Distance.ParseValues(this.perpDist, this.dist2, previousStep, maxProjectionDist);
				
				for (var dist = distances[0]; dist <= distances[1]; dist++)
					for (var perpDist = perpDistances[0]; perpDist <= perpDistances[1]; perpDist++)
					{
						var dest = piece.position.offset(absDir, dist).offset(absPerpDir, perpDist);
						
						if ( !game.board.isValidCell(dest) )
							continue; // this destination is invalid, but try the others if there are any
						
						var captureStep = null;
						var target = game.board.getPieceAt(dest);
						
						if ( this.moveWhen == MoveDefinition.When.Capture )
						{
							if ( target == null )
								continue; // needs to be a capture for this to be valid, and there isn't a piece here
							else if ( piece.canCapture(target) )
								captureStep = MoveStep.CreateCapture(target, target.position, piece.ownerPlayer, game.rules.holdCapturedPieces); // todo: check this is right, once rules are loaded
							else
								continue; // cannot capture this piece
						}
						else if ( this.moveWhen == MoveDefinition.When.Move && target == null )
							continue; // needs to be a non-capture to be valid, and this destination cell is occupied
						else if (target != null)
                                if (piece.canCapture(target))
									captureStep = MoveStep.CreateCapture(target, target.position, piece.ownerPlayer, game.rules.holdCapturedPieces);
								else
									continue;
						
						var newMove = move.clone();
						if (captureStep != null)
						{
							newMove.addStep(captureStep);
							newMove.addPieceReference(target, "target");
						}
						newMove.addStep(MoveStep.Create(piece, piece.position, dest, MoveAppearance.Leap, perpDist > 0 ? perpDist : dist, perpDist > 0 ? absPerpDir : absDir));
						if (this.conditions.isSatisfied(newMove, game))
							moves.push(newMove);
					}
			}
		}
		return moves;
	}
});

Leap.getAbsPerpendicularDirs = function(absDir, perpDir) {
	dirs = [];
	switch ( absDir )
	{
	case AbsoluteDirection.North:
		dirs.push(perpDir == MoveDefinition.PerpendicularDir.Right ? AbsoluteDirection.East : AbsoluteDirection.West);
		if ( perpDir == MoveDefinition.PerpendicularDir.Both )
			dirs.push(AbsoluteDirection.East);
		break;
	case AbsoluteDirection.South:
		dirs.push(perpDir == MoveDefinition.PerpendicularDir.Right ? AbsoluteDirection.West : AbsoluteDirection.East);
		if ( perpDir == MoveDefinition.PerpendicularDir.Both )
			dirs.push(AbsoluteDirection.West);
		break;
	case AbsoluteDirection.East:
		dirs.push(perpDir == MoveDefinition.PerpendicularDir.Right ? AbsoluteDirection.South : AbsoluteDirection.North);
		if ( perpDir == MoveDefinition.PerpendicularDir.Both )
			dirs.push(AbsoluteDirection.South);
		break;
	case AbsoluteDirection.West:
		dirs.push(perpDir == MoveDefinition.PerpendicularDir.Right ? AbsoluteDirection.North : AbsoluteDirection.South);
		if ( perpDir == MoveDefinition.PerpendicularDir.Both )
			dirs.push(AbsoluteDirection.North);
		break;
	case AbsoluteDirection.NorthWest:
		dirs.push(perpDir == MoveDefinition.PerpendicularDir.Right ? AbsoluteDirection.NorthEast : AbsoluteDirection.SouthWest);
		if ( perpDir == MoveDefinition.PerpendicularDir.Both )
			dirs.push(AbsoluteDirection.NorthEast);
		break;
	case AbsoluteDirection.NorthEast:
		dirs.push(perpDir == MoveDefinition.PerpendicularDir.Right ? AbsoluteDirection.SouthEast : AbsoluteDirection.NorthWest);
		if ( perpDir == MoveDefinition.PerpendicularDir.Both )
			dirs.push(AbsoluteDirection.SouthEast);
		break;
	case AbsoluteDirection.SouthWest:
		dirs.push(perpDir == MoveDefinition.PerpendicularDir.Right ? AbsoluteDirection.NorthWest : AbsoluteDirection.SouthEast);
		if ( perpDir == MoveDefinition.PerpendicularDir.Both )
			dirs.push(AbsoluteDirection.NorthWest);
		break;
	case AbsoluteDirection.SouthEast:
		dirs.push(perpDir == MoveDefinition.PerpendicularDir.Right ? AbsoluteDirection.SouthWest : AbsoluteDirection.NorthEast);
		if ( perpDir == MoveDefinition.PerpendicularDir.Both )
			dirs.push(AbsoluteDirection.SouthWest);
		break;
	default:
		throw "Unexpected direction in Leap.GetAbsPerpendicularDir: " + dir.ToString();
	}
	return dirs;
}

Leap.loadFromXml = function(xmlNode, isTopLevel) {
	var conditions = $(xmlNode).children("conditions");
	
	var pieceRef = $(xmlNode).attr("piece");
	if ( pieceRef == undefined )
		pieceRef = "self";
	
	var dirs = MoveDefinition.ParseDirection($(xmlNode).attr("dir"));
	
	var dist = XmlHelper.readDistance(xmlNode, "dist");
	var dist2 = XmlHelper.readDistance(xmlNode, "dist2");
	
	var perpDist = XmlHelper.readDistance(xmlNode, "perpdist");
	if ( perpDist == null )
		perpDist = Distance.Zero;
	
	var perpDir = $(xmlNode).attr("perpdir");
	if ( perpDir == "both" )
		perpDir = MoveDefinition.PerpendicularDir.Both;
	else if ( perpDir == "right" )
		perpDir = MoveDefinition.PerpendicularDir.Right;
	else
		perpDir = MoveDefinition.PerpendicularDir.Left; // default if undefined
	
	var when = XmlHelper.readWhen(xmlNode, "when");
	
	return new Leap(pieceRef, dirs, dist, dist2, perpDir, perpDist, when, conditions.children());
}

Hop = new Class({
	Extends: MoveElement,
	
	initialize: function(pieceRef, dirs, distToHurdle, distAfterHurdle, when, captureHurdle, conditions) {
		this.parent(pieceRef, dirs, when, conditions)
		this.distToHurdle = distToHurdle;
		this.distAfterHurdle = distAfterHurdle;
		this.captureHurdle = captureHurdle;
	},
	
	appendValidNextSteps: function(move, piece, game, previousStep) {
		var moves = [];
		
		var absDirs = move.player.getAbsoluteDirections(this.dirs, previousStep != null && previousStep.direction != null ? previousStep.direction : piece.ownerPlayer.forwardDir);
		
		for ( var i=0; i<absDirs.length; i++ )
		{
			var absDir = absDirs[i];
			var maxProjectionDist = game.board.getMaxProjectionDistance(piece.position, absDir);
			var distancesTo = Distance.ParseValues(this.distToHurdle, null, previousStep, maxProjectionDist);
			var distancesAfter = Distance.ParseValues(this.distAfterHurdle, null, previousStep, maxProjectionDist);
			
			var passedTwoPieces = false;
			for (var distTo = 1; distTo <= distancesTo[1]; distTo++)
			{
				if (passedTwoPieces)
					break; // breaking out of the end of the inner loop, we want break out of both loops.
				// these checks need to occur on cells up to the minimum, to allow for blocking by intervening pieces
				var hurdlePos = piece.position.offset(absDir, distTo);
				if (!game.board.isValidCell(hurdlePos))
					break; // can't hop over invalid cells, so this must be the end

				var hurdle = game.board.getPieceAt(hurdlePos);
				if (distTo < distancesTo[0])
				{
					if (hurdle != null)
						break; // hurdle is too close, cannot hop in this direction at all
				}
				else
				{
					if (hurdle == null)
						continue; // need a hurdle piece to be able to make this move

					for (var distAfter = 1; distAfter <= distancesAfter[1]; distAfter++)
					{
						var dest = hurdle.position.offset(absDir, distAfter);
						if (!game.board.isValidCell(dest))
							break; // can't hop over invalid cells, so this must be the end

						var target = game.board.getPieceAt(dest);

						var captureStep = null;
						if ( this.moveWhen == MoveDefinition.When.Capture )
						{
							if ( target == null )
								continue; // needs to be a capture for this to be valid, and there isn't a piece here - but there may be pieces beyond this one
							else if ( piece.canCapture(target) )
								captureStep = MoveStep.CreateCapture(target, target.position, piece.ownerPlayer, game.rules.holdCapturedPieces);
							else
								break; // cannot capture this piece, and also cannot move beyond it
						}
						else if ( this.moveWhen == MoveDefinition.When.Move && target == null )
							continue; // needs to be a non-capture to be valid, and we're blocked by a piece, so can be no more valid moves in this direction
						else if (target != null)
							if ( piece.canCapture(target) )
								captureStep = MoveStep.CreateCapture(target, target.position, piece.ownerPlayer, game.rules.holdCapturedPieces);
							else
								break;
						
						var newMove = move.clone();
						newMove.addPieceReference(hurdle, "hurdle");
						if (this.captureHurdle)
							MoveStep.CreateCapture(hurdle, hurdle.position, piece.ownerPlayer, game.rules.holdCapturedPieces);
						
						if (captureStep != null)
						{
							newMove.addStep(captureStep);
							newMove.addPieceReference(target, "target");
						}
						
						newMove.addStep(MoveStep.Create(piece, piece.position, dest, MoveAppearance.Slide, distTo + distAfter, absDir));
						if (this.conditions.isSatisfied(newMove, game))
							moves.push(newMove);
						
						if ( target != null )
						{
							passedTwoPieces = true;
							break; // have already hopped over one piece & can't pass another, so as this cell was occupied, there can be no more valid moves in this direction
						}
					}
				}
			}
		}
		return moves;
	}
});

Hop.loadFromXml = function(xmlNode, isTopLevel) {
	var conditions = $(xmlNode).children("conditions");
	
	var pieceRef = $(xmlNode).attr("piece");
	if ( pieceRef == undefined )
		pieceRef = "self";
	
	var dirs = MoveDefinition.ParseDirection($(xmlNode).attr("dir"));
	
	var distToHurdle = XmlHelper.readDistance(xmlNode, "dist_to_hurdle");
	var distAfterHurdle = XmlHelper.readDistance(xmlNode, "dist_after_hurdle");
	
	var when = XmlHelper.readWhen(xmlNode, "when");
	var captureHurdle = XmlHelper.readBool($(xmlNode).attr("capture_hurdle"));
	
	return new Hop(pieceRef, dirs, distToHurdle, distAfterHurdle, when, captureHurdle, conditions.children());
}

Shoot = new Class({
	Extends: MoveElement,
	
	initialize: function(pieceRef, dirs, dist, dist2, perpDir, perpDist, when, conditions) {
		this.parent(pieceRef, dirs, when, conditions)
		this.dist = dist;
		this.dist2 = dist2;
		this.perpDir = perpDir;
		this.perpDist = perpDist;
	},
	
	appendValidNextSteps: function(move, piece, game, previousStep) {
		var moves = [];
		
		var absDirs = move.player.getAbsoluteDirections(this.dirs, previousStep != null && previousStep.direction != null ? previousStep.direction : piece.ownerPlayer.forwardDir);
		
		for ( var i=0; i<absDirs.length; i++ )
		{
			var absDir = absDirs[i];
			var maxProjectionDist = game.board.getMaxProjectionDistance(piece.position, absDir);
			var distances = Distance.ParseValues(this.dist, this.dist2, previousStep, maxProjectionDist);
			
			absPerpDirs = Leap.getAbsPerpendicularDirs(absDir, this.perpDir);
			for ( var j=0; j<absPerpDirs.length; j++ )
			{
				var absPerpDir = absPerpDirs[j];
				var maxPerpProjectionDistance = game.board.getMaxProjectionDistance(piece.position, absPerpDir); // using piece.position here is wrong, but as the first step may be of any distance, seems like the easiest way
				var perpDistances = Distance.ParseValues(this.perpDist, this.dist2, previousStep, maxProjectionDist);
				for (var dist = distances[0]; dist <= distances[1]; dist++)
					for (var perpDist = perpDistances[0]; perpDist <= perpDistances[1]; perpDist++)
					{
						var dest = piece.position.offset(absDir, dist).offset(absPerpDir, perpDist);
						
						if ( !game.board.isValidCell(dest) )
							continue; // this destination is invalid, but try the others if there are any
						
						var target = game.board.getPieceAt(dest);
						if (target == null || !piece.canCapture(target))
							continue; // nothing to shoot here, or a piece we can't capture

						var newMove = move.clone();
						newMove.addStep(MoveStep.CreateCapture(target, target.Position, piece.ownerPlayer, game.rules.holdCapturedPieces));
						newMove.addPieceReference(target, "target");
					}
				}
			}
		return moves;
	}
});

Shoot.loadFromXml = function(xmlNode, isTopLevel) {
	var conditions = $(xmlNode).children("conditions");
	
	var pieceRef = $(xmlNode).attr("piece");
	if ( pieceRef == undefined )
		pieceRef = "self";
	
	var dirs = MoveDefinition.ParseDirection($(xmlNode).attr("dir"));
	
	var dist = XmlHelper.readDistance(xmlNode, "dist");
	var dist2 = XmlHelper.readDistance(xmlNode, "dist2");
	
	var perpDist = XmlHelper.readDistance(xmlNode, "perpdist");
	if ( perpDist == null )
		perpDist = Distance.Zero;
	
	var perpDir = $(xmlNode).attr("perpdir");
	if ( perpDir == "both" )
		perpDir = MoveDefinition.PerpendicularDir.Both;
	else if ( perpDir == "right" )
		perpDir = MoveDefinition.PerpendicularDir.Right;
	else
		perpDir = MoveDefinition.PerpendicularDir.Left; // default if undefined
	
	var when = XmlHelper.readWhen(xmlNode, "when");
	
	return new Shoot(pieceRef, dirs, dist, dist2, perpDir, perpDist, when, conditions.children());
}

MoveLike = new Class({
	Extends: MoveDefinition,
	
	initialize: function(other, when, conditions) {
		this.parent();
		this.pieceRef = other;
		this.moveWhen = when;
		this.conditions = Condition.loadConditions(conditions);
	},
	
	allowTopLevel: function() { return true; },
	
	appendValidNextSteps: function(move, piece, game, previousStep) {
		var moves = [];
		if ( this.pieceref == "target" )
		{// difficult special case - we don't know what piece we're to move like until we've already made the move.
		 // have to loop through all possible piece types, try out every move, and then if the piece(s) captured are of the same type, use it
		
			if ( !MoveLike.AllowMoveLikeSteps )
				return moves; // "move like target" shouldn't try to capture other pieces using "move like target" - that's nonsense
			
			MoveLike.AllowMoveLikeSteps = false;
			
			for ( var i=0; i<game.pieceTypes.length; i++ )
			{
				var pieceType = game.pieceTypes[i];
				for ( var j=0; j<pieceType.allMoves.length; j++ )
				{
					var possibilities = pieceType.allMoves[j].appendValidNextSteps(move, piece, game, previousStep);
					for ( var k=0; k<possibilities.length; k++ )
					{
						var newMove = possibilities[k];
						var moveIsOk = false;
						for ( var step = move.steps.length; step < newMove.steps.count; step++ ) // for each of the NEW steps added
						{
							if ( newMove.steps[step].toState != Piece.State.OnBoard )
							{// moving piece off board means its a capture (debatable)
								var target = newMove.steps[step].piece;
								if ( target == piece )
									continue; // if capturing like a "kamakaze" piece, it should be OK to capture yourself
								
								if ( target != null && target.pieceType == pieceType && piece.canCapture(target) )
									moveIsOk = true;
									// debatable: do we want an option to allow capturing multiple pieces, as long as ONE is of the target type? If so, you'd break here instead of below
								else
								{
									moveIsOk = false;
									break;
								}
							}
						}
						if (moveIsOk) // must be a capture, and every piece captured must be of pieceType.Name
							moves.push(newMove);
					}
				}
			}
			
			MoveLike.AllowMoveLikeSteps = true;
		}
		else
		{// we have reference to a specific, discrete piece. Can simply iterate over all its possible moves
			var other = move.getPieceByRef(this.pieceRef);
			if (other == null)
				return moves;

			for ( var i=0; i<other.pieceType.allMoves; i++ )
			{
				var moveDef = other.pieceType.allMoves[i];
				var possibilities = moveDef.appendValidNextSteps(move, piece, game, previousStep);
				for ( var j=0; j<possibilities.length; j++ )
					moves.push(possibilities[j]);
			}
		}
		return moves;
	}
});

MoveLike.loadFromXml = function(xmlNode, isTopLevel) {
	var conditions = $(xmlNode).children("conditions");
	var pieceRef = $(xmlNode).attr("other");
	var when = XmlHelper.readWhen(xmlNode, "when");

	return new MoveLike(pieceRef, when, conditions.children());
}

MoveLike.AllowMoveLikeSteps = true;

ReferencePiece = new Class({
	Extends: MoveDefinition,
	
	initialize: function(name, type, owner, dir, dist) {
		this.refName = name;
		this.otherType = type;
		this.otherOwner = owner;
		this.direction = dir;
		this.distance = dist;
	},
	
	allowTopLevel: function() { return false; },
	
	appendValidNextSteps: function(move, piece, game, previousStep) {
		// find piece based on the given parameters
		var other = null;
		
		if ( this.direction != null && this.distance != null )
		{
			var absDir = move.player.getAbsoluteDirection(this.direction, previousStep != null && previousStep.direction != null ? previousStep.direction : piece.ownerPlayer.forwardDir);
			var distances = Distance.ParseValues(this.distance, null, previousStep, game.board.getMaxProjectionDistance(piece.position, absDir));
		
			for ( var dist = distances[0]; dist<distances[1]; dist++ )
			{
				var targetCell = piece.position.offset(absDir, dist);
				if ( game.board.isValidCell(targetCell) )
				{
					var testPiece = game.board.getPieceAt(targetCell);
					if (testPiece != null && (this.otherOwner == MoveDefinition.Owner.Any || piece.getOwnerFromPlayer(testPiece.ownerPlayer) == this.otherOwner) && testPiece.typeMatches(this.otherType))
					{
						other = testPiece;
						break;
					}
				}
			}
		}
		else
		{
			var allPieces = game.board.getAllPieces();
			for ( var i=0; i<allPieces.length; i++ )
			{
				var testPiece = allPieces[i];
				if ( this.otherOwner == MoveDefinition.Owner.Any || piece.getOwnerFromPlayer(testPiece.ownerPlayer) == this.otherOwner )
				{
					other = testPiece;
					break; // got one, that'll do
				}
			}
		}
		
		if (other != null)
			move.addPieceReference(other, this.refName);
		return [];
	}
});

ReferencePiece.loadFromXml = function(xmlNode, isTopLevel) {
	var name = $(xmlNode).attr("name");
	
	var dir = $(xmlNode).attr("dir");
	if ( dir == undefined )
		dir = null;
	else
	{
		var dirs = MoveDefinition.ParseDirection(dir);
		if ( dirs.length != 1 )
			throw "ReferencePiece requires a discreet direction, not a compound one!";
		dir = dirs[0];
	}
	
	var dist = XmlHelper.readDistance(xmlNode, "dist");
	var type = $(xmlNode).attr("type");
	if ( type == undefined )
		type = "any";
	
	var owner = $(xmlNode).attr("owner");
	if ( owner == undefined )
		owner = "any";
	switch (owner)
	{
	case "any":
		owner = MoveDefinition.Owner.Any; break;
	case "self":
		owner = MoveDefinition.Owner.Self; break;
	case "enemy":
		owner = MoveDefinition.Owner.Enemy; break;
	case "ally":
		owner = MoveDefinition.Owner.Ally; break;
	default:
		throw "Unexpected owner value: " + owner;
	}
	
	return new ReferencePiece(name, type, owner, dir, dist);
}

ArbitraryAttack = new Class({
	Extends: MoveDefinition,
	
	initialize: function(rowRef, colRef, rowOffset, colOffset, moveWithAttack, conditions) {
		this.rowRef = rowRef;
		this.colRef = colRef;
		this.rowOffset = rowOffset;
		this.colOffset = colOffset;
		this.moveWithAttack = moveWithAttack;
		
		this.conditions = Condition.loadConditions(conditions);
	},
	
	allowTopLevel: function() { return false; }, // possible argument for allowing these at top level
	
	appendValidNextSteps: function(move, piece, game, previousStep) {
		var moves = [];
		
		var pos = new Coord(move.getPieceByRef(this.colRef).position.x, m.getPieceByRef(this.rowRef).position.y);
		if (!game.board.isValidCell(pos))
			return moves;
		
		var target = game.board.getPieceAt(pos);
		if (target == null || !piece.canCapture(target))
			return moves;
		
		var newMove = move.clone();
		newMove.addStep(MoveStep.CreateCapture(target, target.position, piece.ownerPlayer, game.rules.holdCapturedPieces));
		newMove.addPieceReference(target, "target");
		if (this.conditions.isSatisfied(newMove, game))
			moves.push(newMove);
		
		return moves;
	}
});

ArbitraryAttack.loadFromXml = function(xmlNode, isTopLevel) {
	var conditions = $(xmlNode).children("conditions");
	var rowRef = $(xmlNode).attr("row_ref");
	var colRef = $(xmlNode).attr("col_ref");
	var rowOffset = parseInt($(xmlNode).attr("row_offset"));
	var colOffset = parseInt($(xmlNode).attr("col_offset"));
	var move = XmlHelper.readBool($(xmlNode).attr("move"));
	
	return new ArbitraryAttack(rowRef, colRef, rowOffset, colOffset, conditions.children());
}

MoveGroup = new Class({
	Extends: MoveElement,
	
	initialize: function(minOccurs, maxOccurs, stepOutIfFail) {
		this.parent();
		this.contents = [];
		this.minOccurs = minOccurs;
		this.maxOccurs = maxOccurs;
		this.StepOutIfFail = stepOutIfFail; // true for when_possible, false otherwise - makes a group obligatory unless it fails.
	},
	
	appendValidNextSteps: function(move, piece, game, previousStep) {
		var results = []; var prevStepMoves = []; var stepMoves;
		prevStepMoves.push(move);
		
		for ( var rep = 1; rep<=this.maxOccurs; rep++ )
		{
			for (var i=0; i<this.contents.length; i++)
			{
				var step = this.contents[i];
				stepMoves = [];
				for (var j=0; j<prevStepMoves.length; j++)
				{
					var prevMove = prevStepMoves[j];
					for ( var doStep = 0; doStep < prevMove.steps.length; doStep++ )
						prevMove.steps[doStep].perform(game);
				
					var nextMovesForStep = step.appendValidNextSteps(prevMove, piece, game, prevMove.steps.length > 0 ? prevMove.steps[prevMove.steps.length-1] : previousStep);
					
					
					console.log("MoveGroup got " + nextMovesForStep.length + " possible moves from step " + i);
					
					stepMoves.append(nextMovesForStep);
					
					for ( var undoStep = prevMove.steps.length - 1; undoStep >= 0; undoStep-- )
						prevMove.steps[undoStep].reverse(game);
				}
				
				prevStepMoves = stepMoves;
				if (prevStepMoves.Count == 0)
					break;
			}
			
			if (prevStepMoves.length == 0) // this FULL iteration through the loop ended with no suitable moves
			{
				console.log("MoveGroup returned " + results.length + " possible moves");
				break;
			}
                
			if (rep >= this.minOccurs)
			{
				results.append(prevStepMoves);
			}
		}
		
		if (this.stepOutIfFail && results.length == 0 && move.steps.count > 0 ) // this group failed, but it wasn't essential, so return the previous move, as that's still valid on its own
			results.push(m);
		
		return results;
	}
});

Sequence = new Class({
	Extends: MoveGroup,
	
	initialize: function() {
		this.parent(1, 1, false);
	},
	
	allowTopLevel: function() { return true; }
});

Sequence.loadFromXml = function(xmlNode, isTopLevel) {
	var s = new Sequence();
	$(xmlNode).children().each(function(index, child) {
		s.contents.push(MoveDefinition.loadFromXml(child, false));
	});
	return s;
}

Repeat = new Class({
	Extends: MoveGroup,
	
	initialize: function(minOccurs, maxOccurs) {
		this.parent(minOccurs, maxOccurs, false);
	},
	
	allowTopLevel: function() { return true; }
});

Repeat.loadFromXml = function(xmlNode, isTopLevel) {
	var min = parseInt($(xmlNode).attr("min"));
	var max = $(xmlNode).attr("max");
	if ( max == "unbounded" )
		max = -1;
	else
		max = parseInt(max);

	var r = new Repeat(min, max);
	$(xmlNode).children().each(function(index, child) {
		r.contents.push(MoveDefinition.loadFromXml(child, false));
	});
	return r;
}

WhenPossible = new Class({
	Extends: MoveGroup,
	
	initialize: function() {
		this.parent(1, 1, true);
	},
	
	allowTopLevel: function() { return true; }
});

WhenPossible.loadFromXml = function(xmlNode, isTopLevel) {
	var w = new WhenPossible();
	$(xmlNode).children().each(function(index, child) {
		w.contents.push(MoveDefinition.loadFromXml(child, false));
	});
	return w;
}