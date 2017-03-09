class IssueNavigator {
	constructor(){
		this.$container = $('.tickets');
		this.$focused   = null;
		this.editing    = false;
		this.klass      = '.ticket';
		this.focusAttr  = 'focus';
		this.editAttr   = 'edit';
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
		this.$focused.attr(this.editAttr, null);
		this.editing = false;

		if(!$.isEmptyObject(this.dirt.dirt)){
			var save = confirm('Save changes? (unimplemented)');
			if(save) this.save();
			else     this.restore();
		}

		this.dirt = null;

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

	save(){
		// TODO
		console.error('Save unimplemented');
		console.log('here is your dirt:', this.dirt.dirt);
	}

	restore(){
		this.restoreDone();
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
	}

	restoreDone(){ this.dirt.clean.done.$el.val(this.dirt.dirt.done) }
}

module.exports = IssueNavigator;
