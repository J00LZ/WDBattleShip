(function (exports) {
    let canvas = $("#gameCanvas")

    exports.canvas = canvas


    var fastIsFunction = function (obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    };

    exports.drawBoard = function (x_c, y_c, size, fun) {
        if (!fastIsFunction(fun)) fun = function (a) { }
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
                    layer: true,
                    click: function (layer) {
                        var r = (layer.y - y_c) / 50 + (layer.x - x_c) / 50 * 10
                        if (r < 10) r = "0" + r
                        fun(r)
                    }

                })
            }
        }
    }


    exports.drawText = function (x, y, text, ident) {
        if (!(ident)) ident = text
        canvas.drawText({
            text: text,
            fontFamily: 'Open Sans',
            fontSize: 40,
            x: x, y: y,
            fillStyle: 'black',
            strokeWidth: 1,
            layer: true,
            name: "txt/" + ident
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
        return Math.round(value / n) * n
    }
    exports.drawShip = function (xi, yi, length) {
        let len = 30
        let wid = length * 50 - 20
        canvas.drawRect({
            fillStyle: "lightblue",
            strokeStyle: 'blue',
            strokeWidth: 4,
            x: 10 + xi, y: 10 + yi,
            fromCenter: false,
            width: wid,
            height: len,
            layer: true,
            draggable: true,
            groups: ['boats'],
            bringToFront: true,
            updateDragX: function (layer, x) {
                if ((x < 20 + 50 * 9) && x > 10) {
                    return nearest(x, 50) + 20
                } else if (x >= 20 + 50 * 9) {
                    return nearest(20 + 50 * 9, 50) + 20;
                } else {
                    return nearest(20, 50) + 20
                }

            },
            updateDragY: function (layer, y) {
                if (y < 50) {
                    return nearest(50, 50) + 30
                } else if (y >= exports.canvas.height() - exports.canvas.height() / 8) {
                    return nearest(exports.canvas.height() - exports.canvas.height() / 8, 50) + 30
                }
                return nearest(y, 50) + 30;
            },
            click: function (layer) {
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


    // Check if rectangle a contains rectangle b
    // Each object (a and b) should have 2 properties to represent the
    // top-left corner (x1, y1) and 2 for the bottom-right corner (x2, y2).
    function contains(a, b) {
        return !(
            b.x1 < a.x1 ||
            b.y1 < a.y1 ||
            b.x2 > a.x2 ||
            b.y2 > a.y2
        );
    }

    exports.inBoard = function (x, y, size) {
        var boats = canvas.getLayers(function (layer) {
            return (layer.draggable === true);
        });
        var grid = { x: x, y: y, width: size * 50, height: size * 50 }
        for (j = 0; j < boats.length; j++) {
            var boat = boats[j]

            var grd = {
                x1: grid.x, x2: grid.x + grid.width,
                y1: grid.y, y2: grid.y + grid.height
            },
                boatt = {
                    x1: boat.x, x2: boat.x + boat.width,
                    y1: boat.y, y2: boat.y + boat.height
                }

            if (!contains(grd, boatt)) {
                return false
            }



        }

        return true

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
            layer: true
        });
    }

    exports.button = function (x, y, text, onClick, size) {
        canvas.drawText({
            layer: true,
            name: text,
            fillStyle: 'black',
            strokeWidth: 2,
            x: x, y: y,
            fontSize: size ? size : '36pt',
            fontFamily: 'Open Sans',
            click: onClick,
            text: text,
            index: 1
        }).drawRect({
            x: x, y: y,
            width: canvas.measureText(text).width + 10,
            height: canvas.measureText(text).height + 10,
            layer: true,
            strokeStyle: '#000',
            strokeWidth: 4,
            click: onClick,
            cornerRadius: 10,
            fillStyle: "#F55",
            index: 0,
            name: "back/" + text
        }).drawLayers()
    }





}(typeof exports === "undefined" ? this.Drawing = {} : exports));
