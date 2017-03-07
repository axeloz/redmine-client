function Filters(options) {
	this.options  = options;
	this.dfilters = {
		'status_id'     : 'open',
		'assigned_to_id'  : 'me',
		'sort'        : 'updated_on:desc',
		'limit'       : limit
	};
	this.cfilters = {};
};

Filters.prototype.reset = function() {
	this.cfilters = this.dfilters;
	return this;
};

Filters.prototype.unsetFilters = function() {
	for (i = 0; i < arguments.length; ++i) {
		console.log('Unsetting filter: '+arguments[i]);
		delete this.cfilters[arguments[i]];
	}
	return this;
};

Filters.prototype.setFilters = function(mixed, value) {
	var filters = {};

	if (arguments.length > 1) {
		filters[mixed] = value;
	}
	else {
		filters = mixed;
	}

	if (typeof filters == 'object') {
		for (i in filters) {
			this.cfilters[i] = filters[i];
		}
	}
	return this;
}

Filters.prototype.getFilter = function(name){
	if (typeof this.cfilters[name] != 'undefined') {
		return this.cfilters[name];
	}
	return false;
};

Filters.prototype.getCurrent = function(){
	return this.cfilters;
};

module.exports = Filters;
