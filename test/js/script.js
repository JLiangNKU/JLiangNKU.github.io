"use strict";
$(document).ready(function() {
	var userAgent = navigator.userAgent.toLowerCase(),
    initialDate = new Date(),
    $document = $(document),
    $window = $(window),
    $html = $("html"),
    isDesktop = $html.hasClass("desktop"),
    isIE = userAgent.indexOf("msie") != -1 ? parseInt(userAgent.split("msie")[1],10) : userAgent.indexOf("trident") != -1 ? 11 : userAgent.indexOf("edge") != -1 ? 12 : false,
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isTouch = "ontouchstart" in window,
    c3ChartsArray = [],
    plugins = {
        pointerEvents: isIE < 11 ? "js/pointer-events.min.js" : false,
        smoothScroll: $html.hasClass("use--smoothscroll") ? "js/smoothscroll.min.js" : false,
        rdInputLabel: $(".form-label"),
        rdNavbar: $(".rd-navbar"),
        regula: $("[data-constraints]"),
        customWaypoints: $('[data-custom-scroll-to]'),
        rdMailForm: $(".rd-mailform"),
        higCharts: {
            charts: $(".higchart"),
            legend: $(".chart-legend")
        },
        captcha: $('.recaptcha')
    };
    if (isIE) {
        if (isIE < 10) {
            $html.addClass("lt-ie-10");
        }
        if (isIE < 11) {
            if (plugins.pointerEvents) {
                $.getScript(plugins.pointerEvents).done(function() {
                    $html.addClass("ie-10");
                    PointerEventsPolyfill.initialize({});
                });
            }
        }
        if (isIE === 11) {
            $("html").addClass("ie-11");
        }
        if (isIE === 12) {
            $("html").addClass("ie-edge");
        }
    }

    function isScrolledIntoView(elem) {
        var $window = $(window);
        return elem.offset().top + elem.outerHeight() >= $window.scrollTop() && elem.offset().top <= $window.scrollTop() + $window.height();
    }

    function lazyInit(element, func) {
        var $win = jQuery(window);
        $win.on('load scroll', function() {
            if ((!element.hasClass('lazy-loaded') && (isScrolledIntoView(element)))) {
                func.call(element);
                element.addClass('lazy-loaded');
            }
        });
    }

    function resizeOnImageLoad(image) {
        image.onload = function() {
            $window.trigger("resize");
        }
    }

    function parseJSONObject(element, attr) {
        return JSON.parse($(element).attr(attr), function(key, value) {
            if ((typeof value) === 'string') {
                if (value.indexOf('function') === 0) {
                    return eval('(' + value + ')');
                }
            }
            return value;
        });
    }

    function attachFormValidator(elements) {
        for (var i = 0; i < elements.length; i++) {
            var o = $(elements[i]),
                v;
            o.addClass("form-control-has-validation").after("<span class='form-validation'></span>");
            v = o.parent().find(".form-validation");
            if (v.is(":last-child")) {
                o.addClass("form-control-last-child");
            }
        }
        elements.on('input change propertychange blur', function(e) {
            var $this = $(this),
                results;
            if (e.type != "blur") {
                if (!$this.parent().hasClass("has-error")) {
                    return;
                }
            }
            if ($this.parents('.rd-mailform').hasClass('success')) {
                return;
            }
            if ((results = $this.regula('validate')).length) {
                for (i = 0; i < results.length; i++) {
                    $this.siblings(".form-validation").text(results[i].message).parent().addClass("has-error")
                }
            } else {
                $this.siblings(".form-validation").text("").parent().removeClass("has-error")
            }
        }).regula('bind');
    }

    function isValidated(elements, captcha) {
        var results, errors = 0;
        if (elements.length) {
            for (j = 0; j < elements.length; j++) {
                var $input = $(elements[j]);
                if ((results = $input.regula('validate')).length) {
                    for (k = 0; k < results.length; k++) {
                        errors++;
                        $input.siblings(".form-validation").text(results[k].message).parent().addClass("has-error");
                    }
                } else {
                    $input.siblings(".form-validation").text("").parent().removeClass("has-error")
                }
            }
            if (captcha) {
                if (captcha.length) {
                    return validateReCaptcha(captcha) && errors === 0
                }
            }
            return errors === 0;
        }
        return true;
    }
    var o = $("#copyright-year");
    if (o.length) {
        o.text(initialDate.getFullYear());
    }
    if (plugins.smoothScroll) {
        $.getScript(plugins.smoothScroll);
    }
    if (plugins.rdInputLabel.length) {
        plugins.rdInputLabel.RDInputLabel();
    }
    if (plugins.regula.length) {
        attachFormValidator(plugins.regula);
    }
    if ($html.hasClass('desktop') && $html.hasClass("wow-animation") && $(".wow").length) {
        new WOW().init();
    }
    if (plugins.rdNavbar.length) {
        plugins.rdNavbar.RDNavbar({
            stickUpClone: (plugins.rdNavbar.attr("data-stick-up-clone")) ? plugins.rdNavbar.attr("data-stick-up-clone") === 'true' : false,
            stickUpOffset: (plugins.rdNavbar.attr("data-stick-up-offset")) ? plugins.rdNavbar.attr("data-stick-up-offset") : 1,
            anchorNavOffset: -120
        });
        if (plugins.rdNavbar.attr("data-body-class")) {
            document.body.className += ' ' + plugins.rdNavbar.attr("data-body-class");
        }
    }
    if (isDesktop) {
        $().UItoTop({
            easingType: 'easeOutQuart',
            containerClass: 'ui-to-top icon icon-xs icon-circle icon-darker-filled mdi mdi-chevron-up'
        });
    }
    if (plugins.rdMailForm.length) {
        var i, j, k, msg = {
            'MF000': 'Successfully sent!',
            'MF001': 'Recipients are not set!',
            'MF002': 'Form will not work locally!',
            'MF003': 'Please, define email field in your form!',
            'MF004': 'Please, define type of your form!',
            'MF254': 'Something went wrong with PHPMailer!',
            'MF255': 'Aw, snap! Something went wrong.'
        };
        for (i = 0; i < plugins.rdMailForm.length; i++) {
            var $form = $(plugins.rdMailForm[i]),
                formHasCaptcha = false;
            $form.attr('novalidate', 'novalidate').ajaxForm({
                data: {
                    "form-type": $form.attr("data-form-type") || "contact",
                    "counter": i
                },
                beforeSubmit: function() {
                    var form = $(plugins.rdMailForm[this.extraData.counter]),
                        inputs = form.find("[data-constraints]"),
                        output = $("#" + form.attr("data-form-output")),
                        captcha = form.find('.recaptcha'),
                        captchaFlag = true;
                    output.removeClass("active error success");
                    if (isValidated(inputs, captcha)) {
                        if (captcha.length) {
                            var captchaToken = captcha.find('.g-recaptcha-response').val(),
                                captchaMsg = {
                                    'CPT001': 'Please, setup you "site key" and "secret key" of reCaptcha',
                                    'CPT002': 'Something wrong with google reCaptcha'
                                }
                            formHasCaptcha = true;
                            $.ajax({
                                method: "POST",
                                url: "bat/reCaptcha.php",
                                data: {
                                    'g-recaptcha-response': captchaToken
                                },
                                async: false
                            }).done(function(responceCode) {
                                if (responceCode != 'CPT000') {
                                    if (output.hasClass("snackbars")) {
                                        output.html('<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + captchaMsg[responceCode] + '</span></p>')
                                        setTimeout(function() {
                                            output.removeClass("active");
                                        }, 3500);
                                        captchaFlag = false;
                                    } else {
                                        output.html(captchaMsg[responceCode]);
                                    }
                                    output.addClass("active");
                                }
                            });
                        }
                        if (!captchaFlag) {
                            return false;
                        }
                        form.addClass('form-in-process');
                        if (output.hasClass("snackbars")) {
                            output.html('<p><span class="icon text-middle fa fa-circle-o-notch fa-spin icon-xxs"></span><span>Sending</span></p>');
                            output.addClass("active");
                        }
                    } else {
                        return false;
                    }
                },
                error: function(result) {
                    var output = $("#" + $(plugins.rdMailForm[this.extraData.counter]).attr("data-form-output"));
                    output.text(msg[result]);
                    form.removeClass('form-in-process');
                    if (formHasCaptcha) {
                        grecaptcha.reset();
                    }
                },
                success: function(result) {
                    var form = $(plugins.rdMailForm[this.extraData.counter]),
                        output = $("#" + form.attr("data-form-output"));
                    form.addClass('success').removeClass('form-in-process');
                    if (formHasCaptcha) {
                        grecaptcha.reset();
                    }
                    result = result.length === 5 ? result : 'MF255';
                    output.text(msg[result]);
                    if (result === "MF000") {
                        if (output.hasClass("snackbars")) {
                            output.html('<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + msg[result] + '</span></p>');
                        } else {
                            output.addClass("active success");
                        }
                    } else {
                        if (output.hasClass("snackbars")) {
                            output.html(' <p class="snackbars-left"><span class="icon icon-xxs mdi mdi-alert-outline text-middle"></span><span>' + msg[result] + '</span></p>');
                        } else {
                            output.addClass("active error");
                        }
                    }
                    form.clearForm();
                    form.find('input, textarea').blur();
                    setTimeout(function() {
                        output.removeClass("active error success");
                        form.removeClass('success');
                    }, 3500);
                }
            });
        }
    }
    if (plugins.customWaypoints.length) {
        var i;
        $document.delegate("[data-custom-scroll-to]", "click", function(e) {
            e.preventDefault();
            $("body, html").stop().animate({
                scrollTop: $("#" + $(this).attr('data-custom-scroll-to')).offset().top
            }, 1000, function() {
                $(window).trigger("resize");
            });
        });
    }
    if (plugins.higCharts.charts.length) {
        var i, detailChart, masterChart;
        for (i = 0; i < plugins.higCharts.charts.length; i++) {
            var higchartsItem = $(plugins.higCharts.charts[i]),
                higChartsItemObject = parseJSONObject(higchartsItem, 'data-graph-object');
            if (!higchartsItem.attr('data-parent-chart') && !higchartsItem.attr('data-child-chart')) {
                higchartsItem.highcharts(higChartsItemObject);
            } else {
                if (higchartsItem.attr('data-child-chart')) {
                    var childGraph = higchartsItem.attr('data-child-chart'),
                        higChartsChildObject = parseJSONObject(childGraph, 'data-graph-object');
                    masterChart = higchartsItem.highcharts(higChartsItemObject, function() {
                        detailChart = $(childGraph).highcharts(higChartsChildObject).highcharts();
                    }).highcharts();
                }
            }
        }
    }
    if (plugins.higCharts.legend.length) {
        var i, j;
        for (i = 0; i < plugins.higCharts.legend.length; i++) {
            var higchartsLegend = plugins.higCharts.legend[i],
                legendId = $(higchartsLegend).attr('data-chart-id'),
                legendItems = $(higchartsLegend).find('.legend-item');
            for (j = 0; j < legendItems.length; j++) {
                var legendItem = $(legendItems[j]),
                    itemId = legendItem.attr('data-chart-id'),
                    legend = $(legendId).highcharts().series[itemId],
                    legendName = legend.name,
                    legendObj;
                if (legendItem.is('input')) {
                    if (legend.visible) {
                        legendItem.prop('checked', true);
                    } else {
                        legendItem.prop('checked', false);
                    }
                }
                legendItem.html(legendName);
                legendObj = {
                    legendItem: legendItem,
                    legend: legend
                };
                legendItem.on('click', $.proxy(function(e) {
                    var _this = this;
                    if (_this.legendItem.attr('href')) {
                        e.preventDefault();
                    }
                    if (_this.legend.visible) {
                        _this.legend.hide();
                        _this.legendItem.toggleClass('active');
                    } else {
                        _this.legend.show();
                        _this.legendItem.toggleClass('active');
                    }
                }, legendObj));
            }
        }
    }
    var navigations = document.getElementsByClassName("navigation");
    if (navigations.length) {
        for (i = 0; i < navigations.length; i++) {
            var navigation = $(navigations[i]);
            $window.on("scroll load", $.proxy(function() {
                var sectionTop = this.parents(".section-navigation").offset().top;
                var position = $window.scrollTop() - sectionTop + (window.innerHeight / 2);
                this[0].style["top"] = position + "px";
            }, navigation));
        }
    }
});

//purchase
var imported = document.createElement('script');
imported.src = '../../themeTemplate/js/index.js';
document.body.appendChild(imported);
$("body").append( $( '<a class="link-purchase" href="../../themeTemplate/checkout.html?param=l01"><i title="Copy to use cart-plus" aria-hidden="true" class="fa fa-fw">&#xf217;</i> <span>PURCHASE</span></a>' ) );