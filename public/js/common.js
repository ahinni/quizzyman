function noFormat(s) {
  return s;
}


function isHoliday(d) {
  var holidays = [
    '1/1',
    '5/26',
    '7/4',
    '9/1',
    '11/27',
    '11/28',
    '12/24',
    '12/25'
  ];

  var ds = (d.getMonth()+1) + '/' + d.getDate();
  return holidays.indexOf(ds) >= 0;
}

function isWeekend(d) {
  return d.getDay() === 6 || d.getDay() === 0;
}

function formattedDate(d) {
  return [d.getMonth()+1,d.getDate(),d.getFullYear()].join('/');
}

function populateFormFieldsFromModel(form_selector, model, prefix) {
  if ( !model ) return;

  return populateFormFieldsFromObject(form_selector, model.attributes, prefix);
}

function populateFormFieldsFromObject(form_selector, obj, prefix) {
  if (!obj) return;

  _.each(obj, function (value, key) {
    var path = prefix ? prefix + '['+key+']' : key;
    setFormField(form_selector, path, value);
  });
}

function setFormField(form_selector, field_name, value) {
  var $field = $(form_selector + ' [name="'+field_name+'"]');
  if ($field.attr('type') === 'checkbox')
    $field.prop('checked', value);
  else
    $field.val(_.isObject(value) ? JSON.stringify(value) : value);
}

function formToHash(form) {
  var hash = {};

  $('input:checkbox').each(function() {
    hash[this.name] = this.checked;
  });

  _.each($(form).serializeArray(), function(obj) {
    hash[obj.name] = obj.value;
  });

  return hash;
}

function collectionFieldFunctor(collection, field) {
  return function (id) {
    var model = collection.get(id);
    return model ? model.get(field) : id;
  };
}

function emptyOrDollarize(a) {
  return a ? _.dollarize(a) : '';
}

function dashOrDollarize(a) {
  return a ? _.dollarize(a) : '-';
};

_.extend(Backbone.View.prototype, {
  close: function() {
    this.remove();
    this.unbind();
    this.closeSubviews();
  },

  pushSubview: function (v) {
    if ( !this.subviews ) this.subviews = [];
    this.subviews.push(v);
  },

  closeSubviews: function () {
    _.each(this.subviews || [], function (v) {
      v.close();
    });

    this.subviews = [];
  }
});

_.extend(Backbone.Model.prototype, {
  pathSet: function (path, value) {
    var m = path.match(/(\w+)\[(\w+)\]/);
    if (!m) return this.set(path, value);

    var objRoot = m[1];
    var key = m[2];

    var obj = _.clone(this.get(objRoot) || {});
    obj[key] = value;
    this.set(objRoot, obj);
  },

  pathGet: function (path) {
    var m = path.match(/(\w+)\[(\w+)\]/);
    if (!m) return this.get(path);

    var objRoot = m[1];
    var key = m[2];
    var obj = this.get(objRoot) || {};
    return obj[key];
  }
});

var TableRowView = Backbone.View.extend({
  tagName: 'tr',
  template: _.template('<td class="data-column text-<%= alignment %>"><%= text %></td>'),

  events: {
    "click .delete": "triggerDelete",
    "click .data-column": "triggerOpen"
  },

  initialize: function (options) {
    this.header_keys = options.header_keys;
    this.select_mappings = options.select_mappings || {};
    this.formatters = options.formatters || {};
    this.defaultFormatter = options.defaultFormatter || noFormat;
    this.alignment = options.alignment || {};
    this.eventer = options.eventer || this;
    this.can_edit = options.can_edit;
    _.bindAll(this, 'renderChanged', 'close');
    this.model.on('change', this.renderChanged);
    this.model.on('destroy', this.close);
  },

  render: function () {
    var self = this;
    var html = _.map(this.header_keys, function (column) {
      return self.template({
        text: self.displayValue(column),
        alignment: self.alignment[column] || 'left'
      });
    }).join('');

    if (this.can_edit)
      html += '<td class="action"><a href="#"><span class="delete glyphicon glyphicon-trash"></span></a></td>';

    this.$el.html(html);
    return this;
  },

  renderChanged: function () {
    this.render();
    this.$el.find('td').effect('highlight', { duration: 1500 });
    return this;
  },

  displayValue: function (column) {
    var mapper = this.select_mappings[column];
    var formatter = _.bind(this.formatters[column] || this.defaultFormatter, this.model);
    var value = this.model.pathGet(column) || '';
    return mapper ? mapper[formatter(value)] : formatter(value);
  },

  triggerOpen: function (ev) {
    ev && ev.preventDefault();
    this.eventer.trigger('clicked', this.model);
  },

  triggerDelete: function (ev) {
    ev && ev.preventDefault();
    this.eventer.trigger('delete', this.model);
  }
});

