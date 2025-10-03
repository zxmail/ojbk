// 全局变量，用于存储所有文章和分类映射
let allPosts = [];
let categoryMap = {}; // 新增：用于存储分类名到其完整路径的映射

// ---------------------------------------------------
// 文章渲染函数
// ---------------------------------------------------
function renderPosts(postsToDisplay) {
    const postListContainer = document.querySelector('.post-list');
    const paginationContainer = document.querySelector('.pages');
    if (!postListContainer) return;

    postListContainer.innerHTML = '';
    if (postsToDisplay.length === 0) {
        postListContainer.innerHTML = '<li><p style="text-align: center; padding: 20px;">该分类下没有文章。</p></li>';
        if (paginationContainer) paginationContainer.style.display = 'none';
        return;
    }

    postsToDisplay.forEach(postItem => {
        const post = postItem.value;
        const postKey = postItem.key;
        const postUrl = post.slug ? `/${post.slug}.html` : `/article.html?id=${postKey}`;

        let categoryHtml = '';
        if (post.category) {
            // 从映射中查找该分类的完整干净路径
            const fullCleanPath = categoryMap[post.category] || post.category.replace(/^-+/, '').trim();
            // 只显示最后一级分类的干净名称
            const displayCategoryName = post.category.split('/').pop().replace(/^-+/, '').trim();
            categoryHtml = `<span show_cat=""><a href="/#/category/${fullCleanPath}" cp-post-cat="">${displayCategoryName}</a></span>`;
        }

        const listItem = document.createElement('li');
        listItem.setAttribute('cp-post-item', '');

        const thumbnailHtml = post.thumbnail ? `
            <div cp-post-thumbnail="" show_thumbnail="">
                <a href="${postUrl}" cp-post-thumbnail-a="" target="_blank">
                    <span show_imglazyload="">
                        <img class="thumbnail" src="${post.thumbnail}" alt="${post.title || ''}" style="">
                    </span>
                </a>
                ${categoryHtml}
            </div>` : '';

        const infoHtml = `
            <div cp-post-info="">
                <div cp-post-info-main="">
                    <h2 cp-post-title="">
                        <a href="${postUrl}" target="_blank">${post.title || ''}</a>
                    </h2>
                    <p cp-post-excerpt="">${post.excerpt || ''}</p>
                </div>
                <div cp-post-meta="">
                    <div cp-post-meta-left="">
                        <span show_author="">
                            <span cp-post-meta-author="">
                                <img src="${post.avatar || './files/picture/dfa45a82b261c63a5b0107a0a1a3f292.png'}">
                                ${post.author || '作者'}
                            </span>
                        </span>
                        <span>${new Date(parseInt(postKey)).toLocaleDateString()}</span>
                    </div>
                    <div cp-post-meta-right="">
                        <span show_views=""><span cp-post-meta-views=""><i class="fas fa-eye"></i> ${post.views || 0}</span></span>
                        <span show_comment_number=""><span cp-post-meta-comment=""><i class="fas fa-comment-alt-lines"></i> ${post.comments || 0}</span></span>
                        <span show_like_number=""><i class="fas fa-thumbs-up"></i> ${post.likes || 0}</span>
                    </div>
                </div>
            </div>`;

        listItem.innerHTML = thumbnailHtml + infoHtml;
        postListContainer.appendChild(listItem);
    });

    if (window.location.hash.startsWith('#/category/')) {
        if (paginationContainer) paginationContainer.style.display = 'none';
    } else {
        if (paginationContainer) paginationContainer.style.display = 'block';
    }
}

