var $submit,
    $holder,
    $input,
    $message,
    initialMessage,
    overClass = "is-over";

function setupInstance(index, element) {
    $holder = $(element);
    $submit = $holder.closest("form").find("[type=submit]");
    $input = $(element).children(".input");
    $message = $(element).children(".message");
    initialMessage = $message.text();

    $holder.on({
        dragover: function () {
            updateHolder(overClass);
        },

        dragleave: restoreHolder,

        drop: function (e) {
            e.preventDefault();
        }
    });

    $input.on("change", function () {
        var val = this.value;

        if (val) {
            updateHolder("has-file");
        }

        $message.html(val ? val.replace(/.*(\/|\\)/, "") : initialMessage);
        $submit.prop("disabled", !val);
        restoreHolder();
    });
}

function updateHolder(classToAdd) {
    $holder.addClass(classToAdd);
}

function restoreHolder() {
    $holder.removeClass(overClass);
}

$(".droparea").each(setupInstance);
