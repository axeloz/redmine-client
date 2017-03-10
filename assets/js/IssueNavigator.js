const {dialog} = require('electron').remote;

class IssueNavigator {
	constructor(){
		this.$container = $('.tickets');
		this.$focused   = null;
		this.editing    = false;
		this.klass      = '.ticket';
		this.focusAttr  = 'focus';
		this.editAttr   = 'edit';
		this.saveClass  = 'saving';
		this.errorClass = 'error';
		this.dirt       = null;

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

	clearFocus(){ this;
		if(!this.hasFocus()) return

		this.$focused  .attr(this.focusAttr, null);
		this.$container.attr(this.focusAttr, null);
		this.$focused = null;
		return this;
	}

	edit(){
		if(!this.hasFocus()) return null;

		this.$focused.attr(this.editAttr, true);
		this.editing = true;

		var $done = this.$focused.find('.progress');
		this.dirt = {
			id: this.$focused.attr('data-id'),
			clean: {
				done: {
					$el: $done,
					val: $done.val()
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

	save(cb){
		this.$focused.removeClass(this.errorClass);
		this.$focused.addClass(this.saveClass);

		var issueData = {};
		if(this.dirt.dirt.done) issueData.done_ratio = this.dirt.dirt.done;

		$.ajax({
			url     : `${host}/issues/${this.dirt.id}.json`,
			method  : 'PUT',
			data    : { issue: issueData },
			success : this.clearEditCB.bind(this),
			error   : this.saveError.bind(this),
			dataType: 'text'
		});

		// TODO time entries

		return this;
	}

	saveError(a, b, c){
		this.$focused.removeClass(this.saveClass);
		this.$focused.addClass(this.errorClass);

		console.error('SaveError', a, b, c);

		dialog.showMessageBox({
			type     : 'error',
			buttons  : ['Retry', 'Restore', 'No nothing'],
			defaultId: 0,
			title    : 'Oops...',
			message  : 'Something went wrong!',
			detail   : `${a.statusText} (${a.status}) See console for more details`
		}, (response) => {
			switch(response){
				case 0: // Retry
					this.save();
					break;
				case 1: // Restore
					this.restore();
					break;
				case 2: // Do nothing
					break;
			}
		});

		return this;
	}

	restore(){
		this
			.restoreDone()
			.clearEditCB();

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
}

module.exports = IssueNavigator;
