var Utils = {
  hoursADay: 8,
  prettifyTime: (hours) => {
    var d = hours / Utils.hoursADay;
    var h = hours % Utils.hoursADay;
    var m = (h%1) * 60;
    var s = Math.round((m%1) * 60);

    d = Math.floor(d);
    h = Math.floor(h);
    m = Math.floor(m);
    m = d + h + m ? `${m}m` : '';
    h = d + h     ? `${h}h` : '';
    d = d         ? `${d}d` : '';

    return `${d} ${h} ${m} ${s}s`;
  },
  hoursifyTime: (time) => {
    var matches = /((\d+)d\s)?((\d+)h\s)?((\d+)m\s)?((\d+)s)/gi.exec(time);

    var d = matches[2] ? parseInt(matches[2]) * Utils.hoursADay : 0;
    var h = matches[4] ? parseInt(matches[4])                   : 0;
    var m = matches[6] ? parseInt(matches[6]) / 60              : 0;
    var s = matches[8] ? parseInt(matches[8]) / 60 / 60         : 0;

    return Math.round((d + h + m + s) * 100) / 100;
  }
};

module.exports = Utils;
