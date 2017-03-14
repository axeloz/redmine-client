const {dialog} = require('electron').remote;
const utils    = require('./utils');

class IssueNavigator {
	constructor(redmineIssues){
		this.redmineIssues = redmineIssues;

		this.$container = $('.tickets');
		this.$focused   = null;
		this.editing    = false;
		this.klass      = '.ticket';
		this.focusAttr  = 'focus';
		this.editAttr   = 'edit';
		this.saveClass  = 'saving';
		this.errorClass = 'error';
		this.dirt       = null;
		this.activityId = 9; // "Développement" TODO

		this.$container.on('click', this.klass, (e) => {
			this.focus($(e.currentTarget));
		});

		$(window).on('keydown', (e) => {
			console.log(e.keyCode)
			switch(e.keyCode){
				case 38: // UP
					this.focus(this.prev());
					break;
				case 40: // DOWN
					this.focus(this.next());
					break;
				case 37: // LEFT
					this.editDone(-10);
					break;
				case 39: // RIGHT
					this.editDone(+10);
					break;
				case 13: // RETURN
					this.edit();
					break;
				case 27: // ESC
					if(this.isEdit()) this.clearEdit();
					else              this.clearFocus();
					break;
			}
		})
	}

	focus($el){
		if(this.hasFocus()) this.clearFocus();
		this.$focused = $el;
		this.$focused  .attr(this.focusAttr, true);
		this.$container.attr(this.focusAttr, true);
		$('html, body').animate({ scrollTop: this.$focused.offset().top - $('.nav.header').height() - 20 }, 300);
		return this;
	}

	hasFocus(){ return !!this.$focused }

	clearFocus(){
		if(!this.hasFocus()) return

		this.$focused  .attr(this.focusAttr, null);
		this.$container.attr(this.focusAttr, null);
		this.$focused = null;
		return this;
	}

	edit(){
		if(!this.hasFocus() || this.isEdit()) return null;

		this.$focused.attr(this.editAttr, true);
		this.editing = true;

		var $done = this.$focused.find('.progress');
		var $time = this.$focused.find('.time');
		this.dirt = {
			id: this.$focused.attr('data-id'),
			clean: {
				done: {
					$el: $done,
					val: $done.val()
				},
				time: {
					$el: $time,
					val: utils.hoursifyTime($time.text())
				}
			},
			dirt: {}
		};

		return this;
	}

	isEdit() { return this.editing }

	clearEdit() {
		if(!$.isEmptyObject(this.dirt.dirt)){
			if(confirm('Save changes? (Restores otherwise!)')) this.save();
			else                                               this.restore();
		}else{
			this.clearEditCB();
		}

		return this;
	}

	clearEditCB(){
		this.$focused.removeClass(this.errorClass);
		this.$focused.removeClass(this.saveClass);
		this.$focused.attr(this.editAttr, null);
		this.editing = false;
		this.dirt    = null;

		return this;
	}

	setDirt(key, val){
		if(this.dirt.clean[key].val === val) delete this.dirt.dirt[key];
		else                                 this.dirt.dirt[key] = val;

		return this;
	}

	first(){ return this.$container.find(`${this.klass}:first-of-type`) }

	last(){ return this.$container.find(`${this.klass}:last-of-type`) }

	prev($el){
		$el = typeof $el !== 'undefined'
				? $el
				: (this.hasFocus()
					 ? this.$focused
					 : this.first());
		return $el.is(':first-of-type') ? this.last() : $el.prev(this.klass);
	}

	next($el){
		$el = typeof $el !== 'undefined'
				? $el
				: (this.hasFocus()
					 ? this.$focused
					 : this.last());
		return $el.is(':last-of-type') ? this.first() : $el.next(this.klass);
	}

	save(noIssue, noTime){
		this.$focused.removeClass(this.errorClass);
		this.$focused.addClass(this.saveClass);

		var ajax;
		var issueData = {};
		if(this.dirt.dirt.done) issueData.done_ratio = this.dirt.dirt.done;

		var timeData = {
			issue_id: this.dirt.id,
			hours: 1,
			activity_id: this.activityId
		};

		if(!noIssue && !noTime) ajax = this.redmineIssues.updateAll(this.dirt.id, issueData, timeData);
		else{
			if(noIssue)           ajax = this.redmineIssues.updateTime (timeData);
			if(noTime )           ajax = this.redmineIssues.updateIssue(this.dirt.id, issueData);
		}

		ajax
			.done(this.clearEditCB.bind(this))
			.fail(this.saveError  .bind(this));

		return this;
	}

	saveError(issueStatus, timeStatus){
		this.$focused.removeClass(this.saveClass);
		this.$focused.addClass(this.errorClass);

		var msg = '';
		if(!issueStatus) msg += 'Issue update errored\n';
		if(!timeStatus ) msg += 'Time update errored\n';
		msg += '(See console for more details)\n';
		msg += '*: what errored only';

		dialog.showMessageBox({
			type     : 'error',
			buttons  : ['Retry*', 'Restore*'],
			defaultId: 0,
			title    : 'Oops...',
			message  : 'Something went wrong!',
			detail   : msg
		}, (response) => {
			switch(response){
				case 0: // Retry
					this.save(issueStatus, timeStatus);
					break;
				case 1: // Restore
					this.restore(issueStatus, timeStatus);
					break;
				case 2: // Do nothing
					break;
			}
		});

		return this;
	}

	restore(noDone, noTime){
		if(!noDone) this.restoreDone();
		if(!noTime) this.restoreTime();

		this.clearEditCB();

		return this;
	}

	editDone(step){
		if(!this.isEdit()) return null;

		var val = Math.max(
			Math.min(
				this.dirt.clean.done.$el.val() + step,
				100
			), 0
		);

		this.dirt.clean.done.$el.val(val);
		this.setDirt('done', val);

		return this;
	}

	restoreDone(){
		this.dirt.clean.done.$el.val(this.dirt.clean.done.val);
		return this;
	}

	restoreTime(){
		this.dirt.clean.time.$el.text(utils.prettifyTime(this.dirt.clean.time.val));

		return this;
	}
}

module.exports = IssueNavigator;