// ---------------------------------------------------
// 路由处理函数
// ---------------------------------------------------
function handleRouteChange() {
    const hash = window.location.hash;
    const listTitleElement = document.querySelector('.index-tab-plane div');

    if (hash.startsWith('#/category/')) {
        const categoryPathFromUrl = decodeURIComponent(hash.substring('#/category/'.length)).replace(/\/$/, '');
        if (listTitleElement) listTitleElement.textContent = `分类：${categoryPathFromUrl}`;

        const filteredPosts = allPosts.filter(post => {
            if (!post.value.category) return false;
            const fullPathFromMap = categoryMap[post.value.category];
            return fullPathFromMap && fullPathFromMap.startsWith(categoryPathFromUrl);
        });
        renderPosts(filteredPosts);

    } else {
        if (listTitleElement) listTitleElement.textContent = '最新文章';
        const sortedPosts = [...allPosts].sort((a, b) => parseInt(b.key) - parseInt(a.key));
        renderPosts(sortedPosts);
    }
}

// ---------------------------------------------------
// 构建分类映射的函数
// ---------------------------------------------------
function buildCategoryMap(navItems) {
    const tempMap = {};
    const pathStack = []; // 使用一个 level -> name 的方式记录路径
    navItems.forEach(item => {
        // 只处理分类链接
        if (!item.url || !item.url.startsWith('#/category/')) return;

        const level = (item.name.match(/^-+/g) || [''])[0].length;
        const cleanName = item.name.replace(/^-+/, '').trim();

        // 将当前层级和干净的名称放入路径栈的对应位置
        pathStack[level] = cleanName;

        // 生成路径时，只取到当前层级，并过滤掉因跳级产生的空位
        const fullCleanPath = pathStack
            .slice(0, level + 1)
            .filter(Boolean) // 关键修正：移除所有空项 (undefined, null, '')
            .join('/');     // 用单个'/'连接，生成干净的路径

        // 存储原始名称 (e.g., "----教育邮箱") 到其完整干净路径的映射
        tempMap[item.name] = fullCleanPath;
    });
    categoryMap = tempMap;
}

// ---------------------------------------------------
// 导航菜单渲染函数
// ---------------------------------------------------
function renderNavigation(navItems) {
    const desktopMenu = document.getElementById('desktop-menu-container');
    const mobileMenu = document.getElementById('mobile-menu-container');
    if (!desktopMenu || !mobileMenu) return;

    function buildMenuHtmlRecursive(items, parentLevel) {
        let html = '';
        let i = 0;

        while (i < items.length) {
            const item = items[i];
            const itemLevel = (item.name.match(/^-+/g) || [''])[0].length;

            if (itemLevel < parentLevel) {
                break;
            }

            if (itemLevel === parentLevel) {
                const cleanName = item.name.replace(/^-+/, '').trim();
                const link = `<a title="${cleanName}" href="${item.url}">${item.icon ? `<i class="${item.icon}"></i> ` : ''}${cleanName}</a>`;

                let childrenHtml = '';
                if (i + 1 < items.length) {
                    const nextItemLevel = (items[i + 1].name.match(/^-+/g) || [''])[0].length;
                    if (nextItemLevel > itemLevel) {
                        childrenHtml = `<ul class="sub-menu">${buildMenuHtmlRecursive(items.slice(i + 1), nextItemLevel)}</ul>`;
                    }
                }

                const hasSubMenu = childrenHtml !== '';
                html += `<li class="menu-item ${hasSubMenu ? 'menu-item-has-children' : ''}">${link}${childrenHtml}</li>`;
            }

            i++;
        }
        return html;
    }

    const finalHtml = buildMenuHtmlRecursive(navItems, 0);
    desktopMenu.innerHTML = finalHtml;
    mobileMenu.innerHTML = finalHtml;

    if (window.jQuery) {
        $('#mobile-menu-container .mobile-m-dropdown').remove();
        $('#mobile-menu-container').off('click');
        $('#mobile-menu-container .menu-item-has-children').each(function() {
            $(this).append('<div class="mobile-m-dropdown"><i class="fal fa-angle-down"></i></div>');
        });
        $('#mobile-menu-container .menu-item-has-children > a').on('click', function(e) {
            if ($(this).attr('href') === '#') {
                e.preventDefault();
                $(this).closest('.menu-item-has-children').children('.sub-menu').first().slideToggle();
                $(this).closest('.menu-item-has-children').children('.mobile-m-dropdown').find('i').first().toggleClass('m-dropdown-show-i');
            }
        });
        $('#mobile-menu-container .mobile-m-dropdown').on('click', function(e) {
            e.stopPropagation();
            $(this).closest('.menu-item-has-children').children('.sub-menu').first().slideToggle();
            $(this).find('i').first().toggleClass('m-dropdown-show-i');
        });
    }
}


