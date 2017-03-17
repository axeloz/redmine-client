const utils = require('./utils');

class Issue {
  constructor($el){
    this.$el = $el;
    this.id  = $el.attr('data-id');
    this.activityId = 9; // "Développement" TODO
    this.statuses   = null;
    this.interval   = null;

    this.dirtyAttr = 'dirty';

    var $done   = $el.find('.progress');
    var $time   = $el.find('.time');
    var $status = $el.find('[status]');
    this.dirt = {
      clean: {
        done: {
          $el: $done,
          val: $done.val()
        },
        time: {
          $el: $time,
          val: utils.hoursifyTime($time.text())
        },
        status: {
          $el: $status,
          val: parseInt($status.attr('status'))
        }
      },
      dirt: {}
    };
  }

  static getStatuses(){
    if(!!this.statuses) return this.statuses;

    var map      = [];
    var statuses = window.STATUSES.slice().sort((a, b) => { return a.id - b.id });
    for(let i in statuses){
      map[statuses[i].id] = parseInt(i);
    }

    this.statuses = {
      map     : map,
      statuses: statuses
    };

    return this.statuses;
  }

  isDirty(key){
    if(!key) return !$.isEmptyObject(this.dirt.dirt);
    else     return !!this.dirt.dirt[key];
  }

  setDirt(key, val){
    var sameVal = this.dirt.clean[key].val === val;
    var noVal   = val === null;

    if(sameVal || noVal){
      delete this.dirt.dirt[key];
      this.dirt.clean[key].$el.attr(this.dirtyAttr, null);
    }else{
      this.dirt.dirt[key] = val;
      this.dirt.clean[key].$el.attr(this.dirtyAttr, true);
    }

    return this;
  }

  save(noIssue, noTime){
    this.editTime(true);

    var issueData = {};
    if(this.dirt.dirt.done)   issueData.done_ratio = this.dirt.dirt.done;
    if(this.dirt.dirt.status) issueData.status_id  = this.dirt.dirt.status;

    var correctTimeDisplay = false;
    var timeData = {};
    if(this.isDirty('time')){
      var h = Math.max(.01, this.dirt.dirt.time - this.dirt.clean.time.val); // Redmine stores anything < 0.01 as 0.00!
      if(h === .01) correctTimeDisplay = true;

      timeData = {
        issue_id   : this.id,
        hours      : h,
        activity_id: this.activityId
      }
    }

    if($.isEmptyObject(issueData)) noIssue = true;
    if($.isEmptyObject( timeData)) noTime  = true;

    var ajax = $.when({}); // Immediate sync deferred, if no request are made
    if(!noIssue && !noTime) ajax = this.updateAll(this.id, issueData, timeData);
    else{
      if(noIssue)           ajax = this.updateTime (timeData).done(() => { if(correctTimeDisplay) this.correctTimeDisplay() });
      if(noTime )           ajax = this.updateIssue(this.id, issueData);
    }

    return ajax;
  }

  editDone(step){
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
    this.setDirt('done', null);

    return this;
  }

  editTime(forceStop){
    if(this.interval || forceStop){
      clearInterval(this.interval);
      this.interval = null;
      return this;
    }

    var sec = 1/(60*60);
    var updateTimer = () => {
      var t = this.isDirty('time') ? this.dirt.dirt.time : this.dirt.clean.time.val;
      t += sec;

      this.setDirt('time', t);
      this.dirt.clean.time.$el.text(utils.prettifyTime(t));
    }

    updateTimer();
    this.interval = setInterval(updateTimer, 1000);

    return this;
  }

  restoreTime(){
    this.editTime(true);

    this.dirt.clean.time.$el.text(utils.prettifyTime(this.dirt.clean.time.val));
    this.setDirt('time', null);

    return this;
  }

  correctTimeDisplay(){
    // NOTE minimal time emtry in redmine is 0.01 hour (36s)
    // when updating time entry, this class send 0.01h for anything below 36s
    // If this method is called, we send an 36s entry but spend less time, so timer is out of sync with remote data
    // Now we're going to correct this
    this.dirt.clean.time.$el.text(utils.prettifyTime(this.dirt.clean.time.val + .01));

    return this;
  }

  editStatus(step){
    if(!window.STATUSES) return null; // FIXME this is bad (global filled asynchronously)

    var statuses = Issue.getStatuses();
    var id       = this.dirt.clean.status.$el.attr('status');
    var status   = statuses.statuses[utils.mod(statuses.map[id] + step, statuses.statuses.length)];

    this.dirt.clean.status.$el
      .attr('status', status.id)
      .text(status.name)
      .removeClass(`status-${id}`)
      .addClass(`status-${status.id}`);
    this.setDirt('status', status.id);

    return this;
  }

  restoreStatus(){
    var statuses = Issue.getStatuses();
    var dirtyId = this.dirt.dirt .status;
    var id      = this.dirt.clean.status.val;
    var name    = statuses.statuses[statuses.map[id]].name;

    this.dirt.clean.status.$el
      .attr('status', id)
      .text(name)
      .removeClass(`status-${dirtyId}`)
      .addClass(`status-${id}`);

    this.setDirt('status', null);

    return this;
  }

  updateIssue(id, data){
    var def = $.Deferred();

    $.ajax({
      url     : `${host}/issues/${id}.json`,
      method  : 'PUT',
      data    : { issue: data },
      dataType: 'text'
    }).done((data, status) => { def.resolveWith(null, [true , true]); })
      .fail((data, status) => { def.rejectWith (null, [false, true]); console.error(data); });

    return def;
  };

  updateTime(data){
    var def = $.Deferred();

    $.ajax({
      url     : `${host}/time_entries.json`,
      method  : 'POST',
      data    : { time_entry: data },
      dataType: 'text'
    }).done((data, status) => { def.resolveWith(null, [true, true ]); })
      .fail((data, status) => { def.rejectWith (null, [true, false]); console.error(data); });

    return def;
  };

  updateAll(id, issueData, timeData){
    var issueStatus = null;
    var timeStatus  = null;
    var retDef      = $.Deferred();
    var issueDef    = $.Deferred().always((status, x) => issueStatus = status);
    var timeDef     = $.Deferred().always((x, status) => timeStatus  = status);

    this.updateIssue(id, issueData).always(issueDef.resolve);
    this.updateTime (timeData     ).always( timeDef.resolve);

    $.when(issueDef, timeDef).always(() => {
      if(issueStatus && timeStatus) retDef.resolveWith(null, [issueStatus, timeStatus]);
      else                          retDef.rejectWith (null, [issueStatus, timeStatus]);
    });

    return retDef;
  };
}

module.exports = Issue;
