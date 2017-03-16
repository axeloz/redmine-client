const Filters = require('./Filters');
const utils  = require('./utils');

function RedmineIssues(options) {
	this.options	= options;
	this.filters	= new Filters();
	this.issues		= [];

	return this;
}

RedmineIssues.prototype.init = function() {
	var that = this;

	this.filters.reset();

	$.ajaxSetup({
		async: true,
		beforeSend: function() {
			//console.log('Before send');
		},
		complete: function() {
			//console.log('Completed');
		},
		error: function() {
			//console.log('Error');
		},
		headers: {
			'X-Redmine-API-Key': apikey
		}
	});


	that.getProjects();
	that.getStatuses(this.options.statusesCB ? this.options.statusesCB : () => {});
	that.getTrackers();
	that.getPriorities();


	$(document).on('click', 'a[href^="http"]', function(e) {
		e.preventDefault();
		shell.openExternal(this.href);
	});

	// Submitting filters form
	$('#filter_frm').submit(function(e) {
		e.preventDefault();
		e.stopPropagation();

		// Resetting current filters
		that.filters.reset();

		// For each select list
		// TODO : use the
		$('#filter_frm select').each(function() {
			el = $(this);

			if (el.val() != 0) {
				that.filters.setFilters(el.attr('data-filter'), el.val());
			}
			else {
				that.filters.unsetFilters(el.attr('data-filter'));
			}
		});

		that.getUserTickets();
	});

	/*$('form#quick-task-id-frm').submit(function(e) {
		e.preventDefault();
		e.stopPropagation();
	});*/

	// Changing tab
	$('.tickets-filter li a').click(function() {
		$('.tickets-filter li').removeClass('is-active');
		$(this).parent('li').addClass('is-active');

		that.filters
			.reset()
			.unsetFilters('assigned_to_id', 'author_id', 'watcher_id')
			.setFilters($(this).parent('li').attr('data-filter'), 'me');
		that.getUserTickets();
	});

	// Filters reset button clicked
	$('.filters-reset').click(function() {
		that.filters
			.reset();
		that.getUserTickets();
	});

	//get_current_user();
	that.getUserTickets();

};


RedmineIssues.prototype.getProjects = function() {
	that = this;

	var projects_order = projects_index = [];

	$.get(host + '/projects.json', {
		'limit'				: 1000,
		'include'			: 'enabled_modules'
	}, function(response, status) {

		$('#projects_list').children('option').not(':first').remove();

		for (var i in response.projects) {

			var project = response.projects[i];

			/**
			* Removing archived projects from the list
			*/
			if (project.status == 5) {
				continue;
			}

			/**
			* Some projects don't have the issues
			* tracking module enabled
			* No need to list them
			*/
			response.projects[i].disabled = true;
			for (var j in project.enabled_modules) {
				if (project.enabled_modules[j].name == 'issue_tracking') {
					response.projects[i].disabled = false;
				}
			}

			$('#projects_list').append('<option ' + (response.projects[i].disabled == true ? 'disabled="disabled"': '')+ ' value="'+response.projects[i].id+'">'+response.projects[i].name.toUpperCase()+'</option>');

		}

	}, 'json');
};

RedmineIssues.prototype.getTrackers = function(){
	$.get(host + '/trackers.json', {
		limit: 1000,
		sort: 'name'
	}, function(response, status) {

		$('#trackers_list').children('option').not(':first').remove();

		for (i in response.trackers) {
			$('#trackers_list').append('<option value="'+response.trackers[i].id+'">'+response.trackers[i].name+'</option>');
		}

	}, 'json');
};

RedmineIssues.prototype.getStatuses = function(cb){
	var statuses = [];

	$.get(host + '/issue_statuses.json', {
		limit: 1000,
		sort: 'name'
	}, function(response, status) {

		$('#statuses_list').children('option').not(':first').remove();

		for (i in response.issue_statuses) {
			statuses.push({id: response.issue_statuses[i].id, name: response.issue_statuses[i].name });
			$('#statuses_list').append('<option value="'+response.issue_statuses[i].id+'">'+response.issue_statuses[i].name+'</option>');
		}

		cb(statuses);
	}, 'json');
};

RedmineIssues.prototype.getPriorities = function(){
	$.get(host + '/enumerations/issue_priorities.json', {
		limit: 1000,
		sort: 'name'
	}, function(response, status) {

		$('#priorities_list').children('option').not(':first').remove();

		for (i in response.issue_priorities) {
			$('#priorities_list').append('<option value="'+response.issue_priorities[i].id+'">'+response.issue_priorities[i].name+'</option>');
		}
	}, 'json');
};

RedmineIssues.prototype.getUserTickets = function(){
	var that = this;
	var filters		= this.filters.getCurrent();

	$.when(
		$.get(host + '/issues.json', filters, 'json'),
		$.get(host + '/time_entries.json', { limit: 100 })
	).then((issues, timeEntries) => {
		that.issues = issues[0].issues;

		var issuesID2Index = [];
		var timeEntries = timeEntries[0].time_entries;

		for(let i in that.issues){
			issuesID2Index[that.issues[i].id] = i;
			that.issues[i].time = 0;
		}

		var index = null;
		for(let i in timeEntries){
			var issueID = timeEntries[i].issue.id;

			if(index = issuesID2Index[issueID]){
				that.issues[index].time += timeEntries[i].hours;
				that.issues[index].prettyTime = utils.prettifyTime(that.issues[index].time);
			}
		}
		// FIXME: what if we didn't recieved all of the time entries? Should requery API.

		that.render();
	})
};

RedmineIssues.prototype.getCurrentUser = function(){
	$.get(host + '/users/current.json', {}, function(response, status) {

		return response;

	}, 'json');
};

RedmineIssues.prototype.render = function(){
	var data = {
		issues: this.issues,
		redmine_host: host,
	};

	var source		= $("#tickets-list").html();
	var template	= Handlebars.compile(source);
	var html 			= template(data);

	$('.tickets .tickets-for-me').html(html);
};

module.exports = RedmineIssues;