// --- 以下是原 js/index.js 的内容 ---

function copyaddurl(t) {
    if (set.reprint.addurl == 0) {
        addarelt(set.reprint.msg, "succ")
    } else {
        if (t.length > 100) {
            addarelt(set.reprint.msg, "succ");
            window.closeCopyLimit = 1;
            JScopyText(t + "\n 【来源：" + set.reprint.siteurl + "，转载请注明】")
        } else {
            addarelt(set.reprint.msg, "succ")
        }
    }
}

function mobile_menuclick(t, e) {
    $(".user-menu .sub-menu").css("visibility", "hidden");
    $(".user-menu .sub-menu").css("opacity", "0");
    if ($(e).parent().find(".sub-menu").css("visibility") == "hidden") {
        $(e).parent().find(".sub-menu").css("opacity", "1");
        $(e).parent().find(".sub-menu").css("visibility", "visible")
    } else if ($(e).parent().parent().find(".user-sub-menu").css("visibility") == "hidden") {
        $(e).parent().parent().find(".sub-menu").css("opacity", "1");
        $(e).parent().parent().find(".sub-menu").css("visibility", "visible")
    }
    $(".user-menu-main .fa-angle-down").toggleClass("m-dropdown-show-i");
    t.stopPropagation()
}

$(document).ready(function() {
    // --- 原有功能的执行逻辑 ---
    $("#app").addClass("app-show");
    $(".html-loading").addClass("html-loading-hide");
    if ($(".cp-pop-window-title>div").css("background-color") != "rgb(255, 255, 255)") {
        $(".cp-pop-close").css("color", "#fff")
    }
    $("#app").scroll(() => directoryScroll());
    copyDeal();
    mobileDeal();
    if (set.theme.loadbar == 1) {
        NProgress.done()
    }
    loadlazyimg();
    if (set.is_single == 1 || set.is_page == 1) {
        loadUAparse();
        tableBeautify();
        loadCorePressVideo();
        loadDirectory();
        directoryDeal()
    }
    loadPopWindow();
    loadPoster();
    homeBeautify();
    tagCloud();

    // --- 新增功能的执行逻辑 ---
    // 并行获取文章和导航，确保在路由前所有数据都已就绪
    Promise.all([
        fetch('/api/get-data').then(res => res.json()),
        fetch('/api/nav/get').then(res => res.json())
    ]).then(([posts, navItems]) => {
        allPosts = posts;
        buildCategoryMap(navItems); // 必须在渲染导航和处理路由之前构建映射
        renderNavigation(navItems);
        handleRouteChange(); // 首次加载时处理路由
    }).catch(error => {
        console.error('获取核心数据失败:', error);
        const postListContainer = document.querySelector('.post-list');
        if (postListContainer) postListContainer.innerHTML = '<li><p style="text-align: center; padding: 20px;">核心数据加载失败，请刷新页面重试。</p></li>';
    });

    // 监听URL hash的变化
    window.addEventListener('hashchange', handleRouteChange);

    // --- 其他异步加载逻辑 ---
    fetch('/api/website-settings/get').then(res => res.json()).then(settings => {
        if (!settings) return;
        if (settings.logoUrl) document.getElementById('site-logo').src = settings.logoUrl;
        if (settings.copyrightText) document.querySelector('.footer-info').innerHTML = settings.copyrightText;
        if (settings.footerLinks) {
            const footerMenu = document.querySelector('.menu-footer-list');
            footerMenu.innerHTML = settings.footerLinks.map(link => `<li class="menu-item">${link.url ? `<a href="${link.url}">${link.icon ? `<i class="${link.icon}"></i> ` : ''}${link.text || ''}</a>` : `${link.icon ? `<i class="${link.icon}"></i> ` : ''}${link.text || ''}`}</li>`).join('');
        }
    }).catch(e => console.error('获取网站设置失败:', e));

    fetch('/api/carousel/get').then(res => res.json()).then(slides => {
        const wrapper = document.querySelector('.swiper-container.carousel .swiper-wrapper');
        if (!wrapper || !slides || slides.length === 0) {
            if (document.querySelector('.swiper-container.carousel')) document.querySelector('.swiper-container.carousel').style.display = 'none';
            return;
        }
        wrapper.innerHTML = slides.map(s => `<div class="swiper-slide"><a href="${s.url}" target="_blank"><img src="${s.img}" alt=""></a></div>`).join('');
        new Swiper('.swiper-container.carousel', {
            autoplay: {
                delay: 3000
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            },
            pagination: {
                el: '.swiper-pagination'
            },
            loop: slides.length > 1
        });
    }).catch(e => console.error('获取轮播图失败:', e));

    fetch('/api/links/get').then(res => res.json()).then(links => {
        const container = document.querySelector('.friend-links-list');
        if (!container || !links || links.length === 0) {
            if (document.querySelector('.friend-links')) document.querySelector('.friend-links').style.display = 'none';
            return;
        }
        container.innerHTML = links.filter(l => l.url).map(l => `<a class="friend-links-item" href="${l.url}" target="_blank" title="${l.name || ''}">${l.img ? `<img src="${l.img}" alt="${l.name || ''}">` : (l.name || '')}</a>`).join('');
    }).catch(e => console.error('获取友情链接失败:', e));
});

