class PDFRender {
    constructor(canvas, pdfFile = "", options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {

            scale: (options.scale !== undefined) ? options.scale : 1.8,
            scroll_step:(options.scroll_step !== undefined) ? options.scroll_step : 5,

        }

        this.PDF = null
        this.currPage = 0
        this.pageRendering = false
        this.pageNumPending = null

        this.isDragging = false
        this.lastY = 0
        this.top = 0

        this.detector = null

        // DEBUG
        if (pdfFile === "")
            pdfFile = 'https://raw.githubusercontent.com/fabridigua/FacePDFViewer/main/lorem_ipsum.pdf'


        this.initPDF(pdfFile)

        this.addMouseEvents()


    }


    addMouseEvents() {
        let self = this
        this.canvas.addEventListener('mousedown', function(e) {
            var evt = e;
            self.isDragging = true;
            self.lastY = evt.clientY;
            e.preventDefault();
        }, false);

        window.addEventListener('mousemove', function(e) {
            var evt = e;
            if (self.isDragging) {
                const delta = evt.clientY - self.lastY;
                self.lastY = evt.clientY;
                self.top += delta;
                self.canvas.style.top = self.top + "px";
            }
            e.preventDefault();
        }, false);

        window.addEventListener('mouseup', function() {
            self.isDragging = false;
        }, false);
    }

    initPDF(pdfFile) {
        let self = this
        let pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@2.6.347/build/pdf.worker.js';

        pdfjsLib.getDocument(pdfFile).promise.then(function(pdfDoc_) {
            self.PDF = pdfDoc_;
            // document.getElementById('page_count').textContent = pdfDoc.numPages;

            self.renderPage(1);
        });
    }

    // TODO: render the whole PDF FORSE
    renderPage(pageNumber, refresh = false) {
        if (!refresh && pageNumber === this.currPage)
            return;
        if (this.pageRendering) {
            this.pageNumPending = pageNumber;
            return
        }
        self = this
        self.detector.changePage = true
        self.currPage = pageNumber
        self.pageNumPending = pageNumber

        self.pageRendering = true;
        // Using promise to fetch the page
        self.PDF.getPage(pageNumber).then(function(page) {
            let viewport = page.getViewport({scale: self.options.scale});
            self.canvas.height = viewport.height;
            self.canvas.width = viewport.width;
            $(self.canvas).height(viewport.height)
            $(self.canvas).width(viewport.width)

            let parent_w = $(self.canvas.parentElement).width()
            $(self.canvas).css("left", (parent_w/2 - self.canvas.width/2) + "px")

            // Render PDF page into canvas context
            let renderContext = {
                canvasContext:self.ctx,
                viewport: viewport
            };



            page.render(renderContext).promise.then(function() {
                self.pageRendering = false;
                self.detector.changePage = false
                $("#pageNumb p").html(self.currPage + " of " +self.PDF.numPages)
                self.top = 0
                self.canvas.style.top = self.top + "px";
                if (self.pageNumPending !== null) {
                    self.renderPage(self.pageNumPending);
                    self.pageNumPending = null;
                }
            });
        });

    }

    zoom(isZoomOut) {
        console.log("ZOOM: isZoomOut? " + isZoomOut)
        $("td p").removeClass("action_selected")
        if (isZoomOut){
            $("#scrollTiltRightTD p").addClass("action_selected")
            this.options.scale = (this.options.scale > 0.4) ? this.options.scale - 0.2 : 0.4
        }else{
            $("#scrollTiltLeftTD p").addClass("action_selected")
            this.options.scale = (this.options.scale < 2.0) ? this.options.scale + 0.2 : 2.0
        }
        this.renderPage(this.currPage, true)
    }

    scroll(speed){
        const self = this

        const canvas_h = $(self.canvas).height()
        const parent_h = $(self.canvas.parentElement).height()
        if (canvas_h < parent_h)
            return

        if (speed > 0)
            $("#scrollUpTD p").addClass("action_selected")
        else
            $("#scrollDownTD p").addClass("action_selected")

        let top_limit = - Math.abs(canvas_h  - parent_h)

        const delta = speed*self.options.scroll_step;
        self.top += delta;
        self.top = (self.top > top_limit) ? self.top : top_limit
        self.top = (self.top < 0) ? self.top : 0

        self.canvas.style.top = self.top + "px";
    }
}