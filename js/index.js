$(document).ready(function(){

    $("#file").on("change", function (event){
        const value = event.target;
        console.log(value)
        console.log("File: " + $(this).val())
        console.log("File name: " + document.getElementById("file").files[0].name)
        let name = document.getElementById("file").files[0].name
        $("#pdf_opener").hide()
        $("#pdf_container").show()

        initPDF()

    })


});

function initPDF(file_url=''){

    var url = 'https://drive.google.com/file/d/1S7LdHkliDs2gNTW4AZSTffTZO4IW9PSR/view?usp=sharing';
    if (file_url !== '')
        url=file_url

    var pdfjsLib = window['pdfjs-dist/build/pdf'];

    // pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.js';

    pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@2.6.347/build/pdf.worker.js';

    var pdfDoc = null,
        pageNum = 1,
        pageRendering = false,
        pageNumPending = null,
        scale = 0.8,
        canvas = document.getElementById('pdf_canvas'),
        ctx = canvas.getContext('2d');

    /**
     * Get page info from document, resize canvas accordingly, and render page.
     * @param num Page number.
     */
    function renderPage(num) {
        pageRendering = true;
        // Using promise to fetch the page
        pdfDoc.getPage(num).then(function(page) {
            var viewport = page.getViewport({scale: scale});
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page into canvas context
            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            var renderTask = page.render(renderContext);

            // Wait for rendering to finish
            renderTask.promise.then(function() {
                pageRendering = false;
                if (pageNumPending !== null) {
                    // New page rendering is pending
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });

        // // Update page counters
        // document.getElementById('page_num').textContent = num;
    }

    /**
     * If another page rendering in progress, waits until the rendering is
     * finised. Otherwise, executes rendering immediately.
     */
    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    // /**
    //  * Displays previous page.
    //  */
    // function onPrevPage() {
    //     if (pageNum <= 1) {
    //         return;
    //     }
    //     pageNum--;
    //     queueRenderPage(pageNum);
    // }
    // document.getElementById('prev').addEventListener('click', onPrevPage);
    //
    // /**
    //  * Displays next page.
    //  */
    // function onNextPage() {
    //     if (pageNum >= pdfDoc.numPages) {
    //         return;
    //     }
    //     pageNum++;
    //     queueRenderPage(pageNum);
    // }
    // document.getElementById('next').addEventListener('click', onNextPage);

    /**
     * Asynchronously downloads PDF.
     */
    pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
        pdfDoc = pdfDoc_;
        // document.getElementById('page_count').textContent = pdfDoc.numPages;

        // Initial/first page rendering
        console.log("Try render page "+pageNum)
        renderPage(pageNum);
    });
}