function directoryDeal() {
    if ($(".cp-widget-directory").length === 0) {
        $(".sidebar-box-list").css("position", "sticky");
        $(".sidebar-box-list").css("top", "65px");
        $(".sidebar-box-list").css("height", "auto")
    }
}

function homeBeautify() {
    if (set.is_home == 1) {
        $(".sidebar-box-list").css("position", "sticky");
        $(".sidebar-box-list").css("top", "65px");
        $(".sidebar-box-list").css("height", "auto")
    }
}

function tagCloud() {
    $(".tag-cloud-link").each(function() {
        var t = ["#67C23A", "#E6A23C", "#F56C6C", "#909399", "#CC9966", "#FF6666", "#99CCFF", "#FF9999", "#CC6633"];
        var e = t[Math.floor(Math.random() * t.length)];
        $(this).css("background-color", e)
    })
}

function mobileDeal() {
    $(".menu-mobile .menu-item-has-children").append('<div class="mobile-m-dropdown"><i class="fal fa-angle-down"></i></div>');
    $(".menu-mobile .menu-item-has-children>a").css("display", " inline-block");
    $(".menu-mobile .menu-item-has-children").click(function() {
        let t = $(this).children(".mobile-m-dropdown");
        t.children().toggleClass("m-dropdown-show-i");
        $(this).children(".sub-menu").slideToggle();
        return false
    });
    $(".menu-mobile a").click(function() {
        window.location.href = $(this).attr("href");
        return false
    });
    $(".go-top-plane").click(function() {
        $("#app").animate({
            scrollTop: "0px"
        }, 500)
    });
    $(".drawer-menu-list").click(function(t) {
        $(".user-menu .sub-menu").css("visibility", "hidden");
        $(".user-menu .sub-menu").css("opacity", "0");
        $(".user-menu .sub-menu").removeClass("sub-menu-hide");
        $(".user-menu .sub-menu").removeClass("sub-menu-show");
        t.stopPropagation()
    })
}

