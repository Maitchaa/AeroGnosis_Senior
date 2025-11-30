const express = require('express');

// In-memory stores simulating database collections
const imageStore = new Map([
  [
    'image-1',
    {
      id: 'image-1',
      originalUrl: 'https://example.com/images/1.jpg',
      status: 'pending',
    },
  ],
]);
const analysesStore = new Map();

const app = express();
app.use(express.json());

function createAnalysisDoc(image) {
  const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const metrics = {
    confidence: Number(Math.random().toFixed(2)),
    score: Number(Math.random().toFixed(2)),
  };

  const analysisDoc = {
    id: analysisId,
    imageId: image.id,
    overlayUrl: image.originalUrl,
    metrics,
    createdAt: new Date().toISOString(),
  };

  analysesStore.set(analysisId, analysisDoc);
  return analysisDoc;
}

app.post('/api/analyzeImage', (req, res) => {
  const { imageId } = req.body || {};

  if (!imageId) {
    return res.status(400).json({ error: 'imageId is required' });
  }

  const imageDoc = imageStore.get(imageId);

  if (!imageDoc) {
    return res.status(404).json({ error: 'Image not found' });
  }

  const analysisDoc = createAnalysisDoc(imageDoc);

  const updatedImageDoc = {
    ...imageDoc,
    analysisId: analysisDoc.id,
    status: 'analyzed',
    overlayUrl: analysisDoc.overlayUrl,
  };

  imageStore.set(imageId, updatedImageDoc);

  return res.json({ analysis: analysisDoc, image: updatedImageDoc });
});

function start(port = process.env.PORT || 3000) {
  return app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, imageStore, analysesStore, start };
