define(["utils/rect", "utils/transform", "utils/request-animation-frame"], function(Rect, Transform, requestAnimationFrame) {

    var LayerView = Backbone.View.extend({

        initialize: function() {
            LayerView.__super__.initialize.call(this);
            this._bounds = new Rect();
            this._transform = new Transform();
            this._bounds.on("change:position", this._onPositionChanged, this);
            this._bounds.on("change:size", this._onSizeChanged, this);
            this._transform.on("change", this._onTransformChanged, this);
            this._invalidationFlags = null;
            this._needsLayout = false;
        },

        setElement: function(el) {
            if (this.$el)
                this.$el.data("layer-view", null);
            LayerView.__super__.setElement.call(this, el);
            if (this.$el)
                this.$el.data("layer-view", this);
        },

        childrenViews: function() {
            var children = [];
            this.$el.children().each(function(i, child) {
                var layerView = $(child).data("layer-view");
                if (layerView)
                    children.push(layerView);
            });
            return children;
        },

        parent: function() {
            var parent = this.$el.parent();
            for (; parent.length; parent = parent.parent()) {
                var layerView = parent.data("layer-view");
                if (layerView)
                    return layerView;
            }
            return null;
        },

        layoutIfNeeded: function() {
            if (!this._needsLayout)
                return;
            this.layout();
        },

        layout: function() {
            _.each(this.childrenViews(), function(view) {
                view.layoutIfNeeded();
            });
        },

        setNeedsLayout: function(needsLayout) {
            if (this._needsLayout == needsLayout)
                return;
            this._needsLayout = needsLayout;
            if (needsLayout) {
                var parentView = this.parent();
                if (parentView)
                    parentView.setNeedsLayout(needsLayout);
            }
        },

        setBounds: function(bounds) {
            this._bounds.set(bounds);
        },

        bounds: function() {
            return this._bounds;
        },

        setTransform: function(transform) {
            this._transform.set(transform);
        },

        transform: function() {
            return this._transform;
        },

        render: function() {
            this.$el.addClass("js-layer-view");
            this._validatePosition();
            this._validateSize();
            this._validateTransform();
            return this;
        },

        invalidate: function(type) {
            this._requestAnimationFrame();
            this._invalidationFlags[type] = true;
        },

        _requestAnimationFrame: function() {
            if (this._invalidationFlags)
                return;
            this._invalidationFlags = {};
            requestAnimationFrame(this._update.bind(this));
        },

        _update: function() {
            if (!this._invalidationFlags)
                return;
            var invalidationFlags = this._invalidationFlags;
            this._invalidationFlags = null;
            var self = this;
            _.each(invalidationFlags, function(enabled, type) {
                if (!enabled)
                    return;
                self._validate(type);
            });
            this.trigger("update");
        },

        _validate: function(type) {
            var fn = this["_validate" + _.string.capitalize(type)];
            if (fn)
                fn.call(this);
            else
                this.trigger("validate:" + type);
        },

        _validatePosition: function() {
            this.$el
                .css("left", this._bounds.x())
                .css("top", this._bounds.y());
        },

        _validateSize: function() {
            this.$el
                .css("width", this._bounds.width())
                .css("height", this._bounds.height());
        },

        _validateTransform: function() {
            this.$el.css("transform", this._transform.toString());
        },

        _onPositionChanged: function() {
            this.invalidate("position");
        },

        _onSizeChanged: function() {
            this.invalidate("size");
        },

        _onTransformChanged: function() {
            this.invalidate("transform");
        }
    });

    return LayerView;

});