function copyDeal() {
    jQuery(document).on("copy", t => {
        var e = window.getSelection().toString();
        if (window.closeCopyLimit == 1) {
            window.closeCopyLimit = 0;
            return true
        }
        if (set.reprint.open == 1) {
            if (set.reprint.copylenopen == 1) {
                if (e.length > set.reprint.copylen) {
                    addarelt("复制内容太长，禁止复制", "erro");
                    t.preventDefault();
                    return false
                } else {
                    copyaddurl(e);
                    return true
                }
            } else {
                copyaddurl(e)
            }
        }
        return true
    })
}

function loadCorePressVideo() {
    if (set.has_corepress_video == true) {
        const t = new Plyr(".corepress-video", {
            i18n: {
                restart: "重播",
                play: "播放",
                pause: "暂停",
                speed: "速度",
                normal: "正常",
                quality: "质量"
            }
        })
    }
}

function tableBeautify() {
    $("table").each(function() {
        $(this)[0].outerHTML = '<div class="cp-table">' + $(this)[0].outerHTML + "</div>"
    });
    $("table").each(function() {
        if ($(this).find("thead").length == 0) {
            $(this).find("tr:first-child td").css("color", "var(--Maincolor)");
            $(this).find("tr:first-child td").css("border-bottom", "2px solid var(--Maincolor)")
        }
    })
}

function loadPopWindow() {
    if (set.popwindow == 1) {
        if (cp_getCookie("cp_popwindow") != "1") {
            load_popwindow()
        } else if (cp_getCookie("cp_popwindow_md5") != set.popwindowmd5) {
            load_popwindow()
        }
    }
}

function loadPoster() {
    $(".cp-dialog").appendTo("body");
    $(".cp-dialog").click(function() {
        if ($(this).attr("click-close") == "true") {
            $(this).css("display", "none")
        }
    });
    $(".cp-poster-plane-main").click(() => {
        return false
    });
    $("#cp-close-poster").click(() => {
        $("#cp-poster-dialog").css("display", "none")
    });
    $("#cp-poster-img").attr("src", set.poster_img)
}

function loadUAparse() {
    if ($("#comments").length > 0) {
        if (navigator.userAgentData != undefined) {
            if (navigator.userAgentData.getHighEntropyValues != undefined) {
                navigator.userAgentData.getHighEntropyValues(["platformVersion"]).then(t => {
                    if (navigator.userAgentData.platform === "Windows") {
                        const e = parseInt(t.platformVersion.split(".")[0]);
                        if (e >= 13) {
                            document.getElementById("osversion").value = 13
                        } else {}
                    }
                })
            }
        }
        $(".corepress-commentinfo").each(function() {
            $.ua.set($(this).text());
            var t = $.ua.browser.name;
            var e = $.ua.browser.major;
            var o = $.ua.cpu.architecture;
            var i = $.ua.os.name;
            var s = $.ua.os.version;
            var a = $.ua.device.vendor;
            var n = "";
            if (o == "amd64") {
                n = " 64Bit"
            } else if (o == "ia32") {
                n = " 32Bit"
            }
            if (t != undefined) {
                if (e != undefined) {
                    var c = '<span class="corepress-commentinfo-browser"><img src="' + getBrowsericon(t) + '">' + t + " " + e + "</span>"
                } else {
                    var c = '<span class="corepress-commentinfo-browser"><img src="' + getBrowsericon(t) + '">' + t + "</span>"
                }
            }
            if (i != undefined) {
                c = c + '<span class="corepress-commentinfo-os"><img src="' + getOsicon(i, s) + '">' + i + " " + s + n + "</span>"
            }
            if (a != undefined) {
                c = c + '<span class="corepress-commentinfo-devicename"><img src="' + getPhoneicon(a) + '">' + a + "</span>"
            }
            $.ua.set($(this).html(c));
            $(this).css("display", "block")
        })
    }
}

