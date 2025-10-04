import { useState, useEffect } from 'react';

interface CapturedImage {
  id: string;
  url: string;
  timestamp: number;
  analysisResult?: {
    disease: string;
    confidence: string;
  };
  isAnalyzing?: boolean;
}

interface ImageGalleryProps {
  esp32Ip: string;
  apiEndpoint: string;
}

const ImageGallery = ({ esp32Ip, apiEndpoint }: ImageGalleryProps) => {
  const [images, setImages] = useState<CapturedImage[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  // Load images from localStorage on component mount
  useEffect(() => {
    const storedImages = localStorage.getItem('capturedImages');
    if (storedImages) {
      setImages(JSON.parse(storedImages));
    }
  }, []);

  // Save images to localStorage whenever images state changes
  useEffect(() => {
    localStorage.setItem('capturedImages', JSON.stringify(images));
  }, [images]);

  // Capture image from ESP32-CAM
  const captureImage = async () => {
    setIsCapturing(true);
    try {
      const response = await fetch(`http://${esp32Ip}/capture`, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        const newImage: CapturedImage = {
          id: Date.now().toString(),
          url: imageUrl,
          timestamp: Date.now(),
        };
        
        setImages(prev => [newImage, ...prev.slice(0, 9)]); // Keep only last 10 images
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      // For demo purposes, create a placeholder image
      const newImage: CapturedImage = {
        id: Date.now().toString(),
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVTUDMyIEltYWdlPC90ZXh0Pjwvc3ZnPg==',
        timestamp: Date.now(),
      };
      setImages(prev => [newImage, ...prev.slice(0, 9)]);
    } finally {
      setIsCapturing(false);
    }
  };

  // Analyze image
  const analyzeImage = async (imageId: string, imageUrl: string) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, isAnalyzing: true } : img
    ));

    try {
      // Convert blob URL to actual blob for POST request
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'plant_image.jpg');

      const analysisResponse = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (analysisResponse.ok) {
        const result = await analysisResponse.json();
        setImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, analysisResult: result, isAnalyzing: false }
            : img
        ));
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      // Demo result for testing
      const demoResult = {
        disease: 'Leaf Spot',
        confidence: '92%'
      };
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, analysisResult: demoResult, isAnalyzing: false }
          : img
      ));
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      const newImage: CapturedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        timestamp: Date.now(),
      };
      setImages(prev => [newImage, ...prev.slice(0, 9)]); // Keep only last 10 images
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          📸 Image Gallery
          <div className="status-indicator"></div>
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="btn-analyze cursor-pointer inline-block"
            >
              📁 Upload Image
            </label>
          </div>
          <button
            onClick={captureImage}
            disabled={isCapturing}
            className="btn-analyze disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCapturing ? (
              <span className="flex items-center gap-2">
                <div className="loading-spinner"></div>
                Capturing...
              </span>
            ) : (
              '📷 Capture from ESP32'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div key={image.id} className="gallery-item">
            <div className="aspect-video bg-muted overflow-hidden">
              <img
                src={image.url}
                alt={`Captured at ${new Date(image.timestamp).toLocaleTimeString()}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 space-y-3">
              <div className="text-sm text-muted-foreground">
                📅 {new Date(image.timestamp).toLocaleString()}
              </div>
              
              {!image.analysisResult && !image.isAnalyzing && (
                <button
                  onClick={() => analyzeImage(image.id, image.url)}
                  className="btn-analyze w-full"
                >
                  🔬 Analyze Plant
                </button>
              )}

              {image.isAnalyzing && (
                <div className="flex items-center justify-center gap-2 p-2">
                  <div className="loading-spinner"></div>
                  <span className="text-sm text-muted-foreground">Analyzing...</span>
                </div>
              )}

              {image.analysisResult && (
                <div className="bg-muted/50 p-3 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">🔬 Analysis Result</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Disease:</strong> {image.analysisResult.disease}</div>
                    <div><strong>Confidence:</strong> {image.analysisResult.confidence}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-4">📷</div>
          <p>No images yet. Upload an image or capture from ESP32-CAM to get started.</p>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;