const utils = require('./utils');

class Issue {
  constructor($el){
    this.$el = $el;
    this.id  = $el.attr('data-id');
    this.activityId = 9; // "Développement" TODO

    var $done = $el.find('.progress');
    var $time = $el.find('.time');
    this.dirt = {
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
  }

  isDirty(){
    return !$.isEmptyObject(this.dirt.dirt);
  }

  setDirt(key, val){
    if(this.dirt.clean[key].val === val) delete this.dirt.dirt[key];
    else                                 this.dirt.dirt[key] = val;

    return this;
  }

  save(noIssue, noTime){
    var issueData = {};
    if(this.dirt.dirt.done) issueData.done_ratio = this.dirt.dirt.done;

    var timeData = {
      issue_id: this.id,
      hours: 1,
      activity_id: this.activityId
    };

    var ajax;
    if(!noIssue && !noTime) ajax = this.updateAll(this.id, issueData, timeData);
    else{
      if(noIssue)           ajax = this.updateTime (timeData);
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

    return this;
  }

  restoreTime(){
    this.dirt.clean.time.$el.text(utils.prettifyTime(this.dirt.clean.time.val));

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
