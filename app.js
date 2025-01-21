


document.addEventListener("DOMContentLoaded", function () {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  let isScanning = true; // To control when scanning occurs

  // Get user media (camera)
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then(function (stream) {
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // Required for iOS Safari
      video.play();
    })
    .catch(function (err) {
      console.error("Error accessing camera: " + err);
    });

  // Function to display a message and wait for user interaction
  function showMessage(message) {
    return new Promise((resolve) => {
      // Show a custom modal or dialog
      const modal = document.createElement("div");
      modal.style.position = "fixed";
      modal.style.top = "50%";
      modal.style.left = "50%";
      modal.style.transform = "translate(-50%, -50%)";
      modal.style.backgroundColor = "#fff";
      modal.style.padding = "20px";
      modal.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
      modal.style.zIndex = "9999";
      modal.style.textAlign = "center";

      const text = document.createElement("p");
      text.innerText = message;
      modal.appendChild(text);

      const button = document.createElement("button");
      button.innerText = "OK";
      button.style.marginTop = "10px";
      button.style.padding = "10px 20px";
      button.style.border = "none";
      button.style.backgroundColor = "#007BFF";
      button.style.color = "#fff";
      button.style.cursor = "pointer";
      button.onclick = function () {
        modal.remove();
        resolve(); // Proceed to resume scanning
      };

      modal.appendChild(button);
      document.body.appendChild(modal);
    });
  }

  // Function to scan the video frame for QR code
  async function scanQRCode() {
    if (video.readyState === video.HAVE_ENOUGH_DATA && isScanning) {
      // Set canvas size to match video size
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;

      // Draw the current frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);

      if (code) {
        const qrCodeData = code.data;
        isScanning = false; // Stop scanning until the message is handled

        if (localStorage.getItem(qrCodeData)) {
          await showMessage("This QR Code has already been used.");
        } else {
          await showMessage("QR Code Scanned: " + qrCodeData);

          // Mark the QR code as used by saving it in localStorage
          localStorage.setItem(qrCodeData, "used");

          // Send the QR code data to Google Sheets (via Apps Script Web App)
          fetch(
           "https://script.google.com/macros/s/AKfycbzBVy9dRQFh8CjySBBqvrYRqQBFNX51lEutUtDOJWJA6o93vZiIEOwdXho8JeQXtTnmOA/exec",
            {
              method: "POST",
              body: new URLSearchParams({
                qrCode: qrCodeData, // Send the scanned QR code data
              }),
            }
          )
            .then((response) => response.text())
            .then((responseData) => {
              console.log(responseData); // Log the response from the server
            })
            .catch((error) => {
              console.error("Error:", error); // Handle any errors
            });
        }

        isScanning = true; // Resume scanning after message is handled
      }
    }

    // Continue scanning the next frame
    requestAnimationFrame(scanQRCode);
  }

  // Start scanning when the video is playing
  video.addEventListener("play", function () {
    scanQRCode();
  });
});