var TableView = Backbone.View.extend({

  initialize: function (options) {
    this.header_keys = _.map(options.headers, function (h) { return h[0]; });
    this.header_titles = _.map(options.headers, function (h) { return h[1]; });
    this.select_mappings = options.select_mappings || {};
    this.formatters = options.formatters || {};
    this.defaultFormatter = options.defaultFormatter || noFormat;
    this.alignment = options.alignment || {};
    this.eventer = options.eventer || this;
    this.can_edit = options.can_edit;
    this.subviews = [];
    _.bindAll(this, 'render', 'renderRow');

    this.collection.on('add', this.renderRow);
    this.collection.on('reset', this.render);
    this.footer = options.footer;
  },

  render: function () {
    this.closeSubviews();
    this.$el.html( '<thead><tr>'+this.headerColumns()+this.actionColumn() +'</tr></thead><tbody></tbody>' );
    this.collection.each(this.renderRow);
    this.renderFooter();
    return this;
  },

  renderRow: function (model, collection, options ) {
    var view = new TableRowView({
      model: model,
      header_keys: this.header_keys,
      select_mappings: this.select_mappings,
      formatters: this.formatters,
      defaultFormatter: this.defaultFormatter,
      alignment: this.alignment,
      eventer: this.eventer,
      can_edit: this.can_edit
    });

    this.pushSubview(view);
    _.isObject(options) && options.add ? view.renderChanged() : view.render();
    this.$el.find('tbody').append(view.el);
  },

  renderFooter: function () {
    if ( !this.footer ) return this;

    var footer = new this.footer.View(this.footer.options);

    this.$el.find('tbody').after(footer.render().$el);
    this.pushSubview(footer);
  },

  headerColumns: function () {
    return _.map(this.header_titles, function (title) {
      return '<th>'+title+'</th>';
    }).join('');
  },

  actionColumn: function () {
    return this.can_edit ? '<th></th>' : '';
  }
});

var DynamicOptionsView = Backbone.View.extend({
  template: _.template('<option value="<%= id %>"><%= name %></option>'),

  initialize: function (options) {
    this.displayAttr = options.displayAttr;
    this.lookupAttr = options.lookupAttr;
    this.$monitorEl = $(options.monitorEl);
    this.$form = this.$el.parents('form');
    _.bindAll(this, 'onInitialize', 'onChange');

    this.$form.on('initialize', this.onInitialize);
    $(this.$monitorEl).change( this.onChange );
  },

  lookup: function (value) {
    var self = this;
    return this.collection.select( function (m) { return m.get(self.lookupAttr) == value; } );
  },

  onInitialize: function (ev, model) {
    this.currentModel = model;
    this.renderOptionsForValue( this.$monitorEl.val() );
  },

  onChange: function (ev) {
    this.renderOptionsForValue( this.$monitorEl.val() );
  },

  renderOptionsForValue: function (value) {
    var self = this;
    var options = this.lookup(value);
    var currentValue = this.currentModel && this.currentModel.get(this.$el.attr('name'));;

    var optionsHtml = _.map( options, function (m) {
      return self.template({
        id: m.id,
        name: m.get(self.displayAttr)
      });
    });

    this.$el.html( optionsHtml );
    this.$el.val(currentValue);
  }
});

var CrudController = function (options) {
  options || (options = {});
  this.modalEl = options.modal;
  this.validate = options.validate || {};
  this.collection = options.collection;
  this.initialize.apply(this, arguments);
}

_.extend(CrudController.prototype, Backbone.Events, {

  initialize: function (options) {
    _.bindAll(this, 'onEdit', 'onDelete');
    this.on('delete', this.onDelete);
    this.on('clicked', this.onEdit);

    this.modalView = new ModalEditView({
      el: this.modalEl,
      collection: this.collection,
      validate: this.validate,
      eventer: this
    });

  },

  onDelete: function (model) {
    model.destroy();
  },

  onEdit: function (model) {
    this.modalView.trigger('edit', model);
  }

});

var ModalEditView = Backbone.View.extend({
  initialize: function (options) {
    this.formEl = options.el + ' form';
    this.$form = $(this.formEl);
    this.itemName = options.itemName || this.$el.find('.modal-title').text();
    this.currentModel = undefined;
    this.eventer = options.eventer || this;

    _.bindAll(this, 'onEdit', 'onShowModal', 'onHideModal', 'submitForm');

    this.initializeValidate(options.validate);

    this.on('edit', this.onEdit);
    this.$el.on('show.bs.modal', this.onShowModal);
    this.$el.on('hidden.bs.modal', this.onHideModal);


    this.$el.find('.button-save').click( this.submitForm );
  },

  initializeValidate: function (options) {
    var self = this;
    this.$form.validate(_.extend({
      submitHandler: function () {
        self.$el.modal('hide');

        var data = formToHash(self.formEl);
        if ( self.currentModel ) {
          self.currentModel.set(data);
          self.currentModel.trigger('updated');
        }
        else {
          self.collection.add(data);
        }
      }
    }, options || {}));
  },

  onEdit: function (model) {
    this.currentModel = model;
    this.$el.modal('show');
  },

  onShowModal: function (e) {
    var titleAction = this.currentModel ? 'Edit' : 'Add';
    var buttonLabel = this.currentModel ? 'Save' : 'Create';

    this.$el.find('.modal-title').text(titleAction  + ' ' + this.itemName);
    this.$el.find('.button-save').text(buttonLabel);
    $(this.formEl).trigger('reset');
    populateFormFieldsFromModel(this.formEl, this.currentModel); // TODO: pass prefix
    $(this.formEl).trigger('initialize', this.currentModel);
    this.eventer.trigger('modal:show', this.currentModel);
  },

  onHideModal: function (e) {
    this.currentModel = undefined;
  },

  submitForm: function () {
    this.$form.submit();
  }
});
