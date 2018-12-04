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
        canvas.drawRect({
            fillStyle: "white",
            x: 0, y: 0,
            width: 2000, height: 1000,
            fromCenter: false
        })
    }

    // The pixel multiple to snap to
    var snapToAmount = 10;
    // Round the given value to the nearest multiple of n
    function nearest(value, n, corneranchor) {

        return Math.round(value / n) * n+corneranchor;
    }
    exports.drawShip = function (x, y, sideways, length, snapto, corneranchorx, corneranchory) {
        len = length * 50 - 20
        wid = 30
        canvas.drawRect({
            fillStyle: "lightblue",
            strokeStyle: 'blue',
            strokeWidth: 4,
            x: 10 + x, y: 10 + y,
            fromCenter: false,
            width: sideways ? len : wid,
            height: sideways ? wid : len,
            layer: true,
            draggable: true,
            updateDragX: function (layer, x) {
                return nearest(x, snapto, corneranchorx+10);
            },
            updateDragY: function (layer, y) {
                return nearest(y, snapto, corneranchory+10);
            },
            click: function (layer) {
                // Spin star
                $(this).animateLayer(layer, {
                    width: layer.width===wid ? len : wid,
                    height: layer.height===len ? wid : len
                });
            }
        })
    }



}(typeof exports === "undefined" ? this.Drawing = {} : exports));