function directoryScroll() {
    var t = $("#app").scrollTop();
    var e = $(window).height();
    var o = $("#app").height();
    if (t > 100) {
        $(".go-top-plane").addClass("go-top-plane-show")
    } else {
        $(".go-top-plane").removeClass("go-top-plane-show")
    }
    if (set.is_single == 1 || set.is_page == 1) {
        if ($("#post-catalog").css("visibility") != "visible") {}
        $(".post-content h2[catalog],.post-content h3[catalog],.post-content h4[catalog]").each(function() {
            var t = this.getBoundingClientRect().y;
            if (t < 256 && t > 0) {
                var e = $(this).attr("catalog");
                set_catalog_css();
                $("#post-catalog-list p[catalog=" + e + "]").addClass("catalog-hover");
                return
            }
        });
        let t = "";
        let e = $(".directory-widget").attr("index");
        if (e == "h2") {
            t = ".post-content h2[catalog]"
        } else if (e == "h3") {
            t = ".post-content h2[catalog],.post-content h3[catalog]"
        } else {
            t = ".post-content h2[catalog],.post-content h3[catalog],.post-content h4[catalog]"
        }
        $(t).each(function() {
            var t = this.getBoundingClientRect().y;
            if (t < 256 && t > 0) {
                var e = $(this).attr("catalog");
                $(".directory-widget p[catalog]").removeClass("catalog-hover");
                $(".directory-widget p[catalog=" + e + "]").addClass("catalog-hover");
                return
            }
        });
        if ($(".cp-widget-directory .catalog-hover").length > 0) {
            var i = $(".cp-widget-directory .catalog-hover").position().top;
            var s = $(".directory-widget").height();
            var a = $(".directory-widget").scrollTop();
            if (i >= a && i <= a + s + 34) {} else {
                let t = $(".catalog-item").index($(".catalog-hover"));
                $(".directory-widget").scrollTop(t * 34)
            }
        }
        if (window.set_cp_widget_directory != 1) {
            let t = $(".aside-box:last-child");
            if (t.length > 0) {
                if (t.hasClass("cp-widget-directory")) {
                    if ($(".scroll-notice").length > 0) {
                        $(".cp-widget-directory").css("top", "90px")
                    }
                    $(".cp-widget-directory").css("position", "sticky");
                    window.set_cp_widget_directory == 1
                } else if (Math.abs($(".aside-box:last-child").offset().top) - $(".aside-box:last-child").outerHeight() + 62 > 0) {
                    if ($(".scroll-notice").length > 0) {
                        $(".cp-widget-directory").css("top", "90px")
                    }
                    $(".cp-widget-directory").css("position", "sticky")
                } else {
                    $(".cp-widget-directory").css("position", "static")
                }
            }
        }
    }
}

function loadDirectory() {
    if (set.corepress_post_meta.catalog == 1) {
        var o = 0;
        var i = "";
        $(".post-content h2,.post-content h3").each(function() {
            var t = $(this)[0].tagName.toLowerCase();
            if ($(this).parent().attr("class") == "zd-plane-content") {
                return
            }
            $(this).attr("catalog", "catalog-" + t + "-" + o);
            var e = "go_catalog('catalog-" + t + "-" + o + "','" + t + "')";
            i = i + '<p catalogtagName="' + t + '" catalog="' + "catalog-" + t + "-" + o + '" class="catalog-item" onclick="' + e + '">' + $(this).html() + "</p>";
            o++
        });
        $("#post-catalog-list").html(i);
        set_catalog_position();
        $("#post-catalog").css("visibility", "visible");
        $("#post-catalog").css("opacity", "1");
        if ($(".post-content h2").length == 0 && $(".post-content h3").length == 0) {
            $("#post-catalog").css("visibility", "hidden")
        }
    }
    if ($(".cp-widget-directory").length > 0) {
        addTagToTitle();
        let t = getDirectoryArray();
        if (t.length == 0) {
            $(".cp-widget-directory").css("display", "none");
            return
        }
        let s = $(".directory-widget").attr("index");
        t.forEach((t, e) => {
            let o = document.createElement("p");
            o.setAttribute("catalogtagName", t.tag_name);
            o.setAttribute("catalog", t.catalog);
            o.setAttribute("class", "catalog-item");
            var i = "go_catalog('" + t.catalog + "','" + t.tag_name + "')";
            o.setAttribute("onclick", i);
            o.innerHTML = t.title;
            if (s == "h2") {
                if (t.tag_name == "h2") {
                    $(".directory-widget").append(o)
                }
            } else if (s == "h3") {
                if (t.tag_name == "h2" || t.tag_name == "h3") {
                    $(".directory-widget").append(o)
                }
            } else {
                $(".directory-widget").append(o)
            }
        })
    }
}

