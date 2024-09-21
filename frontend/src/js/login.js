$(document).ready(function() {
    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        const formData = $(this).serialize();

        $.post($(this).attr('action'), formData, function(response) {
            const result = JSON.parse(response);
            if (result.success) {
                alert("登入成功");
                window.location.reload()
            } else {
                alert("錯誤喔")    
            }
        });
    });
});