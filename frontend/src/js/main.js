$(document).ready(function() {
    // --------處理換頁 START----------
    // 導覽列點擊事件
    $('.nav-item').on('click', function(e) {
        e.preventDefault();
        const content = $(this).data('content');
        loadContent(content);
    });

    // 功能區點擊事件
    $('.list-group-item').on('click', function(e) {
        e.preventDefault();
        const feature = $(this).data('content');
        loadContent(feature);
    });
    
    // 加載內容
    function loadContent(file) {
        if(!file) return;
        file = "src/view/" + file;
        $('#content-area').load(file, function(response, status, xhr) {
            if (status == "error") {
                const msg = "出現錯誤: " + xhr.status + " " + xhr.statusText;
                $('#content-area').html(msg);
            }
        });
    }

    loadContent("home.html")

    // --------處理換頁 END----------

    // --------處理sidebar問題 START----------
    function toggleSidebar() {
        $("#sidebar").toggleClass("active");
        $("#content-area").toggleClass("active");
    }

    $("#sidebarToggle").click(function(e) {
        e.preventDefault();
        toggleSidebar();
    });

    $("#closeSidebar").click(function(e) {
        e.preventDefault();
        toggleSidebar();
    });
    // --------處理sidebar問題 END----------

    // --------處理登入 START----------
    const $userName = $("#userName");
    const $logoutBtn = $("#logoutBtn");
    const $loginBtn = $("#loginBtn");
    $.ajax({
        url: '../backend/check_session.php',
        method: 'GET',
        success: function(response) {
            if (response.logged_in) {
                $userName.html(`歡迎，${response.username}`);
                $userName.show();
                $logoutBtn.show();
                $loginBtn.hide();

            }
        }
    });

    $logoutBtn.on("click", ()=>{
        $.get('../backend/logout.php', function() {
                alert("已登出");
                window.location.reload();
        });
    })

    // --------處理登入 EMD----------

});