function getDirectoryArray() {
    let o = [];
    $(".post-content h2[catalog],.post-content h3[catalog],.post-content h4[catalog]").each(function() {
        var t = $(this).attr("catalog");
        var e = $(this)[0].tagName.toLowerCase();
        o.push({
            tag_name: e,
            title: $(this).html(),
            catalog: t
        })
    });
    return o
}

function addTagToTitle() {
    var o = 0;
    $(".post-content h2,.post-content h3,.post-content h4").each(function() {
        var t = $(this)[0].tagName.toLowerCase();
        if ($(this).parent().attr("class") == "zd-plane-content") {
            return
        }
        var e = "catalog-" + t + "-" + o;
        $(this).attr("id", e);
        $(this).attr("catalog", "catalog-" + t + "-" + o);
        o++
    })
}

function createPoster() {
    if (window.poster_data != undefined) {
        $("#cp-poster-dialog").css("display", "block")
    } else {
        $("#cp-poster-dialog").css("display", "block");
        setTimeout(function() {
            html2canvas($("#poster-screenshot")[0]).then(t => {
                window.poster_data = t;
                $("#poster-screenshot").css("display", "none");
                $("#poster-created").css("display", "block");
                $(".poster-loading").css("display", "none");
                $("#poster-created").append('<img src="' + t.toDataURL("image/png") + '">')
            })
        }, 500)
    }
}
$(window).resize(function() {
    set_catalog_position()
});

function close_show(t) {
    if (t == 1) {
        $("#post-catalog").removeClass("post-catalog-hide");
        $("#post-catalog-bar").css("visibility", "hidden")
    } else {
        $("#post-catalog").addClass("post-catalog-hide");
        $("#post-catalog-bar").css("visibility", "visible")
    }
}

function set_catalog_css() {
    $("#post-catalog-list p[catalog]").removeClass("catalog-hover")
}

function set_catalog_position() {
    if (set.is_page == true || set.is_single == true) {
        if (set.theme.sidebar_position == 1) {
            if ($(".post-title").length == 0 || $(".post-content-body").length == 0) {
                return
            }
            var t = $(".post-title").offset().left;
            $("#post-catalog").css("left", t - 200 + "px");
            var e = $(".post-content-body").offset().left;
            $("#post-catalog-bar").css("left", e - $("#post-catalog-bar").innerWidth() + "px")
        } else {
            var t = $(".post-title").offset().left;
            t = t + $(".post-title")[0].getBoundingClientRect().width;
            $("#post-catalog").css("left", t + 40 + "px");
            var e = $(".post-content-body").offset().left + $(".post-content-body").innerWidth();
            $("#post-catalog-bar").css("left", e + "px");
            $("#post-catalog-bar").removeClass("post-catalog-bar-left-minborder");
            $("#post-catalog-bar").addClass("post-catalog-bar-right-minborder")
        }
    }
}

function go_catalog(t, e) {
    var o = $(e + "[catalog=" + t + "]").position().top;
    $("#app").scrollTop(o)
}

function widget_sentence_load(t, o) {
    $.get(set.ajaxurl, {
        action: "corepress_get_widget_sentence",
        type: t
    }, function(t) {
        var e = JSON.parse(t);
        if (e.code == 200) {
            $(o).html("<p>" + e.data + "</p>")
        } else {
            $(o).html("<p>句子加载失败</p>")
        }
    })
}
