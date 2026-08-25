/**
 * Fondo dinámico "fibra óptica" para NTS, sobre el azul vívido de marca.
 * Nodos blancos que se desplazan sin parar por toda la pantalla y se
 * conectan con haces gruesos y con brillo; sobre cada haz viaja un
 * pulso de luz en bucle, como datos recorriendo una fibra. Se detiene
 * si el usuario pidió menos movimiento (prefers-reduced-motion) o si
 * la pestaña no está visible, para no gastar batería/CPU de más.
 */
(function () {
    "use strict";

    var canvas = document.getElementById("fondo-red");
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var COLOR_NODO = "255, 255, 255";     /* nodos y haces: blanco, como la referencia */
    var COLOR_ACENTO = "255, 214, 163";   /* toque cálido ocasional (ámbar de marca, aclarado) */

    var DISTANCIA_MAX = 200;              /* px: por debajo de esto, se dibuja el haz */
    var DISTANCIA_CURSOR = 230;
    var VELOCIDAD = 0.5;                  /* px por frame: deriva constante y bien visible */
    var VELOCIDAD_PULSO = 0.18;           /* vueltas por segundo a lo largo de cada haz */

    var puntos = [];
    var ancho = 0;
    var alto = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var mouse = { x: null, y: null };
    var frameId = null;

    function densidadPorArea(a) {
        return Math.min(80, Math.round(a / 30000));
    }

    function crearPuntos() {
        var n = densidadPorArea(ancho * alto);
        puntos = [];
        for (var i = 0; i < n; i++) {
            var ang = Math.random() * Math.PI * 2;
            puntos.push({
                x: Math.random() * ancho,
                y: Math.random() * alto,
                vx: Math.cos(ang) * VELOCIDAD,
                vy: Math.sin(ang) * VELOCIDAD,
                color: Math.random() < 0.82 ? COLOR_NODO : COLOR_ACENTO,
                r: Math.random() * 1.7 + 1.5
            });
        }
    }

    function redimensionar() {
        ancho = window.innerWidth;
        alto = window.innerHeight;
        canvas.width = ancho * dpr;
        canvas.height = alto * dpr;
        canvas.style.width = ancho + "px";
        canvas.style.height = alto + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        crearPuntos();
    }

    function paso() {
        for (var i = 0; i < puntos.length; i++) {
            var p = puntos[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.x <= 0 || p.x >= ancho) p.vx *= -1;
            if (p.y <= 0 || p.y >= alto) p.vy *= -1;
            p.x = Math.max(0, Math.min(ancho, p.x));
            p.y = Math.max(0, Math.min(alto, p.y));
        }
    }

    /* fase fija por par de nodos, para que el pulso de cada haz
       viaje siempre a un ritmo propio (no todos sincronizados) */
    function fase(i, j) {
        var h = (i * 928371 + j * 57373) % 1000;
        return h / 1000;
    }

    function dibujarHaz(ax, ay, bx, by, colorRGB, opacidadBase, grosor, t) {
        // halo exterior, suave (brillo difuso del haz)
        ctx.strokeStyle = "rgba(" + colorRGB + ", " + (opacidadBase * 0.3).toFixed(3) + ")";
        ctx.lineWidth = grosor * 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();

        // núcleo del haz, definido
        ctx.strokeStyle = "rgba(" + colorRGB + ", " + opacidadBase.toFixed(3) + ")";
        ctx.lineWidth = grosor;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();

        // pulso de luz recorriendo el haz de extremo a extremo, en bucle
        var px = ax + (bx - ax) * t;
        var py = ay + (by - ay) * t;
        var brillo = Math.sin(t * Math.PI);
        ctx.beginPath();
        ctx.arc(px, py, grosor * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, " + (0.95 * brillo).toFixed(3) + ")";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, grosor * 2.3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + colorRGB + ", " + (0.25 * brillo).toFixed(3) + ")";
        ctx.fill();
    }

    function dibujar(tiempoSeg) {
        ctx.clearRect(0, 0, ancho, alto);

        for (var i = 0; i < puntos.length; i++) {
            for (var j = i + 1; j < puntos.length; j++) {
                var a = puntos[i], b = puntos[j];
                var dx = a.x - b.x, dy = a.y - b.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < DISTANCIA_MAX) {
                    var cercania = 1 - dist / DISTANCIA_MAX;
                    var opacidad = cercania * 0.55;
                    var grosor = 1.3 + cercania * 2.2;
                    var t = (tiempoSeg * VELOCIDAD_PULSO + fase(i, j)) % 1;
                    dibujarHaz(a.x, a.y, b.x, b.y, COLOR_NODO, opacidad, grosor, t);
                }
            }
            // haz hacia el cursor, un poco más marcado (efecto "sensor")
            if (mouse.x !== null) {
                var mdx = puntos[i].x - mouse.x, mdy = puntos[i].y - mouse.y;
                var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
                if (mdist < DISTANCIA_CURSOR) {
                    var mcercania = 1 - mdist / DISTANCIA_CURSOR;
                    var mt = (tiempoSeg * VELOCIDAD_PULSO * 1.4 + fase(i, 9999)) % 1;
                    dibujarHaz(puntos[i].x, puntos[i].y, mouse.x, mouse.y, COLOR_ACENTO, mcercania * 0.6, 1.5 + mcercania * 2, mt);
                }
            }
        }

        // nodos, dibujados al final para que queden por encima de los haces
        for (var k = 0; k < puntos.length; k++) {
            var pt = puntos[k];
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + pt.color + ", 0.95)";
            ctx.fill();
        }
    }

    function animar(tsMs) {
        paso();
        dibujar(tsMs / 1000);
        frameId = requestAnimationFrame(animar);
    }

    function iniciar() {
        redimensionar();
        if (reduceMotion) {
            dibujar(0); // un solo frame estático, sin animación continua
            return;
        }
        if (frameId === null) {
            frameId = requestAnimationFrame(animar);
        }
    }

    function detener() {
        if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
        }
    }

    var resizeTimeout;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(redimensionar, 150);
    });

    window.addEventListener("mousemove", function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener("mouseleave", function () {
        mouse.x = null;
        mouse.y = null;
    });

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            detener();
        } else if (!reduceMotion) {
            frameId = requestAnimationFrame(animar);
        }
    });

    iniciar();
})();
