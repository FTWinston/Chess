// todo: write all this
Condition = new Class({
	initialize: function() {
		
    },
	
	isSatisfied: function() { return true; }
});

Condition.loadConditions = function(xmlNodes) {
	return new Condition();
}

ConditionsGroup = new Class({
	initialize: function() {
		
	}
});