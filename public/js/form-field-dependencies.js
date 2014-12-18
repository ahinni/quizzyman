function initiallyHidden() {
  $('.initially-hidden')
    .hide()
    .removeClass('initially-hidden');
}

function applyFormDependencies() {
  $('.dependent').each( function () {
    var $section = $(this);
    var deps = parseDependencies($section.data('dependent'));
    _.each(deps, function (dep) {
      $('[name='+dep[0]+']').change( function () {
        var values = dep[1].split(',');
        $section.toggle(_.include(values, $(this).val()));
      });
    });
  });
}

function parseDependencies(depsString) {
  var deps = depsString.split('|');
  return _.map(deps, function (dep) {
    return dep.split('=');
  });
}

$(document).ready( function() {
  applyFormDependencies();

  // on form initialize (when data set), fire changes on all of the dependent fields
  // so we can show the proper sections
  $('form:has(.dependent)').on('initialize', function () {
    var $form = $(this);
    var deps = $form.find('.dependent').map( function (index, el) {
       return parseDependencies($(el).data('dependent'));
    });

    var names = _.chain(deps).map(function (dep) { return dep[0]; }).uniq().value();

    _.each(names, function (name) {
      $form.find('[name='+name+']').change();
    });
  });
});
