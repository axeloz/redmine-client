const {dialog} = require('electron').remote;
const Issue    = require('./Issue');

class IssueNavigator {
	constructor(){
		this.issue = null;

		this.$container = $('.tickets');
		this.$focused   = null;
		this.editing    = false;
		this.klass      = 'ticket';
		this.focusAttr  = 'focus';
		this.editAttr   = 'edit';
		this.saveClass  = 'saving';
		this.errorClass = 'error';

		this.registerActions();
	}

	registerActions(){
		this.$container.on('click', `.${this.klass}`, (e) => this.focus($(e.currentTarget)) );

		$(window).on('keydown', (e) => {
			console.log(e.keyCode);

			var RETURN  = 13;
			var ESC     = 27;
			var LEFT    = 37;
			var UP      = 38;
			var RIGHT   = 39;
			var DOWN    = 40;
			var noop    = () => {};
			var nodef   = () => { return false };
			var actions = { return: noop, esc: noop, left: noop, up: noop, right: noop, down: noop };

			actions.up   = () => this.focus(this.prev());
			actions.down = () => this.focus(this.next());

			if(!this.hasFocus()){
			}else{
				if(!this.isEdit()){
					actions.return = () => this.edit();
					actions.esc    = () => this.clearFocus();
				}else{
					actions.up     = () => { this.issue.editStatus(-1); return false; }
					actions.down   = () => { this.issue.editStatus(+1); return false; }
					actions.left   = () => this.issue.editDone(-10);
					actions.right  = () => this.issue.editDone(+10);
					actions.return = () => this.clearEdit();
				}
			}

			switch(e.keyCode){
				case UP    : return actions.up();
				case DOWN  : return actions.down();
				case LEFT  : return actions.left();
				case RIGHT : return actions.right();
				case RETURN: return actions.return();
				case ESC   : return actions.esc();
			}
		})
	}

	focus($el){
		this.clearFocus();

		this.$focused = $el;
		this.$focused  .attr(this.focusAttr, true);
		this.$container.attr(this.focusAttr, true);
		$('html, body').animate({ scrollTop: this.$focused.offset().top - $('.nav.header').height() - 20 }, 300);

		return this;
	}

	hasFocus(){ return !!this.$focused }

	clearFocus(){
		if(!this.hasFocus()) return this;

		this.$focused  .attr(this.focusAttr, null);
		this.$container.attr(this.focusAttr, null);
		this.$focused = null;
		return this;
	}

	edit(){
		if(!this.hasFocus() || this.isEdit()) return null;

		this.$focused.attr(this.editAttr, true);
		this.editing = true;

		this.issue = new Issue(this.$focused, this.redmineIssues);

		return this;
	}

	isEdit() { return this.editing }

	clearEdit() {
		if(this.issue.isDirty()){
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
		this.issue   = null;

		return this;
	}

	first(){ return this.$container.find(`.${this.klass}:first-of-type`) }
	last() { return this.$container.find(`.${this.klass}:last-of-type` ) }

	prev($el){
		$el = typeof $el !== 'undefined'
				? $el
				: (this.hasFocus()
					 ? this.$focused
					 : this.first());
		return $el.is(':first-of-type') ? this.last() : $el.prev(`.${this.klass}`);
	}

	next($el){
		$el = typeof $el !== 'undefined'
				? $el
				: (this.hasFocus()
					 ? this.$focused
					 : this.last());
		return $el.is(':last-of-type') ? this.first() : $el.next(`.${this.klass}`);
	}

	save(noIssue, noTime){
		this.$focused.removeClass(this.errorClass);
		this.$focused.addClass(this.saveClass);

		this.issue.save(noIssue, noTime)
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
			}
		});

		return this;
	}

	restore(noIssue, noTime){
		if(!noTime ) this.issue.restoreTime();
		if(!noIssue){
			this.issue.restoreDone();
			this.issue.restoreStatus();
		}

		this.clearEditCB();

		return this;
	}
}

module.exports = IssueNavigator;
