const vision = require('@google-cloud/vision');

const getTextFromImage = async (path) => {
  try {
    const client = new vision.ImageAnnotatorClient({
      credentials: JSON.parse(process.env.GOOGLE_CLOUD_KEY),
    });

    // Performs text detection on the image file
    const [result] = await client.textDetection(path);
    // TODO: Error handling
    // TODO: Image enhancements
    const detections = result.textAnnotations;
    let lines = detections.length > 0 && detections[0].description;
    return lines;
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
    getTextFromImage
}
