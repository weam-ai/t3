// src/utils/api.js
const API_BASE_URL = 'https://your-api-endpoint.com'; // Replace with your actual API endpoint

export const analyzeFiles = async (videoFile, documentFile) => {
  try {
    const formData = new FormData();
    
    // Add files in binary format
    formData.append('video', videoFile);
    formData.append('document', documentFile);
    
    // Add additional metadata if needed
    formData.append('videoName', videoFile.name);
    formData.append('documentName', documentFile.name);
    formData.append('videoSize', videoFile.size);
    formData.append('documentSize', documentFile.size);
    console.log("🚀 ~ analyzeFiles ~ formData:", formData)

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header, let browser set it with boundary for FormData
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Alternative implementation if you need to send files as base64
export const analyzeFilesBase64 = async (videoFile, documentFile) => {
  try {
    // Convert files to base64
    const videoBase64 = await fileToBase64(videoFile);
    const documentBase64 = await fileToBase64(documentFile);

    const payload = {
      video: {
        content: videoBase64,
        name: videoFile.name,
        type: videoFile.type,
        size: videoFile.size
      },
      document: {
        content: documentBase64,
        name: documentFile.name,
        type: documentFile.type,
        size: documentFile.size
      }
    };

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Utility function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:mime;base64, prefix
    reader.onerror = error => reject(error);
  });
};