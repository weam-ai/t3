import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  Skeleton,
  Card,
  CardMedia,
  CardContent,
  LinearProgress,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  CloudUpload,
  VideoFile,
  Image,
  Analytics,
  Delete,
  CheckCircle,
  Warning,
  Error,
  Info,
  ExpandMore,
  Policy,
  Assessment,
  Description,
  Schedule,
  Search,
  ArrowBack
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components with radiant theme
const GradientBox = styled(Box)(({ theme }) => ({
  background: 'radial-gradient(600px 300px at 50% -60px, rgba(124,58,237,0.12), transparent 70%)',
  minHeight: '100vh',
  padding: theme.spacing(3),
}));

const UploadArea = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isDragOver' && prop !== 'hasFile',
})(({ theme, isDragOver, hasFile }) => ({
  // height: 200,
  margin: '0 auto',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(2),
  textAlign: 'center',
  cursor: 'pointer',
  color: theme.palette.primary.dark,
  transition: 'all 0.3s ease',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: hasFile
    ? '#e9d5ff'
    : isDragOver
      ? '#ede9fe'
      : theme.palette.primary.main,
  minHeight: 200,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  '&:hover': {
    borderColor: theme.palette.primary.light,
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(124,58,237,0.18)',
    // background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
  }
}));

const AnalyzeButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
  color: '#ffffff',
  padding: theme.spacing(1.5, 4),
  fontSize: '1.1rem',
  fontWeight: 'bold',
  borderRadius: theme.spacing(3),
  '&:hover': {
    // background: 'linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(124,58,237,0.35)',
  },
  '&:disabled': {
    background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
    color: '#666',
  }
}));

const ResultCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(3),
  background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  borderRadius: theme.spacing(2),
}));

const StatusChip = styled(Chip)(({ status }) => ({
  fontWeight: 'bold',
  ...(status === 'success' && {
    background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
    color: 'white',
  }),
  ...(status === 'violated' && {
    background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
    color: 'white',
  }),
  ...(status === 'warning' && {
    background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
    color: 'white',
  }),
}));

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

const SeverityChip = styled(Chip)(({ severity }) => ({
  ...(severity === 'high' && {
    backgroundColor: '#f44336',
    color: 'white',
  }),
  ...(severity === 'medium' && {
    backgroundColor: '#ff9800',
    color: 'white',
  }),
  ...(severity === 'low' && {
    backgroundColor: '#2196f3',
    color: 'white',
  }),
}));

// Policy Mode Toggle Components
const PolicyModeCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  borderRadius: theme.spacing(2),
  border: '1px solid #ede9fe',
}));

const ModeButton = styled(Button)(({ active }) => ({
  background: active 
    ? 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)'
    : 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
  color: active ? '#ffffff' : '#6b7280',
  fontWeight: 'bold',
  borderRadius: theme => theme.spacing(2),
  padding: theme => theme.spacing(0.5, 2),
  textTransform: 'none',
  fontSize: '0.875rem',
  minWidth: 80,
  '&:hover': {
    background: active 
      ? 'linear-gradient(135deg, #6d28d9 0%, #7e22ce 100%)'
      : 'linear-gradient(135deg, #e9d5ff 0%, #ede9fe 100%)',
  }
}));

// Segmented control
const Segmented = styled(ToggleButtonGroup)(({ theme }) => ({
  background: '#f5f3ff',
  borderRadius: theme.spacing(2),
  padding: 4,
  '& .MuiToggleButton-root': {
    border: 'none',
    textTransform: 'none',
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(0.5, 2),
    color: '#6b7280',
  },
  '& .Mui-selected': {
    background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
    color: '#fff',
  }
}));

const FileUploadAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [policySource, setPolicySource] = useState('live'); // 'live' or 'standard'
  const fileInputRef = useRef(null);

  // Derived state for dynamic mode
  const isDynamicMode = policySource === 'live';

  // File validation
  const validateFile = (file) => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = ['video/', 'image/'];

    if (file.size > maxSize) {
      return 'File size must be less than 20MB';
    }

    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      return 'Only video and image files are allowed';
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setAnalysisResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  // File input change
  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  // Remove file
  const handleRemoveFile = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setFile(null);
    setPreview(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert file to binary format
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:type;base64, prefix
      reader.onerror = error => reject(error);
    });
  };

  // Analyze file
  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formdata = new FormData();
      formdata.append("file", file);
      const apiUrl = import.meta.env.VITE_API_URL;

      // Choose API endpoint based on selected policy source
      const endpoint = policySource === 'live' ? '/summarize-dynamic' : '/summarize';

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        body: formdata,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze file. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <GradientBox>
      <Box maxWidth="none" mx={2} width={'100%'}>

        {/* Header */}
        <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 2 }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img src="/weam-logo.svg" alt="Weam" width={32} height={32} />
              <Typography variant="h6" fontWeight="bold" color="#7c3aed">Weam AI</Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => {
                const url = import.meta.env.VITE_WEAM_URL;
                if (url) window.location.href = url;
              }}
              sx={{ borderRadius: 2, background: 'linear-gradient(180deg, #ffffff, #f6f5ff)', borderColor: '#e9d5ff' }}
            >
              Back to Weam
            </Button>
          </Toolbar>
        </AppBar>

        {/* Policy Source Selection */}
        <PolicyModeCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Search sx={{ color: '#7c3aed', fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold" color="#7c3aed">
                  Ad Content Compliance Checker
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mb: 3 }}>
              <Typography 
                variant="body1" 
                fontWeight="medium" 
                color={policySource==='standard' ? '#7c3aed' : '#666'}
                sx={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setPolicySource('standard')}
              >
                Standard
              </Typography>
              <Divider orientation="vertical" flexItem />
              <Typography 
                variant="body1" 
                fontWeight="medium" 
                color={policySource==='live' ? '#7c3aed' : '#666'}
                sx={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setPolicySource('live')}
              >
                Live
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography 
                  variant="body2" 
                  color="#666" 
                  sx={{ 
                    fontSize: '0.875rem',
                    opacity: !isDynamicMode ? 1 : 0.6,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  Uses static Meta Ads policies with Gemini AI.
                </Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography 
                  variant="body2" 
                  color="#666" 
                  sx={{ 
                    fontSize: '0.875rem',
                    opacity: isDynamicMode ? 1 : 0.6,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  Uses dynamic Meta Ads policies with Claude AI.
                </Typography>
              </Box>
            </Box>

            {/* Policy Description Box - Always visible with consistent size */}
            <Box 
              sx={{ 
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: 2,
                p: 2,
                border: '1px solid #dee2e6',
                minHeight: '80px', // Fixed minimum height for consistency
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <Typography variant="h6" fontWeight="bold" color="#7c3aed" sx={{ mb: 1 }}>
                {policySource === 'live' ? 'Live Policy Source' : 'Standard Policy Source'}
              </Typography>
              <Typography variant="body2" color="#666" sx={{ lineHeight: 1.6 }}>
                {policySource === 'live' 
                  ? 'Uses real-time Meta Ads policies fetched from Meta\'s transparency resources for the most up-to-date compliance checking.'
                  : 'Uses static Meta Ads policies with Gemini AI for consistent and reliable compliance checking.'
                }
              </Typography>
            </Box>
          </CardContent>
        </PolicyModeCard>

        {/* Upload Area */}
        <UploadArea
          isDragOver={isDragOver}
          hasFile={!!file}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {file ? (
            <Box sx={{ width: '100%' }}>

              {/* File Preview */}
              {preview && (
                <ResultCard>
                  <CardContent>
                    {file?.type.startsWith('video/') ? (
                      <CardMedia
                        component="video"
                        controls
                        src={preview}
                        sx={{ maxHeight: 400, width: '100%' }}
                      />
                    ) : (
                      <CardMedia
                        component="img"
                        src={preview}
                        alt="Preview"
                        sx={{ maxHeight: 400, width: '100%', objectFit: 'contain' }}
                      />
                    )}
                  </CardContent>
                </ResultCard>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1, mt: 1 }}>
                {file.type.startsWith('video/') ? (
                  <VideoFile sx={{ fontSize: 25, color: '#2196f3' }} />
                ) : (
                  <Image sx={{ fontSize: 25, color: '#4caf50' }} />
                )}
                <Typography variant="body1" fontWeight="medium" color={'success.main'}>
                  {file.name}
                </Typography>
                <Chip
                  label={formatFileSize(file.size)}
                  size="small"
                  color="primary"
                />
              </Box>

              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleRemoveFile}
                sx={{ mt: 1 }}
                style={{ borderRadius: 16 }}
              >
                Remove File
              </Button>
            </Box>
          ) : (
            <Box>
              <CloudUpload sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'center' }} fontSize={20}>
                Drop your file here
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }} fontSize={18} fontWeight={700}>
                or click to browse
              </Typography>
            </Box>
          )}
        </UploadArea>

        <Typography variant="h6" color="#2a00a1" textAlign="center" fontWeight={900} mt={2}>
          {'Upload your video or image file for meta policy analysis'}
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Analyze Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <AnalyzeButton
            variant="contained"
            disabled={!file || isAnalyzing}
            onClick={handleAnalyze}
            startIcon={<Analytics />}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze File'}
          </AnalyzeButton>
        </Box>

        {/* Loading Progress */}
        {isAnalyzing && (
          <Box sx={{ mt: 3 }}>
            <LinearProgress
              sx={{
                height: 8,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }
              }}
            />
            <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
              Analyzing your file...
            </Typography>
          </Box>
        )}

        {/* Skeleton Loading */}
        {isAnalyzing && (
          <ResultCard>
            <CardContent>
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="rectangular" width="100%" height={100} sx={{ mt: 2 }} />
              <Skeleton variant="text" width="60%" height={24} sx={{ mt: 2 }} />
              <Skeleton variant="text" width="80%" height={24} />
              <Skeleton variant="text" width="70%" height={24} />
            </CardContent>
          </ResultCard>
        )}

        {analysisResult && !isAnalyzing && (
          <ResultCard>
            <CardContent>
              {/* Header with Status */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                  Analysis Results
                </Typography>
                <StatusChip
                  status={analysisResult.success ? 'success' : 'error'}
                  label={analysisResult.success ? 'Analysis Complete' : 'Analysis Failed'}
                  icon={analysisResult.success ? <CheckCircle /> : <Error />}
                />
              </Box>

              {analysisResult.success && (
                <>
                  {/* File Information */}
                  {/* <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description color="primary" />
                        <Typography variant="h6">File Information</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">Original Name:</Typography>
                          <Typography variant="body1" fontWeight="medium">{analysisResult.fileInfo.originalName}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">File Size:</Typography>
                          <Typography variant="body1" fontWeight="medium">{formatFileSize(analysisResult.fileInfo.fileSize)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">File Type:</Typography>
                          <Chip label={analysisResult.fileInfo.fileType} size="small" color="primary" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">Upload Date:</Typography>
                          <Typography variant="body1" fontWeight="medium">{formatDate(analysisResult.fileInfo.uploadDate)}</Typography>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion> */}

                  {/* Analysis Summary */}
                  {/* <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assessment color="primary" />
                        <Typography variant="h6">Analysis Summary</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body1" sx={{ lineHeight: 1.6, mb: 2 }}>
                        {analysisResult.analysis.summary}
                      </Typography>

                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Key Points:
                      </Typography>
                      <List dense>
                        {analysisResult.analysis.keyPoints.map((point, index) => (
                          <ListItem key={index} sx={{ pl: 0 }}>
                            <ListItemIcon>
                              <Info color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={point} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion> */}

                  {/* Policy Check */}
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between', width: '100%', pr: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Policy color="primary" />
                          <Typography variant="h6">Policy Check</Typography>
                        </Box>
                        <StatusChip
                          status={analysisResult.policyCheck.violated ? 'violated' : 'success'}
                          label={analysisResult.policyCheck.violated ? 'Policy Violated' : 'Policy Compliant'}
                          icon={analysisResult.policyCheck.violated ? <Warning /> : <CheckCircle />}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {analysisResult.policyCheck.violated ? (
                        <>
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Reasoning:</strong> {analysisResult.policyCheck.reasoning}
                          </Typography>

                          <Typography variant="h6" gutterBottom>
                            Violations Found:
                          </Typography>
                          {analysisResult.policyCheck.violations.map((violation, index) => (
                            <Card key={index} sx={{ mb: 2, border: '1px solid #ffcdd2' }}>
                              <CardContent sx={{ pb: '16px !important' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="h6" color="error">
                                    {violation.category}
                                  </Typography>
                                  <SeverityChip
                                    severity={violation.severity}
                                    label={`${violation.severity.toUpperCase()} RISK`}
                                    size="small"
                                  />
                                </Box>
                                <Typography variant="body2">
                                  {violation.description}
                                </Typography>
                              </CardContent>
                            </Card>
                          ))}
                        </>
                      ) : (
                        <Alert severity="success">
                          No policy violations detected. The content complies with platform guidelines.
                        </Alert>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                        <Schedule fontSize="small" color="text.secondary" />
                        <Typography variant="body2" color="text.secondary">
                          Checked at: {formatDate(analysisResult.policyCheck.checkedAt)}
                        </Typography>
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                </>
              )}
            </CardContent>
          </ResultCard>
        )}
      </Box>
    </GradientBox>
  );
};

export default FileUploadAnalyzer;
