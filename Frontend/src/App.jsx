import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [animatedHist, setAnimatedHist] = useState([]);
  const [visibleFeatureIndex, setVisibleFeatureIndex] = useState(-1);
  const animationRef = useRef(null);
  const oscillationRef = useRef(0);
  const waveOffsetRef = useRef(0);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append("image", image);

    const response = await fetch("http://127.0.0.1:5000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setResult(data);
    setAnimatedHist(new Array(data.histogram.length).fill(0));
    setVisibleFeatureIndex(-1);
  };

  useEffect(() => {
    if (!result) return;
    const canvas = document.getElementById('histogram-canvas');
    const ctx = canvas.getContext('2d');
    const hist = result.histogram;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const maxVal = Math.max(...hist);

    const animate = () => {
      oscillationRef.current += 0.05;
      waveOffsetRef.current += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      hist.forEach((val, i) => {
        const baseHeight = (val / maxVal) * canvas.height;
        const oscillation = Math.sin(oscillationRef.current + i) * 0.07 * baseHeight;
        const wave = Math.sin(waveOffsetRef.current + i * 0.3) * 0.05 * baseHeight;
        const height = baseHeight + oscillation + wave;
        ctx.fillStyle = `hsl(270, 70%, 60%)`; // purple color for bars
        ctx.fillRect(i * (canvas.width / hist.length), canvas.height - height, canvas.width / hist.length, height);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [result]);

  useEffect(() => {
    if (!result) return;
    setVisibleFeatureIndex(-1);
    const featureCount = 3;
    let currentIndex = 0;

    const interval = setInterval(() => {
      setVisibleFeatureIndex((prev) => {
        if (prev < featureCount - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
      currentIndex++;
    }, 300);

    return () => clearInterval(interval);
  }, [result]);


  const featureClassName = (index) => {
    return visibleFeatureIndex < index ? "feature-map-wrapper hidden" : "feature-map-wrapper visible";
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Image Info and B&W Converter</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        className="file-input"
      />

      <button
        onClick={handleUpload}
        className="convert-button"
      >
        Convert
      </button>

      <button
        onClick={() => { navigate('/history'); }}
        className="convert-button"
        style={{ display: 'block', margin: '20px auto 0 auto' }}
      >
        History
      </button>

      <div className="result-container">
        {result && (
          <>
            <h3 className="section-title">Black & White Image:</h3>
            <div className="bw-image-wrapper">
              <img
                src={`data:image/png;base64,${result.bw_image}`}
                alt="BW"
                className="bw-image"
              />
            </div>

            <h3 className="section-title">Feature Maps:</h3>
            <div className="feature-maps-container">
              {[result.sobelx, result.sobely, result.edges].map((src, idx) => (
                <div key={idx} className={featureClassName(idx)}>
                  <img
                    src={`data:image/png;base64,${src}`}
                    alt={idx === 0 ? "Sobel X" : idx === 1 ? "Sobel Y" : "Edges"}
                    width="120"
                    className="feature-map-image"
                  />
                </div>
              ))}
            </div>

            <h3 className="section-title">Grayscale Histogram:</h3>
            <canvas
              id="histogram-canvas"
              width="900"
              height="375"
              className="histogram-canvas"
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;