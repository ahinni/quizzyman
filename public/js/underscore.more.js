_.mixin(_.str.exports());
_.mixin({
  monetize: function(n) {
    var s = _.numberFormat(+n, 2);
    return n < 0 ? "(" + s.replace('-','') + ")" : s;
  },

  dollarize: function(n) {
    return "$"+_.numberFormat(+n,2);
  },

  upcase: function (s) {
    return s && s.toUpperCase();
  },

  downcase: function (s) {
    return s && s.toLowerCase();
  }
});
