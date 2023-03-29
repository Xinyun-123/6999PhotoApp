// var apigClient = apigClientFactory.newClient({});
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function voiceSearch(){
    if ('webkitSpeechRecognition' in window) {
        console.log("webkitSpeechRecognition is Working");
    } else {
        console.log("webkitSpeechRecognition is Not Working");
    }
    
    var inputSearchQuery = document.getElementById("search_query");
    const recognition = new window.webkitSpeechRecognition();
    //recognition.continuous = true;

    micButton = document.getElementById("mic_search");  
    
    if (micButton.innerHTML == "mic") {
        recognition.start();
    } else if (micButton.innerHTML == "mic_off"){
        recognition.stop();
    }

    recognition.addEventListener("start", function() {
        micButton.innerHTML = "mic_off";
        console.log("Recording.....");
    });

    recognition.addEventListener("end", function() {
        console.log("Stopping recording.");
        micButton.innerHTML = "mic";
    });

    recognition.addEventListener("result", resultOfSpeechRecognition);
    function resultOfSpeechRecognition(event) {
        const current = event.resultIndex;
        transcript = event.results[current][0].transcript;
        inputSearchQuery.value = transcript;
        console.log("transcript : ", transcript)
    }
}




function textSearch() {
    var searchText = document.getElementById('search_query');
    if (!searchText.value) {
        alert('Please enter a valid text or voice input!');
    } else {
        searchText = searchText.value.trim().toLowerCase();
        console.log('Searching Photos....');
        searchPhotos(searchText);
    }
}

function searchPhotos(searchText) {
    console.log("search text: ", searchText);
    document.getElementById('search_query').value = searchText;
    document.getElementById('photos_search_results').innerHTML = "<h4 style=\"text-align:center\">";

    var params = {
        'q' : searchText
    };
    
    apigClient.searchGet(params, {}, {})
        .then(function(result) {
            console.log("Result : ", result);

            image_paths = result["data"]["body"]["imagePaths"];
            if (image_paths === undefined) {
                image_paths = {};
                console.log("No image found.");
            } else {
                console.log("image_paths : ", image_paths);
            }          

            var photosDiv = document.getElementById("photos_search_results");
            photosDiv.innerHTML = "";

            var n;
            for (n = 0; n < image_paths.length; n++) {
                images_list = image_paths[n].split('/');
                imageName = images_list[images_list.length - 1];

                photosDiv.innerHTML += '<figure><img src="' + image_paths[n] + '" style="width:25%"><figcaption>' + imageName + '</figcaption></figure>';
            }

        }).catch(function(result) {
            console.log(result);
        });
}

function uploadPhoto() {
    var filePath = (document.getElementById('uploaded_file').value).split("\\");
    var fileName = filePath[filePath.length - 1];

    var body = document.getElementById('uploaded_file').files[0];
    console.log("body: ", body);

    if (!document.getElementById('custom_labels').innerText == "") {
        var customLabels = document.getElementById('custom_labels');
    }
    console.log("file name: ", fileName);
    // console.log(custom_labels.value);
    console.log("file path: ", filePath);

    var labels = custom_labels.value.split(",");
    var reader = new FileReader();
    var file = document.getElementById('uploaded_file').files[0];
    console.log('File : ', file);
    document.getElementById('uploaded_file').value = "";

    if ((filePath == "") || (!['png', 'jpg', 'jpeg'].includes(filePath[filePath.length - 1].split(".")[1]))) {
        alert("Please upload a valid .png/.jpg/.jpeg file!");
    } else {
        console.log("here", file.type);
        var params = {
            'file': fileName,
            'bucket': "my6998photofiles",
            'x-api-key': 'PBbxIHHXQs8f1OZKClwb88JMVt5cWVgm8lpWxygd',
            'x-amz-meta-customLabels': labels
            // 'Access-Control-Allow-Origin': '*',
            // 'Access-Control-Allow-Headers': '*',
            // 'Access-Control-Allow-Methods': '*'
        };
        var additionalParams = {
            headers: {
                // 'Access-Control-Allow-Origin': '*',
                'Content-Type': body.type
                // 'x-amz-meta-customLabels': labels,
            }
        };
        
        reader.onload = function (event) {
            // body = btoa(event.target.result);
            // console.log('Reader body : ', body);
            return apigClient.uploadBucketFilePut(params, additionalParams)
            .then(function(result) {
                console.log("res from api: ", result);
            })
            .catch(function(error) {
                console.log("err from api", error);
            })
        }
        reader.readAsBinaryString(file);
    }
}