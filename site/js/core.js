function HashTable(obj) {
    this.length = 0;
    this.items = {};
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
		this.items[p] = obj[p];
		this.length++;
        }
    }

    this.setItem = function(key, value)
    {
        var previous = undefined;
        if (this.hasItem(key)) {
		previous = this.items[key];
        }
        else {
		this.length++;
        }
        this.items[key] = value;
        return previous;
    }

    this.getItem = function(key) {
        return this.hasItem(key) ? this.items[key] : undefined;
    }

    this.hasItem = function(key)
    {
        return this.items.hasOwnProperty(key);
    }
   
    this.removeItem = function(key)
    {
        if (this.hasItem(key)) {
		previous = this.items[key];
		this.length--;
		delete this.items[key];
		return previous;
        }
        else {
		return undefined;
        }
    }

    this.keys = function()
    {
        var keys = [];
        for (var k in this.items)
			if (this.hasItem(k))
				keys.push(k);
        return keys;
    }

    this.values = function()
    {
        var values = [];
        for (var k in this.items)
			if (this.hasItem(k))
				values.push(this.items[k]);
        return values;
    }

    this.each = function(fn) {
        for (var k in this.items)
			if (this.hasItem(k))
				fn(k, this.items[k]);
    }

    this.clear = function()
    {
        this.items = {}
        this.length = 0;
    }
}

// method to remove a single item from an array. Returns true if item was removed, false if it was not present
Array.implement('removeItem', function(item) {
	var index = this.indexOf(item);
	if ( index == -1 )
		return false;
	
	this.splice(index, 1);
	return true;
});

// these are invariant, and are always the same for every player
AbsoluteDirection = {
	North: 0,
	NorthEast : 1,
	East : 2,
	SouthEast : 3,
	South: 4,
	SouthWest: 5,
	West: 6,
	NorthWest: 7
}

AbsoluteDirection.parse = function(val) {
	switch ( val )
	{
	case 'north':
		return AbsoluteDirection.North;
	case 'south':
		return AbsoluteDirection.South;
	case 'east':
		return AbsoluteDirection.East;
	case 'west':
		return AbsoluteDirection.West;
	case 'northeast':
		return AbsoluteDirection.NorthEast;
	case 'northwest':
		return AbsoluteDirection.NorthWest;
	case 'southeast':
		return AbsoluteDirection.SouthEast;
	case 'southwest':
		return AbsoluteDirection.SouthWest;
	default:
		throw 'Cannot parse absolute direction: ' + val;
	}
}

Coord = new Class({
	initialize: function(x,y) {
		this.x = parseInt(x);
		this.y = parseInt(y);
	},
	
	equals: function(other) {
		return this.x == other.x && this.y == other.y;
	},
	
	toString: function() {
		return this.x + "x" + this.y;
	},
	
	getName: function() {
		return Coord.columnName(this.x) + this.y;
	},
	
	offset: function(dir, dist) {
		switch ( dir )
		{
		case AbsoluteDirection.North:
			return new Coord(this.x, this.y + dist);
		case AbsoluteDirection.South:
			return new Coord(this.x, this.y - dist);
		case AbsoluteDirection.East:
			return new Coord(this.x + dist, this.y);
		case AbsoluteDirection.West:
			return new Coord(this.x - dist, this.y);
		case AbsoluteDirection.NorthEast:
			return new Coord(this.x + dist, this.y + dist);
		case AbsoluteDirection.NorthWest:
			return new Coord(this.x - dist, this.y + dist);
		case AbsoluteDirection.SouthEast:
			return new Coord(this.x + dist, this.y - dist);
		case AbsoluteDirection.SouthWest:
			return new Coord(this.x - dist, this.y - dist);
		default:
			throw "Unexpected direction in Coord.offset (" + dir + ")";
		}
	}
});

Coord.columnName = function(num) {
	if ( num > 0 )
	{
		if ( num < 27 )
			return String.fromCharCode(num + 64);
		else if ( num < 53 )
			return String.fromCharCode(num + 70);
	}
	else if ( num > -26 )
		return String.fromCharCode(num + 122);
	return "?"; // we can handle -25 through to +52, without resorting to this. -25 to 0 and 27 - 52 use the same lowercase range, though
}

Rectangle = new Class({
	initialize: function(x, y, w, h) {
		this.x = x; this.y = y;
		this.w = w; this.h = h;
	},
	
	toString: function() {
		return "{" + this.x + "," + this.y + " - " + this.w + " x " + this.h + "}";
	},
	
	centerX: function() {
		return this.x + this.w/2.0;
	},
	
	centerY: function() {
		return this.y + this.h/2.0;
	}
});