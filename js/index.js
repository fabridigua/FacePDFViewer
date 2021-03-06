
let renderer = null
let detector = null

let streaming = false

$(document).ready(function(){

    $("#but_upload").on("click",startUpload)

    let video = document.getElementById("cameraImg");
    let faceCanvas = document.getElementById("faceImg");

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            video.srcObject = stream;
            video.play();
            $(video).hide()
        })
        .catch(function(err) {
            console.log("An error occurred! " + err);
        });

    detector = new FaceDetector(video, faceCanvas)

    detector.loadModels().then(function (){
        // detector.initStream()
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
                $(video).hide()
                detector.initStream()
            })
            .catch(function(err) {
                console.log("An error occurred! " + err);
            });
    })


    $("#pdf_url_form a").on("click", function (event){
        $("#pdf_opener").hide()
        $("#pdf_container").show()


        let canvas = document.getElementById('pdf_canvas')
        let url = 'https://raw.githubusercontent.com/fabridigua/FacePDFViewer/main/lorem_ipsum.pdf';

        let input_text = $("#pdf_url_form input").val()

        if(input_text !== "")
            url = input_text

        renderer = new PDFRender(canvas, url)
        renderer.detector = detector
        detector.controller = renderer

        $("#actionsContainer").show()

    })

    $(".book_demo").on("click", function (){

        $("#pdf_opener").hide()
        $("#pdf_container").show()

        console.log($(this).attr("id"))
        let url = 'https://raw.githubusercontent.com/fabridigua/FacePDFViewer/main/lorem_ipsum.pdf';
        // let url2 = 'https://raw.githubusercontent.com/fabridigua/FacePDFViewer/main/Alice_Lewis_Carroll.pdf';
        // let url3 = 'https://raw.githubusercontent.com/fabridigua/FacePDFViewer/main/Frankenstein_Mary_Shelley.pdf';

        if ($(this).attr("id") === "alice_pdf")
            url = 'https://raw.githubusercontent.com/fabridigua/FacePDFViewer/main/Alice_Lewis_Carroll.pdf'
        else if ($(this).attr("id") === "frank_pdf")
            url = 'https://raw.githubusercontent.com/fabridigua/FacePDFViewer/main/Frankenstein_Mary_Shelley.pdf'


        let canvas = document.getElementById('pdf_canvas')

        let input_text = $("#pdf_url_form input").val()

        if(input_text !== "")
            url = input_text

        renderer = new PDFRender(canvas, url)
        renderer.detector = detector
        detector.controller = renderer

        $("#actionsContainer").show()

    })


});

function startUpload(){
    var fd = new FormData();
    var files = $('#file')[0].files;

    console.log("startUpload: " + files)
    // Check file selected or not
    if(files.length > 0 ){
        fd.append('file',files[0]);

        $.ajax({
            // url: 'http://facepdfviewer.altervista.org/upload.php',
            url: 'https://facepdfviewer.altervista.org/upload.php',
            type: 'post',
            data: fd,
            contentType: false,
            processData: false,
            success: function(response){
                console.log(response)
            },
        });
    }else{
        alert("Please select a file.");
    }
}


//
// function initPDF(file_url=''){
//
//     // Init PDF File
//     var url = 'https://raw.githubusercontent.com/fabridigua/FacePDFViewer/main/lorem_ipsum.pdf';
//     if (file_url !== '')
//         url=file_url
//
//     var pdfjsLib = window['pdfjs-dist/build/pdf'];
//
//     // pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.js';
//
//     pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@2.6.347/build/pdf.worker.js';
//
//     var pdfDoc = null,
//         pageNum = 1,
//         pageRendering = false,
//         pageNumPending = null,
//         scale = 1.8,
//         canvas = document.getElementById('pdf_canvas'),
//         canvas_parent = document.getElementById('pdf_container'),
//         ctx = canvas.getContext('2d');
//
//
//     var dragging = false;
//     var lastY;
//     var marginTop = 0;
//
//     canvas.addEventListener('mousedown', function(e) {
//         var evt = e || event;
//         dragging = true;
//         lastY = evt.clientY;
//         e.preventDefault();
//     }, false);
//
//     window.addEventListener('mousemove', function(e) {
//         var evt = e || event;
//         if (dragging) {
//             var delta = evt.clientY - lastY;
//             lastY = evt.clientY;
//             marginTop += delta;
//             canvas.style.top = marginTop + "px";
//         }
//         e.preventDefault();
//     }, false);
//
//     window.addEventListener('mouseup', function() {
//         dragging = false;
//     }, false);
//
//
//     function renderPage(num) {
//         pageRendering = true;
//         // Using promise to fetch the page
//         pdfDoc.getPage(num).then(function(page) {
//             var viewport = page.getViewport({scale: scale});
//             canvas.height = viewport.height;
//             canvas.width = viewport.width;
//             $(canvas).height(viewport.height)
//             $(canvas).width(viewport.width)
//
//             let parent_w = $(canvas_parent).width()
//
//             $(canvas).css("left", (parent_w/2 - canvas.width/2) + "px")
//
//             // Render PDF page into canvas context
//             var renderContext = {
//                 canvasContext: ctx,
//                 viewport: viewport
//             };
//             var renderTask = page.render(renderContext);
//
//             // Wait for rendering to finish
//             renderTask.promise.then(function() {
//                 pageRendering = false;
//                 if (pageNumPending !== null) {
//                     // New page rendering is pending
//                     renderPage(pageNumPending);
//                     pageNumPending = null;
//                 }
//             });
//         });
//
//         // // Update page counters
//         // document.getElementById('page_num').textContent = num;
//     }
//
//     /**
//      * If another page rendering in progress, waits until the rendering is
//      * finised. Otherwise, executes rendering immediately.
//      */
//     function queueRenderPage(num) {
//         if (pageRendering) {
//             pageNumPending = num;
//         } else {
//             renderPage(num);
//         }
//     }
//
//     // /**
//     //  * Displays previous page.
//     //  */
//     // function onPrevPage() {
//     //     if (pageNum <= 1) {
//     //         return;
//     //     }
//     //     pageNum--;
//     //     queueRenderPage(pageNum);
//     // }
//     // document.getElementById('prev').addEventListener('click', onPrevPage);
//     //
//     // /**
//     //  * Displays next page.
//     //  */
//     // function onNextPage() {
//     //     if (pageNum >= pdfDoc.numPages) {
//     //         return;
//     //     }
//     //     pageNum++;
//     //     queueRenderPage(pageNum);
//     // }
//     // document.getElementById('next').addEventListener('click', onNextPage);
//
//     /**
//      * Asynchronously downloads PDF.
//      */
//     pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
//         pdfDoc = pdfDoc_;
//         // document.getElementById('page_count').textContent = pdfDoc.numPages;
//
//         // Initial/first page rendering
//         console.log("Try render page "+pageNum)
//         renderPage(pageNum);
//     });
// }