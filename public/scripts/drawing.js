(function (exports) {
    let canvas = $("#gameCanvas")

    exports.canvas = canvas

    exports.drawBoard = function (x_c, y_c, size) {
        for (x1 = 0; x1 < size; x1++) {
            for (y1 = 0; y1 < size; y1++) {
                canvas.drawRect({
                    fillStyle: (x1 + y1 + 1) % 2 == 0 ? 'white' : "lightgray",
                    strokeStyle: 'black',
                    strokeWidth: 4,
                    x: x1 * 50 + x_c, y: y1 * 50 + y_c,
                    fromCenter: false,
                    width: 50,
                    height: 50,
                    layer: true
                })
            }
        }
    }

    exports.drawText = function (x, y, text) {
        canvas.drawText({
            text: text,
            fontFamily: 'Open Sans',
            fontSize: 40,
            x: x, y: y,
            fillStyle: 'darkgrey',
            strokeStyle: 'black',
            strokeWidth: 1,
            fromCenter: false,
            layer: true
        });
    }

    exports.clearCanvas = function () {
        canvas.removeLayers();
        canvas.drawLayers();
    }

    // The pixel multiple to snap to
    var snapToAmount = 10;
    // Round the given value to the nearest multiple of n
    function nearest(value, n, corneranchor) {

        return Math.round(value / n) * n + corneranchor;
    }
    exports.drawShip = function (x, y, length, snapto) {
        let len = length * 50 - 20
        let wid = 30
        canvas.drawRect({
            fillStyle: "lightblue",
            strokeStyle: 'blue',
            strokeWidth: 4,
            x: 10 + x, y: 10 + y,
            fromCenter: false,
            width: wid,
            height: len,
            layer: true,
            draggable: true,
            updateDragX: function (layer, x) {
                return nearest(x, snapto, 10);
            },
            updateDragY: function (layer, y) {
                return nearest(y, snapto, 10);
            },
            click: function (layer) {
                // Spin star
                $(this).animateLayer(layer, {
                    width: layer.width === wid ? len : wid,
                    height: layer.height === len ? wid : len
                });
            }
        })
    }

    exports.getBoats = function () {
        return canvas.getLayers(function (layer) {
            return (layer.draggable === true);
        });
    }

    exports.overlap = function () {
        var boats = canvas.getLayers(function (layer) {
            return (layer.draggable === true);
        });
        for (i = 0; i < boats.length; i++) {
            var b = boats[i]
            for (j = 0; j < boats.length; j++) {
                c = boats[j]
                if (b !== c) {
                    var b_x = b.x, b_w = b.x + b.width,
                        b_y = b.y, b_h = b.y + b.height,
                        c_x = c.x, c_w = c.x + c.width,
                        c_y = c.y, c_h = c.y + c.height,
                        x_overlap = Math.max(0, Math.min(b_w, c_w) - Math.max(b_x, c_x)),
                        y_overlap = Math.max(0, Math.min(b_h, c_h) - Math.max(b_y, c_y));
                    if ((x_overlap * y_overlap) !== 0) {
                        return true
                    }
                }
            }

        }

        return false

    }

    exports.miss = function (x, y) {
        canvas.drawPath({
            strokeStyle: '#F22',
            strokeWidth: 10,
            rounded: true,
            layer: true,
            p2: {
                type: 'line',
                x1: x + 8, y1: y + 8,
                x2: x + 42, y2: y + 42
            },
            p1: {
                type: 'line',
                x1: x + 8, y1: y + 42,
                x2: x + 42, y2: y + 8
            }
        });
    }

    exports.hit = function (x, y) {
        canvas.drawArc({
            strokeStyle: '#2F2',
            strokeWidth: 5,
            x: x + 25, y: y + 25,
            radius: 17,
            layer:true
        });
    }




}(typeof exports === "undefined" ? this.Drawing = {} : exports));
