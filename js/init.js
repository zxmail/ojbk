$(document).ready(function () {
    if (set.module.imglightbox == 1) {
        $('.post-content-content img').not('.c-downbtn-icon,.cp-postcard-item img,.wxshow-img-plane img').each(function () {
            $(this).attr('data-fancybox', 'gallery');
            if (set.module.imglazyload == 1) {
                $(this).attr('data-src', $(this).attr('data-original'));
            }
        });
        Fancybox.bind("[data-fancybox=gallery]", {
            backFocus : false,
            Toolbar: {
                display: [
                    "zoom",
                    "slideshow",
                    "fullscreen",
                    "close",
                    "counter"
                ],
            },
            Thumbs: {
                autoStart: false,
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', (event) => {
    document.querySelectorAll('.corepress-code-pre code').forEach((block) => {
        hljs.highlightBlock(block);
    });

});
$('.corepress-code-pre').append('<div class="code-bar"><i class="fal fa-clone code-bar-btn-copy-fonticon" title="复制"></i></div>')
$(".corepress-code-pre code").each(function () {
    $(this).html("<ul class='hijs-line-number'><li>" + $(this).html().replace(/\n/g, "\n</li><li>") + "\n</li></ul>");
});



