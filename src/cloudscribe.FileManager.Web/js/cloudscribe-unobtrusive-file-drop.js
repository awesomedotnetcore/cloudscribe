﻿(function () {
            document.addEventListener("DOMContentLoaded", function () {
                var dropElements = document.querySelectorAll('[data-dropzone]');
                var previewTemplate = "<div class=\"dz-preview dz-file-preview\"><div class=\"dz-image\"><img data-dz-thumbnail /></div><div class=\"dz-details collapse\"><div class=\"dz-size collapse\"><span data-dz-size></span></div><div class=\"dz-filename collapse\"><span data-dz-name></span></div></div><div class=\"dz-progress collapse\"><span class=\"dz-upload\" data-dz-uploadprogress></span></div><div class=\"dz-error-message collapse\"><span data-dz-errormessage></span></div><div class=\"dz-success-mark collapse\"></div><div class=\"dz-error-mark collapse\"></div></div>";

                var cloudscribeDropAndCrop = {

                    openServerBrowser: function (fileBrowseUrl) {
                        $('#fileBrowseDialog').find('iframe').attr('src', fileBrowseUrl);
                        $('#fileBrowseDialog').modal('show');
                    },
                    closeServerBrowser: function () {
                        $('#fileBrowseDialog').modal('hide');

                    },

                    buildImageEditor: function (div) {
                        var imageItem = {
                            dropZoneDiv: div,

                            setupCropper: function () {
                                var resizeWidth = new Number(this.dropZoneDiv.dataset.resizeWidth);
                                var resizeHeight = new Number(this.dropZoneDiv.dataset.resizeHeight);
                                var opts = {
                                    viewport: {
                                        width: resizeWidth,
                                        height: resizeHeight
                                    },
                                    boundary: {
                                        width: resizeWidth,
                                        height: resizeHeight
                                    }
                                };
                                this.cropper = new Croppie(this.fullSizeImage, opts);

                                var btnSave = document.getElementById(this.dropZoneDiv.id + "-save-crop");
                                if (btnSave) {
                                    var that = this;
                                    btnSave.classList.remove("collapse");
                                    btnSave.onclick = function () {
                                        //console.log('save button clicked');
                                        if (that.cropper) {
                                            var cropInfo = that.cropper.get();
                                            //console.log(cropInfo);
                                            var x1 = new Number(cropInfo.points[0]);
                                            var y1 = new Number(cropInfo.points[1]);
                                            var x2 = new Number(cropInfo.points[2]);
                                            var y2 = new Number(cropInfo.points[3]);
                                            var cropWidth = x2 - x1;
                                            var cropHeight = y2 - y1;

                                            var formData = new FormData();
                                            formData.append("sourceFilePath", that.fullSizeInput.value);
                                            formData.append("x1", x1);
                                            formData.append("y1", y1);
                                            formData.append("widthToCrop", cropWidth);
                                            formData.append("heightToCrop", cropHeight);
                                            formData.append("finalWidth", that.dropZoneDiv.dataset.resizeWidth);
                                            formData.append("finalHeight", that.dropZoneDiv.dataset.resizeHeight);

                                            $.ajax({
                                                type: "POST",
                                                processData: false,
                                                contentType: false,
                                                headers: {
                                                    'X-CSRFToken': that.dropZoneDiv.dataset.antiForgeryToken
                                                },
                                                dataType: "json",
                                                url: that.dropZoneDiv.dataset.fileCropUrl,
                                                data: formData

                                            }).done(function (data, textStatus, jqXHR) {
                                                that.handleCropResult(data);
                                            })
                                                .fail(function (jqXHR, textStatus, errorThrown) {
                                                    alert(textStatus);
                                                })
                                                ;


                                        }
                                        else {
                                            //console.log('cropper not found');

                                        }

                                    };
                                }
                                else {
                                    //console.log('failed to find save button');

                                }

                            },
                            destroyCropper: function () {
                                if (this.cropper) {
                                    this.cropper.destroy();
                                    this.cropper = undefined;
                                    var btnSave = document.getElementById(this.dropZoneDiv.id + "-save-crop");
                                    if (btnSave) {
                                        btnSave.classList.add("collapse");
                                    }
                                }
                            },

                            clearInputs: function () {
                                if (this.dropZoneDiv.dataset.targetFullsizeInputId) {
                                    this.fullSizeInput = document.getElementById(this.dropZoneDiv.dataset.targetFullsizeInputId);
                                    this.fullSizeInput.value = '';

                                }
                                if (this.dropZoneDiv.dataset.targetResizedInputId) {
                                    this.resizedInput = document.getElementById(this.dropZoneDiv.dataset.targetResizedInputId);
                                    this.resizedInput.value = '';
                                }
                                if (this.dropZoneDiv.dataset.targetThumbInputId) {
                                    this.thumbInput = document.getElementById(this.dropZoneDiv.dataset.targetThumbInputId);
                                    this.thumbInput.value = '';
                                }

                            },

                            handleCropResult: function (cropResult) {
                                this.destroyCropper();
                                this.fullSizeImage.src = cropResult.resizedUrl;
                                this.resizedInput.value = cropResult.resizedUrl;
                            },

                            serverFileSelected: function (url) {
                                this.destroyCropper();
                                this.clearInputs();
                                if (this.dropZoneDiv.dataset.targetFullsizeImageId) {
                                    this.fullSizeImage = document.getElementById(this.dropZoneDiv.dataset.targetFullsizeImageId);
                                    this.fullSizeImage.src = url;
                                }
                                if (this.dropZoneDiv.dataset.targetResizedImageId) {
                                    this.resizedImage = document.getElementById(this.dropZoneDiv.dataset.targetResizedImageId);
                                    this.resizedImage.src = url;
                                }
                                if (this.dropZoneDiv.dataset.targetFullsizeInputId) {
                                    this.fullSizeInput = document.getElementById(this.dropZoneDiv.dataset.targetFullsizeInputId);
                                    this.fullSizeInput.value = url;

                                }
                                if (this.dropZoneDiv.dataset.targetResizedInputId) {
                                    this.resizedInput = document.getElementById(this.dropZoneDiv.dataset.targetResizedInputId);
                                    this.resizedInput.value = url;
                                }

                                cloudscribeDropAndCrop.closeServerBrowser();

                            },

                            dropZoneAddedFile: function (file) {
                                // if a new file is dropped destroy the old croppie
                                if (this.cropper) {
                                    this.destroyCropper();
                                }
                            },
                            dropZoneSending: function (file, xhr, formData) {

                                if ((this.dropZoneDiv.dataset.resizeWidth) && (this.dropZoneDiv.dataset.resizeHeight)) {
                                    formData.append("maxWidth", this.dropZoneDiv.dataset.resizeWidth);
                                    formData.append("maxHeight", this.dropZoneDiv.dataset.resizeHeight);
                                }

                                if (this.dropZoneDiv.dataset.resizeImage == "false")
                                {
                                    formData.append("resizeImage", false);

                                }
                                
                                if (this.dropZoneDiv.dataset.targetPath) {
                                    formData.append("targetPath", this.dropZoneDiv.dataset.targetPath);
                                }
                                if (div.dataset.createThumb == 'true') {
                                    formData.append("createThumbnail", this.dropZoneDiv.dataset.createThumb);
                                }
                            },
                            dropZoneSuccess: function (file, serverResponse) {
                                if (this.dropZone) {
                                    this.dropZone.removeFile(file);
                                }

                                var fsImageUrl = serverResponse[0].originalUrl;
                                var resizedUrl = serverResponse[0].resizedUrl;
                                var thumbUrl = serverResponse[0].thumbUrl;
                                this.resizedImage = this.dropZoneDiv.getElementsByTagName('img')[0];
                                if (this.resizedImage) {
                                    this.resizedImage.src = resizedUrl;
                                }
                                else if (this.dropZoneDiv.dataset.targetResizedImageId) {
                                    this.resizedImage = document.getElementById(this.dropZoneDiv.dataset.targetResizedImageId);
                                    if (this.resizedImage) {
                                        this.resizedImage.src = resizedUrl;
                                    }
                                }

                                if (this.dropZoneDiv.dataset.targetThumbImageId) {
                                    this.thumbImage = document.getElementById(this.dropZoneDiv.dataset.targetThumbImageId);
                                    if (this.thumbImage) {
                                        this.thumbImage.src = thumbUrl;
                                    }
                                }

                                if (this.dropZoneDiv.dataset.targetFullsizeImageId) {
                                    this.fullSizeImage = document.getElementById(this.dropZoneDiv.dataset.targetFullsizeImageId);
                                    if (this.fullSizeImage) {
                                        this.fullSizeImage.src = fsImageUrl;
                                        if (this.dropZoneDiv.dataset.enableCrop == "true") {
                                            this.setupCropper();
                                        }
                                    }
                                }

                                if (this.dropZoneDiv.dataset.targetFullsizeInputId) {
                                    this.fullSizeInput = document.getElementById(this.dropZoneDiv.dataset.targetFullsizeInputId);
                                    if (this.fullSizeInput) {
                                        this.fullSizeInput.value = fsImageUrl;
                                    }
                                }
                                if (this.dropZoneDiv.dataset.targetResizedInputId) {
                                    this.resizedInput = document.getElementById(this.dropZoneDiv.dataset.targetResizedInputId);
                                    if (this.resizedInput) {
                                        this.resizedInput.value = resizedUrl;
                                    }
                                }
                                if (this.dropZoneDiv.dataset.targetThumbInputId) {
                                    this.thumbInput = document.getElementById(this.dropZoneDiv.dataset.targetThumbInputId);
                                    if (this.thumbInput) {
                                        this.thumbInput.value = thumbUrl;
                                    }
                                }
                            },
                            dropZoneError: function (file, errorMessage) {
                                console.log(errorMessage);
                            }

                        };

                        imageItem.dropZone = this._buildDropZone(imageItem, imageItem.dropZoneDiv);
                        if (div.dataset.fileBrowseUrl && (div.dataset.enableBrowseServer == 'true')) {
                            var btnBrowseServer = document.getElementById(div.id + "-browse-server");
                            if (btnBrowseServer) {
                                btnBrowseServer.classList.remove("collapse");
                                btnBrowseServer.onclick = function () {
                                    cloudscribeDropAndCrop.openServerBrowser(div.dataset.fileBrowseUrl);
                                    window.FileSelectCallback = function (url) {
                                        imageItem.serverFileSelected(url);
                                    }
                                };
                            }
                        }

                        return imageItem;
                    },

                    _buildDropZone: function (imageItem, div) {

                        var myDropzone = new Dropzone('#' + div.id, {
                            url: div.dataset.uploadUrl,
                            method: "post",
                            headers: {
                                'X-CSRFToken': div.dataset.antiForgeryToken
                            },
                            maxFiles: 1,
                            acceptedFiles: div.dataset.acceptedFiles,
                            previewTemplate: previewTemplate,
                            createImageThumbnails: false,
                            clickable: true

                        });
                        myDropzone.on("addedfile", function (file) {
                            if (imageItem.dropZoneAddedFile) {
                                imageItem.dropZoneAddedFile(file);
                            }
                            if (window.DropZoneAddedFileHandler) {
                                window.DropZoneAddedFileHandler(file);
                            }
                        });
                        myDropzone.on("sending", function (file, xhr, formData) {
                            if (imageItem.dropZoneSending) {
                                imageItem.dropZoneSending(file, xhr, formData);

                            }

                            if (window.DropZoneSendingHandler) {
                                window.DropZoneSendingHandler(file, xhr, formData);
                            }
                        });
                        myDropzone.on("success", function (file, serverResponse) {
                            if (imageItem.dropZoneSuccess) {
                                imageItem.dropZoneSuccess(file, serverResponse);
                            }

                            if (window.DropZoneSuccessHandler) {
                                window.DropZoneSuccessHandler(file, serverResponse);
                            }

                        });
                        myDropzone.on("error", function (file, errorMessage) {
                            if (imageItem.dropZoneError) {
                                imageItem.dropZoneError(file, errorMessage);
                            }
                            if (window.DropZoneErrorHandler) {
                                window.DropZoneErrorHandler(file, errorMessage);
                            }
                        });

                        return myDropzone;
                    },

                };

                for (var i = 0; i < dropElements.length; i++) {
                    var item = dropElements[i];
                    cloudscribeDropAndCrop.buildImageEditor(item);
                }
            });
        })();
		