import Ember from 'ember';
import StyleBindingsMixin from 'ember-table/mixins/style-bindings';
import RegisterTableComponentMixin from 'ember-table/mixins/register-table-component';
import SortableMixin from 'ember-table/mixins/sortable';

// We hacked this. There is an inconsistency at the level in which we are
// handling scroll event...
export default Ember.View.extend(
StyleBindingsMixin, RegisterTableComponentMixin, SortableMixin, {
  templateName: 'header-row',
  classNames: ['ember-table-table-row', 'ember-table-header-row'],
  styleBindings: ['width', 'top', 'height'],
  columns: Ember.computed.alias('content'),
  width: Ember.computed(function() {
    var widths = this.get('columns').getEach('width');
    return widths.reduce(function (res, width) {
      return width + res;
    }, 0);
  }).property('columns.@each.width'),
  scrollLeft: Ember.computed.alias('tableComponent._tableScrollLeft'),
  isFixedBlock: Ember.computed.alias('parentView.isFixedBlock'),
  rowWidth: Ember.computed(function() {
    var hasColumnGroup = this.get('tableComponent.hasGroupColumn');
    return this.get(hasColumnGroup ? 'width' : 'controller._tableColumnsWidth');
  }),

  // Options for jQuery UI sortable
  sortableOption: Ember.computed(function() {
    return {
      axis: 'x',
      containment: 'parent',
      cursor: 'move',
      helper: 'clone',
      items: ".ember-table-header-cell.sortable",
      opacity: 0.9,
      placeholder: 'ui-state-highlight',
      scroll: true,
      tolerance: 'pointer',
      update: Ember.$.proxy(this.onColumnSortDone, this),
      stop: Ember.$.proxy(this.onColumnSortStop, this),
      sort: Ember.$.proxy(this.onColumnSortChange, this)
    };
  }),
  isNotFixedBlock: Ember.computed.not('isFixedBlock'),
  isNotTopRow: Ember.computed.not('isTopRow'),
  enableColumnReorder: Ember.computed.and('tableComponent.enableColumnReorder', 'isNotTopRow', 'isNotFixedBlock'),

  // for sortable mixin
  sortableItemSelector: '.ember-table-header-cell',
  sortableTargetElement: '.ui-state-highlight',

  getSortableElement: function () {
    return this.$('> div');
  },

  columnSortDidStart: function() {
    if (this.get('tableComponent.hasColumnGroup')) {
      this.set('tableComponent._isReorderInnerColumns', true);
    }
  },

  didInsertElement: function() {
    this._super();
    if (this.get('enableColumnReorder')) {
      this.getSortableElement().sortable(this.get('sortableOption'));
    }
  },

  willDestroyElement: function() {
    if (this.get('enableColumnReorder')) {
      // TODO(azirbel): Get rid of this check, as in onColumnSortDone?
      var $divs = this.getSortableElement();
      if ($divs) {
        $divs.sortable('destroy');
      }
    }
    this._super();
  },

  onColumnSortStop: function() {
    this.set('tableComponent._isShowingSortableIndicator', false);
  },

  onColumnSortChange: function() {
    var left = this.$('.ui-state-highlight').offset().left -
        this.$().closest('.ember-table-tables-container').offset().left;
    this.set('tableComponent._isShowingSortableIndicator', true);
    this.set('tableComponent._sortableIndicatorLeft', left);
  },

  onColumnSortDone: function(event, ui) {
    var newIndex = ui.item.index();
    this.$('> div').sortable('cancel');
    var view = Ember.View.views[ui.item.attr('id')];
    var column = view.get('column');
    this.get('tableComponent').onColumnSort(column, newIndex);
    this.set('tableComponent._isShowingSortableIndicator', false);
  }
});
